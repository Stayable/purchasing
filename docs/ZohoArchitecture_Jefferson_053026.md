# How Procurement Works in Zoho — Guide for Jefferson (v2)
**RISE8 Companies / Stayable**
For: Jefferson Gomez (Procurement SME & end-user) · From: Kyle Estocapio · Approver: Rob Beyer
Prepared: 05/30/26 · **Supersedes** `ZohoArchitecture_Jefferson_052926.md` (kept as history)

> 📋 Updated after your 05/29 handback. **You already confirmed the core design — this just folds in your confirmations and the small adjustments your vendor/item data surfaced.** Nothing here changes how you operate day-to-day. Please review §8 and reply to acknowledge.
>
> 🟡 **Production still ON HOLD** pending Rob. You keep staging/organizing; nothing loads live yet.

---

## 1. The model (unchanged — you confirmed it)
The **item** is the center. Each item you source is a record in the **`Procurement_Items`** module holding its specs, costs, vendors, conversations, decision, and PO. Vendors = **Accounts**; the people = **Contacts**; conversations/decisions log **on the item**. ✅ *You confirmed this is the right call over a Deals pipeline.*

## 2. The 10 stages (unchanged — you confirmed)
`Spec → Bid → Level → FL-Validate → Recommend → Submitted → Approved / Approved-with-Conditions / Declined / Need-More-Info`. ✅ *Matches how you buy; no missing steps.*

## 3. FL-Validate (unchanged — you confirmed)
Humidity · salt air · hurricane code · 120V / UL-ETL. ✅ *Right rejection criteria.*

## 4. POs (unchanged — you confirmed)
`PO Number` + `PO Status` fields track the order; for office-supply/linen you attach the PDF from your template. Covers Alibaba, Amazon, Home Depot. ✅ *No separate PO module needed.*

## 5. Multi-vendor bidding (one change pending Rob)
Vendor quotes tracked per-row on the item (staging → RFQ → quote → negotiate → award/lost).
- 🟡 **Your recommendation — 3-day stale-bid alert (not 14)** — is logged and routed to Rob. It affects whether stale bids surface as a *report* or as *automated per-vendor reminders* (his open decision). We'll confirm once he rules. Your rationale (overseas vendors go quiet fast) is on record.

## 6. Vendors — what your scan changed
Your mailbox scan refined the vendor picture. Adjustments being made on our side (you don't need to do anything):
- **Sourcing agents** (Jing Sourcing, LeeLine) are now a distinct vendor type — adding `Sourcing Agent` to the Vendor_Type list so they're not lumped with manufacturers.
- **More countries** — Thailand, Vietnam, Philippines added alongside China.
- **~14 new vendors** from your scan will be created as Accounts (after de-duplicating alt contacts) once the hold lifts. The 21 already loaded now carry real rep names where you found them.
- **WhatsApp/WeChat-first vendors** (Souxin, TKT, Asico, iSuperhouse): noted — those conversations get logged on the item manually, same as Alibaba chat (no auto-capture).

## 7. Your 35 staged items
The 35-item file is good and staged. Before load: category labels get normalized to match the picklist (e.g., "Appliance" → "Appliances"), and we cross-check the Item_Names against your SharePoint folders. Load happens after Rob lifts the hold. *(Note: the plan previously said "197" — your 35 top-by-spend items are the real initial load.)*

## 8. What we need you to confirm / do
1. **Acknowledge this doc** (reply) — so we have your sign-off on record.
2. **Fill the rep gaps** when you can: 4 reps need a last name + phone; 4 need a name at all (reply to the vendor).
3. **SharePoint folders** — once you have the structure, we verify the 35 Item_Names match.

That's it — the system works the way you confirmed. The only open design question (3-day bidding) is with Rob.

---

## 9. Where to look
| Doc | Purpose |
|---|---|
| `ZohoArchitecture_Jefferson_053026.md` | **This file** (v2) |
| `JeffersonAck_053026.md` | Cover note / what we did with your handback |
| `JeffersonTasks_Procurement_052926.md` | Your data intake + recommendation log |
| `ZohoArchitecture_Jefferson_052926.md` | v1 (history) |
