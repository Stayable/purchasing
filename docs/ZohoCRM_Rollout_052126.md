# Zoho CRM — Reintroduction Plan & Progress Log

**Spearhead:** Kyle Estocapio (`bke@rise8companies.com`) — Vercel admin + Zoho super admin (05/27/26→)
**Approver:** Rob Beyer (procurement decisions, architectural shifts)
**Operator:** Jefferson Gomez (day-to-day Zoho use)
**Project Start:** 05/21/26
**Status:** In Progress — Phase 0 (Tooling) + Phase 1 (Procurement)
**Last Updated:** 06/02/26

---

## 1. Strategic Context

Zoho is being reintroduced to RISE8 Companies / Stayable after a previous deployment was abandoned. The prior failure was caused by **module sprawl** — Books, Desk, Projects, Campaigns, and CRM all activated simultaneously, with no clear ownership of each module. This rollout is deliberately scoped to **CRM only**.

The reintroduction is structured around **three distinct workflows**, each mapped to its own Deal pipeline inside a single Zoho CRM environment:

| Pipeline | Purpose | Primary Operator |
|---|---|---|
| Procurement | Track Alibaba and overseas vendor orders | Jefferson Gomez |
| Non-Profit Sales | Convert non-profits into recurring room placements | Bea (north FL) & Crystal (central FL) |
| Special Projects | Mini-RFPs and structured selections (e.g., bankruptcy attorney from 15 candidates) | Rob Beyer (with Claude as co-worker) |

---

## 2. Environment Architecture

### Single Org, Multiple Pipelines

One Zoho CRM environment serves all three workflows. Separation is achieved through:

- **3 Deal pipelines** with distinct stage sets
- **Custom field "Record Type"** on Accounts/Contacts (Vendor / Non-Profit / Counterparty)
- **Profiles & roles** controlling which user sees which pipeline
- **Layout rules** providing different field layouts per record type

**Why not three separate orgs:** Would triple licensing cost (each user needs a seat in each org), fragment search, and force Rob to maintain three dashboards. Single-org is correct unless legal/regulatory isolation is required — which it is not.

### Tier Selection

**Professional Plan — $35/user/month (month-to-month billing)**

Reasoning:
- **Standard ($20)** — lacks Inventory Management (kills SKU tracking for Alibaba) and Email Intelligence (kills attorney scoring). False economy.
- **Professional ($35)** — includes Email Intelligence (open/reply tracking) and Inventory Management (Products module). Correct fit.
- **Enterprise ($50)** — Territory Management, AI assistant, Customer Portals not needed at this stage.
- **CRM Plus ($69)** — bundle includes Email Marketing, Help Desk, Social, Projects, Surveys. This is the sprawl trap that killed the previous deployment. Hard no.

**Billing:** Started month-to-month to validate adoption. Annual lock-in deferred to Day 90 checkpoint (~$48/seat/month savings vs. monthly).

### Seat Strategy (Phased)

| Phase | Seats | Cost/mo (monthly billing) | Users |
|---|---|---|---|
| **Phase 1 (current)** | 3 | $105 | Rob (admin@, Super Admin) + Jefferson (Administrator) + Rob (rb@rise8companies.com, working account — activated early per 05/27 decision) |
| **Phase 2** | 5 | $175 | + Bea + Crystal (Non-Profit pipeline activation) |

---

## 3. User Roster (Current — Phase 1)

| Name | Email | Profile | Designation | Notes |
|---|---|---|---|---|
| Rob Beyer | admin@rentstayable.com | **Super Admin** | CEO | Institutional chair — configuration, billing, recovery only. Not a daily operator account by design. |
| Jefferson Gomez | jefferson@rentstayable.com | **Administrator** | Manager | Procurement operator + backup admin (recovery rights if Rob's super admin is locked). |
| Rob Beyer | rb@rise8companies.com | **Standard User** (TBD) | CEO (working account) | Daily working account. Activated 05/27/26 — originally deferred to Phase 3, pulled forward per 05/27 architecture pivot to support Procurement_Items module ownership and Special Projects work. |

**Key governance decisions:**

- Super Admin identity is "Rob Beyer" but the login is `admin@rentstayable.com` (institutional, not personal). This anchors org ownership to the company domain rather than Rob's personal Gmail.
- Jefferson as Administrator (not just Standard user) provides backup admin coverage from day one — no single point of failure.
- Rob's personal working account (`rb@rise8companies.com`) was considered and **rejected**. Rob does not need a daily-use seat in Phase 1; the Special Projects pipeline is deferred.

---

## 4. Mailbox Connections

Email integration is critical — it's why we did not choose the Free tier. All inbound and outbound vendor/non-profit/counterparty communication must auto-log against the matching CRM record.

| Mailbox | Connection Type | Burns a Seat? | Phase |
|---|---|---|---|
| admin@rentstayable.com | Super Admin login only — no mailbox feed | N/A | Phase 1 |
| jefferson@rentstayable.com | Personal IMAP/OAuth (Jefferson's own mailbox) | Yes (Seat 2) | Phase 1 |
| purchasing@rentstayable.com | **Organization Email / shared mailbox** — Jefferson reads + sends from inside CRM | **No** | Phase 1 |
| Bea's mailbox | Personal IMAP/OAuth | Yes (Seat 3) | Phase 2 |
| Crystal's mailbox | Personal IMAP/OAuth | Yes (Seat 4) | Phase 2 |
| nonprofits@rentstayable.com (proposed) | Organization Email / shared mailbox | No | Phase 2 |

**Why purchasing@ is NOT a user account:** Generic shared mailboxes should never burn a Zoho seat. They are inbox destinations, not people. A user account requires real 2FA, real audit trail, and real accountability — none of which a shared mailbox provides. Same principle was applied (correctly) to admin@ being a real-person-identity rather than a faceless inbox.

**Jefferson sees `purchasing@` inside his own Zoho session** via the Organization Emails feature and can compose new messages as `purchasing@` or `jefferson@` depending on context.

---

## 5. Module & Pipeline Structure

### Modules in Use (CRM Only)

| Module | Status | Used For |
|---|---|---|
| Leads | Active (Phase 2) | Cold non-profits before qualification |
| Accounts | Active | Vendors, non-profits, counterparty firms |
| Contacts | Active | Individuals at each Account (sales reps, ED/case managers, attorneys) |
| Deals | Active | All three pipelines (Procurement, Non-Profit, Special Projects) |
| Products | Active (Phase 1) | SKU catalog for Alibaba orders — requires Professional tier |
| Tasks / Notes / Meetings | Active | Activities logged against any record |

### Modules Disabled (to prevent UI clutter and prior sprawl)

Quotes, Invoices, Vendors (the native one — we use Accounts instead), Price Books, Sales Orders, Purchase Orders, Forecasts (initial), Campaigns module, Visits.

### Procurement Pipeline — Stages

`Inquiry → Quote Requested → Quote Received → PO Issued → In Production → In Transit → Received → Closed`

**Custom fields on Procurement Deals:**
- **Property ID** (dropdown: 6802, 2295, 5399, 2535, 4645, 44199, 812, 8700)
- **Vendor Country** (China, Vietnam, India, Mexico, USA, Other)
- **PO Value (USD)**
- **Expected Ship Date**
- **Expected Arrival Date**

**Custom fields on Procurement Accounts:**
- **Vendor Type** (Overseas Manufacturer, US Distributor, Freight Forwarder, Inspection Service)
- **Alibaba Profile URL**

### Non-Profit Pipeline — Stages (Phase 2)

`Lead → Qualified → Proposal → MOU → Active → Renewing → Lost`

### Special Projects Pipeline — Stages (Phase 2 / on-demand)

`Sent → Responded → Interviewed → Shortlisted → Selected → Declined`

---

## 6. Terminology Decoder

For internal reference — Zoho's module names don't always match how we'd naturally describe the work.

| Zoho Term | What It Actually Means | RISE8 Example |
|---|---|---|
| **Lead** | Unqualified prospect (cold). Auto-converts into Account + Contact + Deal once qualified. | Non-profit imported from Candid that hasn't been contacted yet |
| **Account** | The organization. The "company card." | Foshan Furniture Co. Ltd; Salvation Army; Berger Singerman LLP |
| **Contact** | The human at the Account. One Account, many Contacts. | Lily Chen (sales rep at Foshan); housing coordinator at Salvation Army |
| **Deal** | The active opportunity / transaction / project. Has $ value and stage. | "200 mattresses — Jacksonville West PO #2026-014" |
| **Product** | SKU-level line item attached to Deals (Procurement only) | Mattress, queen, foam, 10" — SKU MAT-Q-10F |
| **Task / Note / Meeting** | Activities logged against any record. Where Alibaba email tracking lives. | Email thread with vendor, inspection report note, call summary |

---

## 7. Phase 1 Setup Status (refreshed 05/27/26)

| Item | Status | Notes |
|---|---|---|
| Zoho CRM Professional account created | ✅ Complete | admin@rentstayable.com is Super Admin |
| Seat 1: Rob Beyer (Super Admin) | ✅ Complete | Login: admin@rentstayable.com |
| Seat 2: Jefferson Gomez (Administrator) | ✅ Complete | Login: jefferson@rentstayable.com |
| Seat 3: Rob Beyer (working account, rb@rise8companies.com) | ✅ Complete | Activated 05/27/26 — pulled forward from Phase 3 per architecture pivot |
| 2FA enabled on admin@ | ⚠️ On hold | Held per Rob 05/20/26 — must be re-opened before Phase 2 |
| 2FA enabled on Jefferson | ⚠️ On hold | Held per Rob 05/20/26 |
| Recovery codes stored | ⚠️ On hold | Pending 2FA decision |
| Jefferson personal mailbox connected (IMAP/OAuth) | ✅ Complete | Done 05/20/26; "empty mail" symptom resolved post-vendor-import 05/26/26 |
| purchasing@ connected as Organization Email | 🔲 Not started | Requires M365 forwarding rule first (Zoho Pro has no true shared inbox) |
| Vendor source list received + cleaned | ✅ Complete | 05/26/26 — 19 rows post-dedupe |
| Alibaba vendors imported as Accounts | ✅ Complete | 05/26/26 — 19 Accounts via `Accounts_RISE8_052626.xlsx` |
| Vendor contacts imported | ✅ Complete | 05/26/26 — 20 Contacts via `Contacts_RISE8_052626.xlsx`; Account ↔ Contact lookup verified |
| Vendor Type custom field (Accounts) | ✅ Complete | Pick List created 05/26/26 to support import mapping |
| **Architecture pivot to `Procurement_Items` custom module** | ✅ Decided 05/27/26 | Supersedes "Deals pipeline + custom fields" approach. Spec: `ZohoModuleSpec_ProcurementItems_052626.md` |
| Procurement_Items module shell created | ⚠️ Gated on Phase 0 MCP setup | Task 2 — Kyle to execute via MCP once configured |
| 19 custom fields + 7 picklists deployed | ⚠️ Gated on module shell | Task 3 — `createFields` batch via MCP |
| Layout sections, permissions, 5 workflow rules | ⚠️ Gated on fields | Task 4 |
| Disabled unused modules (Quotes, Invoices, etc.) | 🔲 Not started | Partially obviated by Procurement_Items pivot but still needed for UI hygiene |
| Procurement pipeline stages on Deals (legacy 05/21 plan) | ❌ Superseded | Replaced by 10-value Stage picklist on Procurement_Items per spec |
| First live procurement record logged (test) | ⚠️ Gated on Task 4 | Task 5 — 5 test items: PTAC9000BTU, PressureWasher4400PSI, MiniSplit23000BTU, ArcWelderAC225S, ExtensionLadder40FT |
| Zoho MCP server configured in Claude Code | 🔲 Not started | **Phase 0 prerequisite** — Owner: Kyle, before next session |
| Vercel project linked to repo | 🔲 Not started | **Phase 0** — Owner: Kyle. Production deploy gated on Task 9 (HTML repoint) |

---

## 8. Open Questions

1. **2FA confirmation** — Is two-factor authentication active on both admin@ and Jefferson's accounts? Recovery codes stored where?
2. **Vendor source list** — Is there an existing list of current Alibaba/overseas vendors (spreadsheet, Ramp transaction history, past emails) for bulk import? If not, Jefferson builds it organically as orders happen.
3. **Active orders in flight** — Are there Alibaba orders currently in progress that should be the first test Deals logged? Recommended to enter 1–2 real orders in week 1 to validate the structure before scaling.
4. **Day 90 checkpoint date** — Target review date for monthly-to-annual billing decision. Default: 08/19/26 (90 days from 05/21/26).
5. **Phase 2 trigger** — What event signals readiness to add Bea and Crystal? Recommended: Phase 1 must be stable for 30 days with Jefferson actively logging Deals daily.

---

## 9. Decisions Made (Decision Log)

| Date | Decision | Rationale |
|---|---|---|
| 05/21/26 | CRM-only deployment, no Books/Desk/Projects/Campaigns | Prior deployment failed due to module sprawl |
| 05/21/26 | Single Zoho org (not 3 separate orgs) | Cost, search, reporting, mailbox connection efficiency |
| 05/21/26 | Professional tier selected over Standard | Inventory Management + Email Intelligence required for use cases |
| 05/21/26 | Month-to-month billing initially, annual at Day 90 | $420 trial cost vs. $1,104 annual lock — insurance against repeat abandonment |
| 05/21/26 | admin@rentstayable.com as Super Admin login (identity: Rob Beyer) | Institutional chair anchored to company domain, not Rob's personal Gmail |
| 05/21/26 | rb@rise8companies.com working account deferred | Rob does not need a daily operator seat in Phase 1 |
| 05/21/26 | Jefferson as Administrator (not Standard user) | Backup admin coverage from day one |
| 05/21/26 | purchasing@ as Organization Email, not a user seat | Shared mailboxes never burn licenses; principle applied across the deployment |
| 05/21/26 | Phased rollout — Procurement first, Non-Profit + Special Projects later | Procurement has the most concrete pain point (Alibaba tracking); fastest ROI validation |
| 05/21/26 | Each Todo item tagged with P1/P2/P3 priority within its phase | P1 = critical/blocker, P2 = important after P1s clear, P3 = defer-able. Prevents working low-priority items (e.g., Alibaba Profile URL field) before security/email gates are closed. |
| 05/21/26 | Day 90 review date corrected from 08/21/26 to 08/19/26 | 90 days from 05/21/26 project start |
| 05/21/26 | Monthly CRM data export to OneDrive added as recurring maintenance | Backup hygiene; insurance against vendor lock-in or repeat abandonment. Zoho native backup is paid add-on. |
| 05/20/26 | 2FA enablement on `admin@` and Jefferson placed on hold per Rob | Reason not specified. Risk acknowledged: Super Admin without 2FA is a single point of failure. Revisit before Phase 2 seat expansion. |
| 05/26/26 | Jefferson IMAP "empty mail" diagnosed as expected — not a connection failure | Configuration Status = Working, Sync Status = Completed. Root cause: no Accounts/Contacts imported yet → no records for emails to associate against. Reconnecting would lose sync state and not fix the symptom. Re-verify after vendor import lands. |
| 05/26/26 | Vendor source list received from Jefferson (22 rows, name + email only) | File: `For_upload_in_Zoho.xlsx`. Flagged 5 data quality issues (duplicate email row 13/23, Walrus ambiguity row 9/17, Mesa dedupe row 14/15, GP Batteries classification, trailing whitespace). Must be resolved with Jefferson before Zoho import — no fabrication. |
| 05/26/26 | Vendor list will be split into TWO Zoho import files (Accounts + Contacts), not one | Native Vendors module stays disabled. Companies → Accounts (Vendor Type=Overseas Manufacturer). Sales rep emails → Contacts linked to Account. Accounts must be imported before Contacts to prevent orphan records. |
| 05/26/26 | Jefferson revised vendor list to 19 rows (`For_upload_in_Zoho_1.xlsx`); 3 of 5 flagged issues resolved by source | Dropped: duplicate Hangzhou DE & E Smart Home row, Walrus Floors / kimayfloors ambiguity. Mesa collapsed to one row, two emails. Remaining 2 issues (GP Batteries classification, trailing whitespace) handled on import-format side without further Jefferson input. Target output: 19 Accounts, 20 Contacts. |
| 05/26/26 | Zoho import files produced: `Accounts_RISE8_052626.xlsx` (19 rows) + `Contacts_RISE8_052626.xlsx` (20 rows) | Saved to `/outputs`. Last Name field uses company-name placeholders where actual surnames unknown — flagged in Description column for post-import cleanup. GP Batteries set to Vendor Type = Other / Billing Country = United States pending classification confirmation. Accounts must be uploaded BEFORE Contacts to satisfy lookup. |
| 05/26/26 | Vendor Type custom field (Pick List) created on Accounts layout | Values: Overseas Manufacturer, US Distributor, Freight Forwarder, Inspection Service, Other. Created during import to enable mapping of Vendor Type column. |
| 05/26/26 | Both import files uploaded successfully; Account ↔ Contact lookup confirmed | Jefferson spot-checked: clicking Account Name on a Contact opens the matching Account record. Phase 1 vendor master data is now live in Zoho. |
| 05/26/26 | Jefferson IMAP confirmed working post-import — vendor emails to `jefferson@` are visible in Zoho Mail tab | Original "empty mail" symptom resolved as predicted: needed Contacts to associate against. Diagnosis from earlier in this session was correct. |
| 05/26/26 | `purchasing@` shared inbox to be implemented via M365 forwarding → `jefferson@`, not a native Zoho shared inbox | Zoho Professional has no true shared inbox (SalesInbox is paid add-on). Organization Emails feature is outbound-only. Forwarding pattern works for single-operator Phase 1 but co-mingles purchasing@ mail into Jefferson's personal Mail tab. Revisit in Phase 2 when Bea + Crystal need their own shared inboxes. |
| 05/27/26 | **Architecture pivot:** Procurement tracking moves from Deals pipeline (with custom fields) to a dedicated `Procurement_Items` custom module | Source: 05/27 task update doc originally written against a separate test account, applied here per Rob. Reverses the 05/21 "avoid module sprawl — use Deals pipeline" decision. Tradeoff acknowledged: heavier setup (19 fields, 7 picklists, 5 workflow rules, 3 layout sections per planned spec), but cleaner separation from any future tenant/lease/non-profit work that would otherwise compete for the Deals module. Justified by 3-user paid Professional tier that supports custom modules + workflow rules. |
| 05/27/26 | Third seat activated: `rb@rise8companies.com` working account | Pulled forward from Phase 3 deferral. Required because Procurement_Items module needs a real Procurement-team owner separate from `admin@` (which stays institutional-only). 3 seats × $35 = $105/mo monthly billing. |
| 05/27/26 | Imported 05/27 task update doc was sourced from a different (free-tier) test Zoho account | Confirmed by Rob. Only the architectural goal carries over; the "subscription upgrade" task is N/A on current paid Professional. 4 referenced source files (HTML tracker, project instructions, module spec, vendor tracker) marked on hold pending location. Tasks 2–9 cannot start until the module spec file surfaces. |
| 05/27/26 | The 19 Alibaba Accounts + 20 Contacts imported 05/26 remain valid under new architecture | Vendors are still vendors. Under the pivot, they become the "Linked Vendors" related list on Procurement_Items records rather than the parent record of a Deal. No re-import needed. |
| 05/27/26 | **Kyle Estocapio (`bke@rise8companies.com`) assumes project spearhead role** | Kyle holds Zoho super-admin access (via `admin@rentstayable.com`) and Vercel admin. All Phase 0/1 execution tasks default to Kyle as owner unless explicitly reassigned. Rob remains the approval authority on procurement decisions and architectural shifts; Jefferson remains the day-to-day procurement operator inside Zoho. Doc convention updated: "Owner: Kyle" = Kyle executes; decisions still route through Rob before action where flagged. |
| 05/27/26 | **Phase 0 — Tooling & Infrastructure added to scope** | Captures build-systems work that gates downstream execution: (1) Zoho MCP server configuration so Tasks 2–4 can run programmatically rather than as a Jefferson click-walkthrough, (2) Vercel project setup for hosting the procurement tracker HTML as a live URL. Both owned by Kyle; both are infrastructure, not procurement decisions, so no Rob sign-off required. Phase 0 sits ahead of Phase 1 finish-out in the active sprint. |
| 05/27/26 | **Vercel hosting added to project scope; deploy sequencing decided** | The repointed `ZohoProcurementTracker_052626.html` will be deployed to Vercel as a static site linked to `github.com/Stayable/purchasing` `main`. Sequencing decision: **Task 9 (repoint Deals → Procurement_Items) must complete before production deploy.** Rationale: the current HTML references Deals-architecture field names that no longer match the architecture-of-record. Deploying as-is would publish a misleading tracker to Rob and Jefferson. Vercel project setup (linking repo, configuring static deploy, framework=Other) can proceed in parallel before Task 9 lands; only the production cut-over waits. v1 tracker `ZohoVendorTracker_Procurement_052626.html` not deployed — superseded artifact, would create drift. |
| 05/27/26 | **Zoho MCP setup added as Phase 0 prerequisite owned by Kyle** | Tasks 2–4 (module shell, field deploy, layout/workflow rules) require either (a) a Zoho MCP server connected to Claude Code or (b) a Jefferson click-by-click walkthrough doc. Kyle to configure MCP before the next session using Zoho API Console credentials (super admin access required). Once MCP is live, Tasks 2–4 collapse into a single working session. Walkthrough doc is the documented fallback if MCP setup hits a blocker. |
| 05/29/26 | **Shared `CRM_Use_Case` firewall field created on Accounts; 21 vendor records backfilled to `Procurement`** | Multi-select picklist (Procurement / Non-Profit Sales / Vendor Selection), required. Created manually in Settings (MCP can't create fields); first built single-select, deleted, recreated multi-select. All 21 existing Accounts tagged `["Procurement"]` via `updateRecords`. Prevents collision between procurement vendors and Kate's incoming 48 non-profit partner Accounts in the shared module. See `ZohoBuildTracker_NonProfitSales_Kate_052926.md`. |
| 05/29/26 | **Multi-vendor bidding modeled as a `Contact_Tracking` subform on `Procurement_Items`, NOT a child module or the standard inventory suite** | The 05/28 meeting required multiple contacts per item, conversations tracked on the item, and a Vendor 1/2/3 staging→bid→select→award flow with RFQ. Three candidate designs evaluated: (a) Jefferson's standard Products+Quotes+Deals+Purchase-Orders suite — rejected, reintroduces Deals + 4 modules = the v1 sprawl trap, and discards the FL/tariff/spec fields on the live module; (b) a `Vendor_Bids` child module — specced then superseded; (c) a subform on the item — **chosen.** Rationale: the subform delivers every stated requirement inline on the item, supports trade-show fallback text (optional Contact lookup + always-on text fields) and API bulk-load, with no extra module. Trade-off acknowledged: subforms can't hold per-row attachments and can't run time-triggered per-row workflow — so automated per-vendor follow-up nudges are replaced by a "Stale (>14 days)" saved report view. Decision routes through Rob if he wants the per-bid automation back (would revert to design b). Specs: `ZohoModuleSpec_ContactTrackingSubform_052926.md` (active), `ZohoModuleSpec_VendorBids_052926.md` (superseded). |
| 05/29/26 | **PO handling: tracking-number fields on the item + attach PDF for document channels; no PO/Quotes/Products modules** | Field reality: PO numbers are used for tracking on every channel (Alibaba built-in PO confirmation; Amazon/Home Depot generate their own numbers). Office supplies & linen need an actual PO document, which Jefferson generates from a template (Excel — sample at `reference/FSCP Linen Default PO for Properties NP 3.xlsx`, added 05/29/26). Decision: add `PO_Number` + `PO_Status` fields to `Procurement_Items` for tracking; for document channels Jefferson generates the PO from his template and attaches the PDF to the item. Native Purchase Orders/Quotes/Products suite stays disabled. Revisit a Zoho Writer mail-merge template or native PO module at the 06/21/26 checkpoint only if document volume justifies it. |
| 05/29/26 | **Vendor / Professional Selection (Special Projects) deferred — to be cloned from the proven procurement pattern** | Track 3 (mini-RFP selections, e.g. bankruptcy attorney) is structurally identical to procurement's multi-vendor flow (a project, candidate firms, score→shortlist→select). Decision: build and validate the procurement Contact_Tracking pattern first, then clone it into a `Vendor_Selection` module rather than designing twice. No parallel build now. |
| 05/29/26 | **Jefferson's `ZohoProcurementProcessGuide_RISE8_052926.md` — process adopted, module mapping redirected** | Jefferson (Purchasing) authored a 3-quote process guide built on the standard Deals/Quotes/Products/PO modules; his guide notes it was written against the NonProfit/Vendor-Selection Deals layout (he was not working from the live `Procurement_Items` module). His *process* (3 competing quotes → compare → approve winner → PO) is correct and adopted. The *module mapping* is redirected to the item-centric architecture (subform on Procurement_Items). Guide annotated, not discarded. |
| 05/29/26 | **`PO_Number` + `PO_Status` fields built and verified live on `Procurement_Items`** | Created manually in Settings (MCP has no field-creation path — same constraint as `CRM_Use_Case`). `PO_Number` = text; `PO_Status` = picklist with Not Issued / PO Drafted / PO Issued / Confirmed by Vendor / Partially Received / Received / Closed. Field count 36→38. This is held config — the PO *approach* (fields + attached PDF, no native PO module) still awaits Rob's §13 #2 confirm. Cosmetic follow-up: `PO_Number` display label carries an underscore; relabel to "PO Number" in Settings. |
| 05/30/26 | **Jefferson handback received (3 files) — architecture validated; §1.1/§1.2 data applied** | `JeffersonHandback_052926.md`, `IntlVendorContacts_RISE8_052926.md`, `ItemStaging_Procurement_052926.xlsx`. Jefferson confirmed the 10-stage flow, PO handling, and FL-Validate criteria — no change. Applied to live records (hygiene on existing records, **not** the frozen 197-item load): Guangdong Yongcheng `Vendor_Type`=Overseas Manufacturer; 13 vendor-Contact rep names (9 full + 4 first-name-only). |
| 05/30/26 | **Jefferson recommendation — stale-bid threshold 3 days, not 14 — PENDING Rob (§13 #1)** | Rationale: overseas vendors go quiet fast; 14 days misses the negotiation window. Changes SOP rule 4 / WorkflowRules R4 (tracker P6) and raises report-vs-per-vendor-workflow — the §13 #1 bidding fork. Logged; Rob rules. |
| 05/30/26 | **Backend adjustments triggered by handback (Kyle decisions, not Rob)** | (1) Add `Sourcing Agent` to `Vendor_Type` (Jing, LeeLine are agents). (2) Add Thailand + Philippines to Country picklist. (3) Normalize staging Category values singular→plural before load. (4) Reconcile item-load scope "197" → **35 top-by-spend** (Jefferson's actual staging). Tracked P18–P20, P12. |
| 06/02/26 | **Rob APPROVED the v2 merged architecture** (`docs/ZohoArchitecture_Update_053026v2.md`) | His 05/30 three-module build spec (Vendors → Procurement Items → Quotes) reconciled into the architecture of record. Design frozen; build proceeds against it (held-state until Rob lifts the operational go-live/data-load hold separately). Folded into `Zoho_Architecture.md` (status, §5.1, §6, §12, §13, §16) this session. Resolves open decision §13 #1 (bidding) and #2 (PO). |
| 06/02/26 | **Multi-vendor bidding = `Vendor_Quotes` child module, REVERSING the 05/29 subform decision** | Rob's spec requires per-quote spec-sheet attachments, per-quote reporting, two landed-cost **formula fields**, a Kanban, and a per-row **award workflow** — all first-class-record capabilities the `Contact_Tracking` subform explicitly could not provide (see superseded subform spec's documented trade-offs). The previously-shelved `Vendor_Bids` child module is thus re-derived and improved as `Vendor_Quotes`. New spec: `specs/ZohoModuleSpec_Quotes_060226.md`. Subform spec (`ZohoModuleSpec_ContactTrackingSubform_052926.md`) and `ZohoModuleSpec_VendorBids_052926.md` marked superseded. Trade-off acknowledged: a 2nd custom module (heavier than a subform) — justified by Rob's explicit requirements and confirmed Professional headroom. |
| 06/02/26 | **Procurement supplier master moves to the native Vendors module** (was: Accounts behind the `CRM Use Case` firewall) | Rob's Module 1. Native Vendors was already enabled/customizable on the org (Rob touched it 04/15/26), so his "needs Enterprise" caution does not apply. Add 5 custom fields (Country of Origin, Vendor Vetted, Existing Supplier, Default Payment Terms, Vendor Notes) + carry `Vendor_Type`. Migrate the 21 held vendor Accounts + 20 Contacts in (low cost — held/test data, pre-real-load). The Accounts `CRM Use Case` firewall is **partly retired for vendors** but **stays** for Non-Profit partners and Track-3 counterparties. §6 module table updated: native Vendors **On**; native **Quotes stays Off**. |
| 06/02/26 | **`Procurement_Items` field changes (v2):** `Target_Qty` added; `Awarded_Vendor` (→ Vendor_Quotes) added; `Winning_Vendor` (→ Accounts) deprecated; `Bid_Count` + Linked Vendors related list retired | Award now points to the winning *Quote* record (one lookup = one winner, structurally), stamped by the Quote award workflow. Bid count = Vendor Quotes related-list row count. `Stage` kept canonical — Rob's `Sourcing_Status` (5-value) **not** added (overlaps the existing 10-value `Stage`; his report filter maps to `Stage` ∈ {Bid, Level}). Spec updated: `specs/ZohoModuleSpec_ProcurementItems_052626.md`. |
| 06/02/26 | **Open flags verified via MCP against the live org** | (1) Edition = **Professional** confirmed (`getOrganization`: `paid_type=professional`, 3 seats, paid through 2026-06-19). (2) Custom-module count: **only 1 custom module exists** (`Procurement_Items`); Quotes = 2nd, Track-3 = 3rd — well within Professional limits; not a blocker. The old test-account's `Mechanic_Liens` module is **not** in this production org (confirms separate accounts). (3) ⚠️ **Build constraint discovered:** the stock `Quotes` module already occupies the `Quotes` API name, so the custom bidding module must use a distinct API name — recommended **`Vendor_Quotes`**; formula tokens and the parent `Awarded_Vendor` lookup follow that API name. Captured in the Quotes spec. |
| 06/02/26 | **Currency standardization (Rob's caution #2 — adopted):** quotes in USD; formula fields treat all currency as org base (USD confirmed) | Zoho's cross-module multi-currency auto-conversion on formula fields is unreliable. Vendors quote in USD where possible, or a manual USD Unit Price feeds the landed-cost formula. `Currency` picklist retained for reference only, not for math. |
| 06/02/26 | **Open items remaining for Rob:** Property `2900` and the stale-bid threshold | Property `2900` appears in Rob's v2 picklist but is **not** in the 8-property canon — **not built into any picklist until Rob confirms** new property vs. typo (no fabrication). Stale-bid follow-up timer: Jefferson recommends 3 days vs. prior 14 — Rob's call; sets the Quote follow-up workflow. Both logged as `Zoho_Architecture.md` §13 #6/#7. |
| 06/02/26 | **All 3 procurement modules BUILT + validation test PASSED** | Kyle built (manual UI): Vendors (6 custom fields), `Vendor_Quotes` custom module (auto-number `QT-{0000}`, both lookups, 2 landed-cost formulas, 7 picklists), and Procurement_Items v2 deltas (`Target_Quantity`, `Awarded_Vendor`→Vendor_Quotes; `Bid_Count`/`Winning_Vendor` removed). Verified via MCP. 3-quote test (1 item + 3 quotes): landed-cost formulas correct (A 57.00 / B 58.00 / C 56.50 — lowest sticker ≠ best landed cost), auto-numbers + lookups + `Awarded_Vendor` stamp all work. **Deployed API-name reconciliation** logged in `specs/ZohoModuleSpec_Quotes_060226.md` (`Minimum_Order_Qty`, `Lead_Time_days`, `Sample_Lead_Time_days`, `Landed_Cost_Unit`, `Currency1`/"Quote Currency", `Certificates`=textarea, `Target_Quantity`). **Remaining:** 3 validation-rule gates + award workflow (Deluge function). **Test records flagged `_DELETE` — manual cleanup (no MCP delete tool).** |

---

## 10. File Naming & Repository

This document and all related Zoho rollout artifacts follow the RISE8 naming convention:

`Title_PropertyID_MMDDYY` — for company-wide files where there is no property, the entity name replaces the property ID.

Examples:
- `ZohoCRM_Rollout_052126.md` (this file)
- `ZohoCRM_Todo_052126.md` (companion task list)
- `ZohoCRM_VendorImport_052126.xlsx` (when vendor list is prepared)
- `ZohoCRM_Day90Review_081926.md` (target review document)

Track this rollout in the Claude Code repository so the history, decision log, and progress are versioned over time.
