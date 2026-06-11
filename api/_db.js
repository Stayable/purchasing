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

module.exports = { dbEnabled, getUser, audit };
