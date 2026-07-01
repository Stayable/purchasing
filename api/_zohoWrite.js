// api/_zohoWrite.js — shared Zoho write helpers (token refresh + record create).
// Underscore prefix = not a route. Uses the SEPARATE write-scoped token so the
// read proxy stays least-privilege (mirrors api/award.js).
const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

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

// Create one record. Returns { id } on success; throws on failure.
async function createRecord(module, record) {
  const token = await getWriteToken();
  const r = await fetch(`${API}/crm/v8/${module}`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [record] }),
  });
  const j = await r.json().catch(() => ({}));
  const row = j && j.data && j.data[0];
  if (!r.ok || !row || row.code !== "SUCCESS") {
    throw new Error("zoho_write_failed:" + JSON.stringify(row || j));
  }
  return { id: row.details && row.details.id };
}

// Update one record (must include id). Returns { id } on success; throws on failure.
async function updateRecord(module, record) {
  const token = await getWriteToken();
  const r = await fetch(`${API}/crm/v8/${module}`, {
    method: "PUT",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [record] }),
  });
  const j = await r.json().catch(() => ({}));
  const row = j && j.data && j.data[0];
  if (!r.ok || !row || row.code !== "SUCCESS") {
    throw new Error("zoho_write_failed:" + JSON.stringify(row || j));
  }
  return { id: row.details && row.details.id };
}

// COQL read using the write token (scope ZohoCRM.modules.ALL covers reads).
async function coql(query) {
  const token = await getWriteToken();
  const r = await fetch(`${API}/crm/v8/coql`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ select_query: query }),
  });
  if (r.status === 204) return [];
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`coql_failed:${r.status}:` + JSON.stringify(j));
  return j.data || [];
}

module.exports = { getWriteToken, createRecord, updateRecord, coql };
