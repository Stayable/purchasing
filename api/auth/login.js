// api/auth/login.js — POST {email, password} -> sets a signed 30-day session cookie.
// Logs successful logins (who/when) to the function logs for the portal access audit.
// Auth disabled (no SESSION_SECRET) -> 404, so the endpoint is inert until configured.

const auth = require("../_auth.js");

module.exports = async (req, res) => {
  if (!auth.authEnabled()) return res.status(404).json({ error: "auth_disabled" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  const { email, password } = await auth.readJson(req);
  const who = auth.norm(email);

  if (!auth.verifyPassword(email, password)) {
    // Single generic failure (no email enumeration); log the attempt.
    console.log(JSON.stringify({ evt: "login_failed", email: who || null, ts: new Date().toISOString() }));
    return res.status(401).json({ error: "invalid_credentials" });
  }

  res.setHeader("Set-Cookie", auth.cookie("portal_session", auth.makeSession(who), auth.SESSION_TTL_SEC));
  console.log(JSON.stringify({ evt: "login", email: who, ts: new Date().toISOString() }));
  return res.status(200).json({ ok: true, email: who });
};
