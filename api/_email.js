// api/_email.js — outbound email via Resend REST API (no SDK dependency; uses fetch).
// Underscore prefix = not a route. Best-effort: never throws; returns a small result object.
// Inert until RESEND_API_KEY is set (returns {sent:false, reason:"not_configured"}).
//
// Env vars (server-side, Vercel):
//   RESEND_API_KEY   Resend API key (enables sending)
//   RESEND_FROM      optional "From" header (default below); the domain must be verified in Resend

const DEFAULT_FROM = "Stayable Procurement <procurement@rentstayable.com>";

function emailEnabled() {
  return !!process.env.RESEND_API_KEY;
}

// Send one email. to = string or array of strings. Returns {sent, reason?, id?}.
async function sendEmail(to, subject, html) {
  if (!emailEnabled()) return { sent: false, reason: "not_configured" };
  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (!recipients.length) return { sent: false, reason: "no_recipient" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: recipients,
        subject,
        html,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { sent: false, reason: "resend_error", detail: j };
    return { sent: true, id: j && j.id };
  } catch (err) {
    return { sent: false, reason: String(err.message || err) };
  }
}

module.exports = { emailEnabled, sendEmail };
