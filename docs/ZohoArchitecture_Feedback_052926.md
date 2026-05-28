# Zoho CRM Architecture — Feedback & Suggestions (R&D intake)

**Purpose:** One place to collect every suggested edit or modification to the **proposed** Zoho architecture *before* Kyle & Kate build it in the CRM. Nothing gets built until feedback here is consolidated, the builders respond, and Rob signs off on anything that changes the design.

**Reviewing:** `Zoho_Architecture.md` (the proposal + map) · visual: `reference/ZohoArchitecture_VisualGuide_052926.png`
**Status:** OPEN for input · **Production is on hold** until consolidation closes.
**Owners:** Kyle (Procurement + Vendor Selection) · Kate (Non-Profit) · **Approver:** Rob

---

## How to give feedback (please don't edit `Zoho_Architecture.md` directly)

Add a row to the table below. One suggestion per row. Keep it specific — name the section and what you'd change.

- **Workflow:** Procurement · Non-Profit · Vendor Selection · Shared (Accounts/Contacts/firewall) · Front-end
- **Section:** the §number or heading in `Zoho_Architecture.md`
- **Status** is filled in by the builders, not you.

| # | Date | From | Workflow | Section | Suggestion / change | Why | Builder response | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | Open |
| 2 | | | | | | | | Open |
| 3 | | | | | | | | Open |
| 4 | | | | | | | | Open |
| 5 | | | | | | | | Open |

*(Add rows as needed.)*

Status values: **Open** · **Accepted** (will build) · **Rejected** (with reason) · **Needs Rob** (decision) · **Deferred** (post-v1).

---

## Open decisions already on the table (weigh in if you have a view)

These come from `Zoho_Architecture.md` §13 and need a call before/at build:

1. **Procurement bidding** — vendor bids as a **subform on the item** (chosen) vs. a separate child module. Subform can't send automated per-vendor follow-up reminders (a "Stale >14 days" report is the manual substitute). Acceptable?
2. **PO in Zoho** — PO *numbers* tracked as fields + PO *documents* from Jefferson's Word template (attach PDF); no native PO module. OK?
3. **Vendor / Professional Selection timing** — build later by cloning Procurement (recommended) vs. in parallel now.
4. **Security: 2FA** — re-open the on-hold 2FA on `admin@` + Jefferson before go-live?
5. **Phase-2 trigger** — what signals readiness to add Bea + Crystal.

---

## Consolidation & build gate

1. R&D adds suggestions above.
2. Kyle + Kate review each, fill **Builder response** + **Status**.
3. Items marked **Needs Rob** route to Rob for a decision.
4. Accepted changes are folded into `Zoho_Architecture.md` and the affected spec; logged in `ZohoCRM_Rollout_052126.md`.
5. Rob lifts the production hold → **then** build in CRM.

> If Rob reviews in Claude Desktop, the architecture file's §15 instruction has Claude emit a `ZohoArchitectureDecision_RISE8_<MMDDYY>.md` back to Kyle — that decision file + this feedback file together are the build input.
