# Zoho CRM Architecture — Update v2 (Recommended Final Design)

**To:** Rob Beyer (CEO) · **From:** Kyle Estocapio (Procurement build) · **Date:** 05/30/26
**Last Updated:** 05/30/26

> 🟡 **STATUS: PROPOSAL — production remains ON HOLD.** This is the recommended final procurement design after reconciling **Rob's 05/30 build spec** against the architecture-of-record. Nothing is built; the held config is unchanged. This file routes to Rob for approval; once approved it folds into `Zoho_Architecture.md` and the decision log in `docs/ZohoCRM_Rollout_052126.md`.

**Version note:** *v1 = the 05/29 architecture-of-record (`Zoho_Architecture.md`). v2 = this update, incorporating Rob's 05/30 three-module build spec (`docs/ZohoArchitecture_RobFeedback_053026.md`).*

**Companion artifacts:**
- Rob's spec, verbatim → `docs/ZohoArchitecture_RobFeedback_053026.md`
- Visual 3-column comparison → `infographics/ArchitectureComparison_CurrentVsRob_053026.html` (Section 05)
- Consolidation log → `docs/ZohoArchitecture_Feedback_052926.md`

---

## 1. What this is and what changed

Rob sent a three-module build spec (Vendors → Procurement Items → Quotes) on 05/30. Compared against the current architecture, his spec **fills a real gap** (no landed-cost math, no per-quote attachments, no per-quote comparison view) and **conflicts in two places** (native Vendors vs. shared Accounts; item on Deals vs. our custom module). One of his cautions ("custom modules need Enterprise") does **not** hold — `Procurement_Items` is already a live custom module on our **Professional** org (verified 05/30).

The recommended final design **keeps** the SOP scaffolding and Kate-safe item module, **adopts** Rob's comparison layer and landed-cost math, and **moves** the procurement supplier master into the native Vendors module Rob already enabled (touched 04/15/26). Net effect: Rob's intent, built without re-creating the module sprawl that killed v1.

**Key structural shift from v1:** the multi-vendor bidding layer changes from a **`Contact_Tracking` subform** (v1 choice) to a **`Quotes` child module** (v2). This reopens and resolves open decision §13 #1 — Rob's requirements (per-quote spec sheets, per-quote reporting, landed-cost formulas, Kanban, award workflow) now justify the heavier child module the team had declined.

---

## 2. Recommended final design — Original · Rob's · Recommended

`keep` = from current · `adopt` = take Rob's · `merge` = combine · `flag` = confirm before build

| Design element | ① Original (of record) | ② Rob's spec | ③ Recommended final | Tag |
|---|---|---|---|---|
| **Supplier master** | Accounts + `CRM Use Case` firewall (21 live) | Native Vendors module | **Native Vendors** module (already enabled). Migrate 21 held vendors in. Accounts+firewall retained for Non-Profit + Track-3. | adopt |
| **Vendor diligence fields** | `Vendor_Type` only | Country of Origin, Vendor Vetted, Existing Supplier, Default Payment Terms, Vendor Notes | All 5 of Rob's on the Vendor layout; carry `Vendor_Type` over. | adopt |
| **Item home module** | `Procurement_Items` custom (live) | Deals/Potentials *or* custom | **`Procurement_Items` custom** — not Deals (Deals = Kate's Non-Profit pipeline). | keep |
| **Item field depth** | 19 fields (HTS, tariff, FL-validation, spend tier, Approver, SharePoint, 10-stage `Stage`) | Lean 7 (incl. Target Qty, Sourcing Status, Awarded Vendor) | Keep our depth **+ add Target Qty**; point `Awarded Vendor` → Quotes. *(Sourcing Status overlaps existing `Stage` — see §5.4.)* | merge |
| **Florida validation gates** | On item (Stage 4 + `Florida_Validation_Status`) | Not addressed | Keep on item — core SOP. | keep |
| **Approval routing** | Approver picklist by spend tier | Not addressed | Keep spend-tier routing. | keep |
| **Bid / quote capture** | `Contact_Tracking` subform (spec, unbuilt); `Vendor_Bids` rejected | `Quotes` custom module (~25 fields) | **Build the `Quotes` child module** — supersedes the subform. | adopt |
| **Landed-cost math** | None (manual `Quoted_Total`) | Total Landed Cost + Landed Cost/Unit formulas | Adopt Rob's formulas — the Stage-3 "Level" comparator. | adopt |
| **Per-quote attachments** | Subform can't | Spec Sheet file upload per quote | Per-quote Spec Sheet upload. | adopt |
| **Certifications** | Unstructured | Multi-select (BIFMA/CARB/Fire-Rated/ANSI/None) | Multi-select on the Quote. | adopt |
| **Award (one winner)** | `Winning_Vendor` → Accounts (manual) | `Awarded Vendor` → Quotes + workflow | `Awarded Vendor` → winning **Quote record** + award-stamping workflow. | adopt |
| **Conversations** | Activities on item (single timeline) | Vendor+Contact per quote | Keep Activities on item; per-vendor status on each Quote. | keep |
| **Comparison view** | Subform report + "Stale >14d" view | Grouped report by item, sorted by Landed Cost/Unit + Kanban | Adopt Rob's grouped report + Kanban on Quote Status. | adopt |
| **PO handling** | `PO_Number` + `PO_Status` on item + attached PDF | Not addressed | Keep field-based PO + attached PDF; native PO module stays off. | keep |
| **Currency** | USD-only field | Quote in USD or manual USD field | Standardize quotes to USD (or manual USD Unit Price feeding the formula). | adopt |
| **Property picklist** | 8-property canon + Portfolio-wide | Adds `2900` | 8-property canon; **`2900` = OPEN** (§5.3). | flag |
| **Track 3 clone path** | Clone `Procurement_Items` later | 3-module pattern inherently cloneable | Clone the **Item + Quotes** pattern; Track-3 counterparties stay in Accounts (professionals ≠ suppliers). | keep |
| **Edition / module count** | Professional; `Procurement_Items` live | "Needs Enterprise" (incorrect) | Professional confirmed; Quotes = 2nd custom module (+Track 3 = 3rd). **Verify count cap** (§5.2). | flag |

---

## 3. Module-by-module build target

### 3.1 Vendors (native Zoho module) — *new home for procurement suppliers*

Native Vendors is already enabled, customizable, and lookup-able on the org (verified 05/30; last modified by Rob 04/15/26). Stock fields include `Vendor_Name`, `Email`, `Phone`, `Website`, `Category`, `Country`, `Owner`.

**Add custom fields:**

| Field | Type | Values / notes |
|---|---|---|
| Country of Origin | Picklist | China, Vietnam, India, Mexico, USA, Other *(or reuse stock `Country`)* |
| Vendor Vetted | Checkbox | Diligence gate |
| Existing Supplier | Checkbox | Already in our stack |
| Default Payment Terms | Single line | e.g., "30/70 dep/BL" |
| Vendor Notes | Multi-line | — |
| Vendor Type | Picklist | **carry over** from the existing Accounts field |

**Migration:** the 21 held vendor Accounts + 20 Contacts move into Vendors. This is held/test data loaded before the real 197-item run, so the move is low-cost. The `CRM Use Case` firewall + Account vendor layout built 05/29 are **partly retired for vendors**, but the firewall stays for Non-Profit partners and Track-3 counterparties.

### 3.2 Procurement_Items (custom) — *reconciled, not rebuilt*

Keep the live module and all 19 fields. **Changes:**

| Change | Field | Notes |
|---|---|---|
| Add | `Target_Qty` (Number) | From Rob — drives the per-unit landed math on quotes. |
| Repoint | `Awarded_Vendor` → **Quotes** | Replaces/augments `Winning_Vendor` (→ Accounts). One award = one Quote record, structurally. *(Decide: repoint `Winning_Vendor`, or add `Awarded_Vendor` and deprecate `Winning_Vendor` — §5.4.)* |
| Add related list | **Quotes** | Side-by-side bid comparison renders here (via the Quote→Item lookup). |
| Retire | `Bid_Count`, `Linked Vendors` related list | Superseded by the Quotes related list (row count = bid count). |
| Hold open | `Sourcing_Status` | Rob's 5-value picklist **overlaps the existing 10-value `Stage`** — do not duplicate blindly (§5.4). |

`Stage`, `Florida_Validation_Status`, `Spec_Sheet_Status`, `Approver`, spend tier, HTS/tariff, SharePoint link, `Decision_Notes`, `PO_Number`/`PO_Status` — **all unchanged.**

### 3.3 Quotes (new custom child module) — *the comparison layer*

One record per vendor offer. Parent lookup makes quotes appear under each item.

| Section | Fields |
|---|---|
| **Identification** | `Name` (auto-number, e.g. `QT-{0000}`) · `Procurement_Item` (lookup→Procurement_Items, required) · `Vendor` (lookup→Vendors, required) · `Quote_Status` (Requested/Received/Under Review/Sample Requested/Awarded/Declined) · `Date_Received` (Date) |
| **Pricing** | `Unit_Price` (Currency, USD) · `Currency` (USD/CNY/VND/INR/MXN — **standardize to USD**, §5.5) · `Order_Quantity` (Number) · `MOQ` (Number) · `Price_Breaks` (Multi-line) · `Freight_Cost` (Currency) · `Duty_Tariff` (Currency) · `Inspection_Cost` (Currency) · `Payment_Terms` (Single line) · `Total_Landed_Cost` (Formula-Currency) · `Landed_Cost_Per_Unit` (Formula-Decimal) |
| **Delivery** | `Lead_Time_Days` (Number) · `Ship_Mode` (Sea-FCL/Sea-LCL/Air/Domestic) · `Incoterm` (FOB/CIF/DDP/EXW) · `Port_of_Origin` (Single line) · `Sample_Lead_Time_Days` (Number) |
| **Specifications** | `Spec_Match` (Exceeds/Meets/Minor Deviation/Fails) · `Material_Construction` (Multi-line) · `Dimensions` (Single line) · `Certifications` (Multi-select: BIFMA/CARB/Fire-Rated/ANSI/None) · `Spec_Sheet` (File Upload) · `Sample_Status` (Not Requested/Requested/In Transit/Received/Approved/Rejected) |
| **Diligence** | `Warranty` (Single line) · `Risk_Notes` (Multi-line) |

**Formulas (Rob's, verbatim):**

```
Total Landed Cost (Currency):
Round((${Quotes.Unit Price} * ${Quotes.Order Quantity})
  + ${Quotes.Freight Cost} + ${Quotes.Duty / Tariff} + ${Quotes.Inspection Cost}, 2)

Landed Cost / Unit (Decimal, divide-by-zero guarded):
If(${Quotes.Order Quantity} > 0,
  Round( ((${Quotes.Unit Price} * ${Quotes.Order Quantity})
    + ${Quotes.Freight Cost} + ${Quotes.Duty / Tariff} + ${Quotes.Inspection Cost})
    / ${Quotes.Order Quantity}, 2),
  0)
```

**Report (on Quotes):** Summary/Grouped · group by Procurement Item · columns Vendor · Unit Price · Landed Cost/Unit · MOQ · Lead Time · Incoterm · Spec Match · Sample Status · Payment Terms · Quote Status · sort within group by Landed Cost/Unit **ascending** · filter to actively-sourcing items. Plus a **Kanban** on `Quote_Status`.

**Award workflow:** when a Quote's `Quote_Status` → Awarded, stamp the parent item's `Awarded_Vendor` and (optionally) flip sibling quotes to Declined. *(Per-row workflow is the child-module capability the subform lacked.)*

---

## 4. What this supersedes / docs to update on approval

| Doc | Action on approval |
|---|---|
| `Zoho_Architecture.md` | §5.1 (bidding → Quotes module), §6 (turn native Vendors **On**; note it's already on — the "Off" line is stale), §10/§11 (Vendors module + migration). |
| `specs/ZohoModuleSpec_ContactTrackingSubform_052926.md` | **Mark superseded** by the Quotes module (it superseded `Vendor_Bids`; v2 reverses to the child-module path). |
| `specs/ZohoModuleSpec_VendorBids_052926.md` | **Revived & evolved** as the basis for the new `Quotes` spec — write `specs/ZohoModuleSpec_Quotes_053026.md`. |
| `specs/ZohoModuleSpec_ProcurementItems_052626.md` | Add `Target_Qty`; repoint award lookup; retire `Bid_Count`/`Linked Vendors`. |
| `docs/ZohoCRM_Rollout_052126.md` | New decision-log entry (date 05/30, reasoning, trade-offs) — the audit trail. |

> None of these are edited yet — this update file is the proposal. Build only after Rob signs off and lifts the hold.

---

## 5. Open decisions for Rob

1. **Native Vendors vs. Accounts.** Recommend moving procurement suppliers into the native Vendors module (Rob's spec; already enabled). Confirm — this partly retires the 05/29 Accounts firewall *for vendors* (firewall stays for Non-Profit + Track-3).
2. **Professional custom-module count cap.** We currently have 1 custom module (`Procurement_Items`); Quotes makes 2, Track-3 later makes 3. **Verify** Professional allows this many before building Module 3. *(Not yet confirmed — flagged honestly.)*
3. **Property `2900`.** Appears in Rob's Property picklist but is **not** in the 8-property canon (4645, 2295, 6802, 812, 5399, 2535, 44199, 8700). New property or typo? Will not build the value until confirmed.
4. **`Stage` vs. `Sourcing_Status`.** Rob's 5-value Sourcing Status overlaps our existing 10-value `Stage`. Recommend **keeping `Stage`** as the canonical item pipeline and mapping Rob's report filter to it, rather than maintaining two status fields. Confirm.
5. **`Winning_Vendor` disposition.** Repoint it to Quotes, or add `Awarded_Vendor` (→ Quotes) and deprecate `Winning_Vendor` (→ Accounts)? Recommend the latter for a clean audit trail.

---

## 6. Build sequence (once approved)

1. **Vendors** — add the 5 custom fields + `Vendor_Type`; migrate 21 vendors + 20 contacts from Accounts.
2. **Procurement_Items** — add `Target_Qty`; add `Awarded_Vendor` (→ Quotes); retire `Bid_Count`/`Linked Vendors`.
3. **Quotes** — create the custom module, fields, picklists, 2 formula fields (manual UI — MCP can't create modules/fields).
4. **Workflow** — award-stamping rule on `Quote_Status` → Awarded (via `zoho-crm-workflows` MCP).
5. **Report + Kanban** — grouped landed-cost report; Kanban on `Quote_Status`.
6. **Validate** with a 3-quote test on one item before the real data load.

---

## 7. Production hold (reaffirmed)

Unchanged from v1: no go-live, no team onboarding, no real data load (197 items stay out), no live tracker writes. Build continues only as **held configuration** that can still be redirected cheaply. This update does not lift the hold — Rob does.

---

*Prepared for CEO review. Mark up or return comments; Kyle revises and resubmits before any production step. On approval, fold into `Zoho_Architecture.md` + the rollout decision log.*
