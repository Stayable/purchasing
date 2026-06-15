// db/setup.js — apply db/schema.sql and (optionally) seed portal_users against the
// database that DATABASE_URL points to. Used by `npm run db:setup`.
//
//   DATABASE_URL=...                  node db/setup.js            # schema only
//   DATABASE_URL=... SEED_USERS='[…]' node db/setup.js            # schema + seed
// SEED_USERS is JSON: [{"email":"..","password":"..","role":"admin|reviewer"}, ...]
// Passwords are scrypt-hashed locally (api/_auth.js); only hashes are written.

const fs = require("fs");
const path = require("path");
const { neon } = require("@neondatabase/serverless");
const { hashPassword } = require("../api/_auth.js");

// Load DATABASE_URL from a local env file if not already in the environment.
// (Handles Windows CRLF, optional surrounding quotes, BOM.)
if (!process.env.DATABASE_URL) {
  for (const f of [".env.vercel.local", ".env.local", ".env"]) {
    const p = path.join(__dirname, "..", f);
    if (!fs.existsSync(p)) continue;
    const txt = fs.readFileSync(p, "utf8").replace(/^﻿/, "");
    const m = txt.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/m);
    if (m) { process.env.DATABASE_URL = m[1].replace(/\r$/, "").replace(/^["']|["']$/g, ""); break; }
  }
}

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }
const sql = neon(url);

(async () => {
  // 1. schema — split on ';' (schema.sql has no $$-quoted blocks)
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8")
    .replace(/^\s*--.*$/gm, "");   // strip line comments first, so they don't mask a statement
  const stmts = schema.split(";").map((s) => s.trim()).filter(Boolean);
  for (const stmt of stmts) await sql.query(stmt);
  console.log(`schema applied (${stmts.length} statements)`);

  // 2a. seed from SEED_USERS json (non-interactive)
  let users = process.env.SEED_USERS ? JSON.parse(process.env.SEED_USERS) : [];

  // 2b. interactive seed of the 3 canonical users:  node db/setup.js --seed
  if (process.argv.includes("--seed") && !users.length) {
    const readline = require("readline");
    const ask = (q) => new Promise((res) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl._writeToOutput = () => rl.output.write(q);   // mute the typed password
      rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); res(a); });
    });
    const roster = [
      { email: "rb@rise8companies.com", role: "admin" },
      { email: "admin@rentstayable.com", role: "admin" },
      { email: "jefferson@rentstayable.com", role: "reviewer" },
    ];
    for (const r of roster) {
      const pw = await ask(`Password for ${r.email} (${r.role}): `);
      if (pw) users.push({ ...r, password: pw });
      else console.log(`  skipped ${r.email} (no password entered)`);
    }
  }

  for (const u of users) {
    const email = String(u.email).trim().toLowerCase();
    const role = u.role === "admin" ? "admin" : "reviewer";
    const hash = hashPassword(u.password);
    await sql.query(
      `INSERT INTO portal_users (email, password_hash, role) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, active = true, updated_at = now()`,
      [email, hash, role]
    );
    console.log(`seeded ${email} (${role})`);
  }

  // 3. report
  const rows = await sql.query("SELECT email, role, active FROM portal_users ORDER BY email");
  console.log("portal_users:", JSON.stringify(rows));
})().catch((e) => { console.error("setup failed:", e.message || e); process.exit(1); });
