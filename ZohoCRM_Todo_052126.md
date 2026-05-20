# Zoho CRM Rollout — TODO

**Owner:** Rob Beyer
**Companion doc:** `ZohoCRM_Rollout_052126.md`
**Last Updated:** 05/21/26

Status legend: 🔲 not started · ⏳ in progress · ✅ done · ⚠️ blocked

---

## Phase 1 — Procurement (Active)

### Security & Governance (do these FIRST)

- [ ] 🔲 Enable 2FA on `admin@rentstayable.com` Super Admin account
- [ ] 🔲 Enable 2FA on Jefferson's account (`jefferson@rentstayable.com`)
- [ ] 🔲 Generate and store recovery codes for both accounts in RISE8 password manager
- [ ] 🔲 Document Super Admin recovery procedure in case Rob's account is locked
- [ ] 🔲 Confirm `admin@rentstayable.com` is a real Microsoft 365 mailbox (not a forwarding alias)

### Email Integration

- [ ] 🔲 Connect Jefferson's personal mailbox (`jefferson@rentstayable.com`) via IMAP/OAuth
  - Setup → Channels → Email → IMAP Configuration
- [ ] 🔲 Add `purchasing@rentstayable.com` as Organization Email (shared mailbox)
  - Setup → Channels → Email → Organization Emails
- [ ] 🔲 Grant Jefferson read + send access to `purchasing@`
- [ ] 🔲 Test inbound: send a test email to `purchasing@` from a Gmail account, confirm it appears in Jefferson's Zoho inbox view
- [ ] 🔲 Test outbound: have Jefferson reply from `purchasing@` inside Zoho, confirm the thread logs against a test record

### Pipeline Configuration

- [ ] 🔲 Rename default Deals pipeline to **"Procurement"**
- [ ] 🔲 Configure stages: Inquiry → Quote Requested → Quote Received → PO Issued → In Production → In Transit → Received → Closed
- [ ] 🔲 Set stage probabilities and forecast categories
- [ ] 🔲 Add custom field on Deals: **Property ID** (dropdown: 6802, 2295, 5399, 2535, 4645, 44199, 812, 8700)
- [ ] 🔲 Add custom field on Deals: **Vendor Country** (China, Vietnam, India, Mexico, USA, Other)
- [ ] 🔲 Add custom field on Deals: **PO Value (USD)**
- [ ] 🔲 Add custom field on Deals: **Expected Ship Date**
- [ ] 🔲 Add custom field on Deals: **Expected Arrival Date**
- [ ] 🔲 Add custom field on Accounts: **Vendor Type** (Overseas Manufacturer, US Distributor, Freight Forwarder, Inspection Service)
- [ ] 🔲 Add custom field on Accounts: **Alibaba Profile URL**

### Module Cleanup (prevent sprawl)

- [ ] 🔲 Disable Quotes module
- [ ] 🔲 Disable Invoices module
- [ ] 🔲 Disable native Vendors module (we use Accounts with Vendor Type tag instead)
- [ ] 🔲 Disable Price Books module
- [ ] 🔲 Disable Sales Orders module
- [ ] 🔲 Disable Purchase Orders module (we use Deals instead)
- [ ] 🔲 Disable Campaigns module
- [ ] 🔲 Disable Visits module
- [ ] 🔲 Hide Forecasts module from Phase 1 nav

### Products Module (SKU catalog)

- [ ] 🔲 Activate Products module
- [ ] 🔲 Define top-level product categories (Mattresses, Linens, Case Goods, FF&E, OS&E, Lighting, Appliances)
- [ ] 🔲 Add initial SKU set for mattresses (size × type × thickness)
- [ ] 🔲 Configure Products to attach to Deals as line items

### Data Import

- [ ] 🔲 Source current Alibaba vendor list (check Ramp transactions, past emails, Jefferson's records)
- [ ] 🔲 Format vendor list to Zoho Accounts import template
- [ ] 🔲 Import vendors as Accounts with Vendor Type = "Overseas Manufacturer"
- [ ] 🔲 Identify primary Contact for each vendor (sales rep) and link
- [ ] 🔲 Log 1–2 active in-flight Alibaba orders as test Deals to validate structure

### Workflow Rules (automation — set up AFTER data is in)

- [ ] 🔲 Auto-assignment rule: emails to `purchasing@` auto-create or attach to matching Vendor Account
- [ ] 🔲 Stage change notification: alert Rob when any Deal >$10k moves to "PO Issued"
- [ ] 🔲 Stale Deal alert: notify Jefferson when a Deal sits in "Quote Requested" >7 days

### Training & Handoff

- [ ] 🔲 30-minute walkthrough with Jefferson on Procurement pipeline
- [ ] 🔲 Document common workflows (new vendor inquiry, PO issuance, shipment tracking) in a quick-reference card
- [ ] 🔲 Confirm Jefferson is logging Deals daily for 2 consecutive weeks before Phase 2 starts

---

## Phase 1 Validation Checkpoint (target: 06/21/26)

Before moving to Phase 2, verify:

- [ ] 🔲 Jefferson has logged at least 5 active Procurement Deals
- [ ] 🔲 Jefferson is using the system without daily prompting from Rob
- [ ] 🔲 At least one full vendor cycle (Inquiry → Received) has gone through the system
- [ ] 🔲 No major friction points or "this doesn't work for me" complaints from Jefferson
- [ ] 🔲 `purchasing@` email integration is reliable (no missed threads)

---

## Phase 2 — Non-Profit Sales (Bea & Crystal)

### Seat Expansion

- [ ] 🔲 Confirm Phase 1 stability checkpoint passed
- [ ] 🔲 Add 2 seats (total billing: $140/mo monthly or $92/mo annual)
- [ ] 🔲 Invite Bea as Standard user
- [ ] 🔲 Invite Crystal as Standard user

### Mailbox Connections

- [ ] 🔲 Connect Bea's personal mailbox via IMAP/OAuth
- [ ] 🔲 Connect Crystal's personal mailbox via IMAP/OAuth
- [ ] 🔲 Decide on shared `nonprofits@rentstayable.com` alias (recommended) and provision if approved
- [ ] 🔲 If provisioned, connect as Organization Email and grant both Bea and Crystal access

### Pipeline Configuration

- [ ] 🔲 Create second Deal pipeline: **"Non-Profit Sales"**
- [ ] 🔲 Configure stages: Lead → Qualified → Proposal → MOU → Active → Renewing → Lost
- [ ] 🔲 Configure territory assignment: Bea = north FL properties, Crystal = central FL properties (or other agreed split)
- [ ] 🔲 Add custom field on Accounts: **Non-Profit Type** (Housing, Veterans, Faith-Based, Disaster Relief, Government Contract, Other)
- [ ] 🔲 Add custom field on Accounts: **501(c)(3) Status** (Verified, Pending, N/A)
- [ ] 🔲 Add custom field on Deals: **Target Property** (linked to Property ID dropdown)
- [ ] 🔲 Add custom field on Deals: **Estimated Monthly Room Nights**

### Data Import

- [ ] 🔲 Pull non-profit list from Candid (per organization context)
- [ ] 🔲 Filter to Florida-based housing/relief organizations near each property
- [ ] 🔲 Import as Leads (not Accounts — they need to be qualified first)
- [ ] 🔲 Assign Leads to Bea or Crystal based on geography

### Training & Handoff

- [ ] 🔲 60-minute joint walkthrough with Bea + Crystal
- [ ] 🔲 Set weekly Bea/Crystal pipeline review cadence (CRM dashboard)

---

## Phase 3 — Special Projects (Rob + Claude)

Triggered on-demand when Rob has a structured-selection project (bankruptcy attorney, broker selection, etc.).

### When Triggered

- [ ] 🔲 Determine if Rob needs his own dedicated seat at this point (`rb@rise8companies.com`)
- [ ] 🔲 Create third Deal pipeline: **"Special Projects"**
- [ ] 🔲 Configure stages: Sent → Responded → Interviewed → Shortlisted → Selected → Declined
- [ ] 🔲 Set up Zoho BCC dropbox address for auto-logging Rob's outbound emails
- [ ] 🔲 First test project: bankruptcy attorney selection (15 candidates)

---

## Day 90 Review (target: 08/21/26)

- [ ] 🔲 Pull usage report: Deals created, emails logged, stage progressions
- [ ] 🔲 Confirm adoption criteria met (see Rollout doc Section 9)
- [ ] 🔲 Decision: switch to annual billing (saves $48/seat/month) or continue monthly
- [ ] 🔲 Update `ZohoCRM_Day90Review_082126.md` with findings
- [ ] 🔲 Log decision in main Rollout doc decision log

---

## Recurring Maintenance (post-deployment)

- [ ] 🔲 Monthly: review user activity, flag inactive seats
- [ ] 🔲 Quarterly: audit custom fields, remove unused ones
- [ ] 🔲 Quarterly: review module enablement, confirm no sprawl creeping in
- [ ] 🔲 Annually: rotate Super Admin password, regenerate recovery codes
- [ ] 🔲 Annually: review tier (Standard vs. Professional vs. Enterprise) against actual usage
