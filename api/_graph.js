// api/_graph.js — Microsoft Graph app-only client for vendor-communications.
// Reads scoped mailboxes (Inbox + Sent Items) READ-ONLY. Inert until env vars set.
//
// Env (Vercel, server-side only):
//   GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET  (required to enable)
//   GRAPH_MAILBOXES  (optional CSV; default purchasing@ + jefferson@)
const LOGIN = "https://login.microsoftonline.com";
const GRAPH = "https://graph.microsoft.com/v1.0";
const DEFAULT_MAILBOXES = ["purchasing@rentstayable.com", "jefferson@rentstayable.com"];

function graphConfigured() {
  return !!(process.env.GRAPH_TENANT_ID && process.env.GRAPH_CLIENT_ID && process.env.GRAPH_CLIENT_SECRET);
}
function scopedMailboxes() {
  const csv = process.env.GRAPH_MAILBOXES;
  return (csv ? csv.split(",") : DEFAULT_MAILBOXES).map((s) => s.trim()).filter(Boolean);
}
function addrList(arr) {
  return (arr || []).map((r) => (r.emailAddress && r.emailAddress.address) || "").filter(Boolean);
}
function normalizeGraphMessage(raw) {
  return {
    id: raw.id,
    conversationId: raw.conversationId || null,
    from: (raw.from && raw.from.emailAddress && raw.from.emailAddress.address) || "",
    to: addrList(raw.toRecipients),
    cc: addrList(raw.ccRecipients),
    subject: raw.subject || "",
    preview: raw.bodyPreview || "",
    receivedAt: raw.receivedDateTime || null,
    hasAttachments: !!raw.hasAttachments,
    webLink: raw.webLink || null,
  };
}

let _tok = null, _exp = 0;
async function getGraphToken() {
  const now = Date.now();
  if (_tok && now < _exp) return _tok;
  const body = new URLSearchParams({
    client_id: process.env.GRAPH_CLIENT_ID,
    client_secret: process.env.GRAPH_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const r = await fetch(`${LOGIN}/${process.env.GRAPH_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("graph_token_failed:" + JSON.stringify(j));
  _tok = j.access_token; _exp = now + (Number(j.expires_in || 3600) - 300) * 1000;
  return _tok;
}

const SELECT = "id,conversationId,subject,bodyPreview,receivedDateTime,hasAttachments,webLink,from,toRecipients,ccRecipients";
async function fetchFolder(mailbox, folder, token, sinceIso, top) {
  const url = `${GRAPH}/users/${encodeURIComponent(mailbox)}/mailFolders/${folder}/messages`
    + `?$select=${SELECT}&$top=${top}&$orderby=receivedDateTime desc`
    + `&$filter=receivedDateTime ge ${sinceIso}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`graph_fetch_failed:${mailbox}:${folder}:${r.status}`);
  const j = await r.json().catch(() => ({}));
  return (j.value || []).map(normalizeGraphMessage);
}
async function fetchRecentMessages(mailbox, opts = {}) {
  const sinceDays = opts.sinceDays || 120, top = opts.top || 50;
  const token = await getGraphToken();
  const sinceIso = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const [inbox, sent] = await Promise.all([
    fetchFolder(mailbox, "inbox", token, sinceIso, top),
    fetchFolder(mailbox, "sentitems", token, sinceIso, top),
  ]);
  return inbox.concat(sent);
}

module.exports = { graphConfigured, scopedMailboxes, normalizeGraphMessage, getGraphToken, fetchRecentMessages };
