# Zoho CRM Build Tracker — Non-Profit Sales Module
**RISE8 Companies / Stayable**
**Owned & maintained by: Kate** (Non-Profit Sales lead) · Developer: TBD · Approver: Rob
Prepared: 05/28/26 · Last updated: 05/29/26
File: `ZohoBuildTracker_NonProfitSales_Kate_052926.md` — Kate's tracker; **not** part of the procurement working-doc set.

---

## Purpose

This is the execution tracker for the **Non-Profit Sales** module of Zoho CRM. It's one of three module groups (Procurement, Non-Profit Sales, Vendor Selection) sharing the same Zoho instance, the same Contacts table, and the same Accounts table.

The developer building Procurement should treat this as **adjacent scope**, not separate scope — every Account, Contact, and workflow tag in this module must coexist cleanly with the Procurement build. Conflicts surfaced in the **Cross-Module Dependencies** section below.

---

## Status Legend

| Symbol | Meaning |
|---|---|
| ☐ | Not started |
| ◐ | In progress |
| ☑ | Complete |
| ⚠ | Blocked / decision needed |
| 🔁 | Depends on another task |

---

## Cross-Module Dependencies (READ FIRST)

These items must be coordinated with the Procurement build before either module goes live.

> **Reconciled 05/29/26 against live Zoho state.** Procurement pivoted off the Deals module on 05/27/26 onto a dedicated `Procurement_Items` custom module (live, verified 05/29). That changes three rows below. Live org confirmed: Accounts holds 20 procurement-vendor records; the only Account custom field today is `Vendor_Type` (text); `CRM Use Case` does **not** exist yet; the 48 nonprofit Accounts are **not** imported.

| Item | Issue | Owner | Status |
|---|---|---|---|
| `CRM Use Case` multi-select field on Accounts | Required tag on every Account to prevent collision between supplier orgs (Procurement) and partner orgs (Non-Profit Sales). Values: `Procurement`, `Non-Profit Sales`, `Vendor Selection`. Make required at Account creation. **Field does not exist yet** — must be created in Zoho Settings (no API/MCP path for field creation). The 20 existing vendor Accounts will be backfilled to `Procurement` before the nonprofit import. **Coordinate with Kyle (procurement) before creating — it writes to shared live records.** | Kyle + Developer | ☐ |
| Contacts module shared across all 3 modules | A "Smith" can appear as a supplier rep AND a case worker. Contact must inherit `CRM Use Case` from linked Accounts. | Developer | ☐ |
| Email connector strategy | Procurement uses shared `purchasing@rise8companies.com`. Non-Profit Sales uses individual mailboxes (Bea, Crystal). Both must coexist without cross-pollinating SalesInbox auto-link rules. | Developer | ☐ |
| ~~Pipeline naming~~ → **No contention** | **OBSOLETE.** Procurement no longer uses the Deals module — it moved to the `Procurement_Items` custom module. Deals is **not** renamed and is uncontested. "Non-Profit Placements" can be the primary (or only) pipeline on Deals. No multi-pipeline coordination required for Procurement. | Developer | ☑ |
| Picklist value namespace | **De-scoped.** Procurement's status picklists (Stage, Spec Sheet Status, etc.) live on `Procurement_Items`, not on Accounts or Deals — so there is no `Status` picklist collision. On the only shared module (Accounts), Procurement uses just `Vendor_Type`. Prefixing (`NP-`/`Proc-`) is **not** needed. Separate by record type / layout instead — see next row. | Developer | ☑ |
| Account page layouts (Vendor vs Partner) | Kate's 19 nonprofit Account fields will physically exist on the 20 vendor records too (blank). Build two page layouts on Accounts — "Non-Profit Partner" and "Vendor" — assigned by `CRM Use Case`, so neither team sees the other's fields. | Developer | ☐ |

---

## Phase 1 — Foundation (Week 1)

Standing up the schema and picklists. Nothing imports until this phase is complete.

### 1.1 Account custom fields

19 fields total: 1 standard (Account Name), 10 original spec, 8 added from partner data import.

| # | Field name | Type | Required | Picklist values / notes | Status |
|---|---|---|---|---|---|
| 1 | Account Name | Single line text | Yes | STANDARD — must be unique | ☐ |
| 2 | Status | Picklist | Yes | Active / Prospect / Inactive / Do not engage | ☐ |
| 3 | Organization Type | Picklist | Yes | Nonprofit / Hospital / Government / Employer / School / PHA / VA-VSO / Faith-based | ☐ |
| 4 | Priority | Picklist | No | High / Medium / Low | ☐ |
| 5 | Outreach Status | Picklist | No | Active partner / No contact / Email sent / Engaged / Declined | ☐ |
| 6 | Street Address | Single line text | No | — | ☐ |
| 7 | City | Single line text | No | — | ☐ |
| 8 | ZIP | Single line text | No | — | ☐ |
| 9 | County (Service Area) | Multi-select picklist | Yes | Polk / Orange / Osceola / Duval / St. Johns / Other | ☐ |
| 10 | Website | URL | No | — | ☐ |
| 11 | Main Contact Name | Single line text | No | — | ☐ |
| 12 | Main Contact Number | Phone | No | — | ☐ |
| 13 | Main Contact Email | Email | No | — | ☐ |
| 14 | Preferred Communication | Picklist | No | Email / Phone / Text | ☐ |
| 15 | Program Type | Multi-select picklist | No | See **Picklist: Programs** below | ☐ |
| 16 | Service Mix | Multi-select picklist | No | Rent help / Deposit-Move-in / Referral-Intake / Placement-Rehousing | ☐ |
| 17 | Preferred Property | Multi-select picklist | No | See **Picklist: Properties** below | ☐ |
| 18 | Who They Serve | Single line text | No | — | ☐ |
| 19 | Active Referrals | Number (rollup later) | No | Manual at launch → convert to rollup formula in Phase 3 | ☐ |
| 20 | Payment Reliability | Picklist | No | Unrated / Good / Delayed / Inconsistent (auto-compute in Phase 3) | ☐ |
| 21 | Notes / Partnership Details | Multi-line text | No | — | ☐ |
| 22 | CRM Use Case | Multi-select picklist | **Yes** | Default to `Non-Profit Sales`. See Cross-Module Dependencies. | ☐ |

### 1.2 Deal custom fields

14 fields total: 2 standard (Deal Name, Account lookup), 11 original spec, 1 added (Case Worker Email).

| # | Field name | Type | Required | Picklist values / notes | Status |
|---|---|---|---|---|---|
| 1 | Deal Name | Single line text | Yes | STANDARD — convention: `Lastname, First — Property` | ☐ |
| 2 | Account Name | Lookup → Accounts | Yes | STANDARD lookup | ☐ |
| 3 | Nonprofit Organization | Single line text | No | Auto-populate from linked Account via workflow | ☐ |
| 4 | Case Worker Name | Single line text | No | — | ☐ |
| 5 | Case Worker Contact Number | Phone | No | — | ☐ |
| 6 | Case Worker Email | Email | No | ADDED from partner data | ☐ |
| 7 | Fund Source / Program Type | Picklist | Yes | See **Picklist: Programs** below | ☐ |
| 8 | Assistance Status | Picklist | Yes | Pending / Approved / Denied / Paid | ☐ |
| 9 | Estimated Assistance Amount | Currency | Yes | USD | ☐ |
| 10 | Tenant Portion | Currency | No | USD | ☐ |
| 11 | Lease Type | Picklist | Yes | Weekly / Monthly / 6 Months / 12 Months | ☐ |
| 12 | Special Requests | Multi-line text | No | — | ☐ |
| 13 | Management Approval Needed | Checkbox | No | Triggers workflow when checked (see Phase 3) | ☐ |
| 14 | Follow-Up Date | Date | No | Drives reminder workflow | ☐ |

### 1.3 Shared picklists (define once, reference on both Account and Deal)

**Picklist: Programs**
- Section 8
- ESG
- Rapid Rehousing
- Veterans Program
- HUD-VASH
- SSVF
- CoC
- HOME-ARP
- State EM
- Private / self-pay
- Other

**Picklist: Properties** (use exact strings)
- Lakeland (4645)
- Davenport (44199)
- Orlando OBT (8700)
- Kissimmee East (2295)
- Kissimmee West (5399)
- Jacksonville West (6802)
- Jacksonville North (812)
- St. Augustine (2535)

**Picklist: Counties → Property mapping** (used by workflow in Phase 3)
| County | Properties to auto-suggest |
|---|---|
| Polk | Lakeland (4645), Davenport (44199) |
| Orange | Orlando OBT (8700) |
| Osceola | Kissimmee East (2295), Kissimmee West (5399) |
| Duval | Jacksonville West (6802), Jacksonville North (812) |
| St. Johns | St. Augustine (2535) |

### 1.4 Pipeline configuration

Module: Deals · Pipeline name: **Non-Profit Placements**

| Stage | Probability | Type | Status |
|---|---|---|---|
| Referred | 10% | Open | ☐ |
| Qualified | 25% | Open | ☐ |
| Funded | 50% | Open | ☐ |
| Pre Move-in | 75% | Open | ☐ |
| Active Stay | 90% | Open | ☐ |
| Renewed | 100% | Closed-Won | ☐ |
| Departed | 100% | Closed-Won | ☐ |
| Declined | 0% | Closed-Lost | ☐ |

---

## Phase 2 — Forms & Layouts (Week 2)

Build the page layouts to match the approved mockups. Reference: in-chat mockups dated 05/27/26 — `New Account` and `New Deal` forms (enriched versions).

### 2.1 Account creation form

| Section | Fields (in order) | Status |
|---|---|---|
| Identification | Account Name, Organization Type, Status, Priority, Outreach Status | ☐ |
| Location | Street Address, City, ZIP, County (Service Area), Website | ☐ |
| Primary contact | Main Contact Name, Preferred Communication, Main Contact Number, Main Contact Email | ☐ |
| Service profile | Program Type, Service Mix, Preferred Property, Who They Serve | ☐ |
| Operations | Active Referrals, Payment Reliability | ☐ |
| Notes | Notes / Partnership Details | ☐ |

Footer buttons: `Cancel` · `Save & add deal` · `Save`

### 2.2 Deal creation form

| Section | Fields (in order) | Status |
|---|---|---|
| Identification | Deal Name, Account (lookup) | ☐ |
| Referral source | Nonprofit Organization, Case Worker Name, Case Worker Contact Number, Case Worker Email | ☐ |
| Funding | Fund Source / Program Type, Assistance Status, Estimated Assistance Amount, Tenant Portion | ☐ |
| Stay | Lease Type | ☐ |
| Special handling | Special Requests, Management Approval Needed, Follow-Up Date | ☐ |

Footer buttons: `Cancel` · `Save & new` · `Save`

### 2.3 Account record (detail) page

Reference: in-chat mockup dated 05/27/26 — `Account record layout (HSN)`.

| Block | Content | Status |
|---|---|---|
| Header bar | Account name, Status pill, Priority pill, Org type pill, CRM Use Case tag, Owner avatar, Email button, New Deal button | ☐ |
| Metric tiles (4) | Active Referrals · Lifetime Stays · Lifetime Billed · Days to Pay (all rollups — Phase 3) | ☐ |
| Primary contact card | Avatar, name, role, email, phone, address | ☐ |
| Account health card | Payment Reliability, Credit Terms, Volume Tier, MSA status, W-9/EIN status | ☐ |
| Service profile card | Service Area, Primary Role, Service Mix pills, Properties, Programs, Who They Serve | ☐ |
| Recent placements table | Related list: 4 most recent Deals with stage, program, amount, funder status | ☐ |

### 2.4 Deal record (detail) page

Reference: in-chat mockup dated 05/27/26 — `Deal record layout (Reyes placement)`.

| Block | Content | Status |
|---|---|---|
| Header bar | Deal name, Account pill, Program pill, Stage pill, Assistance Status pill, Contract value tile | ☐ |
| Pipeline strip | Visual stage progression with current stage highlighted | ☐ |
| Tenant card | Name, DOB, SSN (encrypted), Household size, Phone, Special Requests | ☐ |
| Funding card | Account link, Worker, Program, Voucher exp, Assistance, Tenant share | ☐ |
| Stay card | Property, Unit, Check-in, Check-out, Lease type, Rate | ☐ |
| Documents block | File uploads: Voucher, Tenant ID, Lease, etc. | ☐ |
| Payments block | Related list: monthly invoice rows with status | ☐ |
| Activity stream | Notes, payment events (Ramp), stage transitions | ☐ |

---

## Phase 3 — Workflows & Formulas (Week 3)

Logic that makes the system maintain itself.

### 3.1 Formula fields

| Field | Where | Formula logic | Status |
|---|---|---|---|
| Deal Name (auto) | Deal | `Lastname & ", " & Firstname & " — " & Property` | ⚠ blocked — no Tenant Name field on Deal; add Tenant First/Last as Phase 4 enhancement OR have user type it | ☐ |
| Voucher Days Remaining | Deal | `Voucher Expiration - TODAY()` | ☐ |
| Total Contract Value | Deal | `Estimated Assistance Amount` (placeholder — extend when Monthly Rate added) | ☐ |
| Days to Pay (avg) | Account | Avg of (Payment Date − Invoice Date) over last 90 days of Paid Deals | ☐ |
| Payment Reliability (badge) | Account | If Days to Pay < 30 → Good; 30–45 → Delayed; > 45 → Inconsistent; null → Unrated | ☐ |

### 3.2 Rollup summary fields (Account)

| Field | Source | Aggregation | Status |
|---|---|---|---|
| Active Referrals | Deals where Account = this AND Stage ∈ {Funded, Pre Move-in, Active Stay} | COUNT | ☐ |
| Lifetime Stays | Deals where Account = this AND Stage ∈ {Renewed, Departed} | COUNT | ☐ |
| Lifetime Billed | Same as Lifetime Stays | SUM(Estimated Assistance Amount) | ☐ |
| Pending Approvals | Deals where Assistance Status = Pending | COUNT | ☐ |

### 3.3 Workflow rules

| # | Trigger | Action | Status |
|---|---|---|---|
| W1 | Account Status changes Prospect → Active | Task to Owner: "Collect W-9, EIN, MSA, agree credit terms" — due +7 days | ☐ |
| W2 | Account County (Service Area) modified | Auto-populate Preferred Property based on county map | ☐ |
| W3 | Deal Account changes | Auto-fill Nonprofit Organization, Case Worker Name, Case Worker Contact Number, Case Worker Email from Account's primary contact | ☐ |
| W4 | Deal Voucher Days Remaining < 30 | Email + task to Deal Owner: "Voucher expiring — re-cert needed" | ☐ |
| W5 | Deal Management Approval Needed = TRUE | Task to Rob (or COO based on amount): "Approval needed for <Deal Name>" — due +1 day | ☐ |
| W6 | Deal Follow-Up Date = today | Email + task to Deal Owner: "Follow up: <Deal Name>" | ☐ |
| W7 | Deal Stage = Active Stay | Recurring weekly task to Owner: "Check in with case manager" | ☐ |
| W8 | Deal Stage moves to Funded | Required attachments check: Voucher PDF, Tenant ID. Block move if missing. | ☐ |
| W9 | Account Payment Reliability changes to Inconsistent | Notification to Bea, Crystal, Rob | ☐ |

### 3.4 Validation rules

| # | Rule | Status |
|---|---|---|
| V1 | If Organization Type = Government → Tax ID / EIN not required (gov agencies exempt) | ☐ |
| V2 | If Estimated Assistance Amount > $10,000 → Management Approval Needed must be TRUE | ☐ |
| V3 | Cannot set Status = Active without at least one County (Service Area) populated | ☐ |
| V4 | Cannot save Deal in Funded stage without linked Account | ☐ |

---

## Phase 4 — Data Import & Validation (Week 4)

### 4.1 Pre-import checklist

| Task | Status |
|---|---|
| Resolve 2 High-severity Data Quality Flags (HSN/CSC phone duplication) — see import file DQ sheet | ☐ |
| Resolve 4 Medium-severity DQ flags (Sheriff inclusion, Aspire/Help Now county verification, UF Health co-location) | ☐ |
| Confirm county-to-property map with Bea / Crystal | ☐ |
| All Phase 1 picklists defined and values match import file exactly | ☐ |
| All Phase 1 fields visible on Phase 2 forms | ☐ |
| Test workflows in sandbox using 3 dummy records | ☐ |

### 4.2 Import sequence

1. ☐ Import **Accounts** sheet from `ZohoImport_NonprofitAccounts_052726.xlsx` (48 records: 11 Active + 37 Prospect)
2. ☐ Import **Contacts** sheet (11 case workers linked to Active Accounts)
3. ☐ Verify all 48 Accounts tagged `CRM Use Case = Non-Profit Sales`
4. ☐ Verify all 11 Contacts inherited `CRM Use Case` from their parent Account
5. ☐ Spot-check 3 merged records (HSN, Catholic Charities CF, Christian Service Center) for completeness
6. ☐ Run report: "Accounts by Status" — should return 11 Active, 37 Prospect

### 4.3 Post-import verification

| Check | Expected | Status |
|---|---|---|
| Total Account count | 48 | ☐ |
| Active Accounts | 11 | ☐ |
| Prospect Accounts | 37 | ☐ |
| Total Contacts | 11 | ☐ |
| Accounts with Service Area populated | 48 (all) | ☐ |
| Accounts missing Preferred Property | 0 (workflow W2 should auto-populate) | ☐ |
| Records with duplicate names | 0 | ☐ |

---

## Phase 5 — User Acceptance & Training (Week 5)

| Task | Owner | Status |
|---|---|---|
| Bea + Crystal create 3 test Deals end-to-end | Bea, Crystal | ☐ |
| Rob reviews 2 Account record pages, 2 Deal record pages | Rob | ☐ |
| Kate validates DQ flags resolved correctly | Kate | ☐ |
| Reports/dashboards built: Pipeline by stage, Active Stays by Property, Payment Reliability heatmap, Renewal Calendar (next 90 days) | Developer | ☐ |
| 60-min training session with Bea + Crystal | Developer | ☐ |
| 30-min handoff session with Kate | Developer | ☐ |
| Sign-off from Rob to switch from sandbox → production | Rob | ☐ |

---

## Open Decisions (Block Phase 3+ until resolved)

| # | Decision | Options | Owner | Status |
|---|---|---|---|---|
| D1 | One Deal = one stay, or one Deal = one tenant with multiple stays? | (a) One stay (simpler reporting) — recommended (b) One tenant with stay child records (more complex but tracks tenant lifetime) | Rob | ⚠ |
| D2 | Payment Reliability default | (a) Manual rating at onboarding (b) Leave "Unrated" until 5+ closed Deals, then auto-compute — recommended | Rob | ⚠ |
| D3 | Ramp ↔ Zoho payment integration timing | (a) Phase 3 (delays go-live by 2-3 weeks) (b) Phase 6 post-launch — recommended | Rob | ⚠ |
| D4 | Sheriff's Office (Michael Clark) — include as Account? | (a) Include as Government Account (b) Drop — sheriff unusual for housing referrals | Bea / Crystal | ⚠ |
| D5 | Program Type on Account — single or multi-select? | (a) Single (per original spec) (b) Multi-select (orgs handle multiple programs) — recommended | Bea / Crystal | ⚠ |
| D6 | Deal Name convention | (a) `Lastname, First — Property` (b) Add Tenant First/Last fields and auto-generate | Bea / Crystal | ⚠ |

---

## Reference Files

| File | Location | Purpose |
|---|---|---|
| `ZohoImport_NonprofitAccounts_052726.xlsx` | OneDrive /outputs | 48 Accounts + 11 Contacts + DQ flags + field mapping |
| `NON_PROFIT_PARTNERS.xlsx` | Source | 11 active partners (original) |
| `florida_county_agency_outreach__3_.xlsx` | Source | 44 outreach rows across 5 counties |
| Form mockups (in-chat, 05/27/26 + 05/28/26) | Conversation thread | Approved layouts for Account/Deal create forms and detail pages |

---

## Change Log

| Date | Change | By |
|---|---|---|
| 05/28/26 | Initial tracker created | Kate (via Claude) |
| 05/29/26 | Reconciled Cross-Module Dependencies against live Zoho + the 05/27 procurement pivot (Procurement off Deals → `Procurement_Items` custom module). Marked "Pipeline naming" and "Picklist namespace" rows obsolete/de-scoped; added Vendor-vs-Partner layout row; flagged that `CRM Use Case` does not exist yet and must be created in Settings. | Kyle (via Claude) |

---

## Developer Notes

- Run all builds in a Zoho sandbox first. Do not touch production until Phase 4.3 verification passes.
- If a Phase 1 field type changes (e.g. Program Type single → multi), flag it in the change log and re-run the import.
- Procurement and Non-Profit Sales share Accounts and Contacts tables. Every time a field is added to Accounts for either module, confirm it doesn't collide with the other. The `CRM Use Case` tag is the firewall — keep it required.
- Mockups are reference, not specification. Where the mockup and this tracker disagree, the tracker wins.
- Status updates: edit this file directly, update the symbol in the Status column, and commit to wherever Kate stores it.
