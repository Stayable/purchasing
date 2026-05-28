# Proposal — Zoho CRM Universal Architecture

**To:** Rob Beyer, CEO
**From:** Kyle Estocapio (build — Procurement & Vendor Selection) · Kate (build — Non-Profit Sales)
**Date:** 05/29/26
**Re:** Approval of the single Zoho CRM architecture across all three workflows

> **STATUS: PROPOSAL — awaiting your approval. Production is ON HOLD.**
> Nothing goes live, no real data is loaded, and no team is onboarded until you sign off. We expect changes from your review — this is written to be marked up. Full technical detail in `Zoho_Architecture.md`.

---

## 1. What we're asking you to do

1. **Approve (or redirect) the architecture** in §2 — one org, shared Accounts/Contacts, three workflows on their own home modules.
2. **Rule on the open decisions** in §6 (a few genuinely need you).
3. **Confirm the production hold** in §7 stays until you give go.

Once approved, build resumes against a frozen design. Until then we keep building only in a held state (config, not go-live).

---

## 2. The proposed model (executive summary)

One Zoho CRM org serves **Procurement**, **Non-Profit Sales**, and **Vendor / Professional Selection**. All three share two foundation tables — **Accounts** (organizations) and **Contacts** (people) — kept separate by a required **`CRM Use Case`** tag. Each workflow then uses its own home module so they never collide:

| Workflow | Home module | Builder | Daily user(s) |
|---|---|---|---|
| Procurement | `Procurement_Items` (custom) + Contact-Tracking subform | Kyle | Jefferson |
| Non-Profit Sales | `Deals` — "Non-Profit Placements" pipeline | Kate | Bea, Crystal |
| Vendor / Professional Selection | future custom module (cloned from Procurement) | Kyle | Rob (+ Kyle) |

**You own the process** for all three; Kyle and Kate build to it; Jefferson guides procurement as the end-user.

The deliberate choice throughout: **avoid module sprawl** — the failure mode that ended the previous Zoho deployment. We rejected rebuilding procurement on the standard Quotes/Products/Purchase-Orders suite for exactly this reason (detail in §6).

---

## 3. What is ALREADY BUILT / live in the CRM today

Verified against the live org on 05/29/26.

| Item | State | Detail |
|---|---|---|
| Zoho Professional, 3 seats | ✅ Live | admin@ (super admin), jefferson@, rb@rise8companies.com |
| Modules active | ✅ Live | Accounts, Contacts, Deals (standard), **Procurement_Items (custom)** |
| `Procurement_Items` module | ✅ Built | Shell + 19 custom fields + 7 picklists deployed; layout sections + permissions set. **Workflow rules still pending.** |
| `Procurement_Items` records | 🔸 2 (test) | Appear to be test entries; real 197-item load not yet run |
| Accounts | ✅ 21 records | 19 imported Alibaba vendors + 2 (incl. a "Batteries" stub flagged for cleanup) |
| Contacts | ✅ 20 records | Vendor reps imported 05/26; some placeholder last names pending |
| `Vendor_Type` field (Accounts) | ✅ Live | Picklist created at import |
| Deals | 🔸 2 (test) | Test entries; Non-Profit pipeline not yet configured |
| Vercel portal | ✅ Live | `procurement.rentstayable.com` + tracker at `/tracker` (demo mode — no live API writes yet) |
| Zoho MCP (3 servers) | ✅ Connected | Enables record/workflow automation from the build tooling |

## 4. Changes made THIS session (05/29/26)

| Change | State |
|---|---|
| `CRM Use Case` firewall field on Accounts | ✅ Created — **multi-select, required** (Procurement / Non-Profit Sales / Vendor Selection) |
| Tagged existing vendor Accounts | ✅ All **21** set to `Procurement` |
| Non-Profit tracker reconciled + renamed | ✅ `ZohoBuildTracker_NonProfitSales_Kate_052926.md`; stale cross-module assumptions corrected vs live state |
| Architecture, specs, decision log | ✅ Written/updated and committed to the repo (audit trail) |

---

## 5. What is PROPOSED / pending your approval (not yet built)

| # | Item | Workflow | Owner |
|---|---|---|---|
| P1 | **Contact-Tracking subform** on Procurement_Items (multi-vendor bidding: stage → RFQ → quote → award) | Procurement | Kyle |
| P2 | `PO_Number` + `PO_Status` fields; PO docs via Jefferson's template (attach PDF) | Procurement | Kyle |
| P3 | 5 workflow rules on Procurement_Items (stage gates, stuck-item alerts) | Procurement | Kyle |
| P4 | Real procurement data load (197 historical items) | Procurement | Kyle |
| P5 | **Non-Profit Sales** build — Deals pipeline, partner/case-worker layouts, 48 partner Accounts + 11 Contacts import | Non-Profit | Kate |
| P6 | Vendor / Professional Selection module (cloned from Procurement, later) | Vendor Sel. | Kyle |
| P7 | Phase-2 seats for Bea + Crystal; email integration | Non-Profit | Kyle |

---

## 6. Open decisions that need you

1. **Procurement bidding design.** We propose tracking 3+ vendor bids as a **subform on the item** (item-centric), *not* on the standard Deals/Quotes/Products/PO suite. Trade-off: the subform can't send **automated per-vendor follow-up reminders** (a "Stale >14 days" report is the manual substitute). Accept the subform, or fund the heavier child-module path to get automated nudges?
2. **PO in Zoho.** We propose PO *numbers* tracked as fields + actual PO *documents* generated from Jefferson's Word template and attached — **no native PO module**. Confirm this matches how you want POs handled.
3. **Vendor / Professional Selection timing.** Build later by cloning the proven Procurement pattern (recommended), or stand it up in parallel now?
4. **Security: 2FA.** Enabling 2FA on `admin@` and Jefferson's account has been **on hold per you since 05/20**. A super-admin without 2FA is a single point of failure. Re-open before we add seats / go live?
5. **Phase-2 trigger.** What signals readiness to add Bea + Crystal — a fixed date, or Jefferson logging procurement daily for 2 weeks first?

---

## 7. Production hold — what is frozen

Until you approve:
- **No go-live / no team onboarding** (Bea, Crystal not added; Jefferson not asked to work live).
- **No real data load** — the 197 procurement items and the 48 non-profit partners stay out.
- **No live tracker writes** — the portal stays in demo mode.
- Build continues only as **held configuration** (modules, fields, layouts) that can still be changed cheaply before data lands.

What is **already live and low-risk to leave as-is:** the Procurement_Items module shell, the `CRM Use Case` tagging of existing vendors, and the static portal. None of these commit us to a direction you can't redirect.

---

## 8. For full detail

`Zoho_Architecture.md` (the technical map) · `ZohoCRM_Rollout_052126.md` (decision log / audit trail) · per-workflow specs listed there.

---

*Prepared for CEO review. Mark up directly or return comments; Kyle + Kate will revise and resubmit before any production step.*
