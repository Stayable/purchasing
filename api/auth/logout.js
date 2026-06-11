// api/auth/logout.js — clears the session cookie.
const auth = require("../_auth.js");

module.exports = async (req, res) => {
  // Expire the cookie immediately (Max-Age=0).
  res.setHeader("Set-Cookie", auth.cookie("portal_session", "", 0));
  return res.status(200).json({ ok: true });
};
