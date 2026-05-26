# Zoho CRM — Reintroduction Plan & Progress Log

**Owner:** Rob Beyer
**Project Start:** 05/21/26
**Status:** In Progress — Phase 1 (Procurement)
**Last Updated:** 05/26/26

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
| **Phase 1 (current)** | 2 | $70 | Rob (Super Admin) + Jefferson (Administrator) |
| **Phase 2** | 4 | $140 | + Bea + Crystal (Non-Profit pipeline activation) |

---

## 3. User Roster (Current — Phase 1)

| Name | Email | Profile | Designation | Notes |
|---|---|---|---|---|
| Rob Beyer | admin@rentstayable.com | **Super Admin** | CEO | Institutional chair — configuration, billing, recovery only. Not a daily operator account by design. |
| Jefferson Gomez | jefferson@rentstayable.com | **Administrator** | Manager | Procurement operator + backup admin (recovery rights if Rob's super admin is locked). |

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

## 7. Phase 1 Setup Status

| Item | Status | Notes |
|---|---|---|
| Zoho CRM Professional account created | ✅ Complete | admin@rentstayable.com is Super Admin |
| Seat 1: Rob Beyer (Super Admin) | ✅ Complete | Login: admin@rentstayable.com |
| Seat 2: Jefferson Gomez (Administrator) | ✅ Complete | Login: jefferson@rentstayable.com |
| 2FA enabled on admin@ | ⏳ Pending verification | Critical — must be confirmed before Phase 2 |
| 2FA enabled on Jefferson | ⏳ Pending verification | Strongly recommended given Administrator profile |
| Recovery codes stored | ⏳ Pending | Should live in RISE8 password manager |
| Jefferson personal mailbox connected (IMAP/OAuth) | 🔲 Not started | |
| purchasing@ connected as Organization Email | 🔲 Not started | |
| Procurement pipeline stages configured | 🔲 Not started | |
| Custom fields (Property ID, Vendor Country, etc.) added | 🔲 Not started | |
| Disabled unused modules (Quotes, Invoices, etc.) | 🔲 Not started | |
| Existing Alibaba vendors imported as Accounts | 🔲 Not started | Source list TBD |
| First live Alibaba Deal logged (test record) | 🔲 Not started | |

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
