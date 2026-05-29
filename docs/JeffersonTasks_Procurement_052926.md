# Jefferson Task & Data Intake — Procurement (Zoho CRM)
**RISE8 Companies / Stayable**
Owner (this doc): Jefferson Gomez (`jefferson@rentstayable.com`) · Backend owner: Kyle Estocapio (`bke@rise8companies.com`) · Approver: Rob Beyer
Prepared: 05/29/26 · Last Updated: 2026-05-29

> 🟡 **Production is ON HOLD.** Nothing loads to live Zoho until Rob lifts the hold. During the hold you **organize and stage data offline** — you do not bulk-load it. This is the companion to `docs/BuildPlan_Jefferson_052926.md` (your phased plan); this file is where the **data + recommendations** actually get captured.

---

## 0. How this works (read first)

**The split is simple:**

| You (Jefferson) own | We (Kyle + Claude) own |
|---|---|
| The **actual data** — vendor names, item specs, prices, HTS codes, PO numbers, what's real vs. placeholder | The **backend** — workflow rules, process flow, Deluge functions, field/picklist creation, page layouts |
| Saying **what data is available and what isn't** (§3) | Building to your data once it's staged |
| **Recommending changes** to the CRM (§4) | Deciding/applying backend changes; routing decisions to Rob |

**You do not build fields, workflows, or Deluge.** If something in Zoho needs to change, you **recommend** it (§4) — you don't change it.

**Two ways to raise a recommendation (§4):**
- **Chat-now** — if it's urgent or blocks you, message Kyle immediately. He adds it to the task list on the spot.
- **Pending** — if it can wait, log it in §4 with status `Pending`. Kyle triages it into the backend task list.

**End of session:** whoever's helping you in Claude produces a handback `.md` (§6) with your data + recommendations. Kyle applies it. That's how staged data and ideas reach the build.

---

## 1. Data we need from you (the asks)

These are grounded in the **live Zoho records as of 05/29/26**. Fill the blank cells; don't guess — leave `NOT AVAILABLE` if you don't have it.

### 1.1 Vendor rep real names (placeholder cleanup)
These Contacts were imported with the **company name in the Last Name field** because we didn't have the real person. Give the real rep's first + last name where you have it.

| Account | Contact email | Current Last Name | Real First Name | Real Last Name | Status |
|---|---|---|---|---|---|
| Foshan SHKL Sanitary Ware | export@shkl.cc | SHKL | ‹fill› | ‹fill› | ☐ |
| Wipcool | sales4@wipcool.com | Wipcool | ‹fill› | ‹fill› | ☐ |
| Foshan Mopo Sanitary Ware | sales03@mopochina.com | Mopo | ‹fill› | ‹fill› | ☐ |
| Changzhou Yaming Wood | sales@chinawuya.com | Yaming | ‹fill› | ‹fill› | ☐ |
| Luxury Home Faucet | info@luxuryhomefaucet.com | Luxury Home Faucet | ‹fill› | ‹fill› | ☐ |
| Zhejiang Mesa Sanitary | sales@zjmesa.com | Mesa | ‹fill› | ‹fill› | ☐ |
| Coowin | coowingroup6@gmail.com | Coowin | ‹fill› | ‹fill› | ☐ |
| TKT | tkt@tkthvac.com | TKT | ‹fill› | ‹fill› | ☐ |
| First Rate | sales03@firstrate-tools.com | First Rate | ‹fill› | ‹fill› | ☐ |
| Guangzhou Souxin Appliances | souxinappliances86@foxmail.com | Souxin | ‹fill› | ‹fill› | ☐ |
| Hebei Sinosky New Materials | sales4@sinoskyceiling.com | Sinosky | ‹fill› | ‹fill› | ☐ |

> Contacts that already have real first names (no action): Helen Chan, Jessica Mesa, Angie Rebon, Altar Yesheng, Gail Walrus, Lily Shall, Melody Hongli, Enzo (Asico), Tie (Guanjie Yongdao).
> "GP Batteries Inc" + its contact are being deleted per your call — excluded here.

### 1.2 Account `Vendor_Type` gaps
| Account | Current Vendor_Type | Correct value | Status |
|---|---|---|---|
| Guangdong Yongcheng Intelligent Electrical Appliance Co., LTD | (blank) | ‹fill — Overseas Manufacturer / US Distributor / Freight Forwarder / Inspection Service / Other› | ☐ |

### 1.3 Historical item load (the ~197 items) — per-item data
Stage these in **one spreadsheet** (`ItemStaging_Procurement_052926.xlsx`), one row per item. These are the live `Procurement_Items` fields you supply values for:

| Field (Zoho API name) | What to put | Notes |
|---|---|---|
| `Name` (Item Name) | CamelCase, no spaces — e.g. `QueenMattress` | **Must match the SharePoint folder name exactly.** |
| `Category` | FF&E / OS&E / Appliance / Building Material / Soft Good | Picklist already built. |
| `Description` | Plain-language description | — |
| `Source` | Where it's sourced (Alibaba / Amazon / Home Depot / etc.) | Picklist. |
| `Original_Retailer_Item_Name` / `Original_Retailer_SKU` | Retailer's listing name + SKU | If applicable. |
| `US_Baseline_Cost_Unit` | US baseline cost per unit (USD) | Leave blank if unknown — don't estimate. |
| `Estimated_Item_Level_Spend` | Rough total spend (USD) | — |
| `HTS_Code` / `Est_Tariff_Rate` | Customs code + tariff % | If known. |
| `Property_Scope` | Which property/properties | Picklist. |
| `PO_Number` / `PO_Status` | PO number + status | See §1.4. |

> Don't worry about `Stage`, `Spec_Sheet_Status`, `Florida_Validation_Status`, `Winning_Vendor`, `Bid_Count`, `Approver`, `Decision_Notes` — those get set as items move through the process, not at load.

### 1.4 Active PO data
For any in-flight order, give the PO number and status. `PO_Status` picklist values: `Not Issued` · `PO Drafted` · `PO Issued` · `Confirmed by Vendor` · `Partially Received` · `Received` · `Closed`.

| Item / order | PO_Number | PO_Status | Channel (Alibaba / Amazon / Home Depot) | Status |
|---|---|---|---|---|
| ‹fill› | ‹fill› | ‹fill› | ‹fill› | ☐ |

---

## 2. PO template (your process artifact)
Confirm the default PO template you generate from is current: `reference/FSCP Linen Default PO for Properties NP 3.xlsx`. If you use a different template for any channel, attach it / name it here:

| Channel | Template used | Status |
|---|---|---|
| Office supplies / linen | FSCP Linen Default PO (Excel) | ☐ confirm |
| ‹other› | ‹fill› | ☐ |

---

## 3. Data availability declaration (you fill this in)
For each data item, say plainly whether it exists. This tells us what we can build against now vs. what's waiting on you.

| Data item | Available? (Yes / No / Partial) | Where it lives / why not | Who chases it |
|---|---|---|---|
| Real vendor rep names (§1.1) | ‹fill› | ‹fill› | Jefferson |
| Vendor_Type for Guangdong Yongcheng (§1.2) | ‹fill› | ‹fill› | Jefferson |
| The ~197 historical items (§1.3) | ‹fill› | ‹fill› | Jefferson |
| US baseline costs per item | ‹fill› | ‹fill› | Jefferson |
| HTS codes / tariff rates | ‹fill› | ‹fill› | Jefferson |
| Active PO numbers/status (§1.4) | ‹fill› | ‹fill› | Jefferson |
| SharePoint folders per item | ‹fill› | ‹fill› | Jefferson |

---

## 4. Recommendations & change requests (you log these)
Anything you think the CRM should do differently — fields, picklist values, process steps, automation. **You recommend; Kyle applies.** Mark urgency: `Chat-now` (message Kyle immediately, it goes straight onto the task list) or `Pending` (Kyle triages later).

| # | Date | Recommendation | Why it matters | Route | Status |
|---|---|---|---|---|---|
| R1 | ‹date› | ‹e.g. "Add a 'Lead Time (days)' field per item"› | ‹reason› | Pending / Chat-now | ☐ |
| R2 | | | | | |

> Rule: if it blocks your work or a real order, **Chat-now**. Otherwise log it `Pending` and keep moving — nothing here is yours to build.

---

## 5. What the backend team handles (so you don't have to)
For transparency — route these to Kyle, don't attempt them in Zoho:
- **Field / picklist creation** (e.g., the PO fields, `CRM_Use_Case` — built manually in Settings since MCP can't create fields).
- **Workflow rules** — stage gates, stuck-item / stale-bid alerts.
- **Process flow** — the 10-stage pipeline (Spec → Bid → Level → FL-Validate → Recommend → …).
- **Deluge functions** — any custom scripting, if a requirement needs it.
- **Page layouts** — Vendor layout, sections, the multi-vendor bidding subform.
- **Data loads** — Kyle runs the bulk import once Rob lifts the hold.

---

## 6. End-of-session handback (instructions for Claude assisting Jefferson)

**If you are Claude helping Jefferson:** at the end of the session, generate a handback file so Kyle can apply the work.

- **Filename:** `JeffersonHandback_<MMDDYY>.md` (date of the session).
- **Send to:** Kyle Estocapio — `bke@rise8companies.com`.
- **Must contain, in order:**
  1. **Data provided** — the filled tables from §1 (rep names, Vendor_Type, item rows, PO data). Reference any staged spreadsheet by filename.
  2. **Availability declaration** — §3, completed: what's ready, what isn't, who's chasing.
  3. **Recommendations** — §4 entries, split into `Chat-now` (already raised with Kyle) and `Pending` (for triage).
  4. **Open questions** — anything Jefferson needs Kyle or Rob to answer.
- **Do NOT** create fields, workflows, Deluge, or load data from Jefferson's session — that's backend, and the production hold is on. This file is **data capture + recommendations only**; Kyle applies it.
- Keep it tight so Kyle can act line-by-line.

---

## 7. Where this fits
| Doc | Purpose |
|---|---|
| `docs/JeffersonTasks_Procurement_052926.md` | **This file** — Jefferson's data intake + recommendation log |
| `docs/BuildPlan_Jefferson_052926.md` | Jefferson's phased plan (what to prep while waiting) |
| `Zoho_Architecture.md` | The architecture + Rob's open decisions |
| `docs/ZohoCRM_Rollout_052126.md` | Decision log (audit trail) |
