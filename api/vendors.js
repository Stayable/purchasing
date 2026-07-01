// api/vendors.js — Vendors list/create for the portal entry flow (Phase 4, HIDDEN).
//   GET  /api/vendors            -> { vendors:[{id, name, email}] }  (for the quote-form dropdown)
//   POST /api/vendors  {name,...} -> { ok:true, id }                  (inline "create new vendor")
//
// Gated behind PORTAL_ENTRY_ENABLED (default OFF -> 404) so it's invisible until we flip
// Jefferson to portal entry. Session-gated + role-gated (jefferson@ / admin@).

const auth = require("./_auth.js");
const zw = require("./_zohoWrite.js");
const dbm = require("./_db.js");
const events = require("./_events.js");

const ENTRY_ROLES = ["jefferson@rentstayable.com", "admin@rentstayable.com"];

function entryEnabled() { return !!process.env.PORTAL_ENTRY_ENABLED; }

function buildVendorRecord(input) {
  const rec = { Vendor_Name: String(input.name || "").trim() };
  if (input.email) rec.Email = String(input.email).trim();
  if (input.vendorType) rec.Vendor_Type = input.vendorType;         // picklist
  if (input.country) rec.Country_of_Origin = input.country;          // picklist
  if (input.phone) rec.Phone = String(input.phone).trim();
  if (input.website) rec.Website = String(input.website).trim();
  if (input.notes) rec.Vendor_Notes = String(input.notes);
  return rec;
}

const handler = async (req, res) => {
  if (!entryEnabled()) return res.status(404).json({ error: "not_found" });
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (!ENTRY_ROLES.includes(auth.norm(viewer))) return res.status(403).json({ error: "forbidden" });

  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Cookie");

  if (req.method === "GET") {
    try {
      const rows = await zw.coql("SELECT Vendor_Name, Email, id FROM Vendors WHERE Vendor_Name is not null ORDER BY Vendor_Name asc LIMIT 500");
      const vendors = rows.map((v) => ({ id: v.id, name: v.Vendor_Name, email: v.Email || null }));
      return res.status(200).json({ vendors });
    } catch (err) {
      return res.status(502).json({ error: "zoho_read_failed", detail: String(err.message || err) });
    }
  }

  if (req.method === "POST") {
    if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });
    const input = await auth.readJson(req);
    if (!input.name || !String(input.name).trim()) {
      return res.status(400).json({ error: "bad_request", detail: "missing name" });
    }
    try {
      const { id } = await zw.createRecord("Vendors", buildVendorRecord(input));
      await dbm.audit("vendor_added", viewer, { vendorId: String(id), name: String(input.name).trim() });
      await events.emit({ type: "vendor_added_internal", action: "vendor_added", actor: viewer, itemId: null, itemName: String(input.name).trim(), detail: { vendorId: String(id) } });
      return res.status(201).json({ ok: true, id, name: String(input.name).trim(), email: input.email || null });
    } catch (err) {
      const msg = String(err.message || err);
      return res.status(msg === "writes_not_configured" ? 503 : 502).json({ error: msg });
    }
  }

  return res.status(405).json({ error: "method_not_allowed" });
};

module.exports = handler;
module.exports.buildVendorRecord = buildVendorRecord;
