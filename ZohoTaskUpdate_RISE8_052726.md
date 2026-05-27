# Zoho Procurement Setup — Task Update

**Date:** 05/27/26
**Project:** Overseas Procurement — Zoho CRM as System of Record
**Status:** ON HOLD — source files missing

---

## Import notes (added 05/27/26 in our session)

This document was produced against a **different test Zoho account** (which was on Free tier). Rob has confirmed:

- The **current production account** is already on **Professional tier with 3 users** (admin@rentstayable.com, jefferson@rentstayable.com, rb@rise8companies.com). **Task 1 below is N/A** — no upgrade needed; subscription is already in place.
- The **architectural goal** of this 05/27 doc — pivoting from Deals pipeline to a `Procurement_Items` custom module — is **adopted** for the current paid account. This supersedes the 05/21 rollout doc's "Deals pipeline with custom fields" approach. See decision log in `ZohoCRM_Rollout_052126.md`.
- The **4 referenced files** (`ZohoProcurementTracker_052626.html`, `ProjectInstructions_OverseasProc_052626.md`, `ZohoModuleSpec_ProcurementItems_052626.md`, `ZohoVendorTracker_Procurement_052626.html`) are **on hold** — location unknown, not in this repo. Tasks 2–9 cannot meaningfully proceed without the spec file in particular.

**Net:** until the 4 source files surface, the only items below that are actionable are notional. Once the spec lands, re-evaluate.

---

## Where things stand (original — written against the test account)

Architecture decided, artifact built, project instructions rewritten, custom module spec drafted. Execution stalled because the free-tier Zoho account does not allow new custom module creation. The existing `Mechanic_Liens_Jul_2025` custom module is grandfathered from a prior paid period; any new module attempts return `INVALID_MODULE` from the live Zoho API.

**Until the tier is upgraded, nothing further moves forward.**

---

## Tasks to log to Action Items Staging Sheet (1981210199805828)

### Task 1 — Upgrade Zoho CRM subscription

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | Zoho CRM subscription upgraded to Professional tier (3 users) is completed |
| **Next Actions** | Verify current Zoho pricing at zoho.com/crm/comparison and complete upgrade purchase via Zoho admin portal |
| **Status** | Next Action |
| **Owner** | Rob Beyer |
| **Resources Required** | Zoho admin credentials; payment method; confirmation of user count (currently 3) |
| **Latest Comment** | Free tier blocks new custom modules. Pro tier (~$830–1,260/yr) recommended over Standard for custom module headroom and workflow rule enforcement. |
| **Priority** | P1 |

### Task 2 — Recreate Procurement_Items module shell

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | Empty Procurement_Items custom module shell is created in Zoho with API name confirmed as `Procurement_Items` |
| **Next Actions** | After Zoho upgrade completes, log into Zoho → Settings → Modules and Fields → Create New Module → singular label "Procurement Item", plural "Procurement Items", primary field Item_Name; complete full wizard end-to-end and click Save |
| **Status** | Waiting |
| **Owner** | Rob Beyer (or designated Zoho admin) |
| **Resources Required** | Completed Zoho upgrade (Task 1); ZohoModuleSpec_ProcurementItems_052626.md as reference |
| **Latest Comment** | Prior attempt did not persist — likely free-tier restriction. After upgrade, redo from scratch and confirm module appears in top nav before signaling Claude. |
| **Priority** | P1 |

### Task 3 — Push 19 procurement fields via Zoho MCP

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | All 19 fields and 7 picklists from ZohoModuleSpec_ProcurementItems_052626.md are deployed to Procurement_Items module via createFields API batch |
| **Next Actions** | Once Rob confirms module shell is live, run createFields batch call against Procurement_Items API; verify schema via getFields |
| **Status** | Waiting |
| **Owner** | Claude (executed via MCP) |
| **Resources Required** | Module shell live (Task 2); Zoho MCP connector re-authorized if needed |
| **Latest Comment** | Field labels shortened to comply with 25-char Zoho cap. API names retained from spec. |
| **Priority** | P1 |

### Task 4 — Configure layout, permissions, and workflow rules in Zoho

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | Procurement_Items module layout sections, permissions, and 5 optional workflow rules are configured per spec |
| **Next Actions** | After fields are deployed (Task 3), drag fields into the 5 layout sections per spec; set permissions (Admin full, Procurement team R/W, others read-only); add 3 related lists (Linked Vendors, Activities, Attachments); configure workflow rules |
| **Status** | Waiting |
| **Owner** | Rob Beyer (or designated Zoho admin) |
| **Resources Required** | Fields deployed (Task 3); ZohoModuleSpec_ProcurementItems_052626.md section "Layout sections" and "Workflow rules" |
| **Latest Comment** | Workflow rules require Professional tier — confirm tier supports before configuring. |
| **Priority** | P2 |

### Task 5 — Run test 5 procurement items

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | 5 test procurement items (PTAC9000BTU, PressureWasher4400PSI, MiniSplit23000BTU, ArcWelderAC225S, ExtensionLadder40FT) are created in Zoho Procurement_Items module with Stage=Spec and CamelCase names |
| **Next Actions** | After module layout is complete (Task 4), execute test batch of 5 items via Zoho MCP using filtered purchase report data |
| **Status** | Waiting |
| **Owner** | Claude (executed via MCP) |
| **Resources Required** | Layout complete (Task 4); filtered purchase report (200 items ≥ $100, 3 excluded as operating fees → 197 candidates) |
| **Latest Comment** | Spans Appliances/Outdoor/Hardware/Building Materials categories; hits both Home Depot and Amazon sources. Validates field mapping before batch. |
| **Priority** | P2 |

### Task 6 — Push remaining 192 procurement items

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | Remaining 192 procurement items from filtered purchase report are created in Zoho Procurement_Items module as Stage=Spec records |
| **Next Actions** | After test 5 validates clean (Task 5), batch-create remaining 192 items via Zoho MCP |
| **Status** | Waiting |
| **Owner** | Claude (executed via MCP) |
| **Resources Required** | Test 5 validated (Task 5); filtered purchase report |
| **Latest Comment** | 197 total legitimate items (excluding 3 Amazon Prime/gift card entries). Heavy in Kitchen & Bath (52), Electrical (27), Hardware & Tools (15). |
| **Priority** | P3 |

### Task 7 — Update OverseasProcSOP_RISE8 document

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | OverseasProcSOP_RISE8 operational SOP document is rewritten to reference Zoho Procurement_Items module instead of Smartsheet |
| **Next Actions** | Rewrite SOP doc replacing Smartsheet references with Zoho Procurement_Items module references; align with ProjectInstructions_OverseasProc_052626.md |
| **Status** | Next Action |
| **Owner** | Claude |
| **Resources Required** | Current OverseasProcSOP_RISE8 document; ProjectInstructions_OverseasProc_052626.md (updated 05/26) |
| **Latest Comment** | Project instructions already rewritten. SOP doc still references Smartsheet and will create drift if not updated in parallel. |
| **Priority** | P2 |

### Task 8 — Resolve fate of 6 vendor-adjacent Smartsheets

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | 6 vendor-adjacent Smartsheets are either archived, migrated to Zoho, or annotated as non-procurement |
| **Next Actions** | Audit Vendor Relationship Tracker_RISE8_051526, Overseas Vendor Tracking, Overseas Vendor Progress Report, Vendor Matrix, Vendor Masterlist, and Preferred Vendor Matrix — determine which are actively used and by which teams |
| **Status** | Clarify |
| **Owner** | Rob Beyer |
| **Resources Required** | Confirmation from Operations/Purchasing teams on which sheets are in active use for non-procurement purposes (e.g., repair preferred-vendor lookups) |
| **Latest Comment** | With Smartsheet out of procurement, these sheets create single-source-of-truth ambiguity. Either retire or rename to clarify non-procurement scope. |
| **Priority** | P3 |

### Task 9 — Repoint Zoho artifact to Procurement_Items module

| Field | Value |
|---|---|
| **Project** | Overseas Procurement — Zoho CRM System of Record |
| **Deliverables** | ZohoProcurementTracker_052626.html artifact is updated to reference Procurement_Items module instead of Deals |
| **Next Actions** | After module is live and fields are deployed (Tasks 2 + 3), rewrite artifact field mappings and API calls from Deals → Procurement_Items |
| **Status** | Waiting |
| **Owner** | Claude |
| **Resources Required** | Module + fields deployed; current artifact ZohoProcurementTracker_052626.html |
| **Latest Comment** | Current artifact wired to Deals module which is configured for tenant/lease management — would pollute tenant pipeline if used as-is. |
| **Priority** | P2 |

---

## Decision required from Rob

**Single blocker:** Approve the Zoho Professional tier upgrade (~$830–1,260/yr at 3 users). Standard tier (~$500–720/yr) is viable but caps custom modules at 1 and lacks workflow rule enforcement — both create downstream friction.

Once Rob approves and the upgrade lands, Tasks 2–6 can run in sequence within a single working session.

---

## Files produced in 5/26 session (for reference)

| File | Purpose |
|---|---|
| `ZohoProcurementTracker_052626.html` | 5-tab procurement tracker artifact (needs repoint per Task 9) |
| `ProjectInstructions_OverseasProc_052626.md` | Rewritten project instructions — Smartsheet removed from procurement |
| `ZohoModuleSpec_ProcurementItems_052626.md` | Authoritative spec for Procurement_Items module setup |
| `ZohoVendorTracker_Procurement_052626.html` | v1 vendor tracker artifact (superseded by ZohoProcurementTracker) |
