# Build Plan — Jefferson Gomez (Procurement SME / End-User)
**RISE8 Companies / Stayable · Zoho CRM rollout**
Owner: Jefferson Gomez (`jefferson@rentstayable.com`) · Builds with: Kyle · Approver: Rob Beyer
Prepared: 05/29/26 · Last Updated: 2026-05-29

> 🟡 **Production is ON HOLD** pending Rob's approval. Jefferson is the procurement **SME and daily end-user**, not a CRM builder. This plan is **offline prep + process readiness** so the moment Rob lifts the hold, the real data load and go-live are fast. **Nothing here writes to live Zoho.**

---

## Possibility-of-change legend

| Mark | Meaning | Action rule |
|---|---|---|
| 🟢 **Stable** | Process/doctrine locked. Safe to prep fully. | Do now. |
| 🟡 **Minor-change risk** | Decided; small tweaks possible. | Do now, accept minor rework. |
| 🔴 **Change-prone** | Depends on Rob §13 (esp. bidding/PO). | Prep loosely; don't finalize structure. |
| ⛔ **Frozen by hold** | Loading data into live Zoho. | Stage offline only — do not import. |

---

## Phase 1 — Historical item staging *(offline)*

| Task | Mark | Notes |
|---|---|---|
| Assemble the 197 historical procurement items into one clean sheet | 🟢 | Becomes Kyle's import file when the hold lifts. |
| Apply `Item_Name` convention (CamelCase, no spaces, e.g. `QueenMattress`) | 🟢 | Must match the SharePoint folder name verbatim. |
| Match each item to FF&E / OS&E / appliance / building-material / soft-good category | 🟢 | Drives picklist values already built. |
| Actually import the 197 items | ⛔ | Frozen §14. Staging file only — Kyle runs the load post-approval. |

---

## Phase 2 — Spec stage prep (5-stage flow: **Spec** → Bid → Level → FL-Validate → Recommend)

| Task | Mark | Notes |
|---|---|---|
| Draft spec sheets for top-priority items | 🟢 | Spec is stage 1 of the locked flow. |
| Run FL-validation checks on real items (humidity, salt air, hurricane code, 120V / UL-ETL electrical) | 🟢 | Doctrine in `docs/ProjectInstructions_OverseasProc_052626.md` — locked. Flag auto-reject items now. |
| File naming on all spec docs: `SpecSheet_<ItemName>_MMDDYY.xlsx` | 🟢 | Mandatory convention. |

---

## Phase 3 — Vendor & contact readiness *(offline)*

| Task | Mark | Notes |
|---|---|---|
| Verify the 19 imported Alibaba vendors; supply missing rep names (placeholder Contacts) | 🟢 | Feeds Kyle's account/contact hygiene (his Phase A). |
| Collect current rep contact info for active vendors | 🟢 | — |
| Pre-stage which items are in active multi-vendor bidding | 🔴 | The *structure* (subform vs child-module) is forked on Rob §13 #1. Capture the raw bid data in a simple sheet; don't lock format. |

---

## Phase 4 — PO template & process *(minor-change risk — Rob §13 #2)*

| Task | Mark | Notes |
|---|---|---|
| Standardize the default PO template | 🟡 | Sample: `reference/FSCP Linen Default PO for Properties NP 3.xlsx` (Excel). |
| Confirm PO-number sources per channel (Alibaba confirmation, Amazon/Home Depot) | 🟡 | Maps to `PO_Number` / `PO_Status` fields Kyle builds. |
| Define PO → attach-PDF workflow for office-supplies / linen | 🟡 | You generate the PO from template; PDF attaches to the item. Confirm pending Rob §13 #2. |

---

## Phase 5 — SharePoint folder structure *(offline)*

| Task | Mark | Notes |
|---|---|---|
| Build the per-item SharePoint folders | 🟢 | Folder name **must match** the `Item_Name` verbatim. Structure per `ProjectInstructions_OverseasProc_052626.md`. |

---

## What needs Rob before you finalize
- **Bidding format (§13 #1)** — affects how Phase 3 bid data gets structured.
- **PO approach (§13 #2)** — affects Phase 4 finalization.

## Do-now shortlist (no Rob needed)
1. Build the 197-item staging sheet with `Item_Name` convention. 🟢
2. Draft spec sheets + FL-validation flags for top items. 🟢
3. Fill in missing vendor rep names/contacts. 🟢
4. Stand up SharePoint folders matching `Item_Name`. 🟢
