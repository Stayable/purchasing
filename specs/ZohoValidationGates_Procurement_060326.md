# Zoho Validation-Rule Gates — Procurement_Items SOP gates

**For:** Kyle (builder, Zoho super-admin) · **Date:** 060326 · **Status:** SCAFFOLD — ready to build in Zoho UI. Held-state config build is in-bounds.
**Implements:** Task 10a · `docs/ZohoBuildWalkthrough_Procurement_060326.md` §5 (Validation Rules) + `specs/ZohoModuleSpec_Quotes_060226.md`.
**Pairs with:** `specs/ZohoAwardWorkflow_Procurement_060326.md` (gate #3 below depends on the award stamp populating `Awarded_Vendor`).

---

## What these enforce

Three **Validation Rules** on `Procurement_Items` that block a `Stage` advance until its SOP precondition is met. In Zoho, "block save with an error" = a **Validation Rule**, *not* a workflow rule. These are **manual Zoho UI** (no MCP op creates validation rules) — this doc is the build-spec + exact values.

| # | Block advancing `Stage` to | Unless | Field type |
|---|---|---|---|
| 1 | **Bid** | `Spec_Sheet_Status` = `COO Signed Off` | picklist |
| 2 | **Recommend** | `Florida_Validation_Status` = `Passed` | picklist |
| 3 | **Approved** | `Awarded_Vendor` is **not empty** | lookup → Vendor_Quotes |

Gate #3 is the approve-path gate: an item cannot reach `Approved` until a quote has been awarded (which the award workflow stamps into `Awarded_Vendor`).

---

## Verified deployed values (06/03/26, live org via MCP)

- `Procurement_Items.Stage` (picklist): `-None-`, **Spec, Bid, Level, FL-Validate, Recommend, Submitted, Approved, Approved-with-Conditions, Declined, Need-More-Info**
- `Procurement_Items.Spec_Sheet_Status` (picklist): `-None-`, Not Started, In Progress, **COO Signed Off**
- `Procurement_Items.Florida_Validation_Status` (picklist): `-None-`, Not Yet Reviewed, **Option 2**, **Passed**, Failed, Needs Spec Revision
- `Procurement_Items.Awarded_Vendor` (lookup → `Vendor_Quotes`)

> ⚠️ **Data-quality flag — `Florida_Validation_Status` has a stray value `Option 2`.** Almost certainly a leftover Zoho default never renamed/removed. It is **not** referenced by any SOP and I have not invented a meaning for it. **Recommend Kyle delete `Option 2`** from the picklist while building these gates (Settings → Procurement_Items → Florida_Validation_Status → remove value). Not a blocker for the gates, but it will confuse Jefferson if left.

---

## Build — Settings → Modules and Fields → Procurement Items → Validation Rules → + New Rule

Zoho validation rules fire on save: pick the field whose value triggers evaluation, set the criteria that defines an **invalid** save, and write the blocking error message. Build all three in one sitting.

### Rule 1 — Spec sign-off gate
- **Validate field:** `Stage`
- **Trigger:** when `Stage` is `Bid` (and later stages, optionally — see note)
- **Criteria (invalid when):** `Stage` is `Bid` **AND** `Spec_Sheet_Status` is **not** `COO Signed Off`
- **Error message (on `Stage`):** `Cannot advance to Bid — Spec Sheet Status must be "COO Signed Off" first.`

### Rule 2 — Florida validation gate
- **Validate field:** `Stage`
- **Criteria (invalid when):** `Stage` is `Recommend` **AND** `Florida_Validation_Status` is **not** `Passed`
- **Error message:** `Cannot advance to Recommend — Florida Validation Status must be "Passed" first.`

### Rule 3 — Award gate (approve path)
- **Validate field:** `Stage`
- **Criteria (invalid when):** `Stage` is `Approved` **AND** `Awarded_Vendor` **is empty**
- **Error message:** `Cannot advance to Approved — award a Vendor Quote first (Awarded_Vendor is empty).`

**Save and confirm all three are active.**

### Notes / decisions
- **Forward-only vs. exact-match:** the criteria above gate the *exact* target stage. The SOP is linear (Spec→Bid→Level→FL-Validate→Recommend→Submitted→Approved), so exact-match is sufficient and avoids false blocks when editing a record already past the gate. If you'd rather enforce "must have passed the gate to be at or beyond this stage," widen the criteria to `Stage in {Bid, Level, FL-Validate, Recommend, Submitted, Approved, ...}` — but that risks blocking edits to legitimately-advanced records; **recommend exact-match** as written.
- **`Submitted` stage:** the approval-queue portal keys on `Stage = Submitted` (Rob's review queue). Gate #3 fires at `Approved`, i.e., *after* Rob acts. No gate is placed on entering `Submitted` (an item can be submitted for review before award only if you want that; current SOP awards before submit — leave ungated unless Rob asks).
- **`Approved-with-Conditions`:** gate #3 covers `Approved` only. If Rob uses `Approved-with-Conditions`, add it to Rule 3's criteria (`Stage in {Approved, Approved-with-Conditions}`) so a conditional approval also requires an award. **Recommend including it** — confirm with Rob.

---

## Test (held-state, on the existing `_DELETE` test item)

Re-uses the 06/02 test item + 3 quotes already in the org. No real data.

| # | Action | Expected |
|---|---|---|
| 1 | Test item at `Spec`, `Spec_Sheet_Status` ≠ COO Signed Off → set `Stage = Bid`, save | **Blocked** with Rule 1 message |
| 2 | Set `Spec_Sheet_Status = COO Signed Off` → `Stage = Bid`, save | Saves |
| 3 | Advance to `Level`, then `Stage = Recommend` with `Florida_Validation_Status` ≠ Passed | **Blocked** with Rule 2 message |
| 4 | Set `Florida_Validation_Status = Passed` → `Stage = Recommend`, save | Saves |
| 5 | `Stage = Approved` with `Awarded_Vendor` empty | **Blocked** with Rule 3 message |
| 6 | Award a quote (award workflow stamps `Awarded_Vendor`) → `Stage = Approved`, save | Saves |

**Pass:** each gate blocks with its message and clears once its precondition is met. Then delete/clearly-mark the `_DELETE` test records before any real load.

---

## Out of scope here
- Award stamp itself → `specs/ZohoAwardWorkflow_Procurement_060326.md` (10b).
- Stale-bid follow-up timer (**threshold = 7 days, set by Kyle 06/05/26**) — a time-based **workflow** rule, not a validation rule.
- Spend-tier Approver auto-suggest — a separate workflow/field-update, not a gate.
