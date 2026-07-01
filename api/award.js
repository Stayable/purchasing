// api/award.js — portal-initiated award/approve/decline (WRITE) for Procurement_Items.
//
// Session-gated: requires a valid portal login (so we know WHO clicked). The logged-in
// user's email is stamped into Portal_Approved_By + Portal_Approved_At on the record —
// app-level attribution. (Zoho's native Modified_By will still be the service/OAuth user;
// true Zoho-native attribution is the separate per-user-OAuth build, deferred.)
//
// Writes use a SEPARATE write-scoped token so the public read path (api/procurement.js)
// stays least-privilege. Inert until configured:
//   - no SESSION_SECRET            -> 401 (login not active; we can't know who approves)
//   - no ZOHO_WRITE_REFRESH_TOKEN  -> 503 (writes not enabled)
//
// Env vars (server-side, Vercel):
//   ZOHO_WRITE_REFRESH_TOKEN   refresh token with write scope (e.g. ZohoCRM.modules.ALL)
//   ZOHO_WRITE_CLIENT_ID       (optional) defaults to ZOHO_CLIENT_ID
//   ZOHO_WRITE_CLIENT_SECRET   (optional) defaults to ZOHO_CLIENT_SECRET
//   ZOHO_ACCOUNTS_DOMAIN / ZOHO_API_DOMAIN  shared with the read proxy
//
// Prereq: the fields Portal_Approved_By (text) + Portal_Approved_At (datetime) must exist
// on Procurement_Items (created in Zoho Settings UI). If absent, Zoho returns an
// INVALID_DATA error which is surfaced to the caller.

const auth = require("./_auth.js");
const dbm = require("./_db.js");
const events = require("./_events.js");

// decision action -> (activity verb, human label for the notification)
const DECISION_META = {
  approve: { verb: "awarded", label: "approved & awarded" },
  approve_conditions: { verb: "approved", label: "approved with conditions" },
  decline: { verb: "declined", label: "declined" },
};

const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

// action -> Stage value (exact live picklist labels)
const ACTION_STAGE = {
  approve: "Approved",
  approve_conditions: "Approved-with-Conditions",
  decline: "Declined",
};

/**
 * Build the Zoho record object for a portal decision or note-only update.
 *
 * @param {string} itemId   - Procurement_Items record ID
 * @param {string} action   - "approve" | "approve_conditions" | "decline" | "note"
 * @param {string|null} quoteId  - Vendor_Bids record ID to award (ignored on decline/note)
 * @param {string} note     - Decision note text (optional for decision actions; required semantically for note action)
 * @param {string} viewer   - Email of the logged-in portal user making the decision
 * @param {string} today    - Date string in YYYY-MM-DD format (Portal_Approved_At)
 * @returns {object} Zoho record payload (without the outer { data: [...] } wrapper)
 */
function buildRecord(itemId, action, quoteId, note, viewer, today) {
  const id = String(itemId);

  // Note-only action: touch only Decision_Notes, leave Stage/award/approver unchanged.
  if (action === "note") {
    return { id, Decision_Notes: note || "" };
  }

  const stage = ACTION_STAGE[action];
  const record = {
    id,
    Stage: stage,
    Portal_Approved_By: viewer,
    Portal_Approved_At: today, // Date field in Zoho (YYYY-MM-DD), not datetime
  };

  // Only write Decision_Notes when a note is provided.
  if (note) record.Decision_Notes = note;

  // Award the winning quote on an approval (not on decline).
  if (action !== "decline" && quoteId) record.Awarded_Vendor = { id: String(quoteId) };

  return record;
}

let cachedToken = null, cachedExp = 0;
async function getWriteToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExp) return cachedToken;
  const refresh = process.env.ZOHO_WRITE_REFRESH_TOKEN;
  const cid = process.env.ZOHO_WRITE_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
  const secret = process.env.ZOHO_WRITE_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
  if (!refresh || !cid || !secret) throw new Error("writes_not_configured");
  const params = new URLSearchParams({ grant_type: "refresh_token", client_id: cid, client_secret: secret, refresh_token: refresh });
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${params.toString()}`, { method: "POST" });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("token_refresh_failed");
  cachedToken = j.access_token;
  cachedExp = now + (Number(j.expires_in || 3600) - 300) * 1000;
  return cachedToken;
}

const handler = async (req, res) => {
  // Must be logged in (so the approval is attributable to a person).
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });

  const { itemId, action, quoteId, note } = await auth.readJson(req);

  // Validate action is one of the four allowed values.
  const validActions = { approve: true, approve_conditions: true, decline: true, note: true };
  if (!itemId || !validActions[action]) {
    return res.status(400).json({ error: "bad_request", detail: "need itemId and a valid action" });
  }

  // For the three decision actions, a Stage must resolve — a "note" action deliberately has none.
  const stage = ACTION_STAGE[action];
  if (action !== "note" && !stage) {
    return res.status(400).json({ error: "bad_request", detail: "unrecognized decision action" });
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, date-only field
  const record = buildRecord(itemId, action, quoteId, note, viewer, today);

  try {
    const token = await getWriteToken();
    const r = await fetch(`${API}/crm/v8/Procurement_Items`, {
      method: "PUT",
      headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [record] }),
    });
    const j = await r.json().catch(() => ({}));
    const row = j && j.data && j.data[0];
    if (!r.ok || !row || row.code !== "SUCCESS") {
      return res.status(502).json({ error: "zoho_write_failed", detail: row || j });
    }
    console.log(JSON.stringify({ evt: "portal_decision", action, stage: stage || null, itemId, by: viewer, ts: new Date().toISOString() }));
    await dbm.audit("portal_decision", viewer, { itemId: String(itemId), action, stage: stage || null, quoteId: quoteId ? String(quoteId) : null, note: note || null });
    // Fire the workflow event on real decisions (not note-only): log activity + notify Jefferson.
    const meta = DECISION_META[action];
    if (meta) {
      await events.emit({
        type: "decision_made", action: meta.verb, actor: viewer, actorLabel: viewer,
        itemId: String(itemId), extra: meta.label,
        detail: { action, stage: stage || null, quoteId: quoteId ? String(quoteId) : null, note: note || null },
      });
    }
    return res.status(200).json({ ok: true, itemId, stage: stage || null, by: viewer });
  } catch (err) {
    const msg = String(err.message || err);
    const code = msg === "writes_not_configured" ? 503 : 502;
    return res.status(code).json({ error: msg });
  }
};

module.exports = handler;
module.exports.buildRecord = buildRecord;
