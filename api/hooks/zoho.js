// api/hooks/zoho.js — inbound webhook from a Zoho workflow rule.
// When Jefferson sets a Procurement_Item's Stage = Submitted in Zoho, the rule POSTs here
// (with a shared secret + the record's id/name/stage) and we fire the "quotes ready" event
// so Rob gets the bell + email. Jefferson never leaves Zoho.
//
// NOT session-gated (Zoho can't hold a portal cookie) — authenticated by a shared secret.
// Inert until ZOHO_WEBHOOK_SECRET is set (returns 503).
//
// Configure the Zoho workflow-rule webhook to send (query string or form body):
//   secret   = <ZOHO_WEBHOOK_SECRET>
//   itemId   = ${Procurement_Items.Id}
//   itemName = ${Procurement_Items.Item}     (the Name field label is "Item")
//   stage    = ${Procurement_Items.Stage}
//
// Env vars: ZOHO_WEBHOOK_SECRET (required to enable), DEDUPE_MINUTES (optional, default 10)

const crypto = require("crypto");
const auth = require("./../_auth.js");
const dbm = require("./../_db.js");
const events = require("./../_events.js");

function constEq(a, b) {
  const ba = Buffer.from(String(a || "")), bb = Buffer.from(String(b || ""));
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

module.exports = async (req, res) => {
  const secret = process.env.ZOHO_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: "webhook_not_configured" });

  const q = req.query || {};
  const body = (req.method === "POST") ? await auth.readJson(req) : {};
  const src = { ...q, ...body };

  const provided = req.headers["x-webhook-secret"] || src.secret;
  if (!constEq(provided, secret)) return res.status(401).json({ error: "bad_secret" });

  const itemId = src.itemId || src.id || null;
  const itemName = src.itemName || src.name || null;
  const stage = src.stage || null;

  if (!itemId) return res.status(400).json({ error: "bad_request", detail: "missing itemId" });

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
