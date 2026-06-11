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

const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

// action -> Stage value (exact live picklist labels)
const ACTION_STAGE = {
  approve: "Approved",
  approve_conditions: "Approved-with-Conditions",
  decline: "Declined",
};

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

module.exports = async (req, res) => {
  // Must be logged in (so the approval is attributable to a person).
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });

  const { itemId, action, quoteId } = await auth.readJson(req);
  const stage = ACTION_STAGE[action];
  if (!itemId || !stage) return res.status(400).json({ error: "bad_request", detail: "need itemId and a valid action" });

  const record = {
    id: String(itemId),
    Stage: stage,
    Portal_Approved_By: viewer,
    Portal_Approved_At: new Date().toISOString(),
  };
  // Award the winning quote on an approval (not on decline).
  if (action !== "decline" && quoteId) record.Awarded_Vendor = { id: String(quoteId) };

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
    console.log(JSON.stringify({ evt: "portal_decision", action, stage, itemId, by: viewer, ts: new Date().toISOString() }));
    await dbm.audit("portal_decision", viewer, { itemId: String(itemId), action, stage, quoteId: quoteId ? String(quoteId) : null });
    return res.status(200).json({ ok: true, itemId, stage, by: viewer });
  } catch (err) {
    const msg = String(err.message || err);
    const code = msg === "writes_not_configured" ? 503 : 502;
    return res.status(code).json({ error: msg });
  }
};
