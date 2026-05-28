# Zoho CRM Custom Module Spec — `Vendor_Bids`

> ⚠️ **SUPERSEDED 05/29/26** — replaced by the **`Contact_Tracking` subform** on `Procurement_Items` (see `ZohoModuleSpec_ContactTrackingSubform_052926.md`). The subform delivers the same multi-vendor tracking inline on the item, with trade-show fallback text and API bulk-load, without a second module. This spec is kept for reference only.
>
> **Revive this child-module design only if** first-class per-bid records become required — i.e., you need (a) attachments on individual bids (each vendor's quote PDF on its own record), (b) automated per-vendor follow-up reminders (subforms can't do time-triggered per-row workflow), or (c) an approval process that routes on the bid rather than the item. None of those were in the 05/28 requirements.

**Purpose:** Child module of `Procurement_Items`. One record per vendor bid on an item. Enables the **3-quote / multi-vendor bidding process** surfaced in the 05/28 meeting: stage vendors → send RFQ → receive bids → shortlist → select → award. Keeps the item as the center of gravity; each bid hangs off it.

**Owner of this setup:** Zoho admin (manual UI — MCP cannot create modules/fields)
**Date:** 052926
**Status:** SPEC — not yet built. Architecture decided 05/29/26 (see `ZohoCRM_Rollout_052126.md` decision log).

> **Why this exists:** The live `Procurement_Items` module had no structured place to capture each vendor's bid — only a `Bid_Count` number and a single `Winning_Vendor` lookup. This module fills that gap without reintroducing the Deals/Quotes/Products/Purchase-Orders inventory suite (which would re-create the module sprawl that killed the v1 deployment). Jefferson's `ZohoProcurementProcessGuide_RISE8_052926.md` defines the correct *process* (3 competing quotes → compare → approve winner → PO); this module implements that process on the item-centric architecture instead of on standard Deals.

---

## Module configuration

| Property | Value |
|---|---|
| Module label (singular) | Vendor Bid |
| Module label (plural) | Vendor Bids |
| API name | `Vendor_Bids` |
| Primary field | **Auto-number**, Label "Bid ID", format `BID-{0000}` (start 1, step 1) — users never type it |
| Module type | Custom (CRM) |
| Parent relationship | Lookup `Procurement_Item` → `Procurement_Items` (renders as the **"Vendor Bids"** related list on each item) |
| Permissions | Admin: full · Procurement team: read/write · others: read-only (mirror `Procurement_Items`) |

---

## Field specification

### Section 1 — Bid identification

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Name` | Bid ID | Auto-number | YES | Primary (system). Format `BID-{0000}`. |
| `Procurement_Item` | Procurement Item | Lookup → Procurement_Items | YES | The parent item being bid on. This is what makes bids appear under the item. |
| `Vendor` | Vendor | Lookup → Accounts | YES | The bidding vendor (an Account, `CRM Use Case` = Procurement). |
| `Vendor_Contact` | Vendor Contact | Lookup → Contacts | NO | The rep who supplied this bid. Satisfies the "multiple contacts per item" ask — each bid carries its own contact, all visible under the item. |
| `Bid_Status` | Bid Status | Picklist | YES | See picklist below. Default `Staged`. Drives the staging→award flow. |

### Section 2 — RFQ & response

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `RFQ_Sent_Date` | RFQ Sent Date | Date | NO | When the request for quote went to this vendor. |
| `Bid_Received_Date` | Bid Received Date | Date | NO | When the vendor's quote came back. |
| `Sample_Status` | Sample Status | Picklist | NO | See picklist below. Overseas SOP requires samples on higher-tier spend. |

### Section 3 — Commercials

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Quoted_Unit_Price` | Quoted Unit Price (USD) | Currency | NO | Per-unit price for side-by-side comparison. |
| `MOQ` | Minimum Order Qty | Number (integer) | NO | Minimum order quantity the vendor will accept. |
| `Quoted_Lead_Time_Days` | Lead Time (days) | Number (integer) | NO | Production + ship lead time. |
| `Quoted_Total` | Quoted Total (USD) | Currency | NO | Total for the intended order qty. Entered manually in v1 (qty varies); convert to a formula once a standard order-qty field is added. |
| `Incoterm` | Incoterm | Picklist | NO | See picklist below. Material for overseas landed-cost comparison. |
| `Payment_Terms` | Payment Terms | Single line text (100) | NO | e.g., "30% deposit, 70% before shipment". |

### Section 4 — Notes

| API Name | Label | Type | Required | Notes |
|---|---|---|---|---|
| `Bid_Notes` | Bid Notes | Multi-line textarea (2000) | NO | Negotiation notes, caveats, anything that doesn't fit a field. |

---

## Picklist values

### `Bid_Status` (7 values, in this order)
1. Staged
2. RFQ Sent
3. Bid Received
4. Shortlisted
5. Selected
6. Rejected
7. No Response

**Default:** Staged

This is the per-vendor lane. Maps directly to the meeting ask: *"Vendor 1, Vendor 2, Vendor 3 — Staging → waiting for a bid → Select from there → awarding the bid."* The item's own `Stage` (Spec→Bid→Level→FL-Validate→Recommend→…) tracks the overall item; `Bid_Status` tracks each vendor within the Bid/Level stages.

### `Sample_Status` (5 values)
- Not Requested
- Requested
- Received
- Approved
- Failed

### `Incoterm` (5 values)
- EXW
- FOB
- CIF
- DDP
- Other

---

## Layout (section order)

1. **Bid identification** — Bid ID · Procurement Item · Vendor · Vendor Contact · Bid Status
2. **RFQ & response** — RFQ Sent Date · Bid Received Date · Sample Status
3. **Commercials** — Quoted Unit Price · MOQ · Lead Time · Quoted Total · Incoterm · Payment Terms
4. **Notes** — Bid Notes

---

## Changes required on the parent `Procurement_Items` module

These tie the bids back to the item and implement the meeting asks. Build alongside this module.

| Change | Field / config | Notes |
|---|---|---|
| Add related list | **"Vendor Bids"** (source: Vendor_Bids via `Procurement_Item` lookup) | Side-by-side bid comparison happens here — replaces Jefferson's "Quotes subpanel on a Deal". |
| Multi-contact support | New field `Item_Contacts` — **multi-select lookup → Contacts** | For non-vendor people on the item (freight forwarder, RISE8 approver, property GM). Vendor contacts already come via the bids. Together these satisfy "multiple contact persons on the item." |
| Conversations on the item | Use existing **Activities** related list | "All conversations based on the item — all contacts": log every email/call/note against the `Procurement_Items` record, not against individual bids. Single timeline per item. |
| PO tracking | New fields `PO_Number` (text, 50) + `PO_Status` (picklist) | See PO handling below. |

### `PO_Status` picklist (on Procurement_Items)
- Not Issued
- PO Number Logged (online channels — Amazon, Home Depot)
- PO Confirmed (Alibaba built-in)
- PO Document Issued (office supplies, linen — Jefferson's template)

---

## PO handling (per 05/29 decision)

Reality from the field: **PO numbers are used for tracking on every channel.** Alibaba has built-in PO confirmation; Amazon/Home Depot generate their own order/PO numbers. **Office supplies and linen** need an actual PO *document*, which Jefferson generates from a Word template.

**v1 approach (zero new modules):**
1. `PO_Number` + `PO_Status` fields on `Procurement_Items` capture the tracking number for any channel.
2. For channels that need a document, Jefferson generates the PO from his existing Word template and **attaches the PDF to the Procurement_Item** (Attachments related list). PO number logged in `PO_Number`.
3. **Do not** enable the native Purchase Orders / Quotes / Products inventory suite for this. Revisit at the 06/21/26 checkpoint only if document generation volume justifies a Zoho Writer mail-merge template or the native PO module.

**Open item:** confirm with Jefferson whether he wants his Word PO template reproduced as a Zoho mail-merge template (auto-populated from the item) or is fine generating in Word and attaching the PDF. Lowest friction = attach PDF; automation is a later nicety.

---

## Workflow rules (optional, recommended — add after the module validates clean)

| Trigger | Condition | Action |
|---|---|---|
| `Bid_Status` → RFQ Sent | `RFQ_Sent_Date` is blank | Set `RFQ_Sent_Date` = today |
| `Bid_Status` → Selected | — | Update parent `Procurement_Item.Winning_Vendor` = this `Vendor`. (Sibling bids set to Rejected manually in v1.) |
| `Bid_Status` = RFQ Sent for >7 days | `Bid_Received_Date` blank | Email bid owner: "No response from <Vendor> on <Item> — follow up." |

---

## What this module deliberately does NOT do

- **No line-item / SKU catalog.** Single `Quoted_Unit_Price` + `Quoted_Total` is enough for v1 bid comparison. Add Products only if multi-line bids become real.
- **No native quote→PO conversion.** That convenience is the one thing the standard inventory suite does better; it was weighed and declined to avoid module sprawl. PO handled per the section above.
- **No auto-rejection of losing bids.** Marking the winner is explicit; losing bids are set to Rejected by hand so the operator consciously closes them.

---

## Build checklist (Zoho admin, manual UI)

- [ ] Create custom module `Vendor_Bids` (Settings → Modules and Fields → Create New Module)
- [ ] Set primary field = auto-number `BID-{0000}`
- [ ] Add `Procurement_Item` lookup → Procurement_Items (required)
- [ ] Create remaining fields per section order; set required flags
- [ ] Configure the 3 picklists exactly as listed (case-sensitive)
- [ ] Build layout in the 4-section order
- [ ] On `Procurement_Items`: add the "Vendor Bids" related list, `Item_Contacts` multi-lookup, `PO_Number`, `PO_Status`
- [ ] Set module permissions (mirror Procurement_Items)
- [ ] (Optional) Configure the 3 workflow rules via `zoho-crm-workflows` MCP
- [ ] Confirm with Jefferson + Rob before first real bid is logged
