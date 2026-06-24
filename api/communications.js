// api/communications.js — READ-ONLY vendor-communications endpoint.
// Sweeps scoped M365 mailboxes via Graph, matches to each item's vendors, returns
// per-quote threads (?itemId=) or a cross-item attention sweep (no itemId).
// Inert until GRAPH_* env vars are set. Auth-gated; never CDN-shared.
const auth = require("./_auth.js");
const graph = require("./_graph.js");
const comms = require("./_comms.js");

const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";
const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";

function buildQuoteQuery(itemId) {
  const where = itemId ? `Procurement_Item = ${itemId}` : "Procurement_Item is not null";
  return "SELECT Name, Vendor.Vendor_Name, Vendor.id, Vendor.Email, Procurement_Item.id, id "
    + `FROM Vendor_Quotes WHERE ${where} LIMIT 200`;
}

// --- Zoho read (mirrors api/procurement.js token+coql pattern) ---
let zTok = null, zExp = 0;
async function zohoToken() {
  const now = Date.now();
  if (zTok && now < zExp) return zTok;
  const p = new URLSearchParams({
    grant_type: "refresh_token", client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET, refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${p}`, { method: "POST" });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("zoho_token_failed");
  zTok = j.access_token; zExp = now + (Number(j.expires_in || 3600) - 300) * 1000;
  return zTok;
}
async function coql(query) {
  const r = await fetch(`${API}/crm/v8/coql`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${await zohoToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ select_query: query }),
  });
  if (r.status === 204) return [];
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("coql_failed:" + r.status);
  return j.data || [];
}

async function resolveVendors(itemId) {
  const quotes = await coql(buildQuoteQuery(itemId));
  return comms.vendorsFromRows(quotes);
}

// in-memory mailbox sweep cache (per warm instance, ~60s)
let sweepCache = null, sweepExp = 0;
async function recentMessages() {
  const now = Date.now();
  if (sweepCache && now < sweepExp) return sweepCache;
  const boxes = graph.scopedMailboxes();
  const all = [];
  for (const b of boxes) all.push(...(await graph.fetchRecentMessages(b)));
  sweepCache = all; sweepExp = now + 60000;
  return all;
}

async function handler(req, res) {
  if (auth.authEnabled()) {
    const viewer = auth.sessionEmail(req);
    if (!viewer) return res.status(401).json({ error: "auth_required" });
  }
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Cookie");

  if (!graph.graphConfigured()) {
    return res.status(200).json({ configured: false, coverage: "email-only" });
  }

  // Lazy single-message body fetch (expand-to-read). Scope-guard the mailbox so a
  // logged-in user can't read an arbitrary mailbox by passing the param.
  const messageId = req.query && req.query.messageId;
  if (messageId) {
    const mailbox = (req.query && req.query.mailbox) || "";
    if (!graph.scopedMailboxes().includes(mailbox)) {
      return res.status(400).json({ error: "mailbox_out_of_scope" });
    }
    try {
      return res.status(200).json(await graph.fetchMessageBody(mailbox, messageId));
    } catch (err) {
      return res.status(502).json({ error: "comms_body_failed", detail: String(err.message || err) });
    }
  }

  try {
    const itemId = (req.query && req.query.itemId) || null;
    const ourAddresses = graph.scopedMailboxes();
    const nowMs = Date.now();
    const messages = await recentMessages();
    const vendors = await resolveVendors(itemId);
    if (itemId) {
      return res.status(200).json(comms.buildItemPayload({ itemId, vendors, messages, ourAddresses, nowMs }));
    }
    return res.status(200).json(comms.buildAttentionSweep({ itemsVendors: vendors, messages, ourAddresses, nowMs }));
  } catch (err) {
    return res.status(502).json({ error: "comms_read_failed", detail: String(err.message || err) });
  }
}

module.exports = handler;
module.exports.buildQuoteQuery = buildQuoteQuery;
