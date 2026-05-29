# Jefferson Handback — Procurement Session
**File:** JeffersonHandback_052926.md
**Date:** May 29, 2026
**From:** Jefferson Gomez (`jefferson@rentstayable.com`)
**To:** Kyle Estocapio (`bke@rise8companies.com`)
**Re:** ZohoArchitecture review, §1.1 vendor reps, design recommendation, item staging, §1.2 confirmation

---

## 1. Architecture Review — Confirmed ✅

Hi Kyle,

I've reviewed `ZohoArchitecture_Jefferson_052926.md` and the item-centric design makes sense. Using `Procurement_Items` as the center record instead of Deals is the right call — it keeps vendor quotes, PO status, and specs all in one place without the sales pipeline noise.

A few confirmations from my side:

- The **10 stages** (Spec → Bid → Level → FL-Validate → Recommend → Submitted → Approved / Conditions / Declined / Need-More-Info) match how I actually buy. No missing steps.
- **PO handling** (fields + attached PDF) covers all my channels: Alibaba, Amazon, and Home Depot. No separate PO module needed.
- **FL-Validate checks** (humidity, salt air, hurricane code, 120V/UL-ETL) are the right rejection criteria for Florida.

---

## 2. Vendor Rep Names — §1.1 Data Fill

Source: Outlook "Vendors for Follow Up" folder scan conducted May 29, 2026 (37 emails). Full list also in `VendorContactList_RISE8_052926.md` and `Sheet 3` of the staging file.

### ✅ Real names confirmed — update Contact records in Zoho

| Account | Email | First Name | Last Name | Phone |
|---|---|---|---|---|
| Asico Fire Door | enzo@asicofiredoor.com | Enzo | Ren | +1 (424) 426-7895 (US) |
| Hangzhou Hongli Pipe Machinery | melody@pipetool.com.cn | Melody | Cheng | +86-571-86260388 / +86-15155179833 (Mobile/WeChat) |
| Shall Group | lily@shallgroup.com | Lily | Wang | +86-571-82651930 / +86-571-82651773 |
| Rebon Cabinets | angie@reboncabinets.com | Angie | Shen | +86-159-6710-0471 (Mobile/WhatsApp) / +86-571-8283-5318 (Office) |
| Zhejiang Mesa Sanitary | sales@zjmesa.com | Cristina | Chen | [Not in signature — follow up] |
| TKT | tkt@tkthvac.com | Amanda | Yang | [Not in signature — follow up] |
| Guanjie Yongdao Tech | tie@gjyd-tech.com | Qunny | Que | [Not in signature — follow up] |
| Walrus Floors | gail@walrusfloors.com | Gail | Lee | [Not in signature — follow up] |
| Coowin | coowingroup6@gmail.com | Amy | Zhu | [Not in signature — follow up] |
| Zhejiang Mesa Sanitary (alt) | jessica@mesashower.com | Jessica | [Unknown] | [Not in signature] |
| YeSheng Lighting | altar@yeshenglight.com | Altar | [Unknown] | [Not in signature] |

### 🔧 Placeholder contacts — first name only found, last name still needed

| Account | Email | First Name Found | Action |
|---|---|---|---|
| Foshan SHKL Sanitary Ware | export@shkl.cc | Erin | Update first name; follow up for last name + phone |
| Wipcool | sales4@wipcool.com | Zoey | Update first name; follow up for last name + phone |
| First Rate Tools | sales03@firstrate-tools.com | Tina | Update first name; follow up for last name + phone |
| Hebei Sinosky New Materials | sales4@sinoskyceiling.com | Charis | Update first name; follow up for last name + phone |

### ❌ No name found — reply needed

| Account | Email | Action |
|---|---|---|
| Foshan Mopo Sanitary Ware | sales03@mopochina.com | Reply and ask for rep name |
| Changzhou Yaming Wood | sales@chinawuya.com | Reply and ask for rep name |
| Luxury Home Faucet | info@luxuryhomefaucet.com | Reply and ask for rep name |
| Guangzhou Souxin Appliances | souxinappliances86@foxmail.com | Reply and ask for rep name |

---

## 3. §1.2 — Guangdong Yongcheng Vendor_Type ✅

**Confirmed:** Vendor_Type = **Overseas Manufacturer**

> Guangdong Yongcheng Intelligent Electrical Appliance Co., LTD — update the blank Vendor_Type field in their Zoho Account record to `Overseas Manufacturer`.

---

## 4. Recommendation — §4 Change Request

**R1 — Stale Bid Reminder: 3 days (not 14)**

| Field | Value |
|---|---|
| Date | 2026-05-29 |
| Recommendation | Set the stale bid alert threshold to **3 days**, not 14 |
| Why | Overseas vendors (China, Vietnam, Thailand) move fast and go quiet quickly. A 14-day window means I've already missed the window to negotiate. 3 days keeps me responsive while quotes are still warm. |
| Route | **Chat-now** — this affects the workflow rule design before it's built |
| Status | ☐ Pending Kyle action |

> Kyle: Per architecture §4, this is a `Chat-now` item since it changes the bidding table design. Please confirm whether 3-day threshold changes the "stale bid report" approach or requires per-vendor workflow rules.

---

## 5. Item Staging File — §1.3

**File:** `ItemStaging_Procurement_052926.xlsx`
**Sheets:** Item Staging (35 rows) | Instructions | Vendor Rep Names (§1.1)

### What's in it

35 active procurement items pulled from purchase history:
- **20 rows from Home Depot** (top items by spend: refrigerators, PTAC units, vanities, countertops, flooring, lumber, electrical, paint)
- **15 rows from Amazon** (top items by spend: mattresses, bed frames, dining tables, curtains, lighting, CAT6 cable, cameras)

### Fields pre-populated from purchase history

| Field | Status |
|---|---|
| Item Name (CamelCase) | ✅ Auto-generated — Jefferson to verify match to SharePoint folder names |
| Category | ✅ Mapped from department/category data |
| Description | ✅ From retailer listing |
| Source | ✅ Amazon or Home Depot |
| Retailer SKU / ASIN | ✅ From purchase data |
| US Baseline Cost/Unit | ✅ From purchase history (Home Depot items) |
| Est. Item-Level Spend | ✅ Calculated from purchase history |
| Property Scope | ⚠️ Defaulted to "All Properties" — Jefferson to update per-item |

### Fields Jefferson still needs to fill (blue cells)

| Field | Status |
|---|---|
| HTS Code | ❌ Not in purchase data — Jefferson fills if known |
| Est. Tariff % | ❌ Not in purchase data — Jefferson fills if known |
| PO Number | ❌ Jefferson fills for any active orders |
| PO Status | ⚠️ Defaulted to "Not Issued" — update any active orders |

---

## 6. Open Questions for Kyle / Rob

| # | Question | Who Answers |
|---|---|---|
| Q1 | 3-day stale bid alert — does that change design from "report" to "workflow rule per vendor"? | Kyle |
| Q2 | Item Name must match SharePoint folder exactly — can Kyle share the SharePoint folder list so Jefferson can verify the 35 item names before import? | Kyle |
| Q3 | Several Amazon items have no unit price in the export (Listed PPU = null). Is US_Baseline_Cost_Unit required for import, or can it load blank? | Kyle |
| Q4 | Production hold lift — is there a target date from Rob, or is it approval-event-based? | Rob |

---

*Handback prepared May 29, 2026 — Claude assisted Jefferson in this session. Data capture only; no fields, workflows, or Deluge were created or modified.*
