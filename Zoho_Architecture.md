# Zoho CRM — Universal Architecture & Proposal (RISE8 Companies / Stayable)

**To:** Rob Beyer, CEO · **From:** Kyle Estocapio (build — Procurement & Vendor Selection) · Kate (build — Non-Profit Sales) · **Date:** 05/29/26 · **Last Updated:** 06/02/26

> 🟢 **STATUS: ARCHITECTURE APPROVED (06/02/26).** Rob approved the **v2 merged design** (`docs/ZohoArchitecture_Update_053026v2.md`) — his 05/30 three-module build spec reconciled into the architecture of record. The design below is **frozen**; build proceeds against it. Key change folded in: multi-vendor bidding is now a **`Vendor_Quotes` child module** (not the `Contact_Tracking` subform), and procurement suppliers move to the **native Vendors module**. See the decision log in `docs/ZohoCRM_Rollout_052126.md` (06/02/26).
>
> ⚠️ **Operational production hold still applies** to items that are *separate decisions* from the architecture: **no real data-load, no go-live / team onboarding, no live tracker writes**, and 2FA stays open (§13 #4). Held-state build of the approved modules/fields may proceed. Rob lifts the operational hold separately. **One open architecture item remains: Property `2900`** (§13 #6) — not built until Rob confirms it's a real property vs. a typo.

**Builders:** Kyle (Procurement + Vendor/Professional Selection) & Kate (Non-Profit Sales) · **Process owner / Approver:** Rob Beyer (CEO) · **Procurement SME:** Jefferson Gomez (Procurement only)

📊 **Visual guide:** `reference/ZohoArchitecture_VisualGuide_052926.png` · 📝 **Suggest changes here (don't edit this file):** `docs/ZohoArchitecture_Feedback_052926.md`

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
- **Vendors (v2):** the **native Vendors module** is the procurement supplier master (Country of Origin, Vendor Vetted, Existing Supplier, Default Payment Terms, Vendor Notes, Vendor Type). The 21 held vendor Accounts + 20 Contacts migrate in. The `CRM Use Case` firewall stays for Non-Profit + Track-3 counterparties, which remain Accounts.
- **Multi-vendor bidding (v2):** a **`Vendor_Quotes` child module** — one record per vendor offer, lookup to the item + lookup to the Vendor. Carries pricing/delivery/spec/diligence terms, per-quote spec-sheet upload, and two **landed-cost formula fields** (Total Landed Cost, Landed Cost/Unit). Comparison renders as a grouped report (sorted by Landed Cost/Unit ascending) + a Kanban on Quote Status; award is structurally enforced by `Awarded_Vendor` (→ a winning Quote record) + an award-stamping workflow. **Replaces the `Contact_Tracking` subform** — Rob's per-quote attachments, per-quote reporting, formulas, and per-row award workflow are exactly what a subform can't do.
- **PO:** `PO_Number` + `PO_Status` fields track PO numbers across channels (Alibaba confirmation, Amazon/Home Depot numbers); for office-supplies/linen, Jefferson generates the PO from his template (Excel — sample at `reference/FSCP Linen Default PO for Properties NP 3.xlsx`) and attaches the PDF. No native PO/Quotes/Products modules (the native Quotes module stays off — our bidding module is the custom `Vendor_Quotes`).
- **Decision:** recorded in `Decision_Notes` on the item — never in email.
- **Specs:** `ZohoModuleSpec_ProcurementItems_052626.md` · **`ZohoModuleSpec_Quotes_060226.md`** (active) · `ZohoModuleSpec_ContactTrackingSubform_052926.md` (superseded) · process reference `ZohoProcurementProcessGuide_RISE8_052926.md` (process adopted, module mapping redirected).

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
| Accounts, Contacts | **On** | Shared foundation. Accounts firewall (`CRM Use Case`) retained for Non-Profit + Vendor Selection. |
| Procurement_Items (custom) | **On** | Procurement home (1st custom module) |
| **Vendor_Quotes (custom)** | **On (v2 — build pending)** | **Multi-vendor bidding / comparison layer for Procurement (2nd custom module). API name `Vendor_Quotes` — the stock `Quotes` API name is taken.** |
| **Vendors (native)** | **On (v2)** | **Procurement supplier master. Reversed from "Off" — Rob's spec; module was already enabled (touched 04/15/26). 21 held vendor Accounts migrate in.** |
| Deals | **On** | Non-Profit home (and future tenant/lease) |
| Vendor_Selection (custom) | Planned | Track 3, cloned later (would be 3rd custom module — Professional headroom confirmed) |
| Leads | On (Phase 2) | Cold non-profits before qualification |
| Tasks / Notes / Calls / Meetings | On | Activities on any record |
| **Quotes (native)**, Invoices, Price Books, Sales Orders, **Purchase Orders**, Campaigns, Visits | **Off** | The inventory-suite sprawl that killed v1. Native **Quotes** stays off — bidding uses the custom `Vendor_Quotes`. PO handled by fields + attached PDF, not the PO module. |
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
| `PO_Number` + `PO_Status` fields on `Procurement_Items` | ✅ Built (held config) — `PO_Status` 7-value picklist; approach still pending your §13 #2 confirm |
| Non-Profit tracker reconciled + renamed | ✅ `ZohoBuildTracker_NonProfitSales_Kate_052926.md` |
| Architecture, specs, decision log | ✅ Written/updated, committed (audit trail) |

---

## 12. What is PROPOSED / pending your approval (not yet built)

| # | Item | Workflow | Owner |
|---|---|---|---|
| P1 | **`Vendor_Quotes` child module** (multi-vendor bidding) + parent changes on Procurement_Items (`Target_Qty`, `Awarded_Vendor`, retire `Bid_Count`/Linked Vendors) — *was the Contact-Tracking subform; superseded by v2* | Procurement | Kyle |
| P1b | **Native Vendors module** build (5 custom fields + Vendor Type) + **migrate** 21 vendor Accounts + 20 Contacts in | Procurement | Kyle |
| P1c | Quote **landed-cost report** (grouped, sorted by Landed Cost/Unit) + **Kanban** on Quote Status + award-stamping **workflow rule** (via MCP) | Procurement | Kyle |
| P2 | `PO_Number` + `PO_Status` fields **(✅ built 05/29 as held config)**; PO docs via Jefferson's template (attach PDF) — *approach still pending your §13 #2 confirm* | Procurement | Kyle |
| P3 | 5 workflow rules on Procurement_Items (stage gates, stuck-item alerts) | Procurement | Kyle |
| P4 | Real procurement data load (197 historical items) | Procurement | Kyle |
| P5 | **Non-Profit Sales** build — Deals pipeline, layouts, 48 partner Accounts + 11 Contacts import | Non-Profit | Kate |
| P6 | Vendor / Professional Selection module (cloned from Procurement, later) | Vendor Sel. | Kyle |
| P7 | Phase-2 seats for Bea + Crystal; email integration | Non-Profit | Kyle |

---

## 13. Open decisions that need you

1. ✅ **RESOLVED (06/02/26) — Procurement bidding design.** Approved as the **`Vendor_Quotes` child module** (not the subform). Rob's v2 spec requires per-quote spec-sheet attachments, per-quote reporting, landed-cost formulas, a Kanban, and a per-row award workflow — all first-class-record capabilities the subform lacked. The "Stale" follow-up nudge becomes an actual per-row workflow (threshold pending #7). Spec: `ZohoModuleSpec_Quotes_060226.md`.
2. ✅ **RESOLVED (06/02/26) — PO in Zoho.** Field-based PO (`PO_Number` + `PO_Status` + attached PDF), **no native PO module**, confirmed under the v2 approval.
3. **Vendor / Professional Selection timing.** Build later by cloning the Procurement (Item + Quotes) pattern (recommended), or in parallel now? *(Still open — recommend later.)*
4. **Security: 2FA.** Enabling 2FA on `admin@` and Jefferson's account has been **on hold per you since 05/20**. Super-admin without 2FA is a single point of failure. Re-open before seats / go-live? *(Still open.)*
5. **Phase-2 trigger.** What signals readiness to add Bea + Crystal — a fixed date, or Jefferson logging procurement daily for 2 weeks first? *(Still open.)*
6. ⚠️ **OPEN — Property `2900`.** Rob's v2 Property picklist includes `2900`, which is **not** in the 8-property canon (4645, 2295, 6802, 812, 5399, 2535, 44199, 8700). New property or typo? **The value will not be built into any picklist until you confirm.**
7. **OPEN — Stale-bid threshold.** Jefferson recommends **3 days** (overseas vendors go quiet fast); the prior default was 14. Sets the Quote follow-up workflow timer. Your call.

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
| Procurement multi-vendor bidding (Quotes module) | `specs/ZohoModuleSpec_Quotes_060226.md` (active) · `specs/ZohoModuleSpec_ContactTrackingSubform_052926.md` (superseded) |
| v2 merged architecture (approved 06/02/26) | `docs/ZohoArchitecture_Update_053026v2.md` · Rob's spec verbatim: `docs/ZohoArchitecture_RobFeedback_053026.md` |
| Procurement process (workflow reference) | `docs/ZohoProcurementProcessGuide_RISE8_052926.md` |
| Non-Profit Sales build | `docs/ZohoBuildTracker_NonProfitSales_Kate_052926.md` |
| Operating doctrine (5-stage SOP, FL rules) | `docs/ProjectInstructions_OverseasProc_052626.md` |
| Procurement portal + webapp (Option B) decision | live: `procurement.rentstayable.com` · gate: `docs/ZohoCRM_Todo_052126.md` → Phase 0.5 |

**Repository layout:** deploy + entry files at root (`index.html`, `vercel.json`, `ZohoProcurementTracker_052626.html`, `CLAUDE.md`, `start-claude.bat`, `Zoho_Architecture.md`) · planning/process in `docs/` · module specs in `specs/` · source reference in `reference/` · Zoho import files in `outputs/`.

---

*Prepared for CEO review. Mark up directly or return comments; Kyle + Kate will revise and resubmit before any production step.*
