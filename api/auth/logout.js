// api/auth/logout.js — clears the session cookie.
const auth = require("../_auth.js");
const dbm = require("../_db.js");

module.exports = async (req, res) => {
  const who = auth.sessionEmail(req);
  // Expire the cookie immediately (Max-Age=0).
  res.setHeader("Set-Cookie", auth.cookie("portal_session", "", 0));
  if (who) await dbm.audit("logout", who, null);
  return res.status(200).json({ ok: true });
};
