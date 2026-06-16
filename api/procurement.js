// api/procurement.js — Vercel serverless READ-ONLY proxy for the Rob review portal.
//
// Reads Procurement_Items + Vendor_Quotes from Zoho CRM (scope: ZohoCRM.modules.READ)
// and returns JSON shaped for the portal's 5 views. NEVER writes to Zoho.
// Secrets live in Vercel env vars (server-side only) — nothing sensitive reaches the browser.
//
// Field API names verified LIVE via COQL on 06/11/26 (both queries return 200):
//   - vendor name lookup is Vendor.Vendor_Name (NOT Vendor.Name)
//   - Owner.* is not selectable in COQL and is unused by the views (dropped)
// OAuth scope required for these COQL reads: "ZohoCRM.coql.READ,ZohoCRM.modules.READ"
//   (modules.READ alone returns OAUTH_SCOPE_MISMATCH on the /coql endpoint).
// Datacenter: US org -> accounts.zoho.com / www.zohoapis.com (override via env if it ever moves).
//
// Env vars required (set in Vercel project settings):
//   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN
//   ZOHO_ACCOUNTS_DOMAIN (optional, default https://accounts.zoho.com)
//   ZOHO_API_DOMAIN      (optional, default https://www.zohoapis.com)
//   PORTAL_SHARED_SECRET (optional) — if set, requests must send it via
//                                     header  x-portal-key  or query  ?key=
//                                     (primary guard should still be Vercel
//                                      Deployment Protection — see runbook P1-D)

const auth = require("./_auth.js");

const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

// Stage option values that count as a recorded CEO decision (loose match — exact
// picklist labels are matched case-insensitively so a relabel won't silently break it).
function isDecided(stage) {
  const s = (stage || "").toLowerCase();
  return s.startsWith("approved") || s.startsWith("declined") || s.startsWith("need");
}

// --- access token (cached in-memory across warm invocations) ---
let cachedToken = null;
let cachedExp = 0;

async function getAccessToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExp) return cachedToken;
  for (const k of ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"]) {
    if (!process.env[k]) throw new Error(`missing_env:${k}`);
  }
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET,
    refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${params.toString()}`, { method: "POST" });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("token_refresh_failed:" + JSON.stringify(j));
  cachedToken = j.access_token;
  cachedExp = now + (Number(j.expires_in || 3600) - 300) * 1000; // refresh 5 min early
  return cachedToken;
}

// --- COQL helper (one retry on 401 = stale token) ---
async function coql(query, retry = true) {
  const token = await getAccessToken();
  const r = await fetch(`${API}/crm/v8/coql`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ select_query: query }),
  });
  if (r.status === 204) return []; // no matching records
  if (r.status === 401 && retry) { cachedToken = null; return coql(query, false); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`coql_failed:${r.status}:` + JSON.stringify(j));
  return j.data || [];
}

const num = (v) => (v == null ? null : Number(v));

module.exports = async (req, res) => {
  // Primary guard: signed session cookie (set by /api/auth/login). Enabled only when
  // SESSION_SECRET is configured — until then the portal keeps its prior open behavior.
  let viewer = null;
  if (auth.authEnabled()) {
    viewer = auth.sessionEmail(req);
    if (!viewer) return res.status(401).json({ error: "auth_required" });
  } else {
    // Legacy fallback guard (defense in depth) only when auth isn't configured.
    const need = process.env.PORTAL_SHARED_SECRET;
    if (need) {
      const got = req.headers["x-portal-key"] || (req.query && req.query.key);
      if (got !== need) return res.status(401).json({ error: "unauthorized" });
    }
  }

  try {
    const [itemRows, quoteRows] = await Promise.all([
      coql(
        "SELECT Name, Stage, Property_Scope, Estimated_Item_Level_Spend, Approver, " +
        "Target_Decision_Date, Target_Quantity, Florida_Validation_Status, Spec_Sheet_Status, " +
        "Decision_Notes, Awarded_Vendor.id, Modified_Time, Portal_Approved_At, id " +
        "FROM Procurement_Items WHERE Stage is not null ORDER BY Estimated_Item_Level_Spend desc LIMIT 200"
      ),
      coql(
        "SELECT Name, Unit_Price, Order_Quantity, Freight_Cost, Duty_Tariff, Landed_Cost_Unit, " +
        "Total_Landed_Cost, Incoterm, Lead_Time_days, Spec_Match, Quote_Status, Date_Received, " +
        "Currency1, Vendor.Vendor_Name, Procurement_Item.id, id " +
        "FROM Vendor_Quotes WHERE Procurement_Item is not null LIMIT 200"
      ),
    ]);

    // quote id -> vendor name (to resolve an item's Awarded_Vendor quote into a vendor)
    const quoteVendor = {};
    const quotes = quoteRows.map((q) => {
      const vn = q["Vendor.Vendor_Name"] || null;
      quoteVendor[q.id] = vn;
      return {
        id: q.id,
        name: q.Name,
        itemId: q["Procurement_Item.id"] || null,
        vendorName: vn,
        unitPrice: num(q.Unit_Price),
        qty: num(q.Order_Quantity),
        freight: num(q.Freight_Cost),
        duty: num(q.Duty_Tariff),
        landedUnit: num(q.Landed_Cost_Unit),
        totalLanded: num(q.Total_Landed_Cost),
        incoterm: q.Incoterm || null,
        leadDays: num(q.Lead_Time_days),
        specMatch: q.Spec_Match || null,
        status: q.Quote_Status || null,
        dateReceived: q.Date_Received || null,
        currency: q.Currency1 || null,
      };
    });

    const items = itemRows.map((it) => {
      const awardedQuoteId = it["Awarded_Vendor.id"] || null;
      return {
        id: it.id,
        name: it.Name,
        stage: it.Stage || null,
        property: it.Property_Scope || null,
        spend: num(it.Estimated_Item_Level_Spend),
        approver: it.Approver || null,
        decisionDate: it.Target_Decision_Date || null,
        targetQty: num(it.Target_Quantity),
        flStatus: it.Florida_Validation_Status || null,
        specStatus: it.Spec_Sheet_Status || null,
        decisionNotes: it.Decision_Notes || null,
        awardedQuoteId,
        awardedVendorName: awardedQuoteId ? quoteVendor[awardedQuoteId] || null : null,
        modifiedAt: it.Modified_Time || null,
        approvedAt: it.Portal_Approved_At || null,
      };
    });

    // Derived collections for the views
    const counts = {};
    for (const it of items) counts[it.stage || "—"] = (counts[it.stage || "—"] || 0) + 1;

    const queue = items.filter((it) => (it.stage || "").toLowerCase() === "submitted");
    const decisions = items
      .filter((it) => isDecided(it.stage))
      .map((it) => ({
        date: it.decisionDate,
        name: it.name,
        stage: it.stage,
        approver: it.approver,
        note: it.decisionNotes,
      }));

    const sum = (arr) => arr.reduce((a, it) => a + (it.spend || 0), 0);
    const spend = {
      pendingSubmitted: sum(queue),
      approvedTotal: sum(items.filter((it) => (it.stage || "").toLowerCase().startsWith("approved"))),
      overHundredK: queue.filter((it) => (it.spend || 0) > 100000).length,
    };

    // Per-user, auth-gated payload — must NOT be shared-cached at the CDN, or one
    // user's authenticated 200 gets served to anonymous/other callers (data leak).
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Vary", "Cookie");
    return res.status(200).json({
      generatedAt: new Date().toISOString(),
      live: true,
      viewer,
      counts,
      queue,
      items,
      quotes,
      decisions,
      spend,
    });
  } catch (err) {
    // Never leak secrets; surface a short reason for debugging.
    return res.status(502).json({ error: "zoho_read_failed", detail: String(err.message || err) });
  }
};
