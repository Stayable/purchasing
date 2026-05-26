# Zoho CRM Rollout — TODO

**Owner:** Rob Beyer
**Companion doc:** `ZohoCRM_Rollout_052126.md`
**Last Updated:** 05/26/26

Status legend: 🔲 not started · ⏳ in progress · ✅ done · ⚠️ blocked
Priority legend: **[P1]** critical / blocker · **[P2]** important, after P1s in same phase · **[P3]** defer-able / nice-to-have

---

## Phase 1 — Procurement (Active)

### Security & Governance (do these FIRST)

- [ ] 🔲 **[P1]** Confirm `admin@rentstayable.com` is a real Microsoft 365 mailbox (not a forwarding alias)
- [ ] ⚠️ **[P1]** Enable 2FA on `admin@rentstayable.com` Super Admin account — **ON HOLD per Rob 05/20/26**
- [ ] ⚠️ **[P1]** Enable 2FA on Jefferson's account (`jefferson@rentstayable.com`) — **ON HOLD per Rob 05/20/26**
- [ ] ⚠️ **[P1]** Generate and store recovery codes for both accounts in RISE8 password manager — **ON HOLD per Rob 05/20/26**
- [ ] 🔲 **[P2]** Document Super Admin recovery procedure in case Rob's account is locked

### Email Integration

- [x] ✅ **[P1]** Connect Jefferson's personal mailbox (`jefferson@rentstayable.com`) via IMAP/OAuth — done 05/20/26
  - Setup → Channels → Email → IMAP Configuration
  - **05/26/26 status check:** Configuration Status = Working, Sync Status = Completed. Mail tab appears empty — diagnosed as expected behavior at this stage: no Accounts/Contacts imported yet, so emails do not auto-associate to records. Do NOT reconnect. Once vendor Accounts + Contacts are imported, re-verify. Secondary check: open Email Sync Preferences accordion and confirm date range / folder selection (default IMAP often syncs only forward-from-now, INBOX only).
- [ ] 🔲 **[P1]** Add `purchasing@rentstayable.com` as Organization Email (shared mailbox)
  - Setup → Channels → Email → Organization Emails
- [ ] 🔲 **[P1]** Grant Jefferson read + send access to `purchasing@`
- [ ] 🔲 **[P1]** Test inbound: send a test email to `purchasing@` from a Gmail account, confirm it appears in Jefferson's Zoho inbox view
- [ ] 🔲 **[P1]** Test outbound: have Jefferson reply from `purchasing@` inside Zoho, confirm the thread logs against a test record

### Pipeline Configuration

- [ ] 🔲 **[P2]** Rename default Deals pipeline to **"Procurement"**
- [ ] 🔲 **[P2]** Configure stages: Inquiry → Quote Requested → Quote Received → PO Issued → In Production → In Transit → Received → Closed
- [ ] 🔲 **[P3]** Set stage probabilities and forecast categories
- [ ] 🔲 **[P2]** Add custom field on Deals: **Property ID** (dropdown: 6802, 2295, 5399, 2535, 4645, 44199, 812, 8700)
- [ ] 🔲 **[P2]** Add custom field on Deals: **Vendor Country** (China, Vietnam, India, Mexico, USA, Other)
- [ ] 🔲 **[P2]** Add custom field on Deals: **PO Value (USD)**
- [ ] 🔲 **[P2]** Add custom field on Deals: **Expected Ship Date**
- [ ] 🔲 **[P2]** Add custom field on Deals: **Expected Arrival Date**
- [ ] 🔲 **[P2]** Add custom field on Accounts: **Vendor Type** (Overseas Manufacturer, US Distributor, Freight Forwarder, Inspection Service)
- [ ] 🔲 **[P3]** Add custom field on Accounts: **Alibaba Profile URL**

### Module Cleanup (prevent sprawl)

- [ ] 🔲 **[P2]** Disable Quotes module
- [ ] 🔲 **[P2]** Disable Invoices module
- [ ] 🔲 **[P2]** Disable native Vendors module (we use Accounts with Vendor Type tag instead)
- [ ] 🔲 **[P2]** Disable Price Books module
- [ ] 🔲 **[P2]** Disable Sales Orders module
- [ ] 🔲 **[P2]** Disable Purchase Orders module (we use Deals instead)
- [ ] 🔲 **[P2]** Disable Campaigns module
- [ ] 🔲 **[P2]** Disable Visits module
- [ ] 🔲 **[P3]** Hide Forecasts module from Phase 1 nav

### Products Module (SKU catalog)

- [ ] 🔲 **[P2]** Activate Products module
- [ ] 🔲 **[P3]** Define top-level product categories (Mattresses, Linens, Case Goods, FF&E, OS&E, Lighting, Appliances)
- [ ] 🔲 **[P3]** Add initial SKU set for mattresses (size × type × thickness)
- [ ] 🔲 **[P2]** Configure Products to attach to Deals as line items

### Data Import

- [x] ✅ **[P2]** Source current Alibaba vendor list — received 05/26/26 from Jefferson, **revised 05/26/26** (`For_upload_in_Zoho_1.xlsx`, 19 rows after dedupe)
- [x] ✅ **[P2]** Resolve major data quality issues with Jefferson:
  - ✅ Row 13/23 duplicate — Hangzhou DE & E Smart Home dropped (was the bad row).
  - ✅ Walrus ambiguity — "Walrus Floors" / `@kimayfloors.com` dropped. Zhejiang Walrus retained.
  - ✅ Mesa — collapsed to 1 vendor row with 2 emails separated by `;` (will split into 1 Account + 2 Contacts on import).
- [ ] 🔲 **[P2]** Remaining cleanup on import side (no further Jefferson input needed):
  - GP Batteries kept by Jefferson → set `Vendor Type = Other` (personal Yahoo, American name, not overseas manufacturer pattern); Rob/Jefferson can reclassify post-import.
  - Trim trailing whitespace on rows 5 + 15.
  - Drop the unlabeled leading index column (1–19) — header is misaligned in revised file.
  - Split Mesa row into 1 Account + 2 Contacts (Jessica + sales@).
- [x] ✅ **[P2]** Format vendor list to Zoho **Accounts** import template — produced `outputs/Accounts_RISE8_052626.xlsx` (19 Accounts)
- [x] ✅ **[P2]** Format contacts to Zoho **Contacts** import template — produced `outputs/Contacts_RISE8_052626.xlsx` (20 Contacts; Mesa split into 2)
- [ ] 🔲 **[P1]** Pre-import: confirm Accounts custom field **Vendor Type** is created in Zoho (Setup → Modules → Accounts → Layout). If not created yet, Vendor Type column will fail to map — either create the field first or skip that column on import.
- [ ] 🔲 **[P1]** Upload `Accounts_RISE8_052626.xlsx` FIRST via Setup → Data Administration → Import → Accounts. Map: Account Name → Account Name; Account Type → Account Type; Vendor Type → Vendor Type (custom); Industry → Industry; Billing Country → Billing Country; Description → Description. Set dedupe key = Account Name.
- [ ] 🔲 **[P1]** Then upload `Contacts_RISE8_052626.xlsx` via Setup → Data Administration → Import → Contacts. Map: First Name, Last Name, Email, Account Name (lookup → Accounts), Title, Description. Set dedupe key = Email.
- [ ] 🔲 **[P2]** Post-import cleanup: replace placeholder Last Names with actual surnames as Jefferson confirms them with each vendor.
- [ ] 🔲 **[P2]** Post-import: reclassify GP Batteries Vendor Type from "Other" to correct value (likely US Distributor) once confirmed.
- [ ] 🔲 **[P2]** Log 1–2 active in-flight Alibaba orders as test Deals to validate structure

### Workflow Rules (automation — set up AFTER data is in)

- [ ] 🔲 **[P3]** Auto-assignment rule: emails to `purchasing@` auto-create or attach to matching Vendor Account
- [ ] 🔲 **[P3]** Stage change notification: alert Rob when any Deal >$10k moves to "PO Issued"
- [ ] 🔲 **[P3]** Stale Deal alert: notify Jefferson when a Deal sits in "Quote Requested" >7 days

### Training & Handoff

- [ ] 🔲 **[P2]** 30-minute walkthrough with Jefferson on Procurement pipeline
- [ ] 🔲 **[P2]** Document common workflows (new vendor inquiry, PO issuance, shipment tracking) in a quick-reference card
- [ ] 🔲 **[P2]** Confirm Jefferson is logging Deals daily for 2 consecutive weeks before Phase 2 starts

---

## Phase 1 Validation Checkpoint (target: 06/21/26)

Before moving to Phase 2, verify:

- [ ] 🔲 **[P1]** Jefferson has logged at least 5 active Procurement Deals
- [ ] 🔲 **[P1]** Jefferson is using the system without daily prompting from Rob
- [ ] 🔲 **[P1]** At least one full vendor cycle (Inquiry → Received) has gone through the system
- [ ] 🔲 **[P1]** No major friction points or "this doesn't work for me" complaints from Jefferson
- [ ] 🔲 **[P1]** `purchasing@` email integration is reliable (no missed threads)

---

## Phase 2 — Non-Profit Sales (Bea & Crystal)

### Seat Expansion

- [ ] 🔲 **[P1]** Confirm Phase 1 stability checkpoint passed
- [ ] 🔲 **[P1]** Add 2 seats (total billing: $140/mo monthly, or ~$92/mo savings at annual)
- [ ] 🔲 **[P1]** Invite Bea as Standard user
- [ ] 🔲 **[P1]** Invite Crystal as Standard user

### Mailbox Connections

- [ ] 🔲 **[P1]** Connect Bea's personal mailbox via IMAP/OAuth
- [ ] 🔲 **[P1]** Connect Crystal's personal mailbox via IMAP/OAuth
- [ ] 🔲 **[P2]** Decide on shared `nonprofits@rentstayable.com` alias (recommended) and provision if approved
- [ ] 🔲 **[P2]** If provisioned, connect as Organization Email and grant both Bea and Crystal access

### Pipeline Configuration

- [ ] 🔲 **[P1]** Create second Deal pipeline: **"Non-Profit Sales"**
- [ ] 🔲 **[P1]** Configure stages: Lead → Qualified → Proposal → MOU → Active → Renewing → Lost
- [ ] 🔲 **[P2]** Configure territory assignment: Bea = north FL properties, Crystal = central FL properties (or other agreed split)
- [ ] 🔲 **[P2]** Add custom field on Accounts: **Non-Profit Type** (Housing, Veterans, Faith-Based, Disaster Relief, Government Contract, Other)
- [ ] 🔲 **[P2]** Add custom field on Accounts: **501(c)(3) Status** (Verified, Pending, N/A)
- [ ] 🔲 **[P2]** Add custom field on Deals: **Target Property** (linked to Property ID dropdown)
- [ ] 🔲 **[P2]** Add custom field on Deals: **Estimated Monthly Room Nights**

### Data Import

- [ ] 🔲 **[P2]** Pull non-profit list from Candid (per organization context)
- [ ] 🔲 **[P2]** Filter to Florida-based housing/relief organizations near each property
- [ ] 🔲 **[P2]** Import as Leads (not Accounts — they need to be qualified first)
- [ ] 🔲 **[P2]** Assign Leads to Bea or Crystal based on geography

### Training & Handoff

- [ ] 🔲 **[P2]** 60-minute joint walkthrough with Bea + Crystal
- [ ] 🔲 **[P3]** Set weekly Bea/Crystal pipeline review cadence (CRM dashboard)

---

## Phase 3 — Special Projects (Rob + Claude)

Triggered on-demand when Rob has a structured-selection project (bankruptcy attorney, broker selection, etc.).

### When Triggered

- [ ] 🔲 **[P1]** Determine if Rob needs his own dedicated seat at this point (`rb@rise8companies.com`)
- [ ] 🔲 **[P1]** Create third Deal pipeline: **"Special Projects"**
- [ ] 🔲 **[P1]** Configure stages: Sent → Responded → Interviewed → Shortlisted → Selected → Declined
- [ ] 🔲 **[P2]** Set up Zoho BCC dropbox address for auto-logging Rob's outbound emails
- [ ] 🔲 **[P1]** First test project: bankruptcy attorney selection (15 candidates)

---

## Day 90 Review (target: 08/19/26)

- [ ] 🔲 **[P1]** Pull usage report: Deals created, emails logged, stage progressions
- [ ] 🔲 **[P1]** Confirm adoption criteria met (see Rollout doc Section 9)
- [ ] 🔲 **[P1]** Decision: switch to annual billing (saves ~$48/seat/month) or continue monthly
- [ ] 🔲 **[P2]** Update `ZohoCRM_Day90Review_081926.md` with findings
- [ ] 🔲 **[P2]** Log decision in main Rollout doc decision log

---

## Recurring Maintenance (post-deployment)

- [ ] 🔲 **[P2]** Monthly: review user activity, flag inactive seats
- [ ] 🔲 **[P2]** Quarterly: audit custom fields, remove unused ones
- [ ] 🔲 **[P2]** Quarterly: review module enablement, confirm no sprawl creeping in
- [ ] 🔲 **[P1]** Annually: rotate Super Admin password, regenerate recovery codes
- [ ] 🔲 **[P2]** Annually: review tier (Standard vs. Professional vs. Enterprise) against actual usage
- [ ] 🔲 **[P2]** Monthly: export CRM data backup to OneDrive `/outputs` (insurance against vendor lock or repeat abandonment)
