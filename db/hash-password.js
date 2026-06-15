// db/hash-password.js — generate a portal_users UPSERT for the Neon-backed login.
// Uses the SAME scrypt hashing as the live login (api/_auth.js hashPassword) so the
// stored hash verifies correctly. Node crypto only — no npm install needed.
//
// RUN (from the repo root):
//   node db/hash-password.js
// It prompts for email, role, and password (password input is hidden), then prints an
// idempotent UPSERT. Paste that into the Neon SQL editor. Nothing is written to disk.
//
// Non-interactive (e.g. scripting): set env vars, no prompts:
//   HASH_EMAIL=rb@rise8companies.com HASH_ROLE=admin HASH_PW='...' node db/hash-password.js

const readline = require("readline");
const { hashPassword } = require("../api/_auth.js");

function ask(query, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // mute echo: intercept the output stream while typing
      const onData = () => { rl.output.write("[2K[200D" + query); };
      rl._writeToOutput = () => rl.output.write(query);
      process.stdout.write(query);
      rl.question("", (ans) => { rl.close(); process.stdout.write("\n"); resolve(ans); });
      rl.input.on("data", onData);
    } else {
      rl.question(query, (ans) => { rl.close(); resolve(ans.trim()); });
    }
  });
}

(async () => {
  const email = (process.env.HASH_EMAIL || (await ask("Email: "))).trim().toLowerCase();
  const role = (process.env.HASH_ROLE || (await ask("Role (admin|reviewer) [reviewer]: ")) || "reviewer").trim();
  const pw = process.env.HASH_PW || (await ask("Password: ", { hidden: true }));
  if (!email || !pw) { console.error("email and password are required"); process.exit(1); }
  const hash = hashPassword(pw);
  console.log("\n-- paste into the Neon SQL editor --");
  console.log(
    `INSERT INTO portal_users (email, password_hash, role) VALUES\n` +
    `  ('${email}', '${hash}', '${role.replace(/'/g, "''")}')\n` +
    `ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, active = true, updated_at = now();`
  );
})();
