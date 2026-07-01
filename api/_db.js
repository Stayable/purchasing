// api/_db.js — Neon Postgres access for portal auth + audit.
// Underscore prefix = not a route. The driver is required lazily so that, without
// DATABASE_URL, nothing loads and the portal falls back to env-var auth (inert upgrade).

let _sql = null;
function db() {
  if (!process.env.DATABASE_URL) return null;
  if (_sql) return _sql;
  const { neon } = require("@neondatabase/serverless"); // lazy: only when configured
  _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

function dbEnabled() {
  return !!process.env.DATABASE_URL;
}

// Returns { email, password_hash, role, active } or null.
async function getUser(email) {
  const sql = db();
  if (!sql) return null;
  const rows = await sql`
    SELECT email, password_hash, role, active
    FROM portal_users
    WHERE email = ${String(email).trim().toLowerCase()} AND active = true
    LIMIT 1`;
  return rows && rows[0] ? rows[0] : null;
}

// Best-effort audit write; never throws (logging must not break the request).
async function audit(event, email, detail) {
  const sql = db();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO portal_audit (event, email, detail)
      VALUES (${event}, ${email ? String(email).toLowerCase() : null}, ${detail ? JSON.stringify(detail) : null}::jsonb)`;
  } catch (e) {
    // swallow — audit failure should not affect auth
  }
}

// --- workflow activity log (append-only) ---
async function insertActivity(actor, action, itemId, detail) {
  const sql = db();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO portal_activity (actor, action, item_id, detail)
      VALUES (${actor ? String(actor).toLowerCase() : null}, ${action},
              ${itemId ? String(itemId) : null}, ${detail ? JSON.stringify(detail) : null}::jsonb)`;
  } catch (e) { /* swallow — logging must not break the request */ }
}

// List activity, newest first. Optional filters: itemId, actor, action, limit (default 100).
async function listActivity({ itemId, actor, action, limit } = {}) {
  const sql = db();
  if (!sql) return [];
  const lim = Math.min(Number(limit) || 100, 500);
  try {
    const rows = await sql`
      SELECT id, actor, action, item_id, detail, created_at
      FROM portal_activity
      WHERE (${itemId ?? null}::text IS NULL OR item_id = ${itemId ?? null})
        AND (${actor ?? null}::text IS NULL OR actor = ${actor ? String(actor).toLowerCase() : null})
        AND (${action ?? null}::text IS NULL OR action = ${action ?? null})
      ORDER BY created_at DESC
      LIMIT ${lim}`;
    return rows || [];
  } catch (e) { return []; }
}

// --- webapp notifications ---
async function insertNotification(recipient, type, itemId, title, body) {
  const sql = db();
  if (!sql) return;
  try {
    await sql`
      INSERT INTO portal_notifications (recipient, type, item_id, title, body)
      VALUES (${String(recipient).toLowerCase()}, ${type}, ${itemId ? String(itemId) : null}, ${title}, ${body || null})`;
  } catch (e) { /* swallow */ }
}

async function listNotifications(recipient, { limit } = {}) {
  const sql = db();
  if (!sql) return [];
  const lim = Math.min(Number(limit) || 50, 200);
  try {
    const rows = await sql`
      SELECT id, type, item_id, title, body, read_at, created_at
      FROM portal_notifications
      WHERE recipient = ${String(recipient).toLowerCase()}
      ORDER BY (read_at IS NULL) DESC, created_at DESC
      LIMIT ${lim}`;
    return rows || [];
  } catch (e) { return []; }
}

// Mark notifications read for a recipient. ids = array of ids, or all=true for every unread.
async function markNotificationsRead(recipient, { ids, all } = {}) {
  const sql = db();
  if (!sql) return 0;
  const r = String(recipient).toLowerCase();
  try {
    if (all) {
      await sql`UPDATE portal_notifications SET read_at = now() WHERE recipient = ${r} AND read_at IS NULL`;
      return 1;
    }
    if (Array.isArray(ids) && ids.length) {
      const nums = ids.map((x) => Number(x)).filter(Number.isFinite);
      if (nums.length) await sql`UPDATE portal_notifications SET read_at = now() WHERE recipient = ${r} AND id = ANY(${nums})`;
    }
    return 1;
  } catch (e) { return 0; }
}

// De-dupe guard: was a notification of this type for this item created in the last `minutes`?
async function recentNotificationExists(type, itemId, minutes) {
  const sql = db();
  if (!sql) return false;
  try {
    const rows = await sql`
      SELECT 1 FROM portal_notifications
      WHERE type = ${type} AND item_id = ${itemId ? String(itemId) : null}
        AND created_at > now() - (${Number(minutes) || 10} * interval '1 minute')
      LIMIT 1`;
    return !!(rows && rows.length);
  } catch (e) { return false; }
}

module.exports = {
  dbEnabled, getUser, audit,
  insertActivity, listActivity,
  insertNotification, listNotifications, markNotificationsRead, recentNotificationExists,
};
