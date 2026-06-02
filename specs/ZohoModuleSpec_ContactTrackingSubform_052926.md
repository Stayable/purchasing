# Zoho CRM Spec — `Contact_Tracking` Subform on `Procurement_Items`

> ⚠️ **SUPERSEDED 06/02/26** — replaced by the **`Vendor_Quotes` child module** (`specs/ZohoModuleSpec_Quotes_060226.md`). Rob approved the v2 merged architecture (`docs/ZohoArchitecture_Update_053026v2.md`), which reverses the subform decision: his requirements (per-quote spec-sheet attachments, per-quote reporting, landed-cost formula fields, a Kanban, and a per-row award workflow) are exactly the first-class-record capabilities a subform cannot deliver. Multi-vendor bidding is now a child module. This spec is kept for reference only — the trade-offs it documents are why the child module was ultimately chosen. See the decision log in `docs/ZohoCRM_Rollout_052126.md` (06/02/26).

**Purpose:** Inline, per-vendor/per-contact tracking on each Procurement Item — staging, RFQ, quotes, negotiation, award. This is the **chosen design** for the multi-vendor bidding process from the 05/28 meeting. Supersedes the `Vendor_Bids` child-module spec (kept for reference only).

**Owner of build:** Kyle (manual Zoho UI — subforms can't be created via MCP)
**Bulk data load:** Claude/Kate via `updateRecords` on Procurement_Items with the subform field populated (the subform IS API-writable).
**Date:** 052926 · **Status:** SPEC — awaiting build.

> **Why subform, not child module:** delivers all 05/28 asks — multiple contacts on the item, conversations tracked on the item, "Vendor 1/2/3 staging→bid→select→award," trade-show fallback, API bulk-load — inline on the item with no extra module. Trade-off accepted: no per-row attachments and no time-triggered per-row workflow (the "Stale" report view is the manual substitute). Full rationale in `ZohoCRM_Rollout_052126.md` decision log (05/29/26).

---

## Build path

`Setup → Customization → Modules and Fields → Procurement Items → Layouts → Standard` → drag a **Subform** field onto the layout.

| Setting | Value |
|---|---|
| Section Name | Contact Tracking |
| Subform Module Name | Procurement Contact Tracking |
| Subform API Name | `Contact_Tracking` |

## Subform columns (in order)

| Column Label | Type | Options / Settings |
|---|---|---|
| Contact | Lookup → Contacts | Optional. Search by Name. Promote a vendor rep to a real Contact when the relationship matures. |
| Contact Name (Fallback) | Single line (120) | For reps not yet in Contacts (trade-show drop-ins). |
| Company | Single line (120) | Vendor/company name. |
| Email | Email | |
| Phone | Phone | |
| Role | Picklist | Sales Rep · Engineer · Owner · Logistics · Finance · Other |
| Outreach Status | Picklist (color-coded — see note 7) | Not Contacted (gray) · Initial Outreach (blue) · In Discussion (yellow) · Quote Requested (yellow) · Quote Received (light green) · Sample Requested (light green) · Negotiating (orange) · Awarded (green) · Lost (red) · On Hold (gray) |
| Last Contact Date | Date | |
| Next Step | Single line (255) | |
| Next Step Date | Date | |
| Quoted Unit Price | Currency | |
| Quoted MOQ | Number | |
| Lead Time (days) | Number | |
| **Incoterm** | Picklist | EXW · FOB · CIF · DDP · Other — **added** for overseas landed-cost leveling |
| **Sample Status** | Picklist | Not Requested · Requested · Received · Approved · Failed — **added** to match SOP sample gate |
| Notes | Multi-line (2000) | |

> **Contact column decision (05/29):** keep BOTH — optional lookup + fallback text. Cleanest of all worlds.

Save the layout. Subform appears on every Procurement Item record.

---

## Tracking report

`Reports → Create Report → Subform Report template`

- **Primary Module:** Procurement Items
- **Subform:** Contact Tracking
- **Columns:** Item Name (parent), Category (parent), Stage (parent), Contact, Company, Outreach Status, Last Contact Date, Next Step, Next Step Date, Quoted Unit Price
- **Group By:** Outreach Status → then Item Name

### Saved views (with corrections)

| View | Filter | Note |
|---|---|---|
| Active Outreach | Outreach Status ∉ {Awarded, Lost, On Hold} | |
| Stale (>14 days) | Last Contact Date **before** (today − 14) **AND** Outreach Status ∈ {Initial Outreach, In Discussion, Quote Requested, Negotiating} | Build as Zoho operator `Last Contact Date — before — 14 days ago`. **Blank dates won't match** — add `OR Last Contact Date is empty` if you want never-dated rows surfaced. |
| Ready to Award | Outreach Status ∈ {Quote Received, Negotiating} | |

---

## Reconciliation with existing `Procurement_Items` fields

| Existing field | Disposition under subform |
|---|---|
| `Winning_Vendor` (lookup → Accounts) | Keep as the single canonical winner; **set manually** when a subform row hits Awarded (subform can't auto-populate it via workflow). |
| `Bid_Count` (number) | Redundant (= subform row count); leave or deprecate. Not auto-counted. |
| `Linked Vendors` related list (Accounts) | Now partly duplicated by subform Company/Contact. Subform = source of truth for *who's bidding*. Keep Linked Vendors only for Account-level vendor master linkage; do not double-maintain. |
| Activities related list | Unchanged — "all conversations based on the item" log here, at item level. |
| `PO_Number` / `PO_Status` (to add) | Item-level PO tracking per the PO decision (see Rollout log + ProcurementItems spec). Unaffected by subform. |

---

## Open items before/at build

- [ ] Verify **picklist color coding** is available on Professional tier; if not, colors drop, values stay.
- [ ] Confirm the **Stale view** blank-date behavior is acceptable (or add the empty-date OR clause).
- [ ] Decide `Winning_Vendor` manual-set vs. dropping it in favor of the Awarded row.
- [ ] Decide whether `Linked Vendors` related list stays or is retired.
- [ ] After build, Kyle pings Kate/Claude → bulk-load existing contacts from VendorMatrix into the right Procurement Items via `updateRecords`.
