// api/quotes.js — create a Vendor_Quote linked to an item + vendor (Phase 4, HIDDEN).
//   POST /api/quotes {itemId, vendorId, unitPrice, orderQty, ...} -> { ok:true, id }
// Landed-cost fields are Zoho formulas — computed on save, not sent here.
//
// Gated behind PORTAL_ENTRY_ENABLED (default OFF -> 404). Session + role gated (jefferson@/admin@).

const auth = require("./_auth.js");
const zw = require("./_zohoWrite.js");
const dbm = require("./_db.js");
const events = require("./_events.js");

const ENTRY_ROLES = ["jefferson@rentstayable.com", "admin@rentstayable.com"];
function entryEnabled() { return !!process.env.PORTAL_ENTRY_ENABLED; }

function buildQuoteRecord(input) {
  const rec = {
    Procurement_Item: { id: String(input.itemId) },
    Vendor: { id: String(input.vendorId) },
  };
  const numFields = {
    unitPrice: "Unit_Price", orderQty: "Order_Quantity", freight: "Freight_Cost",
    duty: "Duty_Tariff", leadDays: "Lead_Time_days", moq: "Minimum_Order_Qty",
  };
  for (const [k, api] of Object.entries(numFields)) {
    if (input[k] != null && input[k] !== "") rec[api] = Number(input[k]);
  }
  if (input.incoterm) rec.Incoterm = input.incoterm;         // picklist
  if (input.currency) rec.Currency1 = input.currency;        // picklist
  if (input.quoteName) rec.Quote_Name = String(input.quoteName);
  if (input.specMatch) rec.Spec_Match = input.specMatch;     // picklist
  if (input.status) rec.Quote_Status = input.status;         // picklist
  if (input.dateReceived) rec.Date_Received = input.dateReceived; // YYYY-MM-DD
  if (input.notes) rec.Risk_Notes = String(input.notes);
  return rec;
}

const handler = async (req, res) => {
  if (!entryEnabled()) return res.status(404).json({ error: "not_found" });
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (!ENTRY_ROLES.includes(auth.norm(viewer))) return res.status(403).json({ error: "forbidden" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });

  const input = await auth.readJson(req);
  if (!input.itemId || !input.vendorId) {
    return res.status(400).json({ error: "bad_request", detail: "need itemId and vendorId" });
  }

  try {
    const { id } = await zw.createRecord("Vendor_Quotes", buildQuoteRecord(input));
    await dbm.audit("quote_added", viewer, { quoteId: String(id), itemId: String(input.itemId), vendorId: String(input.vendorId) });
    await events.emit({ type: "quote_added_internal", action: "quote_added", actor: viewer, itemId: String(input.itemId), itemName: input.itemName || null, detail: { quoteId: String(id), vendorId: String(input.vendorId) } });
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    const msg = String(err.message || err);
    return res.status(msg === "writes_not_configured" ? 503 : 502).json({ error: msg });
  }
};

module.exports = handler;
module.exports.buildQuoteRecord = buildQuoteRecord;
