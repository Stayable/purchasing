// api/notifications.js — the webapp notification center for the logged-in user.
//   GET  /api/notifications              -> { items:[...], unread:n }
//   POST /api/notifications  {all:true}  -> mark all read
//   POST /api/notifications  {ids:[...]} -> mark those read
// Session-gated. Returns {items:[],unread:0} when the DB isn't configured (inert).

const auth = require("./_auth.js");
const dbm = require("./_db.js");

module.exports = async (req, res) => {
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Cookie");

  if (req.method === "GET") {
    const rows = await dbm.listNotifications(viewer, { limit: 50 });
    const unread = rows.filter((r) => !r.read_at).length;
    return res.status(200).json({ items: rows, unread });
  }

  if (req.method === "POST") {
    const body = await auth.readJson(req);
    await dbm.markNotificationsRead(viewer, { ids: body.ids, all: !!body.all });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method_not_allowed" });
};
