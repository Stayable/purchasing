// portal/src/roles.js — client-side role gating (mirror of the server allowlist in api/items.js).
// UI convenience only; the server is the real gate.
const CREATORS = ["rb@rise8companies.com", "admin@rentstayable.com"];
export function canCreateItems(viewer) {
  return CREATORS.includes(String(viewer || "").trim().toLowerCase());
}
