// api/activity.js — read-only workflow activity feed (per-item timeline + global feed).
//   GET /api/activity?itemId=&actor=&action=&limit=
// Session-gated (any logged-in user may read). Returns [] when the DB isn't configured.

const auth = require("./_auth.js");
const dbm = require("./_db.js");

module.exports = async (req, res) => {
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (req.method !== "GET") return res.status(405).json({ error: "method_not_allowed" });

  const q = req.query || {};
  const rows = await dbm.listActivity({
    itemId: q.itemId || null,
    actor: q.actor || null,
    action: q.action || null,
    limit: q.limit || 100,
  });

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Cookie");
  return res.status(200).json({ items: rows });
};
