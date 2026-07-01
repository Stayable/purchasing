// api/_events.js — the single hook every business event goes through, so the
// activity log, the webapp notifications, and the email all fire from one place
// and can never drift. Called from api/items.js, api/award.js, api/items/ready.js,
// and api/hooks/zoho.js.
//
// Pure helpers (recipientsFor, renderNotification) are exported for unit tests;
// emit() performs the side effects (DB writes + best-effort email) and never throws.

const dbm = require("./_db.js");
const mail = require("./_email.js");

const ROB = "rb@rise8companies.com";
const JEFFERSON = "jefferson@rentstayable.com";

const PORTAL_URL = process.env.PORTAL_PUBLIC_URL || "https://procurement.rentstayable.com";

// notification type -> who gets the bell + email
function recipientsFor(type) {
  switch (type) {
    case "item_created":  return [JEFFERSON]; // Rob briefed a new item to source
    case "quotes_ready":  return [ROB];       // Jefferson finished quotes
    case "decision_made": return [JEFFERSON]; // Rob approved/awarded/declined
    default: return [];
  }
}

// Render the webapp + email copy for a notification. Pure.
// ctx: { itemName, actorLabel, extra }  ->  { title, body, html }
function renderNotification(type, ctx = {}) {
  const name = ctx.itemName || "a procurement item";
  const link = ctx.itemId ? `${PORTAL_URL}/items` : PORTAL_URL;
  let title, body;
  switch (type) {
    case "item_created":
      title = `New item to source: ${name}`;
      body = `${ctx.actorLabel || "Rob"} added "${name}" for sourcing. Add vendors and quotes in Zoho, then set the item to Submitted when ready for review.`;
      break;
    case "quotes_ready":
      title = `Quotes ready for review: ${name}`;
      body = `"${name}" has been marked ready. Review the quotes and communications, then approve or award.`;
      break;
    case "decision_made":
      title = `Decision on ${name}: ${ctx.extra || "recorded"}`;
      body = `${ctx.actorLabel || "Rob"} recorded a decision (${ctx.extra || "recorded"}) on "${name}". Proceed with next steps.`;
      break;
    default:
      title = `Update: ${name}`;
      body = "";
  }
  const html = `<div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#0f172a">
    <h2 style="margin:0 0 8px;font-size:16px">${escapeHtml(title)}</h2>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#334155">${escapeHtml(body)}</p>
    <a href="${link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:9px 16px;border-radius:8px;font-size:14px">Open the portal</a>
  </div>`;
  return { title, body, html };
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Fire an event: log activity + insert per-recipient notifications + send email.
// opts: { type, action, actor, actorLabel, itemId, itemName, extra, detail }
// - type      : notification type (item_created | quotes_ready | decision_made) — drives recipients
// - action    : activity action verb (defaults to type)
// Returns { activity:true, notified:[emails], emailed:n } (best-effort; never throws).
async function emit(opts = {}) {
  const { type, action, actor, actorLabel, itemId, itemName, extra, detail } = opts;
  const out = { activity: false, notified: [], emailed: 0 };
  try {
    await dbm.insertActivity(actor || null, action || type, itemId || null, detail || { itemName, extra });
    out.activity = true;

    const recipients = recipientsFor(type);
    const { title, body, html } = renderNotification(type, { itemName, actorLabel, itemId, extra });
    for (const r of recipients) {
      await dbm.insertNotification(r, type, itemId, title, body);
      out.notified.push(r);
      const res = await mail.sendEmail(r, title, html);
      if (res && res.sent) out.emailed += 1;
    }
  } catch (e) { /* best-effort: swallow so the business write still succeeds */ }
  return out;
}

module.exports = { emit, recipientsFor, renderNotification, ROB, JEFFERSON };
