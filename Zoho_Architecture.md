# Zoho CRM — Universal Architecture (RISE8 Companies / Stayable)

> 🟡 **PROPOSED — pending Rob's approval. Production is ON HOLD.** This is the design submitted to Rob in `ZohoArchitectureProposal_RISE8_052926.md`; it may change after his review. No go-live, no real data load, no team onboarding until sign-off. See the proposal §3 for what is already built vs. §5 for what is proposed.

**The single source of truth for how Zoho CRM is structured at RISE8.** Everyone builds against this doc. If a detailed spec disagrees with this map, this map wins until the spec is reconciled.

**Builders:** Kyle Estocapio (Procurement + Vendor/Professional Selection) & Kate (Non-Profit Sales) · **Process owner / Approver:** Rob Beyer (CEO) · **Procurement SME:** Jefferson Gomez
**Last Updated:** 05/29/26
**Detailed specs (the "how"):** linked per track in §4.

---

## 1. The one-paragraph model

One Zoho CRM org (Professional tier) serves **three workflows** — Procurement, Non-Profit Sales, and Vendor/Professional Selection. They **share two foundation modules** (Accounts = organizations, Contacts = people) and are kept apart by a required **`CRM Use Case` tag** on every Account. Each workflow then uses its own home module: Procurement → a custom `Procurement_Items` module; Non-Profit Sales → the standard `Deals` module; Vendor Selection → a future custom module cloned from Procurement. No module sprawl — that is what ended the previous deployment.

---

## 2. Who owns what

Two **builders** (Kyle + Kate) stand up the system. **Rob** designs and optimizes the processes they build to. **Jefferson** guides the procurement build and is its end-user. **Bea + Crystal** are the Non-Profit end-users.

| Person | Role | Responsibility | Decision authority |
|---|---|---|---|
| **Rob Beyer** | CEO — **Process owner** | Creates & optimizes the processes across **all three** workflows (Kyle + Kate build to his process) | **Approves** all procurement decisions (vendor selection, PO, spend) and any architectural shift |
| **Kyle Estocapio** | **Builder** + super-admin | Builds **Procurement** and **Vendor / Professional Selection** (modules, fields, layouts, subforms); owns overall architecture | Executes; routes architecture/process changes to Rob |
| **Kate** | **Builder** | Builds **Non-Profit Sales** (Deals / Non-Profit Placements) | Owns the non-profit module design; routes process to Rob |
| **Jefferson Gomez** | Purchasing Manager — **SME / end-user (Procurement only)** | Guides the **procurement** process & build only (he will use it daily); recommends vendors to Rob. Not involved in Non-Profit or Vendor Selection. | Advises; procurement decisions go to Rob |
| **Bea** | Non-Profit **end-user** (North FL) | Uses Non-Profit Deals — north FL properties | Operates her pipeline |
| **Crystal** | Non-Profit **end-user** (Central FL) | Uses Non-Profit Deals — central FL properties | Operates her pipeline |

> **Builders:** Kyle + Kate. **Process:** Rob (with Jefferson's guidance on procurement). **Users:** Jefferson (procurement), Bea + Crystal (non-profit). Procurement *decisions* (what to buy, from whom) always route to **Rob** before action.

---

## 3. Shared foundation (all three workflows)

### Modules everyone shares
| Module | Means | Examples |
|---|---|---|
| **Accounts** | The organization | Foshan Furniture Co. (vendor); Salvation Army (non-profit partner); Berger Singerman LLP (counsel) |
| **Contacts** | The person at an Account | A vendor sales rep; a non-profit case worker; an attorney |

### The firewall: `CRM Use Case` (required, multi-select, on Accounts)
Every Account is tagged with one or more of: **`Procurement`** · **`Non-Profit Sales`** · **`Vendor Selection`**. This is what keeps vendors, partners, and counterparties from colliding in the same shared tables. Required on creation. *(Live as of 05/29/26; all 21 existing vendor Accounts tagged `Procurement`.)*

**Account page layouts** are split by use case so each team sees only its own fields:
- **Vendor layout** (Procurement) and **Non-Profit Partner layout** (Kate) are separate, keyed off `CRM Use Case`. A vendor record won't show non-profit fields and vice-versa.

### Conversations
All emails / calls / notes log as **Activities on the home-module record** for that workflow (the Procurement Item, the Deal, etc.) — one timeline per item/deal, regardless of how many contacts are involved.

---

## 4. The three workflows

### 4.1 Procurement (overseas + domestic sourcing) — *Build: Kyle · Uses: Jefferson · Process: Rob*
- **Home module:** `Procurement_Items` (custom). The **item** is the center of gravity. 21 fields, single pipeline "Overseas Procurement", 10-stage flow: Spec → Bid → Level → FL-Validate → Recommend → Submitted → Approved / Approved-with-Conditions / Declined / Need-More-Info.
- **Vendors:** Accounts tagged `Procurement`.
- **Multi-vendor bidding:** a **`Contact_Tracking` subform** on each item — every vendor/contact in a row (staging → RFQ → quote → negotiate → award/lost), with optional Contact lookup + fallback text for trade-show reps. The bid comparison and award happen here.
- **PO:** `PO_Number` + `PO_Status` fields on the item track PO numbers across channels (Alibaba confirmation, Amazon/Home Depot numbers); for office-supplies/linen, Jefferson generates the PO from his Word template and attaches the PDF. No native PO/Quotes/Products modules.
- **Decision:** recorded in `Decision_Notes` on the item — never in email.
- **Specs:** `ZohoModuleSpec_ProcurementItems_052626.md` · `ZohoModuleSpec_ContactTrackingSubform_052926.md` · process reference `ZohoProcurementProcessGuide_RISE8_052926.md` (process adopted, module mapping redirected).
- **Status:** module live; subform + PO fields pending build (Todo Task 10).

### 4.2 Non-Profit Sales (extended-stay group placements) — *Build: Kate · Uses: Bea, Crystal · Process: Rob*
- **Home module:** standard `Deals`, pipeline **"Non-Profit Placements"**: Referred → Qualified → Funded → Pre Move-in → Active Stay → Renewed / Departed / Declined.
- **Partners:** Accounts tagged `Non-Profit Sales`. **Case workers:** Contacts.
- **Deal = one placement** (a tenant/household into a property under a funding program).
- **Territory:** Bea = north FL, Crystal = central FL. Each deal tagged with the serving Stayable property.
- **Spec:** `ZohoBuildTracker_NonProfitSales_Kate_052926.md` (Kate-owned).
- **Status:** in build by Kate; Deals module is uncontested (Procurement left it). Import of 48 partner Accounts + 11 case-worker Contacts pending; all must be tagged `Non-Profit Sales`.

### 4.3 Vendor / Professional Selection (mini-RFPs) — *Build: Kyle · Process: Rob (later)*
- **Home module:** a future custom module **cloned from the Procurement pattern** (item/project + Contact-Tracking-style candidate rows). Counterparties = Accounts tagged `Vendor Selection`.
- **Flow:** Sent inquiry → Replied → Scored → Shortlisted → Interviewed → Selected → Engaged. Losers stay as Accounts for future reference.
- **Status:** deferred. Build after the Procurement Contact-Tracking pattern is proven, then clone — don't design twice.

---

## 5. Module enablement (anti-sprawl)

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

## 6. Email

| Mailbox | How | Burns a seat? |
|---|---|---|
| `admin@rentstayable.com` | Super-admin login only (institutional) | N/A |
| `jefferson@rentstayable.com` | Personal IMAP/OAuth | Yes |
| `purchasing@rentstayable.com` | Organization Email (shared, outbound) + M365 forward → Jefferson | No |
| Bea / Crystal mailboxes | Personal IMAP/OAuth (Phase 2) | Yes |
| `nonprofits@rentstayable.com` (proposed) | Organization Email (Phase 2) | No |

Shared mailboxes never burn a license — they're inboxes, not people.

---

## 7. Front-end & hosting (procurement portal)

Today the only custom front-end is for **Procurement**. Non-Profit and Vendor Selection use the **native Zoho UI** — no separate app.

| Layer | What | State |
|---|---|---|
| **Portal** | `procurement.rentstayable.com` — static branded landing (Tracker · Zoho · Docs links), internal-only, `noindex` | ✅ Live (Vercel) |
| **Procurement Tracker** | `/tracker` — HTML tracker pointed at the `Procurement_Items` module | 🔸 Live in **DEMO MODE** — renders the action/prompt but **does not write to Zoho** yet |
| **Hosting** | Vercel, linked to `github.com/Stayable/purchasing` `main`; static, no build step; SSL via Vercel | ✅ Live |

**Interactive webapp (Option B) — deferred.** Whether to build a custom app that talks to the Zoho API directly (replacing/augmenting the native UI for procurement) is a **decision gated to the 06/21/26 Phase-1 checkpoint**, anchored in real Jefferson workflow data, not speculation. Default is to stay on the static portal (Option A) unless three trigger conditions are met. Full criteria in `ZohoCRM_Todo_052126.md` → "Phase 0.5 — Webapp Decision."

> The tracker stays in demo mode (no live writes) until both Rob lifts the production hold **and** the Phase 0.5 decision lands.

---

## 8. Conventions everyone follows

- **File naming:** `DocType_Identifier_MMDDYY.ext`. Identifier = property ID for property files, the `Item_Name` for procurement files, or the entity/matter name otherwise. No spaces.
- **Procurement Item_Name:** CamelCase, no spaces (`QueenMattress`), and must match its SharePoint folder verbatim.
- **Decisions live in the record** (`Decision_Notes` / Deal notes), never only in email.
- **Three docs stay in sync** when anything changes: this architecture map, the affected spec, and the Rollout decision log (`ZohoCRM_Rollout_052126.md`).
- **Architectural change?** Update the decision log with date + reasoning, and route to **Rob** before acting.

---

## 9. Where to look

| Need | Doc |
|---|---|
| This big-picture map | `Zoho_Architecture.md` (you are here) |
| Rollout plan + decision log (audit trail) | `ZohoCRM_Rollout_052126.md` |
| Live task list | `ZohoCRM_Todo_052126.md` |
| Procurement item module (fields/picklists) | `ZohoModuleSpec_ProcurementItems_052626.md` |
| Procurement multi-vendor tracking | `ZohoModuleSpec_ContactTrackingSubform_052926.md` |
| Procurement process (workflow reference) | `ZohoProcurementProcessGuide_RISE8_052926.md` |
| Non-Profit Sales build | `ZohoBuildTracker_NonProfitSales_Kate_052926.md` |
| Operating doctrine (5-stage SOP, FL rules) | `ProjectInstructions_OverseasProc_052626.md` |
| Procurement portal + webapp (Option B) decision | live: `procurement.rentstayable.com` · gate: `ZohoCRM_Todo_052126.md` → Phase 0.5 |
