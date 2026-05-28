# Zoho CRM — Universal Architecture & Proposal (RISE8 Companies / Stayable)

**To:** Rob Beyer, CEO · **From:** Kyle Estocapio (build — Procurement & Vendor Selection) · Kate (build — Non-Profit Sales) · **Date:** 05/29/26

> 🟡 **STATUS: PROPOSAL — awaiting Rob's approval. Production is ON HOLD.**
> This single file is everything Rob needs: the architecture, what's already built, what's proposed, and the decisions we need. It may change after review — it's written to be marked up. No go-live, no real data load, no team onboarding until sign-off.

**Builders:** Kyle (Procurement + Vendor/Professional Selection) & Kate (Non-Profit Sales) · **Process owner / Approver:** Rob Beyer (CEO) · **Procurement SME:** Jefferson Gomez (Procurement only)

---

## 1. What we're asking you to do

1. **Approve (or redirect) the architecture** in §3–§7 — one org, shared Accounts/Contacts, three workflows on their own home modules.
2. **Rule on the open decisions** in §12 (a few genuinely need you).
3. **Confirm the production hold** in §13 stays until you give go.

Once approved, build resumes against a frozen design. Until then we build only in a held state (config, not go-live).

---

## 2. The model (one paragraph)

One Zoho CRM org (Professional tier) serves **three workflows** — Procurement, Non-Profit Sales, and Vendor/Professional Selection. They **share two foundation modules** (Accounts = organizations, Contacts = people) and are kept apart by a required **`CRM Use Case`** tag on every Account. Each workflow then uses its own home module: Procurement → custom `Procurement_Items`; Non-Profit Sales → standard `Deals`; Vendor Selection → a future custom module cloned from Procurement. No module sprawl — that is what ended the previous deployment. **You own the process** for all three; Kyle and Kate build to it; Jefferson guides procurement as the end-user.

---

## 3. Who owns what

Two **builders** (Kyle + Kate) stand up the system. **Rob** designs and optimizes the processes they build to. **Jefferson** guides the procurement build and is its end-user. **Bea + Crystal** are the Non-Profit end-users.

| Person | Role | Responsibility | Decision authority |
|---|---|---|---|
| **Rob Beyer** | CEO — **Process owner** | Creates & optimizes the processes across **all three** workflows (Kyle + Kate build to his process) | **Approves** all procurement decisions (vendor selection, PO, spend) and any architectural shift |
| **Kyle Estocapio** | **Builder** + super-admin | Builds **Procurement** and **Vendor / Professional Selection**; owns overall architecture | Executes; routes architecture/process changes to Rob |
| **Kate** | **Builder** | Builds **Non-Profit Sales** (Deals / Non-Profit Placements) | Owns the non-profit module design; routes process to Rob |
| **Jefferson Gomez** | Purchasing Manager — **SME / end-user (Procurement only)** | Guides the **procurement** process & build only (he will use it daily); recommends vendors to Rob. Not involved in Non-Profit or Vendor Selection. | Advises; procurement decisions go to Rob |
| **Bea** | Non-Profit **end-user** (North FL) | Uses Non-Profit Deals — north FL properties | Operates her pipeline |
| **Crystal** | Non-Profit **end-user** (Central FL) | Uses Non-Profit Deals — central FL properties | Operates her pipeline |

> **Builders:** Kyle + Kate. **Process:** Rob (with Jefferson's guidance on procurement). **Users:** Jefferson (procurement), Bea + Crystal (non-profit). Procurement *decisions* always route to **Rob** before action.

---

## 4. Shared foundation (all three workflows)

### Modules everyone shares
| Module | Means | Examples |
|---|---|---|
| **Accounts** | The organization | Foshan Furniture Co. (vendor); Salvation Army (non-profit partner); Berger Singerman LLP (counsel) |
| **Contacts** | The person at an Account | A vendor sales rep; a non-profit case worker; an attorney |

### The firewall: `CRM Use Case` (required, multi-select, on Accounts)
Every Account is tagged with one or more of: **`Procurement`** · **`Non-Profit Sales`** · **`Vendor Selection`**. This keeps vendors, partners, and counterparties from colliding in the shared tables. Required on creation. *(Live as of 05/29/26; all 21 existing vendor Accounts tagged `Procurement`.)*

**Account page layouts** split by use case — a **Vendor layout** (Procurement) and a **Non-Profit Partner layout** (Kate), keyed off `CRM Use Case`, so neither team sees the other's fields.

### Conversations
All emails / calls / notes log as **Activities on the home-module record** (the Procurement Item, the Deal, etc.) — one timeline per item/deal, regardless of how many contacts are involved.

---

## 5. The three workflows

### 5.1 Procurement (overseas + domestic sourcing) — *Build: Kyle · Uses: Jefferson · Process: Rob*
- **Home module:** `Procurement_Items` (custom). The **item** is the center of gravity. Single pipeline "Overseas Procurement", 10-stage flow: Spec → Bid → Level → FL-Validate → Recommend → Submitted → Approved / Approved-with-Conditions / Declined / Need-More-Info.
- **Vendors:** Accounts tagged `Procurement`.
- **Multi-vendor bidding:** a **`Contact_Tracking` subform** on each item — every vendor/contact in a row (staging → RFQ → quote → negotiate → award/lost), with optional Contact lookup + fallback text for trade-show reps. Bid comparison and award happen here.
- **PO:** `PO_Number` + `PO_Status` fields track PO numbers across channels (Alibaba confirmation, Amazon/Home Depot numbers); for office-supplies/linen, Jefferson generates the PO from his Word template and attaches the PDF. No native PO/Quotes/Products modules.
- **Decision:** recorded in `Decision_Notes` on the item — never in email.
- **Specs:** `ZohoModuleSpec_ProcurementItems_052626.md` · `ZohoModuleSpec_ContactTrackingSubform_052926.md` · process reference `ZohoProcurementProcessGuide_RISE8_052926.md` (process adopted, module mapping redirected).

### 5.2 Non-Profit Sales (extended-stay group placements) — *Build: Kate · Uses: Bea, Crystal · Process: Rob*
- **Home module:** standard `Deals`, pipeline **"Non-Profit Placements"**: Referred → Qualified → Funded → Pre Move-in → Active Stay → Renewed / Departed / Declined.
- **Partners:** Accounts tagged `Non-Profit Sales`. **Case workers:** Contacts.
- **Deal = one placement** (a tenant/household into a property under a funding program). Bea = north FL, Crystal = central FL; each deal tagged with the serving Stayable property.
- **Spec:** `ZohoBuildTracker_NonProfitSales_Kate_052926.md` (Kate-owned).

### 5.3 Vendor / Professional Selection (mini-RFPs) — *Build: Kyle · Process: Rob (later)*
- **Home module:** a future custom module **cloned from the Procurement pattern**. Counterparties = Accounts tagged `Vendor Selection`.
- **Flow:** Sent inquiry → Replied → Scored → Shortlisted → Interviewed → Selected → Engaged. Losers stay as Accounts for future reference.
- **Status:** deferred — build after the Procurement Contact-Tracking pattern is proven, then clone.

---

## 6. Module enablement (anti-sprawl)

| Module | State | Why |
|---|---|---|
| Accounts, Contacts | **On** | Shared foundation |
| Procurement_Items (custom) | **On** | Procurement home |
| Deals | **On** | Non-Profit home (and future tenant/lease) |
| Vendor_Selection (custom) | Planned | Track 3, cloned later |
| Leads | On (Phase 2) | Cold non-profits before qualification |
| Tasks / Notes / Calls / Meetings | On | Activities on any record |
| Quotes, Invoices, native Vendors, Price Books, Sales Orders, **Purchase Orders**, Campaigns, Visits | **Off** | The inventory-suite sprawl that killed v1. PO handled by fields + attached PDF, not the PO module. |
| Products | Off for v1 | Not needed until multi-line bids are real |

---

## 7. Front-end & hosting (procurement portal)

Today the only custom front-end is for **Procurement**. Non-Profit and Vendor Selection use the **native Zoho UI** — no separate app.

| Layer | What | State |
|---|---|---|
| **Portal** | `procurement.rentstayable.com` — static branded landing (Tracker · Zoho · Docs links), internal-only, `noindex` | ✅ Live (Vercel) |
| **Procurement Tracker** | `/tracker` — HTML tracker pointed at the `Procurement_Items` module | 🔸 Live in **DEMO MODE** — renders the action/prompt but **does not write to Zoho** yet |
| **Hosting** | Vercel, linked to `github.com/Stayable/purchasing` `main`; static, no build step; SSL via Vercel | ✅ Live |

**Interactive webapp (Option B) — deferred** to the **06/21/26 Phase-1 checkpoint**, anchored in real Jefferson workflow data. Default is to stay on the static portal unless three trigger conditions are met (criteria in `ZohoCRM_Todo_052126.md` → "Phase 0.5 — Webapp Decision"). The tracker stays in demo mode until Rob lifts the production hold **and** the Phase 0.5 decision lands.

---

## 8. Email

| Mailbox | How | Burns a seat? |
|---|---|---|
| `admin@rentstayable.com` | Super-admin login only (institutional) | N/A |
| `jefferson@rentstayable.com` | Personal IMAP/OAuth | Yes |
| `purchasing@rentstayable.com` | Organization Email (shared, outbound) + M365 forward → Jefferson | No |
| Bea / Crystal mailboxes | Personal IMAP/OAuth (Phase 2) | Yes |
| `nonprofits@rentstayable.com` (proposed) | Organization Email (Phase 2) | No |

Shared mailboxes never burn a license — they're inboxes, not people.

---

## 9. Conventions everyone follows

- **File naming:** `DocType_Identifier_MMDDYY.ext`. Identifier = property ID for property files, the `Item_Name` for procurement files, or the entity/matter name otherwise. No spaces.
- **Procurement Item_Name:** CamelCase, no spaces (`QueenMattress`), and must match its SharePoint folder verbatim.
- **Decisions live in the record** (`Decision_Notes` / Deal notes), never only in email.
- **Two docs stay in sync** when anything changes: this file, and the Rollout decision log (`ZohoCRM_Rollout_052126.md`).
- **Architectural change?** Update the decision log with date + reasoning, and route to **Rob** before acting.

---

## 10. What is ALREADY BUILT / live in the CRM today

Verified against the live org on 05/29/26.

| Item | State | Detail |
|---|---|---|
| Zoho Professional, 3 seats | ✅ Live | admin@ (super admin), jefferson@, rb@rise8companies.com |
| Modules active | ✅ Live | Accounts, Contacts, Deals (standard), **Procurement_Items (custom)** |
| `Procurement_Items` module | ✅ Built | Shell + 19 custom fields + 7 picklists; layout sections + permissions set. **Workflow rules pending.** |
| `Procurement_Items` records | 🔸 2 (test) | Real 197-item load not yet run |
| Accounts | ✅ 21 records | 19 imported Alibaba vendors + 2 (incl. a "Batteries" stub flagged for cleanup) |
| Contacts | ✅ 20 records | Vendor reps imported 05/26; some placeholder last names pending |
| `Vendor_Type` field (Accounts) | ✅ Live | Picklist created at import |
| `CRM Use Case` field (Accounts) | ✅ Live | Multi-select, required; all 21 Accounts tagged `Procurement` |
| Deals | 🔸 2 (test) | Non-Profit pipeline not yet configured |
| Vercel portal + `/tracker` | ✅ Live | `procurement.rentstayable.com` (tracker in demo mode — no live API writes) |
| Zoho MCP (3 servers) | ✅ Connected | Enables record/workflow automation from build tooling |

## 11. Changes made this session (05/29/26)

| Change | State |
|---|---|
| `CRM Use Case` firewall field on Accounts | ✅ Created — multi-select, required |
| Tagged existing vendor Accounts | ✅ All **21** set to `Procurement` |
| Non-Profit tracker reconciled + renamed | ✅ `ZohoBuildTracker_NonProfitSales_Kate_052926.md` |
| Architecture, specs, decision log | ✅ Written/updated, committed (audit trail) |

---

## 12. What is PROPOSED / pending your approval (not yet built)

| # | Item | Workflow | Owner |
|---|---|---|---|
| P1 | **Contact-Tracking subform** on Procurement_Items (multi-vendor bidding) | Procurement | Kyle |
| P2 | `PO_Number` + `PO_Status` fields; PO docs via Jefferson's template (attach PDF) | Procurement | Kyle |
| P3 | 5 workflow rules on Procurement_Items (stage gates, stuck-item alerts) | Procurement | Kyle |
| P4 | Real procurement data load (197 historical items) | Procurement | Kyle |
| P5 | **Non-Profit Sales** build — Deals pipeline, layouts, 48 partner Accounts + 11 Contacts import | Non-Profit | Kate |
| P6 | Vendor / Professional Selection module (cloned from Procurement, later) | Vendor Sel. | Kyle |
| P7 | Phase-2 seats for Bea + Crystal; email integration | Non-Profit | Kyle |

---

## 13. Open decisions that need you

1. **Procurement bidding design.** Track 3+ vendor bids as a **subform on the item** (item-centric), *not* the standard Deals/Quotes/Products/PO suite. Trade-off: the subform can't send **automated per-vendor follow-up reminders** (a "Stale >14 days" report is the manual substitute). Accept the subform, or fund the heavier child-module path for automated nudges?
2. **PO in Zoho.** PO *numbers* tracked as fields + actual PO *documents* from Jefferson's Word template, attached — **no native PO module**. Confirm.
3. **Vendor / Professional Selection timing.** Build later by cloning Procurement (recommended), or in parallel now?
4. **Security: 2FA.** Enabling 2FA on `admin@` and Jefferson's account has been **on hold per you since 05/20**. Super-admin without 2FA is a single point of failure. Re-open before seats / go-live?
5. **Phase-2 trigger.** What signals readiness to add Bea + Crystal — a fixed date, or Jefferson logging procurement daily for 2 weeks first?

---

## 14. Production hold — what is frozen

Until you approve:
- **No go-live / no team onboarding** (Bea, Crystal not added; Jefferson not asked to work live).
- **No real data load** — the 197 procurement items and the 48 non-profit partners stay out.
- **No live tracker writes** — the portal stays in demo mode.
- Build continues only as **held configuration** (modules, fields, layouts) that can still be changed cheaply before data lands.

**Already live and low-risk to leave as-is:** the Procurement_Items module shell, the `CRM Use Case` tagging of existing vendors, and the static portal. None commit us to a direction you can't redirect.

---

## 15. Instructions for Claude (if Rob is reviewing this in Claude Desktop)

**If you are Claude assisting Rob with this file:** once Rob has made **all** his rulings on §13, any edits to §3–§7 or §12, and an overall verdict (Approved / Approved-with-changes / Rejected), **generate a new markdown file** that captures those decisions and is addressed back to the builder.

- **Filename:** `ZohoArchitectureDecision_RISE8_<MMDDYY>.md` (use the date Rob finalizes).
- **Send to:** Kyle Estocapio — `bke@rise8companies.com` (Kate copied for Non-Profit items).
- **Must contain, in order:**
  1. **Overall verdict** — Approved / Approved-with-changes / Rejected, dated, Rob's name.
  2. **Decisions on §13** — explicit ruling on each of the 5 open decisions, one line each.
  3. **Requested changes** — any modifications to §3–§7 (architecture) or §12 (proposed work), itemized.
  4. **Production hold** — lifted, lifted partially (specify items), or stays.
  5. **Anything blocked on Rob** — items he wants more info on first.
- **Do not** make CRM changes from Rob's session — this is decision capture, not a build. The file is the handback; Kyle + Kate execute and resubmit.
- Keep it tight and unambiguous — Kyle acts on it directly.

---

## 16. Where to look (detailed docs, for builders)

| Need | Doc |
|---|---|
| This map + proposal (single Rob-facing file) | `Zoho_Architecture.md` (root — you are here) |
| Rollout plan + decision log (audit trail) | `docs/ZohoCRM_Rollout_052126.md` |
| Live task list | `docs/ZohoCRM_Todo_052126.md` |
| Procurement item module (fields/picklists) | `specs/ZohoModuleSpec_ProcurementItems_052626.md` |
| Procurement multi-vendor tracking | `specs/ZohoModuleSpec_ContactTrackingSubform_052926.md` |
| Procurement process (workflow reference) | `docs/ZohoProcurementProcessGuide_RISE8_052926.md` |
| Non-Profit Sales build | `docs/ZohoBuildTracker_NonProfitSales_Kate_052926.md` |
| Operating doctrine (5-stage SOP, FL rules) | `docs/ProjectInstructions_OverseasProc_052626.md` |
| Procurement portal + webapp (Option B) decision | live: `procurement.rentstayable.com` · gate: `docs/ZohoCRM_Todo_052126.md` → Phase 0.5 |

**Repository layout:** deploy + entry files at root (`index.html`, `vercel.json`, `ZohoProcurementTracker_052626.html`, `CLAUDE.md`, `start-claude.bat`, `Zoho_Architecture.md`) · planning/process in `docs/` · module specs in `specs/` · source reference in `reference/` · Zoho import files in `outputs/`.

---

*Prepared for CEO review. Mark up directly or return comments; Kyle + Kate will revise and resubmit before any production step.*
