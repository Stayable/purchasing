# Zoho CRM Custom Module Spec — `Quotes` (Vendor Quotes child module)

**Purpose:** The comparison layer for overseas procurement. One record per vendor offer on a Procurement Item. Captures pricing, delivery, specifications, and diligence terms per quote, computes **landed cost** so bids can be compared apples-to-apples, and structurally enforces a single award. This is the **architecture-of-record** for multi-vendor bidding after Rob approved the v2 merged design (06/02/26).

**Owner of build:** Kyle (manual Zoho UI — MCP cannot create modules/fields). Workflow rule added via `zoho-crm-workflows` MCP after the module is live.
**Date:** 060226 · **Status:** SPEC — approved design, awaiting build (build gated only by Rob lifting the production hold on go-live/data-load).
**Source:** `docs/ZohoArchitecture_Update_053026v2.md` §3.3 + Rob's verbatim build spec `docs/ZohoArchitecture_RobFeedback_053026.md` (Module 3).

> **Supersedes:** `specs/ZohoModuleSpec_ContactTrackingSubform_052926.md` (the subform path) and, transitively, `specs/ZohoModuleSpec_VendorBids_052926.md`. Rob's requirements — per-quote spec-sheet attachments, per-quote reporting, landed-cost formula fields, a Kanban, and a per-row award workflow — are exactly the first-class-record capabilities a subform cannot provide, which is why the child module the team previously declined is now justified. See the decision log in `docs/ZohoCRM_Rollout_052126.md` (06/02/26).

---

## ⚠️ Build constraint — the `Quotes` API name is already taken

The live org (verified 06/02/26) carries the **native, stock `Quotes` module** (api_name `Quotes`), part of the inventory suite we keep disabled. **A custom module cannot reuse that API name**, even though the native one is hidden/off — API names are reserved at the platform level.

**Resolution:** create the custom module with a distinct API name. Recommended:

| Property | Value |
|---|---|
| Module label (singular) | **Vendor Quote** |
| Module label (plural) | **Vendor Quotes** |
| API name | **`Vendor_Quotes`** (Zoho derives this from the label; confirm at create time — if it collides or auto-suffixes to `Quotes1`, set it explicitly to `Vendor_Quotes`) |

Rob's spec and the v2 doc call this "Quotes" colloquially; the **display label can read "Quotes"** if preferred, but the **API name must be `Vendor_Quotes`** (or similar). This matters for two things below — get it right once:

1. **Formula field tokens** reference the API name. Rob's formulas read `${Quotes.Unit Price}`; in our org they must read **`${Vendor_Quotes.Unit_Price}`** etc. The formula builder auto-inserts the correct token when you pick the field — do not hand-type `Quotes`.
2. **The parent lookup** on Procurement_Items (`Awarded_Vendor`) points to this module's API name.

The rest of this spec uses **`Vendor_Quotes`** as the API name and the field labels Rob specified.

> **✅ DEPLOYED & TESTED 06/02/26.** Module built; 3-quote validation passed (landed-cost formulas + lookups + auto-number confirmed via MCP). **Deployed API names differ from this spec for these fields** (use the deployed names in code/MCP):
> | Spec name | Deployed API name | Note |
> |---|---|---|
> | `MOQ` | `Minimum_Order_Qty` | — |
> | `Lead_Time_Days` | `Lead_Time_days` | — |
> | `Sample_Lead_Time_Days` | `Sample_Lead_Time_days` | — |
> | `Landed_Cost_Per_Unit` | `Landed_Cost_Unit` | formula (Decimal) — verified computing |
> | `Currency` → `Quote_Currency` | `Currency1` (display label "Quote Currency") | `Currency` was reserved; Zoho auto-suffixed the API to `Currency1`, label corrected to "Quote Currency" |
> | `Certifications` (Multi-Select) | `Certificates` (**Textarea**) | built as free-text; convert to multi-select picklist if cert filtering is needed |
> | `Total_Landed_Cost` | `Total_Landed_Cost` | ✓ as specced |

---

## Module configuration

| Property | Value |
|---|---|
| Module label (singular / plural) | Vendor Quote / Vendor Quotes |
| API name | `Vendor_Quotes` (see constraint above) |
| Primary field | **Auto-number**, Label "Quote ID", format `QT-{0000}` (start 1, step 1) — users never type it |
| Module type | Custom (CRM) — 2nd custom module on the org (`Procurement_Items` is the 1st; Track-3 Vendor Selection will be the 3rd) |
| Parent relationship | Lookup `Procurement_Item` → `Procurement_Items` (renders as the **"Vendor Quotes"** related list on each item — this is where side-by-side bid comparison lives) |
| Permissions | Admin: full · Procurement team: read/write · others: read-only (mirror `Procurement_Items`) |
| Edition check | Professional confirmed 06/02/26 — custom modules, formula fields, multi-select, and file-upload fields are all available. Custom-module count cap is not a concern at 2–3 modules. |

---

## Field specification

Build in section order. Required flags kept deliberately light — a quote is often logged before all terms are known.

### Section 1 — Identification & links

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Name` | Quote ID | Auto-number | YES | Primary (system). Format `QT-{0000}`. |
| `Procurement_Item` | Procurement Item | Lookup → Procurement_Items | YES | Parent. Makes the quote appear under the item. |
| `Vendor` | Vendor | Lookup → Vendors | YES | Bidder. Points to the **native Vendors module** (vendor master), not Accounts — see architecture v2. |
| `Quote_Status` | Quote Status | Picklist | YES | See picklist below. Default `Requested`. Drives the Kanban + award workflow. |
| `Date_Received` | Date Received | Date | NO | When the vendor's quote came back. |

### Section 2 — Pricing

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Unit_Price` | Unit Price | Currency (USD) | NO | Per-unit price. **Quote in USD** (see currency note). |
| `Currency` | Currency | Picklist | NO | USD / CNY / VND / INR / MXN. **Standardize to USD** — see note below; formula fields treat all currency as org base (USD). |
| `Order_Quantity` | Order Quantity | Number (integer) | NO | Drives per-unit landed math. Pre-fill from the item's `Target_Qty`. |
| `MOQ` | Minimum Order Qty | Number (integer) | NO | Vendor's minimum. |
| `Price_Breaks` | Price Breaks | Multi-line (500) | NO | e.g., "500u: $42 / 1000u: $38". |
| `Freight_Cost` | Freight Cost | Currency (USD) | NO | Total for the order. |
| `Duty_Tariff` | Duty / Tariff | Currency (USD) | NO | Total. |
| `Inspection_Cost` | Inspection Cost | Currency (USD) | NO | QC / third-party. |
| `Payment_Terms` | Payment Terms | Single line (100) | NO | e.g., "30% deposit / 70% on B/L". |
| `Total_Landed_Cost` | Total Landed Cost | **Formula (Currency)** | — | Auto. Formula below. |
| `Landed_Cost_Per_Unit` | Landed Cost / Unit | **Formula (Decimal)** | — | Auto. **The real comparator.** Formula below. |

### Section 3 — Delivery

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Lead_Time_Days` | Lead Time (days) | Number (integer) | NO | Production + transit. |
| `Ship_Mode` | Ship Mode | Picklist | NO | Sea-FCL / Sea-LCL / Air / Domestic. |
| `Incoterm` | Incoterm | Picklist | NO | FOB / CIF / DDP / EXW. Material for landed-cost leveling. |
| `Port_of_Origin` | Port of Origin | Single line (100) | NO | — |
| `Sample_Lead_Time_Days` | Sample Lead Time (days) | Number (integer) | NO | — |

### Section 4 — Specifications

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Spec_Match` | Spec Match | Picklist | NO | Exceeds / Meets / Minor Deviation / Fails. |
| `Material_Construction` | Material / Construction | Multi-line (2000) | NO | — |
| `Dimensions` | Dimensions | Single line (255) | NO | — |
| `Certifications` | Certifications | Multi-select picklist | NO | BIFMA / CARB / Fire-Rated / ANSI / None. |
| `Spec_Sheet` | Spec Sheet | File Upload | NO | Per-quote spec PDF — the capability the subform lacked. |
| `Sample_Status` | Sample Status | Picklist | NO | Not Requested / Requested / In Transit / Received / Approved / Rejected. |

### Section 5 — Diligence

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Warranty` | Warranty | Single line (255) | NO | — |
| `Risk_Notes` | Risk Notes | Multi-line (2000) | NO | — |

> Vendor-level diligence (Country of Origin, Vendor Vetted, Existing Supplier, Default Payment Terms, Vendor Notes) lives on the **Vendors** module, not repeated per quote. See the architecture doc / Vendors build target.

---

## Picklist values

### `Quote_Status` (6 values, in order)
1. Requested
2. Received
3. Under Review
4. Sample Requested
5. **Awarded**
6. Declined

**Default:** Requested.

### `Currency` (5 values)
USD · CNY · VND · INR · MXN — **standardize quotes to USD** (see currency note).

### `Ship_Mode` (4 values)
Sea-FCL · Sea-LCL · Air · Domestic

### `Incoterm` (4 values)
FOB · CIF · DDP · EXW

### `Spec_Match` (4 values)
Exceeds · Meets · Minor Deviation · Fails

### `Certifications` (multi-select, 5 values)
BIFMA · CARB · Fire-Rated · ANSI · None

### `Sample_Status` (6 values)
Not Requested · Requested · In Transit · Received · Approved · Rejected

---

## Formula fields (Rob's, verbatim — retokenized to our API name)

In Zoho's formula builder, pick fields from the picker so the tokens resolve to the live API names. Rob wrote `${Quotes.…}`; in our org the module API name is `Vendor_Quotes`, so the tokens resolve to `${Vendor_Quotes.…}`.

**Total Landed Cost** (Currency):

```
Round((${Vendor_Quotes.Unit Price} * ${Vendor_Quotes.Order Quantity})
  + ${Vendor_Quotes.Freight Cost}
  + ${Vendor_Quotes.Duty / Tariff}
  + ${Vendor_Quotes.Inspection Cost}, 2)
```

**Landed Cost / Unit** (Decimal, divide-by-zero guarded):

```
If(${Vendor_Quotes.Order Quantity} > 0,
  Round( ((${Vendor_Quotes.Unit Price} * ${Vendor_Quotes.Order Quantity})
    + ${Vendor_Quotes.Freight Cost}
    + ${Vendor_Quotes.Duty / Tariff}
    + ${Vendor_Quotes.Inspection Cost}) / ${Vendor_Quotes.Order Quantity}, 2),
  0)
```

The guard returns 0 if quantity is blank so the field never errors.

---

## Currency standardization (Rob's caution #2 — adopted)

Zoho's multi-currency auto-conversion on **formula fields across modules is unreliable.** The formula treats every currency field as the org base currency (USD, confirmed via org settings 06/02/26). Therefore:

- **Vendors quote in USD** wherever possible (preferred), **or**
- Keep the `Currency` field for reference only and require a **manual USD `Unit_Price`** that feeds the formula. Do not rely on Zoho converting CNY/VND/INR/MXN inside the formula.

The `Currency` picklist is retained for record-keeping, not for math.

---

## Report config (build on Vendor Quotes)

- **Type:** Summary / Grouped report
- **Group by:** Procurement Item
- **Columns:** Vendor · Unit Price · Landed Cost / Unit · MOQ · Lead Time · Incoterm · Spec Match · Sample Status · Payment Terms · Quote Status
- **Sort within group:** **Landed Cost / Unit ascending** (true cost, not sticker price)
- **Filter:** actively-sourcing items — filter on the parent item's `Stage` ∈ {Bid, Level} (Rob's filter was "Sourcing Status = Sourcing OR Negotiating"; we map that to the canonical `Stage` field — see §5.4 of v2 / the decision to keep `Stage` and not add a parallel `Sourcing_Status`).

**Kanban:** add a Kanban view on `Quote_Status` for sourcing-stage tracking.

---

## Award workflow (the per-row capability the subform lacked)

Configure via `zoho-crm-workflows` MCP **after** the module validates clean.

| Trigger | Condition | Action |
|---|---|---|
| `Quote_Status` → **Awarded** | — | Stamp parent `Procurement_Item.Awarded_Vendor` = this Quote record (structurally one award = one Quote). |
| `Quote_Status` → **Awarded** | sibling quotes on same item not Declined | (Optional) flip sibling quotes to `Declined`. Decide whether to automate or leave manual so the operator consciously closes losers. |
| `Quote_Status` = Requested for >7 days | `Date_Received` blank | Email the item owner. **N = 7 days — set by Kyle 06/05/26** (compromise between Jefferson's recommended 3 and the prior 14). |

---

## Changes required on the parent `Procurement_Items` module

Build alongside this module (detailed in `specs/ZohoModuleSpec_ProcurementItems_052626.md`):

| Change | Field / config | Notes |
|---|---|---|
| Add | `Target_Qty` (Number) | Drives per-unit landed math; pre-fills the quote's `Order_Quantity`. |
| Add | `Awarded_Vendor` (Lookup → Vendor_Quotes) | One value = one winner, structurally. **Deprecate** the old `Winning_Vendor` (→ Accounts) for a clean audit trail. |
| Add related list | **Vendor Quotes** (via the `Procurement_Item` lookup) | Side-by-side comparison renders here. Replaces the planned subform. |
| Retire | `Bid_Count`, `Linked Vendors` related list | Superseded — quote row count = bid count; the Vendor Quotes related list shows who's bidding. |
| Keep | `Stage` | Canonical item pipeline. **Do not** add Rob's `Sourcing_Status` (overlaps `Stage`) — map his report filter to `Stage` instead. |

---

## Build checklist (Zoho admin, manual UI)

- [ ] Create custom module — label "Vendor Quote / Vendor Quotes", **confirm API name = `Vendor_Quotes`** (not `Quotes`)
- [ ] Set primary field = auto-number `QT-{0000}`
- [ ] Add `Procurement_Item` lookup → Procurement_Items (required)
- [ ] Add `Vendor` lookup → **Vendors** (required) — build Vendors module first (v2 build sequence step 1)
- [ ] Create remaining fields per section order
- [ ] Configure the 7 picklists exactly as listed (case-sensitive)
- [ ] Add the 2 formula fields via the formula builder (pick tokens, don't type `Quotes`)
- [ ] Build the layout in the 5-section order
- [ ] On `Procurement_Items`: add `Target_Qty`, `Awarded_Vendor` (→ Vendor_Quotes), the "Vendor Quotes" related list; retire `Bid_Count` / `Linked Vendors`
- [ ] Set module permissions (mirror Procurement_Items)
- [ ] Build the grouped landed-cost report + the `Quote_Status` Kanban
- [ ] Configure the award-stamping workflow rule via `zoho-crm-workflows` MCP
- [ ] Validate with a 3-quote test on one item before any real data load
- [ ] Confirm with Rob + Jefferson before first real quote is logged

---

## What this module deliberately does NOT do

- **No native quote→PO conversion.** PO handled by `PO_Number` + `PO_Status` fields on the item + attached PDF (05/29 decision, unchanged).
- **No per-SKU line items.** One unit price + landed-cost formula is enough for v1 comparison. Add Products only if multi-line bids become real.
- **No second status field on the item.** `Stage` stays canonical; `Sourcing_Status` is not built.
