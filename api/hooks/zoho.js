// api/hooks/zoho.js — inbound webhook from a Zoho workflow rule.
// When Jefferson sets a Procurement_Item's Stage = Submitted in Zoho, the rule POSTs here
// (with a shared secret + the record's id/name/stage) and we fire the "quotes ready" event
// so Rob gets the bell + email. Jefferson never leaves Zoho.
//
// NOT session-gated (Zoho can't hold a portal cookie) — authenticated by a shared secret.
// Inert until ZOHO_WEBHOOK_SECRET is set (returns 503).
//
// Configure the Zoho workflow-rule webhook to send (query string, form body, or JSON):
//   secret   = <ZOHO_WEBHOOK_SECRET>
//   itemId   = ${Procurement_Items.Id}
//   itemName = ${Procurement_Items.Item}     (the Name field label is "Item")
//   stage    = ${Procurement_Items.Stage}
//
// BODY ENCODING (hardened 07/31/26): Vercel only pre-parses application/json and
// x-www-form-urlencoded. The 07/08 live fire produced NO row in Neon, and probing the
// deployed endpoint showed multipart/form-data and missing/odd Content-Type both fail
// closed at the secret check (401) because the parsed body came back empty. We now parse
// the raw body ourselves for multipart, urlencoded, JSON, and no-Content-Type senders, so
// whichever body type the Zoho action is set to, the params arrive.
//
// OBSERVABILITY: every rejected hit is written to portal_activity as `webhook_rejected`
// (reason + which keys arrived + content-type — never the secret value), so a
// misconfigured Zoho action is diagnosable from Neon instead of only the Zoho UI log.
//
// Env vars: ZOHO_WEBHOOK_SECRET (required to enable), DEDUPE_MINUTES (optional, default 10)

const crypto = require("crypto");
const dbm = require("./../_db.js");
const events = require("./../_events.js");

function constEq(a, b) {
  const ba = Buffer.from(String(a || "")), bb = Buffer.from(String(b || ""));
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function parseUrlEncoded(raw) {
  const out = {};
  for (const [k, v] of new URLSearchParams(raw)) out[k] = v;
  return out;
}

// Minimal multipart/form-data reader for small text fields (all Zoho sends here).
function parseMultipart(raw, contentType) {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  const boundary = m && (m[1] || m[2]);
  if (!boundary) return {};
  const out = {};
  for (const part of raw.split(`--${boundary.trim()}`)) {
    const nm = /name="([^"]*)"/i.exec(part);
    if (!nm) continue;
    const sep = part.indexOf("\r\n\r\n");
    if (sep === -1) continue;
    out[nm[1]] = part.slice(sep + 4).replace(/\r\n$/, "");
  }
  return out;
}

// Pure: turn a raw body string + Content-Type into a params object. Exported for tests.
function parseBodyText(raw, contentType) {
  if (!raw) return {};
  const ct = String(contentType || "").toLowerCase();
  if (ct.includes("multipart/form-data")) return parseMultipart(raw, contentType);
  if (ct.includes("x-www-form-urlencoded")) return parseUrlEncoded(raw);
  if (ct.includes("json")) { try { return JSON.parse(raw); } catch { return {}; } }
  // No or unexpected Content-Type — sniff it.
  const t = raw.trim();
  if (t.startsWith("{") || t.startsWith("[")) { try { return JSON.parse(t); } catch { /* fall through */ } }
  if (t.includes("=")) return parseUrlEncoded(t);
  return {};
}

function rawBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

async function readParams(req) {
  if (req.method !== "POST" && req.method !== "PUT") return {};
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;          // Vercel pre-parsed
  if (Buffer.isBuffer(b) || typeof b === "string") {
    return parseBodyText(String(b), req.headers["content-type"]);           // raw passthrough
  }
  return parseBodyText(await rawBody(req), req.headers["content-type"]);    // stream fallback
}

// An unresolved Zoho merge field arrives literally as "${Procurement_Items.Id}".
// Treat that as missing rather than emitting an event against a garbage id.
function cleanId(v) {
  const s = String(v == null ? "" : v).trim();
  if (!s || s.includes("${") || s.toLowerCase() === "null" || s.toLowerCase() === "undefined") return null;
  return s;
}

// Best-effort forensic row. Never throws, never records the secret value.
async function logReject(reason, req, src) {
  try {
    await dbm.insertActivity("zoho-webhook", "webhook_rejected", null, {
      reason,
      method: req.method,
      contentType: req.headers["content-type"] || null,
      keys: Object.keys(src || {}).sort(),
    });
  } catch { /* observability must never break the response */ }
}

module.exports = async (req, res) => {
  const secret = process.env.ZOHO_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "webhook_not_configured" });

  const q = req.query || {};
  const body = await readParams(req);
  const src = { ...q, ...body };

  const provided = req.headers["x-webhook-secret"] || src.secret;
  if (!constEq(provided, secret)) {
    await logReject(Object.keys(src).length ? "bad_secret" : "empty_payload", req, src);
    return res.status(401).json({ error: "bad_secret" });
  }

  const itemId = cleanId(src.itemId || src.id || src.Id || src.entityId || src.record_id);
  const itemName = src.itemName || src.name || null;
  const stage = src.stage || null;

  if (!itemId) {
    await logReject("missing_itemId", req, src);
    return res.status(400).json({ error: "bad_request", detail: "missing itemId" });
  }

  // Only act on the Submitted transition (ignore other stage writes without erroring).
  if (stage && String(stage).toLowerCase() !== "submitted") {
    return res.status(200).json({ ok: true, ignored: "stage_not_submitted", stage });
  }

  // De-dupe: a re-sent webhook must not double-notify Rob.
  const minutes = Number(process.env.DEDUPE_MINUTES) || 10;
  if (await dbm.recentNotificationExists("quotes_ready", itemId, minutes)) {
    return res.status(200).json({ ok: true, ignored: "duplicate" });
  }

  const out = await events.emit({
    type: "quotes_ready",
    action: "quotes_ready",
    actor: "jefferson@ (via zoho)",
    actorLabel: "Jefferson",
    itemId,
    itemName,
  });
  return res.status(200).json({ ok: true, notified: out.notified });
};

module.exports.parseBodyText = parseBodyText;
module.exports.cleanId = cleanId;
