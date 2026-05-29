# How Procurement Works in Zoho — Guide for Jefferson
**RISE8 Companies / Stayable**
For: Jefferson Gomez (Purchasing Manager — Procurement SME & daily end-user)
From: Kyle Estocapio (backend build) · Approver: Rob Beyer
Prepared: 05/29/26 · Last Updated: 2026-05-29

> 📋 **This is for your review.** Read it and tell us where it doesn't match how you actually buy. This is the procurement-only view — written for you, the person who'll use it every day. The full company-wide architecture lives in `Zoho_Architecture.md` (Rob's copy); you don't need that one.
>
> 🟡 **Production is ON HOLD** until Rob approves. For now you **organize and stage** your data (see `JeffersonTasks_Procurement_052926.md`) — nothing loads live yet.

---

## 1. The one idea: the **Item** is the center

Everything in procurement hangs off the **item you're sourcing** — a queen mattress, a faucet, a door. In Zoho that's a record in the **`Procurement_Items`** module. Not a "deal," not a vendor — the *item*.

For each item, the record holds:
- What it is (name, category, description, specs)
- What it should cost (US baseline, estimated spend, tariff/HTS)
- Where it's going (which property)
- Every vendor you're getting quotes from
- The decision and the PO

**Why item-centric:** you source one item from several vendors and compare. Putting the item at the center means one screen shows you the whole story — every quote, every conversation, the decision. The old approach scattered this across separate "vendor" and "order" screens; that's what made the last Zoho attempt collapse.

---

## 2. The pieces you'll touch

| Thing in Zoho | What it means for you |
|---|---|
| **Procurement Item** | The product you're sourcing. Your main workspace. |
| **Account** | A vendor company (Foshan SHKL, Wipcool, etc.). Already loaded — 21 of them, tagged "Procurement." |
| **Contact** | The sales rep at a vendor. Linked to the vendor's Account. |
| **Activities** (notes/calls/emails) | Logged **on the item** — so the item's timeline shows everything, no matter which vendor you talked to. |
| **Decision Notes** | Where the final call is written — **on the item, never in email.** |

---

## 3. How an item moves — the 10 stages

Every item walks this path (this is the pipeline we're building):

```
Spec → Bid → Level → FL-Validate → Recommend → Submitted →
                                   Approved / Approved-with-Conditions / Declined / Need-More-Info
```

| Stage | What happens |
|---|---|
| **Spec** | You write what the item needs to be (specs, target cost, property). |
| **Bid** | You collect quotes from multiple vendors. |
| **Level** | You compare the quotes apples-to-apples. |
| **FL-Validate** | Check it survives Florida: humidity, salt air, hurricane code, 120V / UL-ETL electrical. Auto-reject if it fails. |
| **Recommend** | You recommend a winner. |
| **Submitted → Rob** | Goes to Rob to approve. |
| **Approved / Conditions / Declined / Need-More-Info** | Rob's call, recorded on the item. |

> **Tell us:** does this match your real buying steps? If you do something between Bid and Level we're missing, flag it.

---

## 4. Comparing multiple vendors (the bidding part)

You quote the same item from Vendor 1, 2, 3 and pick a winner. We're building that as a **table right on the item** — one row per vendor, tracking it from first contact → RFQ → quote → negotiate → award/lost. Trade-show reps with no formal contact can be typed in as free text.

🟡 **Pending Rob's approval.** The design (a table on the item vs. a heavier separate module) is one of the decisions waiting on Rob. The trade-off: the simple table can't auto-send per-vendor follow-up reminders — instead you'd get a "Stale (>14 days)" report you check. If you need automatic reminders per vendor, say so — that changes the design.

---

## 5. Purchase Orders

- **PO tracking:** every item has a `PO Number` and `PO Status` field (✅ already built). Status runs: Not Issued → PO Drafted → PO Issued → Confirmed by Vendor → Partially Received → Received → Closed.
- **PO documents:** for office supplies / linen you generate the PO from your Excel template (`FSCP Linen Default PO`) and **attach the PDF to the item.**
- **No separate PO module** — that was part of the sprawl that sank the last attempt. Numbers in fields, document attached. 🟡 *Approach pending Rob's confirm.*

---

## 6. What's built vs. what's coming

| Item | State |
|---|---|
| `Procurement_Items` module + 19 fields + picklists | ✅ Built |
| `PO_Number` + `PO_Status` fields | ✅ Built (05/29) |
| 21 vendor Accounts + their Contacts | ✅ Loaded (some rep names are placeholders — your §1.1 task) |
| 10-stage pipeline + workflow rules | 🔧 Building (backend) |
| Multi-vendor bidding table | 🟡 Pending Rob |
| Your ~197 historical items | ⛔ Staged offline now; loads after Rob lifts the hold |

---

## 7. Your role (and what's not yours)

| You do | You don't do |
|---|---|
| Provide the **real data** (vendor names, specs, costs, PO numbers) | Build fields, workflows, layouts, or scripts — that's Kyle |
| Run the **process** day-to-day once live | Load the bulk data — Kyle runs the import |
| **Recommend** changes to the system | Change the system yourself |
| Recommend vendors | **Approve** vendors / spend — that's Rob |

**Got a recommendation?** Urgent → message Kyle now. Not urgent → log it in `JeffersonTasks_Procurement_052926.md` §4 as `Pending`. You recommend; we build; Rob approves.

---

## 8. What we need you to review

1. **The 10 stages (§3)** — do they match how you actually buy? What's missing?
2. **Bidding (§4)** — is a table on the item enough, or do you need automatic per-vendor reminders?
3. **PO handling (§5)** — does fields + attached PDF cover every channel (Alibaba, Amazon, Home Depot, linen)?
4. **Fields (§2, and the item fields in your task doc)** — any field you need that isn't there?
5. **FL-Validate (§3)** — are the Florida checks (humidity, salt air, hurricane, electrical) the right rejection rules?

Mark up this file or just tell Kyle. Anything you flag becomes a task or a decision for Rob.

---

## 9. Where to look
| Doc | Purpose |
|---|---|
| `ZohoArchitecture_Jefferson_052926.md` | **This file** — procurement system explained for you |
| `JeffersonTasks_Procurement_052926.md` | Your data intake + recommendation log |
| `BuildPlan_Jefferson_052926.md` | Your phased prep plan while we wait on Rob |
| `ZohoProcurementProcessGuide_RISE8_052926.md` | Your earlier 3-quote process guide (adopted; module mapping redirected to the item-centric design) |
