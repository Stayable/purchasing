# Zoho Procurement — Build Walkthrough & Test Runbook

**For:** Kyle (builder) · **Date:** 060326 · **Status:** ✅ **All 3 modules built + 3-quote validation passed 06/02/26** (held-state — no real data load until Rob lifts the operational hold). Remaining: validation-rule gates + award workflow (Deluge).

> **Deployed API names** (differ from the field tables below — use these in MCP/code): `Target_Quantity` (item) · `Minimum_Order_Qty` · `Lead_Time_days` · `Sample_Lead_Time_days` · `Landed_Cost_Unit` · `Currency1` (label "Quote Currency") · `Certificates` (textarea). Module API = `Vendor_Quotes`.
>
> **Validation test result (06/02/26):** item TEST_QueenMattress + 3 quotes. Landed Cost/Unit computed **A=57.00 · B=58.00 · C=56.50** — VendorB lowest sticker ($38) but highest landed; VendorC highest sticker ($45) but **wins** on landed cost. Auto-numbers QT-0001/2/3 ✓; both lookups ✓; `Awarded_Vendor` accepted the winning quote ✓. Test records flagged `_DELETE` for manual removal (no MCP delete tool).
**Architecture of record:** `Zoho_Architecture.md` · `specs/ZohoModuleSpec_Quotes_060226.md` · `specs/ZohoModuleSpec_ProcurementItems_052626.md`
**Visual:** `infographics/ProcurementProcessV2_RISE8_060326.html` (+ PDF)

This is the tab-by-tab build of the approved v2 procurement design: three modules, how they connect, the rules, and an end-to-end test. Everything here is the procurement workflow only.

---

## 0. Ground rules

- **Build order:** Vendors → Vendor Quotes → finish Procurement Items. Quotes looks up to both; the item's `Awarded_Vendor` looks up to Quotes, so Quotes must exist first.
- **Manual vs. MCP:** modules / fields / picklists / layouts / formulas / validation rules = **manual Zoho UI**. Records + workflow rules = **MCP** (`zoho-crm-data`, `zoho-crm-workflows`).
- **API name `Vendor_Quotes`, not `Quotes`** — the stock Quotes module already owns `Quotes`.
- **Do NOT add Property `2900`** — pending Rob's confirmation (new property vs. typo).
- **Held-state:** build config only; the structural 3-quote test in §6 is sanctioned, the 197/35-item real load is not.

---

## 1. Module 1 — Vendors (native, already enabled)

Settings → Modules and Fields → **Vendors** → standard layout (one layout — every record is a procurement supplier; do not create a second layout). Add a **"Procurement Diligence"** section:

| Field label | Type | Picklist values |
|---|---|---|
| Country of Origin | Picklist | China · Vietnam · India · Mexico · USA · Thailand · Philippines · Other |
| Vendor Vetted | Checkbox | — |
| Existing Supplier | Checkbox | — |
| Default Payment Terms | Single line | — |
| Vendor Notes | Multi-line | — |
| Vendor Type | Picklist | Overseas Manufacturer · US Distributor · Freight Forwarder · Inspection Service · Sourcing Agent · Other |

**Migrate** the 21 held vendor Accounts + 20 Contacts into Vendors after fields exist.

---

## 2. Module 2 — Vendor Quotes (new custom child module)

Create New Module → singular "Vendor Quote" / plural "Vendor Quotes" → **confirm API name `Vendor_Quotes`**. Primary field = Auto-number, label "Quote ID", format `QT-{0000}`. Permissions mirror Procurement_Items.

### Fields by section

**§1 Identification & links**
| Label | API | Type | Req |
|---|---|---|---|
| Quote ID | `Name` | Auto-number `QT-{0000}` | system |
| Procurement Item | `Procurement_Item` | Lookup → Procurement_Items | YES |
| Vendor | `Vendor` | Lookup → Vendors | YES |
| Quote Status | `Quote_Status` | Picklist (default Requested) | YES |
| Date Received | `Date_Received` | Date | no |

**§2 Pricing**
| Label | API | Type |
|---|---|---|
| Unit Price | `Unit_Price` | Currency (USD) |
| Currency | `Currency` | Picklist (reference only) |
| Order Quantity | `Order_Quantity` | Number |
| Minimum Order Qty | `MOQ` | Number |
| Price Breaks | `Price_Breaks` | Multi-line |
| Freight Cost | `Freight_Cost` | Currency |
| Duty / Tariff | `Duty_Tariff` | Currency |
| Inspection Cost | `Inspection_Cost` | Currency |
| Payment Terms | `Payment_Terms` | Single line |
| Total Landed Cost | `Total_Landed_Cost` | Formula (Currency) |
| Landed Cost / Unit | `Landed_Cost_Per_Unit` | Formula (Decimal) |

**§3 Delivery**
| Label | API | Type |
|---|---|---|
| Lead Time (days) | `Lead_Time_Days` | Number |
| Ship Mode | `Ship_Mode` | Picklist |
| Incoterm | `Incoterm` | Picklist |
| Port of Origin | `Port_of_Origin` | Single line |
| Sample Lead Time (days) | `Sample_Lead_Time_Days` | Number |

**§4 Specifications**
| Label | API | Type |
|---|---|---|
| Spec Match | `Spec_Match` | Picklist |
| Material / Construction | `Material_Construction` | Multi-line |
| Dimensions | `Dimensions` | Single line |
| Certifications | `Certifications` | Multi-select picklist |
| Spec Sheet | `Spec_Sheet` | File Upload |
| Sample Status | `Sample_Status` | Picklist |

**§5 Diligence**
| Label | API | Type |
|---|---|---|
| Warranty | `Warranty` | Single line |
| Risk Notes | `Risk_Notes` | Multi-line |

### Picklists (case-sensitive)
- `Quote_Status`: Requested · Received · Under Review · Sample Requested · Awarded · Declined *(default Requested)*
- `Currency`: USD · CNY · VND · INR · MXN
- `Ship_Mode`: Sea-FCL · Sea-LCL · Air · Domestic
- `Incoterm`: FOB · CIF · DDP · EXW
- `Spec_Match`: Exceeds · Meets · Minor Deviation · Fails
- `Certifications` (multi): BIFMA · CARB · Fire-Rated · ANSI · None
- `Sample_Status`: Not Requested · Requested · In Transit · Received · Approved · Rejected

### Formula fields (pick tokens in the builder — don't type `Quotes`)
```
Total Landed Cost (Currency):
Round((Unit Price * Order Quantity) + Freight Cost + Duty/Tariff + Inspection Cost, 2)

Landed Cost / Unit (Decimal, divide-by-zero guarded):
If(Order Quantity > 0,
   Round(((Unit Price*Order Quantity)+Freight Cost+Duty/Tariff+Inspection Cost)/Order Quantity, 2),
   0)
```

---

## 3. Module 3 — Procurement Items (LIVE — apply v2 deltas)

Full field roster (v2 changes flagged). Most already exist.

| Section | Fields |
|---|---|
| Identification | `Name` (primary, CamelCase) · `Stage` · `Category` · `Owner` · `Tag` |
| Property & approval | `Property_Scope` · **`Target_Qty` [ADD — Number]** · `Estimated_Item_Level_Spend` · `US_Baseline_Cost_Unit` · `Approver` · `Target_Decision_Date` |
| Sourcing context | `Source` · `Original_Retailer_SKU` · `Original_Retailer_Item_Name` · `HTS_Code` · `Est_Tariff_Rate` |
| Workflow status | `Spec_Sheet_Status` · `Florida_Validation_Status` · **`Awarded_Vendor` [ADD — Lookup→Vendor_Quotes]** · ~~`Bid_Count`~~ [RETIRE] · ~~`Winning_Vendor`~~ [DEPRECATE] |
| Audit & decision | `Sharepoint_Folder_Link` · `Description` · `Decision_Notes` · `PO_Number` · `PO_Status` |

**Deltas to apply:**
1. Add `Target_Qty` (Number).
2. Add `Awarded_Vendor` (Lookup → Vendor_Quotes) — **only after Module 2 exists.**
3. Retire `Bid_Count`; hide/read-only `Winning_Vendor`.
4. Remove the Linked Vendors related list (the Vendor Quotes related list replaces it).

**Key picklists (reference):** `Stage` (10: Spec→…→Need-More-Info) · `Property_Scope` (Portfolio-wide + 8 IDs, **no 2900**) · `Approver` (3 tiers) · `Spec_Sheet_Status` (3) · `Florida_Validation_Status` (4) · `PO_Status` (7).

---

## 4. How they connect

```
VENDORS ──Vendor lookup──► VENDOR QUOTES ──Procurement_Item lookup──► PROCUREMENT ITEMS
                                  ▲                                          │
                                  └────────── Awarded_Vendor lookup ◄────────┘
```

- `Vendor_Quotes.Procurement_Item` → Procurement_Items ⇒ renders the **"Vendor Quotes" related list** on each item (the comparison view).
- `Vendor_Quotes.Vendor` → Vendors (each quote names one supplier).
- `Procurement_Items.Awarded_Vendor` → Vendor_Quotes (the winning quote, stamped by automation §5).
- Emails/calls/notes log as **Activities on the item** (single timeline).

---

## 5. Rules & automation

**Validation Rules on Procurement_Items** (these are the SOP gates — Zoho "block save with error" = a Validation Rule, *not* a workflow rule):
| Advancing to | Block unless |
|---|---|
| Bid | `Spec_Sheet_Status` = COO Signed Off |
| Recommend | `Florida_Validation_Status` = Passed |
| Approved | `Awarded_Vendor` is populated |

**Workflow Rules (MCP-buildable):**
| Module | Trigger | Action | Mechanism |
|---|---|---|---|
| Vendor_Quotes | `Quote_Status` → Awarded | Stamp parent `Procurement_Items.Awarded_Vendor` = this quote; optionally flip sibling quotes → Declined | ⚠️ **Custom function (Deluge)** — a standard field-update can only write the *same* record; writing the *parent* needs a small function. MCP can scaffold the rule; the function body is authored in Zoho. |
| Procurement_Items | Stage = Bid for > N days | Email Owner | Time-based workflow. **N pending Rob** (Jefferson: 3; prior: 14). |
| Procurement_Items | `Estimated_Item_Level_Spend` changes | Suggest `Approver` by tier | Field update / function. |

**Report (on Vendor Quotes):** Grouped → group by Procurement Item → columns Vendor · Unit Price · Landed Cost/Unit · MOQ · Lead Time · Incoterm · Spec Match · Sample Status · Payment Terms · Quote Status → sort by **Landed Cost/Unit ascending** → filter parent `Stage` ∈ {Bid, Level}. **Kanban** on `Quote_Status`.

---

## 6. Test the flow — 3-quote validation on one item

Run before any real load. Steps 1–2, 4, 7 I can drive via MCP (`createRecords`/`updateRecord`) once the modules exist; the gate checks (3, 6, 8) require the validation rules built first.

| # | Step | Pass check |
|---|---|---|
| 1 | Create/confirm 3 Vendor records | exist, vetted flags set |
| 2 | Create 1 Procurement Item, `Stage = Spec`, set `Target_Qty`, spend, property | saves clean |
| 3 | Try `Stage → Bid` before COO sign-off | **blocks**; set `Spec_Sheet_Status = COO Signed Off` → advances |
| 4 | Create 3 Vendor Quotes on the item, 3 different Vendors, with pricing | landed-cost formulas compute; all 3 show in the item's Vendor Quotes related list |
| 5 | Advance to `Level`; open grouped report | rows sort by Landed Cost/Unit ascending under the item |
| 6 | Try `Stage → Recommend` before FL pass | **blocks**; set `Florida_Validation_Status = Passed` → advances |
| 7 | On the best quote set `Quote_Status = Awarded` | workflow stamps item `Awarded_Vendor`; siblings → Declined (if enabled) |
| 8 | `Stage → Approved` | blocks when `Awarded_Vendor` empty; succeeds when populated |
| 9 | Set `PO_Number`/`PO_Status`, attach a PO PDF; write `Decision_Notes` | record carries full trail |

**Overall pass:** formulas correct · lookups resolve both ways · related list complete · all 3 gates fire · award stamp works · Kanban groups · no required-field surprises. Then delete/clearly-mark the test records before go-live.

---

## 7. Pre-staged MCP payloads (fire once modules are live)

> These cannot run yet — `Vendor_Quotes` and the `Awarded_Vendor`/`Target_Qty` fields don't exist. Listed so they're ready.

**Test item** (`createRecords` on `Procurement_Items`):
```json
{ "Name":"TEST_QueenMattress", "Stage":"Spec", "Category":"Furniture",
  "Property_Scope":"Jacksonville West (6802)", "Target_Qty":200,
  "Estimated_Item_Level_Spend":24000, "Spec_Sheet_Status":"In Progress",
  "Florida_Validation_Status":"Not Yet Reviewed",
  "Description":"STRUCTURAL TEST RECORD — delete before go-live." }
```
**Three quotes** (`createRecords` on `Vendor_Quotes`, after capturing the item id + 3 vendor ids):
```json
[ {"Procurement_Item":"<itemId>","Vendor":"<vA>","Quote_Status":"Received","Unit_Price":42,"Order_Quantity":200,"Freight_Cost":1800,"Duty_Tariff":900,"Inspection_Cost":300,"Incoterm":"FOB","Lead_Time_Days":45},
  {"Procurement_Item":"<itemId>","Vendor":"<vB>","Quote_Status":"Received","Unit_Price":38,"Order_Quantity":200,"Freight_Cost":2600,"Duty_Tariff":1100,"Inspection_Cost":300,"Incoterm":"CIF","Lead_Time_Days":60},
  {"Procurement_Item":"<itemId>","Vendor":"<vC>","Quote_Status":"Received","Unit_Price":45,"Order_Quantity":200,"Freight_Cost":1200,"Duty_Tariff":800,"Inspection_Cost":300,"Incoterm":"DDP","Lead_Time_Days":40} ]
```
Expected landed/unit: A = (8400+3000)/200 = **57.00**; B = (7600+4000)/200 = **58.00**; C = (9000+2300)/200 = **56.50**. C wins on true landed cost despite the highest sticker — exactly the point of the comparison. *(Verify the formula reproduces these.)*

**Award workflow** — scaffold the rule via `zoho-crm-workflows` (`postWorkflowRule`) on `Vendor_Quotes`, trigger `Quote_Status = Awarded`; attach a Deluge custom function that sets `Procurement_Item.Awarded_Vendor` to the current quote id. (Function body authored in Zoho — flagged in §5.)
