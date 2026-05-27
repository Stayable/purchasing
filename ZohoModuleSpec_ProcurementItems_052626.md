# Zoho CRM Custom Module Spec — `Procurement_Items`

**Purpose:** System of record for all overseas procurement items moving through the 5-stage SOP. Separate from the standard `Deals` module (which is used for tenant/lease management). Procurement items live here; vendors continue to live in `Accounts`.

**Owner of this setup:** Zoho admin (one-time, ~30 min)
**Date:** 052626
**Last Updated:** 05/28/26 — API names reconciled to deployed module state. Module is live as of 05/28/26.

> **Deployed API names supersede the original spec for 4 fields** (Zoho's 25-char API name cap + system-primary-field convention). All references in code, MCP calls, and the HTML tracker must use the deployed names below. Field labels remain unchanged.

---

## Module configuration

| Property | Value |
|---|---|
| Module label (singular) | Procurement Item |
| Module label (plural) | Procurement Items |
| API name | `Procurement_Items` |
| Primary field | **`Name`** (system; Label = "Item Name") — **API name is `Name`, not `Item_Name`** |
| Module type | Custom (CRM) |
| Pipeline | Single pipeline named "Overseas Procurement" |
| Permissions | Admin: full · Procurement team: read/write · All others: read-only |

---

## Field specification

Fields are grouped by layout section. Build in this order.

### Section 1 — Identification

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Name` | Item Name | Single line text (100) | YES | **Primary field (system; API name = `Name`).** CamelCase, no spaces (e.g., `QueenMattress`, `PTAC9000BTU`). Matches SharePoint folder name verbatim. |
| `Stage` | Stage | Picklist | YES | See picklist values below. |
| `Category` | Category | Picklist | YES | See picklist values below. |
| `Owner` | Owner | User lookup | YES | Person driving the item. System field — Zoho provides this. |
| `Tag` | Tags | Multi-select | NO | System field. Use for ad-hoc flags: `fast-track`, `IC-required`, `pilot-property`, `tariff-watch`. |

### Section 2 — Property & approval

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Property_Scope` | Property Scope | Picklist | YES | See picklist values below. |
| `Estimated_Item_Level_Spend` | Estimated Item-Level Spend (USD) | Currency | YES | Drives approval routing. |
| `US_Baseline_Cost_Unit` | US Baseline Cost / Unit (USD) | Currency | NO | For cost-per-year-of-service comparison at Stage 3 (Level). (Currently flagged Required in deployed layout — recommend unflagging; not always known at Stage = Spec.) |
| `Approver` | Approver | Picklist | YES | See picklist values below. Set manually based on spend tier. |
| `Target_Decision_Date` | Target Decision Date | Date | NO | When the recommendation should land at the approver's desk. |

### Section 3 — Sourcing context

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Source` | Source | Picklist | NO | See picklist values below. |
| `Original_Retailer_SKU` | Original Retailer SKU | Single line text (50) | NO | For traceability back to Home Depot / Amazon historical purchase. |
| `Original_Retailer_Item_Name` | Original Retailer Item Name | Single line text (200) | NO | Full original name from purchase report (un-CamelCased). |
| `HTS_Code` | HTS Code | Single line text (15) | NO | Harmonized Tariff Schedule code. Required to advance past Stage 3 (Level). |
| `Est_Tariff_Rate` | Est. Tariff Rate | Percent (2 decimal places) | NO | Current tariff exposure on the HTS code. Stored as a percent field (modified 05/28/26 from spec's decimal — percent is cleaner UI). |

### Section 4 — Workflow status

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Spec_Sheet_Status` | Spec Sheet Status | Picklist | YES | See picklist values below. Must be "COO Signed Off" before Stage advances to Bid. |
| `Florida_Validation_Status` | Florida Validation Status | Picklist | YES | See picklist values below. Must be "Passed" before Stage advances to Recommend. |
| `Bid_Count` | Bid Count | Number (integer) | NO | Minimum 3 required to advance past Stage 2 (Bid). Stored as Zoho "Number" field (API data_type = `integer`). |
| `Winning_Vendor` | Winning Vendor | Lookup → Accounts | NO | Set at Stage 5 (Recommend). Must be populated before Stage = Approved. |

### Section 5 — Audit trail & decision

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Sharepoint_Folder_Link` | Sharepoint Folder Link | URL | YES | Link to the 8-subfolder structure. Required at Stage = Bid. |
| `Description` | Scope Notes | Multi-line textarea (2000) | YES | What the item is, why we're sourcing overseas, Florida overlay considerations, candidate vendors. |
| `Decision_Notes` | Decision Notes | Multi-line textarea (3000) | NO | Populated at Stage = Recommend with the one-page recommendation summary. Final approval rationale appended at Stage = Approved / Declined. **The decision lives here, never in email.** (Currently flagged Required in deployed layout — **must be unflagged** before Task 5; otherwise no record can be saved at Stage = Spec/Bid since no decision exists yet.) |

### Related lists (configured on the layout, not as fields)

| Related list | Source module | Purpose |
|---|---|---|
| Linked Vendors | Accounts | Vendors bidding on this item. Add at first contact in Stage 2 (Bid). |
| Activities | Notes / Tasks / Calls / Events | Every touchpoint: RFQ sent, bid received, sample requested, audit verified, ImportKey check. |
| Attachments | Files | Spec sheets, leveled cost models, FL validation checklists, decision summaries. |

---

## Picklist values

### `Stage` (10 values, in this exact order)
1. Spec
2. Bid
3. Level
4. FL-Validate
5. Recommend
6. Submitted
7. Approved
8. Approved-with-Conditions
9. Declined
10. Need-More-Info

**Default value:** Spec (new items always start here)

### `Category` (16 values, alphabetical)
- Appliances
- Building Materials
- Electrical
- Electronics
- FF&E
- Flooring & Wall Covering
- Furniture
- Hardware
- Hardware & Tools
- Kitchen & Bath
- Lighting
- Linens
- OS&E
- Outdoor / Garden
- Paint & Supplies
- Plumbing
- Soft Goods
- Other

### `Property_Scope` (9 values)
- Portfolio-wide (all 8 properties)
- Lakeland (4645)
- Kissimmee East (2295)
- Jacksonville West (6802)
- Jacksonville North (812)
- Kissimmee West (5399)
- St. Augustine (2535)
- Davenport (44199)
- Orlando OBT (8700)

### `Approver` (3 values)
- COO (under $25K)
- CEO + sample ($25K–$100K)
- CEO + IC + sample + pre-production inspection (over $100K)

### `Source` (7 values)
- Home Depot historical
- Amazon historical
- Vendor referral
- IBS 2026 (vetted exhibitor)
- ImportKey customs match
- Alibaba / GlobalSources
- Other

### `Spec_Sheet_Status` (3 values)
- Not Started
- In Progress
- COO Signed Off

### `Florida_Validation_Status` (4 values)
- Not Yet Reviewed
- Passed
- Failed
- Needs Spec Revision

---

## Layout sections (recommended order)

When configuring the standard layout, group fields in this order:

1. **Identification** — Item_Name · Stage · Category · Owner · Tag
2. **Property & approval** — Property_Scope · Estimated_Item_Level_Spend · US_Baseline_Cost_Per_Unit · Approver · Target_Decision_Date
3. **Sourcing context** — Source · Original_Retailer_SKU · Original_Retailer_Item_Name · HTS_Code · Estimated_Tariff_Rate
4. **Workflow status** — Spec_Sheet_Status · Florida_Validation_Status · Bid_Count · Winning_Vendor
5. **Audit trail & decision** — SharePoint_Folder_Link · Description · Decision_Notes
6. **Related lists** — Linked Vendors · Activities · Attachments

---

## Workflow rules to configure (optional but recommended)

These are Zoho workflow rules that enforce the SOP. Add after the module is live and the test batch validates clean.

| Trigger | Condition | Action |
|---|---|---|
| Stage changes to Bid | Spec_Sheet_Status ≠ "COO Signed Off" | Block save, show error: "Spec sheet must be COO signed off before advancing to Bid." |
| Stage changes to Recommend | Florida_Validation_Status ≠ "Passed" | Block save, show error: "Florida validation must pass before advancing to Recommend." |
| Stage changes to Approved | Winning_Vendor is blank | Block save, show error: "Winning vendor required before approval." |
| Stage = Bid for >14 days | — | Email Owner + COO: "Item stuck at Bid for >14 days." |
| Estimated_Item_Level_Spend changes | — | Auto-suggest Approver based on spend tier (manual confirm). |

---

## Setup checklist (for the Zoho admin)

- [ ] Create the custom module `Procurement_Items` in Zoho Settings → Modules and Fields → Create New Module
- [ ] Set primary field to `Item_Name`
- [ ] Create all 21 fields per the spec above, in section order
- [ ] Configure picklist values exactly as listed (case-sensitive)
- [ ] Set required-field flags per spec
- [ ] Build the standard layout in the section order shown
- [ ] Add three related lists: Linked Vendors (Accounts), Activities, Attachments
- [ ] Set module permissions: Admin full, Procurement team R/W, others read-only
- [ ] (Optional) Configure workflow rules listed above
- [ ] Confirm with Rob and team before the first record is created

---

## Downstream document updates required (Claude will handle once module is live)

1. **`ZohoProcurementTracker_052626.html`** — change all references from `Deals` to `Procurement_Items` module; update field names; re-prompt the API calls.
2. **`ProjectInstructions_OverseasProc_052626.md`** — change "Item = Zoho Deal" architecture line to reference the custom module; update Stage references.
3. **Test batch of 5 items** — run after module is built and validated.

---

## What this spec deliberately does NOT include

- **Multi-pipeline support** — single pipeline ("Overseas Procurement") is enough for v1. Add additional pipelines later if needed (e.g., domestic procurement, capital projects).
- **Auto-population of Approver from spend** — kept manual to force the operator to look at the spend tier consciously, not just accept a default.
- **Auto-creation of SharePoint folder on record create** — out of scope for Zoho config. Handle as a separate Power Automate / Make.com flow if you want it later.
- **Custom reports / dashboards** — build after 30 days of real data, not before.
