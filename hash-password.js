// hash-password.js — generate a scrypt password hash + UPSERT SQL for a portal user.
//
// Run locally (nothing is stored; the password is only read from the prompt):
//   node hash-password.js
//
// Paste the printed INSERT ... ON CONFLICT into the Neon SQL editor to create or
// change a user's password. To change a password later, just run this again.

const readline = require("readline");
const auth = require("./api/_auth.js");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, (a) => r((a || "").trim())));

(async () => {
  const email = (await ask("Email: ")).toLowerCase();
  const pw = await ask("Password: ");
  let role = (await ask("Role [admin/reviewer] (default reviewer): ")).toLowerCase();
  rl.close();
  if (role !== "admin") role = "reviewer";
  if (!email || !pw) { console.error("email and password are required"); process.exit(1); }

  const hash = auth.hashPassword(pw);
  console.log("\n-- paste into the Neon SQL editor --");
  console.log(
    "INSERT INTO portal_users (email, password_hash, role) VALUES\n" +
    "  ('" + email + "', '" + hash + "', '" + role + "')\n" +
    "ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, active = true, updated_at = now();"
  );
})();
