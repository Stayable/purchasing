// api/items/ready.js — Jefferson marks an item's quotes ready (Phase 4, HIDDEN).
//   POST /api/items/ready {itemId, itemName} -> sets Stage=Submitted + notifies Rob.
// This is the in-portal equivalent of Jefferson setting Stage=Submitted in Zoho; when the
// entry flip is live it replaces the Zoho webhook for in-portal items.
//
// Gated behind PORTAL_ENTRY_ENABLED (default OFF -> 404). Session + role gated (jefferson@/admin@).

const auth = require("./../_auth.js");
const zw = require("./../_zohoWrite.js");
const dbm = require("./../_db.js");
const events = require("./../_events.js");

const ENTRY_ROLES = ["jefferson@rentstayable.com", "admin@rentstayable.com"];
function entryEnabled() { return !!process.env.PORTAL_ENTRY_ENABLED; }

module.exports = async (req, res) => {
  if (!entryEnabled()) return res.status(404).json({ error: "not_found" });
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (!ENTRY_ROLES.includes(auth.norm(viewer))) return res.status(403).json({ error: "forbidden" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });

  const input = await auth.readJson(req);
  if (!input.itemId) return res.status(400).json({ error: "bad_request", detail: "missing itemId" });

  try {
    await zw.updateRecord("Procurement_Items", { id: String(input.itemId), Stage: "Submitted" });
    await dbm.audit("quotes_ready", viewer, { itemId: String(input.itemId) });
    await events.emit({ type: "quotes_ready", action: "quotes_ready", actor: viewer, actorLabel: "Jefferson", itemId: String(input.itemId), itemName: input.itemName || null });
    return res.status(200).json({ ok: true, itemId: input.itemId, stage: "Submitted" });
  } catch (err) {
    const msg = String(err.message || err);
    return res.status(msg === "writes_not_configured" ? 503 : 502).json({ error: msg });
  }
};
