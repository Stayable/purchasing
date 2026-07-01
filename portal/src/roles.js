// portal/src/roles.js — client-side role gating (mirror of the server allowlist in api/items.js).
// UI convenience only; the server is the real gate.
const CREATORS = ["rb@rise8companies.com", "admin@rentstayable.com"];
const ENTRY_ROLES = ["jefferson@rentstayable.com", "admin@rentstayable.com"];
const norm = (v) => String(v || "").trim().toLowerCase();

export function canCreateItems(viewer) {
  return CREATORS.includes(norm(viewer));
}
// Portal data-entry (add vendors/quotes, mark ready) — Jefferson + admin.
// Also requires the server-side PORTAL_ENTRY_ENABLED flag (surfaced as data.entryEnabled).
export function canEnterData(viewer) {
  return ENTRY_ROLES.includes(norm(viewer));
}
