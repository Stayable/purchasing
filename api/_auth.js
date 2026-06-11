// api/_auth.js — shared auth helpers for the Rob review portal.
// Underscore prefix = NOT a route; bundled for require() by /api/auth/* and /api/procurement.js.
// No external deps — Node crypto only.
//
// CURRENT: per-user password login -> signed 30-day session cookie (HttpOnly+Secure).
// PLANNED NEXT (not wired yet): email OTP step before the session is issued. The session/
// cookie/allowlist plumbing here is built to accept that layer without a rewrite.
//
// Security model:
//   - Session cookie carries a JSON payload signed with HMAC-SHA256(SESSION_SECRET); the
//     server re-derives and constant-time compares the signature on every request, and
//     rejects expired tokens. The cookie is HttpOnly+Secure+SameSite=Strict.
//   - Auth is ENABLED only when SESSION_SECRET is set. Unset => auth disabled (portal stays
//     in its current open/live behavior) so deploying this is inert until you configure it.
//
// Env vars (server-side, Vercel):
//   SESSION_SECRET         required to ENABLE auth (long random string)
//   PORTAL_PW_JEFFERSON    password for jefferson@rentstayable.com
//   PORTAL_PW_ADMIN        password for admin@rentstayable.com
//   PORTAL_PW_ROB          password for rb@rise8companies.com
//   PORTAL_ALLOWED_EMAILS  optional CSV override of the allowlist (defaults below)

const crypto = require("crypto");

const DEFAULT_ALLOWED = [
  "jefferson@rentstayable.com",
  "admin@rentstayable.com",
  "rb@rise8companies.com",
];

// email -> env var holding that user's password
const PW_ENV = {
  "jefferson@rentstayable.com": "PORTAL_PW_JEFFERSON",
  "admin@rentstayable.com": "PORTAL_PW_ADMIN",
  "rb@rise8companies.com": "PORTAL_PW_ROB",
};

const SESSION_TTL_SEC = 30 * 24 * 60 * 60; // 30 days

function authEnabled() {
  return !!process.env.SESSION_SECRET;
}

function allowedEmails() {
  const csv = process.env.PORTAL_ALLOWED_EMAILS;
  const list = csv ? csv.split(",") : DEFAULT_ALLOWED;
  return list.map((e) => e.trim().toLowerCase()).filter(Boolean);
}
function norm(email) { return String(email || "").trim().toLowerCase(); }
function isAllowed(email) { return allowedEmails().includes(norm(email)); }

function nowSec() { return Math.floor(Date.now() / 1000); }

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(str) {
  return Buffer.from(String(str).replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}
function hmac(msg) {
  return b64url(crypto.createHmac("sha256", process.env.SESSION_SECRET).update(msg).digest());
}
function safeEqual(a, b) {
  const ba = Buffer.from(String(a)), bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// --- password check (constant-time) ---
function verifyPassword(email, password) {
  if (!isAllowed(email)) return false;
  const envKey = PW_ENV[norm(email)];
  const expected = envKey ? process.env[envKey] : null;
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}

// --- signed session token ---
function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  return body + "." + hmac(body);
}
function verify(token) {
  if (!token || typeof token !== "string" || token.indexOf(".") < 0) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(sig, hmac(body))) return null;
  let payload;
  try { payload = JSON.parse(fromB64url(body)); } catch { return null; }
  if (!payload || typeof payload.exp !== "number" || nowSec() > payload.exp) return null;
  return payload;
}
function makeSession(email) {
  return sign({ t: "sess", email: norm(email), iat: nowSec(), exp: nowSec() + SESSION_TTL_SEC });
}
// returns the session email if valid + still allowed, else null
function sessionEmail(req) {
  const p = verify(parseCookies(req)["portal_session"]);
  if (!p || p.t !== "sess" || !isAllowed(p.email)) return null;
  return p.email;
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers && req.headers.cookie;
  if (!raw) return out;
  for (const part of raw.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function cookie(name, value, maxAgeSec) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSec}`;
}

// Read a JSON body from the request (Vercel may or may not pre-parse req.body).
async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return await new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch { resolve({}); } });
    req.on("error", () => resolve({}));
  });
}

module.exports = {
  authEnabled, isAllowed, allowedEmails, norm,
  verifyPassword, makeSession, sessionEmail,
  cookie, parseCookies, readJson, nowSec, SESSION_TTL_SEC,
};
