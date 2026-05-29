# Build Plan — Kyle Estocapio (Procurement + Vendor Selection + Architecture)
**RISE8 Companies / Stayable · Zoho CRM rollout**
Owner: Kyle Estocapio (`bke@rise8companies.com`) · Approver: Rob Beyer
Prepared: 05/29/26 · Last Updated: 2026-05-29

> 🟡 **Production is ON HOLD** pending Rob's approval of `Zoho_Architecture.md`. This plan is **what to build while waiting** — held configuration only. No go-live, no real data load, no live tracker writes until Rob lifts the hold (§14).

---

## Possibility-of-change legend

| Mark | Meaning | Build rule |
|---|---|---|
| 🟢 **Stable** | Architecture-locked. Near-zero rework risk regardless of Rob's ruling. | Build now. |
| 🟡 **Minor-change risk** | Design decided; could get small tweaks. | Build now, accept minor rework. |
| 🔴 **Change-prone** | Depends on a Rob §13 decision or a forked design. | Build spec/shell only — do **not** deploy deep. |
| ⛔ **Frozen by hold** | Real data, go-live, live writes, onboarding. | Do not start until Rob lifts hold. |

**What unblocks the 🔴 items:** Rob's rulings in `Zoho_Architecture.md` §13.

---

## Phase A — Procurement_Items hardening *(held config)*

| Task | Mark | Notes |
|---|---|---|
| Module shell + 19 custom fields + 7 picklists | 🟢 | ✅ Already live (verified 05/29). |
| Layout sections + permissions | 🟢 | ✅ Already set. |
| Account hygiene — resolve the "Batteries" stub; fill placeholder Contact last names (20 Contacts) | 🟢 | Data cleanup on existing live records; not a data load. Coordinate before editing shared Accounts. |
| `CRM Use Case` firewall confirmed on all 21 vendor Accounts | 🟢 | ✅ Done — multi-select, required, all tagged `Procurement`. |

---

## Phase B — Multi-vendor bidding *(CHANGE-PRONE — Rob §13 #1)*

| Task | Mark | Notes |
|---|---|---|
| Contact_Tracking subform (P1) on Procurement_Items | 🔴 | **Highest rework risk in the project.** Forked: item-centric subform vs. heavier child-module (for automated per-vendor nudges). **Refine the spec only** (`specs/ZohoModuleSpec_ContactTrackingSubform_052926.md`); do not deploy the live subform until Rob rules. |
| Sketch the child-module fallback design | 🔴 | So either ruling can move fast. Spec, not build. |

---

## Phase C — PO handling *(minor-change risk — Rob §13 #2 confirm)*

| Task | Mark | Notes |
|---|---|---|
| `PO_Number` + `PO_Status` fields (P2) | ✅🟡 | **Built & verified live 05/29** (held config). `PO_Status` 7-value picklist. Approach still pending Rob §13 #2 confirm; cosmetic relabel of `PO_Number` label pending. |
| Wire PO doc flow to Jefferson's Excel template | 🟡 | Template sample: `reference/FSCP Linen Default PO for Properties NP 3.xlsx`. Jefferson generates PO → attach PDF to the item. |

---

## Phase D — Workflow rules (P3) *(held config, sandbox)*

| Task | Mark | Notes |
|---|---|---|
| Stage-gate rules on the 10-stage pipeline | 🟡 | Pipeline (Spec→Bid→Level→FL-Validate→Recommend→Submitted→Approved/…) is locked, so these are stable. Build/test in sandbox. |
| "Stuck-item / stale-bid >14 days" alert | 🔴 | Tied to the bidding mechanism (Phase B). Hold until §13 #1 lands. |

---

## Phase E — Real procurement data load (P4) *(frozen)*

| Task | Mark | Notes |
|---|---|---|
| Load 197 historical items | ⛔ | Frozen by production hold §14. Stage the file with Jefferson (his plan); do not import. |

---

## Phase F — Vendor / Professional Selection (P6) *(deferred — Rob §13 #3)*

| Task | Mark | Notes |
|---|---|---|
| Future custom module cloned from Procurement | 🔴 | Deferred by design — build after the Contact-Tracking pattern is proven. Keep the clone plan; do not start. |

---

## Phase G — Procurement portal & tracker

| Task | Mark | Notes |
|---|---|---|
| Refine `/tracker` UI against Procurement_Items (demo mode) | 🟢 | Portal + tracker live on Vercel; demo mode renders prompts but does not write. UI work is safe. |
| Live tracker writes to Zoho | ⛔ | Frozen; stays demo mode until hold lifts **and** Phase 0.5 webapp decision lands (gated to 06/21/26). |
| Interactive webapp (Option B) | 🔴 | Deferred to 06/21/26 Phase-1 checkpoint; default stays static. |

---

## Cross-cutting flags

- **2FA (Rob §13 #4):** Enabling 2FA on `admin@` + Jefferson on hold per Rob since 05/20. Super-admin without 2FA is a single point of failure — re-open before seats/go-live. *Decision, not build.*
- **Sandbox-first:** Test workflow rules in a Zoho sandbox before any production config.
- **Keep in sync:** Any architectural change → update `Zoho_Architecture.md` **and** the decision log in `docs/ZohoCRM_Rollout_052126.md` with date + reasoning, and route to Rob.

---

## Do-now shortlist (no Rob needed)
1. Phase A account/contact hygiene. 🟢
2. Refine Contact_Tracking spec + child-module fallback sketch (paper only). 🔴-spec
3. ~~Add `PO_Number`/`PO_Status` fields as held config.~~ ✅ Done 05/29.
4. Build stage-gate workflow rules in sandbox. 🟡
5. Polish the `/tracker` UI in demo mode. 🟢
