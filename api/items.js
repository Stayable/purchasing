// api/items.js — portal-initiated CREATE of a Procurement_Items record (Stage=Spec).
// Session-gated + role-gated (only creators may POST). Writes via api/_zohoWrite.js.
//
// Inert until configured:
//   - no SESSION_SECRET           -> 401 (login not active; we can't know who creates)
//   - not a creator (role)        -> 403
//   - no ZOHO_WRITE_REFRESH_TOKEN -> 503 (writes not enabled)

const auth = require("./_auth.js");
const zw = require("./_zohoWrite.js");
const dbm = require("./_db.js");

// Only these users may create procurement items (Rob + Kyle-admin override).
const CREATORS = ["rb@rise8companies.com", "admin@rentstayable.com"];
const REQUIRED = ["name", "category", "property", "targetQty", "description"];

// Map the portal create-item form to a Zoho Procurement_Items payload.
// Name/Category/Property_Scope/Target_Quantity/Description are required by the form;
// Stage is always forced to "Spec"; optional fields are included only when present.
function buildItemRecord(input) {
  const rec = {
    Name: String(input.name || "").trim(),
    Category: input.category,
    Property_Scope: input.property,
    Target_Quantity: Number(input.targetQty),
    Description: String(input.description || ""),
    Stage: "Spec",
  };
  if (input.neededBy) rec.Target_Decision_Date = input.neededBy; // YYYY-MM-DD
  if (input.baselineUnitCost != null && input.baselineUnitCost !== "") {
    rec.US_Baseline_Cost_Unit = Number(input.baselineUnitCost);
  }
  return rec;
}

const handler = async (req, res) => {
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (!CREATORS.includes(auth.norm(viewer))) return res.status(403).json({ error: "forbidden" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });

  const input = await auth.readJson(req);
  for (const k of REQUIRED) {
    if (input[k] == null || String(input[k]).trim() === "") {
      return res.status(400).json({ error: "bad_request", detail: `missing ${k}` });
    }
  }
  if (!Number.isFinite(Number(input.targetQty)) || Number(input.targetQty) <= 0) {
    return res.status(400).json({ error: "bad_request", detail: "targetQty must be a positive number" });
  }

  const record = buildItemRecord(input);
  try {
    const { id } = await zw.createRecord("Procurement_Items", record);
    console.log(JSON.stringify({ evt: "item_created", itemId: String(id), by: viewer, ts: new Date().toISOString() }));
    await dbm.audit("item_created", viewer, { itemId: String(id), name: record.Name });
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    const msg = String(err.message || err);
    const code = msg === "writes_not_configured" ? 503 : 502;
    return res.status(code).json({ error: msg });
  }
};

module.exports = handler;
module.exports.buildItemRecord = buildItemRecord;
