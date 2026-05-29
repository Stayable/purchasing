# Zoho CRM Architecture — Rob's Build Spec (captured verbatim)

> **What this is:** Rob's procurement-module build spec, sent 05/30/26, captured here **verbatim and unmodified**. This is *input to the feedback/consolidation process* — **not adopted, not built.** Production stays on hold (per `Zoho_Architecture.md` §14).
>
> **Naming note:** filename aligned to convention (`ZohoArchitecture_RobFeedback_053026.md`, in `docs/` beside `ZohoArchitecture_Feedback_052926.md`); requested as "Architecture_Rob_Feedback.md".

**From:** Rob Beyer (CEO) · **Captured by:** Kyle · **Date:** 05/30/26
**Reviewing against:** `Zoho_Architecture.md` (architecture of record) · `specs/ZohoModuleSpec_ProcurementItems_052626.md` · `specs/ZohoModuleSpec_ContactTrackingSubform_052926.md` · `specs/ZohoModuleSpec_VendorBids_052926.md` (superseded)
**Side-by-side comparison:** `ArchitectureComparison_CurrentVsRob_053026.html`
**Builder analysis / disposition:** pending — to be logged in `ZohoArchitecture_Feedback_052926.md` and routed to Rob's open decision §13 #1.

---

## ROB'S MESSAGE — VERBATIM

> Here's the build spec. Three modules; build them in this order (Vendors first, then Procurement Items, then Quotes, since Quotes looks up to the other two).

### Module 1 — Vendors (use Zoho's native Vendors module)

Mostly stock fields. Add these custom fields:

| Field | Type | Notes |
|---|---|---|
| Country of Origin | Picklist | China, Vietnam, India, Mexico, USA, Other |
| Vendor Vetted | Checkbox | Diligence gate |
| Existing Supplier | Checkbox | Already in your stack |
| Default Payment Terms | Single Line | e.g., "30/70 dep/BL" |
| Vendor Notes | Multi Line | — |

### Module 2 — Procurement Items (repurpose Deals/Potentials, or new custom module "Procurement Items")

| Field | Type | Picklist values / notes |
|---|---|---|
| Item Name | Single Line | "Guest Room Case Goods — 6802" |
| Property | Picklist | 6802, 812, 5399, 2295, 2535, 4645, 44199, 8700, 2900 |
| Category | Picklist | FF&E, OS&E, Building Material, Appliance, Linen, Other |
| Target Qty | Number | — |
| Sourcing Status | Picklist | Sourcing, Samples Out, Negotiating, Awarded, Closed |
| **Awarded Vendor** | **Lookup → Quotes** | One value = one winner, structurally enforced |
| Decision Notes | Multi Line | — |

### Module 3 — Quotes (new custom module — the comparison layer)

**Links**

| Field | Type | Notes |
|---|---|---|
| Procurement Item | Lookup → Procurement Items | Parent |
| Vendor | Lookup → Vendors | Bidder |
| Quote Status | Picklist | Requested, Received, Under Review, Sample Requested, **Awarded**, Declined |
| Date Received | Date | — |

**Pricing**

| Field | Type | Notes |
|---|---|---|
| Unit Price | Currency | — |
| Currency | Picklist | USD, CNY, VND, INR, MXN |
| Order Quantity | Number | Drives per-unit landed math |
| MOQ | Number | — |
| Price Breaks | Multi Line | "500u: $42 / 1000u: $38" |
| Freight Cost | Currency | Total for the order |
| Duty / Tariff | Currency | Total |
| Inspection Cost | Currency | QC/third-party |
| Payment Terms | Single Line | — |
| **Total Landed Cost** | Formula (Currency) | formula below |
| **Landed Cost / Unit** | Formula (Decimal) | the real comparator |

**Delivery**

| Field | Type | Picklist values / notes |
|---|---|---|
| Lead Time (days) | Number | Production + transit |
| Ship Mode | Picklist | Sea-FCL, Sea-LCL, Air, Domestic |
| Incoterm | Picklist | FOB, CIF, DDP, EXW |
| Port of Origin | Single Line | — |
| Sample Lead Time (days) | Number | — |

**Specifications**

| Field | Type | Picklist values / notes |
|---|---|---|
| Spec Match | Picklist | Exceeds, Meets, Minor Deviation, Fails |
| Material / Construction | Multi Line | — |
| Dimensions | Single Line | — |
| Certifications | Multi-Select Picklist | BIFMA, CARB, Fire-Rated, ANSI, None |
| Spec Sheet | File Upload | — |
| Sample Status | Picklist | Not Requested, Requested, In Transit, Received, Approved, Rejected |

**Diligence**

| Field | Type | Notes |
|---|---|---|
| Warranty | Single Line | — |
| Risk Notes | Multi Line | — |

### Formulas (Zoho syntax)

**Total Landed Cost** (Currency formula field):

```
Round((${Quotes.Unit Price} * ${Quotes.Order Quantity})
  + ${Quotes.Freight Cost}
  + ${Quotes.Duty / Tariff}
  + ${Quotes.Inspection Cost}, 2)
```

**Landed Cost / Unit** (Decimal formula field, guarded against divide-by-zero):

```
If(${Quotes.Order Quantity} > 0,
  Round( ((${Quotes.Unit Price} * ${Quotes.Order Quantity})
    + ${Quotes.Freight Cost}
    + ${Quotes.Duty / Tariff}
    + ${Quotes.Inspection Cost}) / ${Quotes.Order Quantity}, 2),
  0)
```

> (Field references auto-populate when you pick them in the formula builder — exact token names will match your API field labels. The guard returns 0 if quantity is blank so the field doesn't error.)

### Report config

Build on the Quotes module:

- Type: Summary/Grouped report
- Group by: Procurement Item
- Columns: Vendor · Unit Price · Landed Cost / Unit · MOQ · Lead Time · Incoterm · Spec Match · Sample Status · Payment Terms · Quote Status
- Sort within group: Landed Cost / Unit ascending
- Filter: Sourcing Status = Sourcing OR Negotiating

Add a Kanban view on Quotes grouped by Quote Status for sourcing-stage tracking.

### Two build cautions

1. Custom modules require Enterprise edition or above. Confirm your plan before building Module 3. If you're below that, the fallback is a subform on the Procurement Item — but you lose per-quote spec-sheet attachments and per-quote reporting.
2. Currency mixing. If vendors quote in CNY/VND, the formula treats all currency fields as the org base currency. For true comparison either (a) have vendors quote in USD, or (b) add a manual "USD Unit Price" field and feed the formula from that. Zoho's multi-currency auto-conversion on formula fields is unreliable across modules.

> Want me to also map the Awarded-Vendor enforcement (a workflow that flips Quote Status to "Awarded" and stamps the parent Item's Awarded Vendor field when you pick a winner)?

---

### Rob's follow-up notes (verbatim)

> The zoho thing is awful a little bit because it doesn't have multiple contacts terms determine where we are with each contact. Take a look at this.

> For context — Same architecture, repurposed for sourcing. The "Deal" becomes the item you're buying; each competing contact becomes a vendor quote.
>
> **Data model**
> - **Procurement Item (Deals/Potentials)** — the thing being sourced (e.g., "Guest Room Case Goods — 6802" or "PEX-A Repipe Material"). One record.
> - **Quotes** — custom module, one record per vendor's offer. This is the comparison layer.
> - **Vendors (Contacts/Vendors)** — the suppliers. Note: Zoho has a native Vendors module — point the Quote lookup there instead of Contacts, so vendor data (lead time history, country, MOQ, payment terms) lives where it belongs and links to Purchase Orders downstream.
>
> Each Quote record carries:
> - Lookup → Procurement Item (parent)
> - Lookup → Vendor
> - Term fields (below)
> - Quote Status picklist: Requested / Received / Under Review / Sample Requested / Awarded / Declined
>
> To enforce one winner: add an Awarded Vendor lookup on the Procurement Item pointing to the Quotes module. One lookup value = one award, structurally.
>
> **Term fields to compare (procurement-oriented)**
> *Pricing* — Unit Price · Currency · MOQ · Price Breaks (qty tiers) · Landed Cost (formula: unit + freight + duty/tariff + inspection — critical for overseas comparison) · Payment Terms (e.g., 30% deposit / 70% on B/L)
> *Delivery* — Lead Time (days) · Ship Mode (Sea/Air/LCL/FCL) · Incoterm (FOB/CIF/DDP) · Port of Origin · Sample Lead Time
> *Specifications* — Spec Match (Meets / Exceeds / Deviates) · Material/Construction · Dimensions · Certifications (BIFMA, CARB, fire rating) · Spec Sheet (file attach) · Sample Status
> *Similar / Diligence* — Country of Origin · Vendor Vetted (Y/N) · Warranty · Existing Supplier (Y/N) · Notes
>
> **The tracking report** — built on Quotes: Group by Procurement Item; Columns: Vendor · Unit Price · Landed Cost · MOQ · Lead Time · Incoterm · Spec Match · Sample Status · Payment Terms · Status; Sort within group: Landed Cost (ascending) — true cost, not sticker price; Filter: Item status = actively sourcing. All vendors for one item stacked side-by-side, one block per item. Add a Kanban grouped by Quote Status for sourcing-stage visibility.
>
> **Why Landed Cost is the spine** — For overseas sourcing, sorting on Unit Price is misleading — a cheaper unit with worse Incoterms, longer lead time, or unvetted specs can land higher and riskier. The formula field forces apples-to-apples, which is the whole point of the comparison view. (Mirrors the true-landed-cost logic in the procurement review process.)
>
> Want the exact field types and picklist values mapped out so the team can build it, including the Landed Cost formula?

---

## Open flags for disposition (builder — NOT part of Rob's verbatim message)

These are raised for the consolidation log; none change Rob's text above.

1. **`native Vendors` vs `Accounts`** — Rob's Module 1 uses Zoho's native Vendors module; current architecture deliberately keeps vendors as **Accounts** behind the `CRM Use Case` firewall (21 live) and turned native Vendors **off** as inventory-suite sprawl (§6). Genuine fork — route to Rob.
2. **Property `2900`** — appears in Rob's Property picklist but is **not** in the 8-property canon (4645, 2295, 6802, 812, 5399, 2535, 44199, 8700). Confirm new property vs. error before any picklist is built. Not invented.
3. **Caution #1 (Enterprise)** — **does not hold for our org.** `Procurement_Items` is already a live custom module on **Professional** (org verified 05/30/26). Custom modules/formula/multi-select/file-upload fields are available here. Verify only the Professional custom-module *count cap*.
4. **Quotes module ≈ superseded `Vendor_Bids`** — Rob's Quotes module is structurally the `Vendor_Bids` child module shelved 05/29 in favor of the `Contact_Tracking` subform — re-derived and improved (landed-cost formula, per-quote spec-sheet upload, certifications). Reopens open decision §13 #1.
