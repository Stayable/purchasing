# Workflow & Validation Rules Spec — Procurement_Items
**RISE8 Companies / Stayable · Zoho CRM**
Owner: Kyle Estocapio · Approver: Rob Beyer
Prepared: 05/30/26 · Last Updated: 2026-05-30

> Build checklist for the 5 SOP rules in `specs/ZohoModuleSpec_ProcurementItems_052626.md`. **Key finding: only 2 of the 5 are "workflow rules" — 3 are validation rules** (block-save), which have **no MCP creation path** (manual in Settings, like field creation). The module spec also gates all five: *"Add after the module is live and the test batch validates clean"* → deployment waits for the production hold to lift. This doc pins the exact config so build is fast when unblocked.

**Field api_names** (verified live on Procurement_Items, 05/29): `Stage` · `Spec_Sheet_Status` · `Florida_Validation_Status` · `Winning_Vendor` (lookup) · `Estimated_Item_Level_Spend` (currency) · `Approver` (picklist) · `Owner` (ownerlookup).

⚠️ **Verify before building:** exact picklist option strings — `Stage` values (canonical 10: Spec / Bid / Level / FL-Validate / Recommend / Submitted / Approved / Approved-with-Conditions / Declined / Need-More-Info), `Spec_Sheet_Status` = "COO Signed Off", `Florida_Validation_Status` = "Passed". Match case exactly or criteria silently fail.

---

## R1 — Spec-sheet gate (VALIDATION RULE)
- **Object:** Validation Rule (blocks save). **Not** a workflow rule.
- **Fires:** on save when `Stage` = `Bid`.
- **Block when:** `Spec_Sheet_Status` ≠ `COO Signed Off`.
- **Error text:** "Spec sheet must be COO signed off before advancing to Bid."
- **Build path:** 🔧 Manual — Settings → Modules & Fields → Procurement_Items → Validation Rules. **No MCP path.**
- **Prereqs:** confirm `Spec_Sheet_Status` option "COO Signed Off" exists.
- **Status:** 🔴 gated by hold (spec: after test batch validates).

## R2 — Florida-validation gate (VALIDATION RULE)
- **Object:** Validation Rule.
- **Fires:** on save when `Stage` = `Recommend`.
- **Block when:** `Florida_Validation_Status` ≠ `Passed`.
- **Error text:** "Florida validation must pass before advancing to Recommend."
- **Build path:** 🔧 Manual (Settings). No MCP path.
- **Prereqs:** confirm `Florida_Validation_Status` option "Passed" exists.
- **Status:** 🔴 gated by hold.

## R3 — Winning-vendor gate (VALIDATION RULE)
- **Object:** Validation Rule.
- **Fires:** on save when `Stage` = `Approved`.
- **Block when:** `Winning_Vendor` is empty.
- **Error text:** "Winning vendor required before approval."
- **Build path:** 🔧 Manual (Settings). No MCP path.
- **Status:** 🔴 gated by hold.

## R4 — Stuck-at-Bid alert (WORKFLOW RULE)
- **Object:** Workflow Rule, **time/date-based** trigger + email notification.
- **Intent:** when an item sits in `Stage` = `Bid` for >14 days, email `Owner` + COO.
- **Design (Zoho can't natively time "days in current stage"):**
  1. **New field** `Bid_Entered_Date` (Date) — *prerequisite, doesn't exist.*
  2. Workflow A: trigger `field_update` on `Stage` = `Bid` → field-update sets `Bid_Entered_Date` = today.
  3. Workflow B: `date_or_datetime` trigger, `Bid_Entered_Date` + 14 days → **email notification** to `Owner` + COO, with re-check criteria `Stage` still = `Bid`.
- **Build path:** Workflows A/B via MCP `postWorkflowRule` ✅; **email notification must be pre-created** (`postEmailNotifications`) and referenced by id; **`Bid_Entered_Date` field = manual** (no MCP).
- **Status:** 🔴 **Blocked on Rob §13 #1** — this is the "stale-bid >14d" alert tied to the bidding-design decision (tracker P6). Don't build until ruling. Also the manual substitute is a saved "Stale >14 days" report view if Rob declines the automated path.

## R5 — Spend-tier approver suggestion (WORKFLOW RULE)
- **Object:** Workflow Rule, `field_update` trigger on `Estimated_Item_Level_Spend`.
- **Intent:** suggest `Approver` by spend tier; **manual confirm** (don't hard-set).
- **Blocker:** spend tiers exist only as a **placeholder** in `ProjectInstructions_OverseasProc_052626.md` §Approval routing, explicitly marked *"confirm against current DOA matrix"*: **<$25K → COO** · **$25K–$100K → CEO (Rob) + physical sample** · **>$100K → CEO + Investment Committee + sample + pre-production inspection**. Candidate values are known, but Rob must **confirm them against the DOA matrix** before they're hard-coded into automation. (The live tracker now labels these as placeholder, 05/30.)
- **Design once tiers exist:** either (a) field-update conditions setting a **new `Suggested_Approver` field** (prereq, doesn't exist) per tier, leaving `Approver` for Jefferson to confirm; or (b) a notification "Spend = $X → suggested approver: Y."
- **Build path:** MCP `postWorkflowRule` (field_update trigger + field_updates action) once tiers + `Suggested_Approver` field exist.
- **Status:** 🔴 Blocked — needs spend-tier definition (tracker P7); `Suggested_Approver` field manual.

---

## Summary
| Rule | Object | MCP-buildable? | Blocker | Tracker |
|---|---|---|---|---|
| R1 spec-sheet gate | Validation | ❌ manual | hold | P9 |
| R2 FL-validation gate | Validation | ❌ manual | hold | P9 |
| R3 winning-vendor gate | Validation | ❌ manual | hold | P9 |
| R4 stuck-at-Bid alert | Workflow (date) | ⚠️ partial (needs field + email notif) | Rob §13 #1 | P6 |
| R5 spend-tier approver | Workflow (field_update) | ⚠️ partial (needs field) | placeholder tiers pending Rob DOA confirm | P7 |

**Net:** nothing here deploys today. R1–R3 wait on the hold and are manual Settings work. R4 waits on Rob's bidding ruling. R5 waits on Rob confirming the placeholder spend tiers against the DOA matrix. **Two prerequisite fields** (`Bid_Entered_Date`, `Suggested_Approver`) and **one email notification** must be created before R4/R5 — surface the spend tiers to Rob as a Jefferson-informed recommendation.
