# Zoho CRM Procurement Process Guide
**Organization:** RISE8 Companies / Stayable Extended Stay Suites  
**Prepared by:** Jefferson Gomez, Purchasing Specialist  
**Date:** May 29, 2026  
**Intended For:** Zoho Developer / MCP Administrator  

---

> ⚠️ **Reconciliation note (05/29/26):** Jefferson's **process** here — 3 competing quotes → compare → approve the winner → PO — is correct and adopted. The **module mapping** (Products + Quotes + Deals + Purchase Orders) is **redirected** to the item-centric architecture: procurement lives in the live `Procurement_Items` custom module, and multi-vendor bidding is captured in a **`Contact_Tracking` subform** on that module (`ZohoModuleSpec_ContactTrackingSubform_052926.md`), not on Deals/Quotes. This guide was written against the NonProfit/Vendor-Selection Deals layout (noted in §"Current Layout Notes") — that layout belongs to Kate's non-profit build, not procurement. Reusing the standard Deals/Quotes/Products/PO suite would reintroduce the module sprawl that ended the v1 deployment. Steps below are still useful as the workflow reference; substitute "Procurement Item record + Contact Tracking subform" wherever this doc says "Deal + 3 Quotes." See `ZohoCRM_Rollout_052126.md` decision log (05/29/26).

---

## Overview

This document captures the intended procurement workflow for Stayable using Zoho CRM. The goal is to support a **3-quote vendor selection process** where the purchasing team creates competing quotes for a single item, links them to a Deal record, and routes the winning quote to a supervisor for approval before converting it to a Purchase Order.

The CRM instance is configured with a **NonProfit / Vendor Selection layout** — field names in this guide reflect that custom layout.

---

## Module Map

| Zoho Module | Procurement Purpose |
|---|---|
| **Products** | The item being procured (line item used across all quotes) |
| **Quotes** | One record per vendor — 3 quotes per procurement item |
| **Deals** | Groups all 3 quotes under one procurement event |
| **Approval Process** | Routes the winning quote to the supervisor for sign-off |
| **Purchase Orders** | Final PO created after supervisor approves winning quote |
| **Vendors** | Vendor master records linked to quotes |

---

## Process Flow

```
1. CREATE ITEM in Products
        ↓
2. CREATE DEAL (procurement event)
        ↓
3. CREATE 3 QUOTES (one per vendor) → link each to the Deal
        ↓
4. COMPARE quotes via Deal's Quotes subpanel
        ↓
5. CHANGE winning quote Stage → triggers Approval Process
        ↓
6. SUPERVISOR APPROVES in CRM (email notification + mobile)
        ↓
7. CONVERT approved Quote → Purchase Order
```

---

## Step-by-Step Instructions

### Step 1 — Add the Item to Products

1. Navigate to **Products** in the left sidebar
2. Click **New Product**
3. Enter item name, description, unit price, and SKU
4. Save

> This product record becomes the standard line item referenced across all 3 vendor quotes, keeping pricing comparisons clean.

---

### Step 2 — Create the Deal (Procurement Event)

1. Navigate to **Deals** in the left sidebar
2. Click **Create Deal** (top right)
3. Fill in the following fields:

| Field | Value |
|---|---|
| **Deal Name** | Descriptive item + purpose (e.g., *"Emergency Exit Signs — Vendor Selection"*) |
| **Stage** | Needs Analysis |
| **Pipeline** | Standard |
| **Property** | Select the applicable Stayable property |
| **Closing Date** | Target decision date (required to save) |

4. Save

> The Deal acts as the procurement "container." All 3 vendor quotes will be linked here so they can be reviewed side by side.

---

### Step 3 — Create 3 Quotes (One Per Vendor)

For each vendor:

1. Navigate to **Quotes** in the left sidebar
2. Click **Create Quote**
3. Fill in:

| Field | Value |
|---|---|
| **Subject** | Item name (e.g., *"Emergency Exit Signs"*) |
| **Quote Stage** | Draft |
| **Account Name** | Vendor company name |
| **Deal Name** | Select the Deal created in Step 2 |
| **Line Items** | Add the Product from Step 1; enter vendor's unit price and qty |

4. Save
5. Repeat for all 3 vendors

> All 3 quotes will now appear in the **Quotes subpanel** at the bottom of the Deal record.

---

### Step 4 — Compare Quotes

1. Open the Deal record
2. Scroll down to the **Quotes subpanel**
3. All 3 vendor quotes are visible with Grand Totals
4. Select the winning vendor

---

### Step 5 — Submit for Approval

1. Open the winning quote
2. Click **Edit**
3. Change **Quote Stage** to the stage configured to trigger the Approval Process (e.g., *"Approved"* or *"Pending Approval"* — confirm with admin)
4. Save
5. The Approval Process fires automatically — supervisor receives a notification

---

### Step 6 — Supervisor Approves

The supervisor (approver) will:
- Receive an **email notification** with a direct link to the quote
- Or approve via the **Zoho CRM mobile app** (one tap)
- Or log in to CRM → navigate to the pending record and click **Approve** or **Reject**

> While pending approval, the quote record is **locked** and cannot be edited.  
> If rejected, the purchasing team can resubmit within 60 days.

---

### Step 7 — Convert to Purchase Order

Once approved:

1. Open the approved quote
2. Click the **Convert to Purchase Order** button (or custom button if configured)
3. All line item details carry over automatically
4. Save the PO

---

## Developer / Admin Configuration Requirements

The following must be configured by the Zoho admin before this workflow is live:

### 1. Approval Process Setup

**Path:** `Setup → Process Management → Approval Processes → Add Approval Process`

| Setting | Value |
|---|---|
| **Module** | Quotes |
| **Trigger** | Record Edit |
| **Rule Criteria** | Quote Stage = [chosen approval-trigger stage] |
| **Approver** | Assign by Role, specific User, or Manager hierarchy |
| **On Approve Action** | Update Quote Stage to "Approved" + notify record owner |
| **On Reject Action** | Update Quote Stage to "Rejected" + notify record owner |

> Approver can be set as: Manager (direct manager of record owner), specific named users, or by CRM Role. Configure based on org chart.

### 2. Quote Stage Values to Add/Confirm

Ensure the following stages exist in the **Quote Stage** picklist:

- `Draft` ← purchasing team works here
- `Pending Approval` ← triggers approval process
- `Approved` ← set by approval process on approval
- `Rejected` ← set by approval process on rejection

**Path to edit:** `Setup → Customization → Modules and Fields → Quotes → Fields → Quote Stage`

### 3. Deal–Quote Relationship

Confirm that the **Deal Name** lookup field is visible and editable on the Quote create/edit form under the current NonProfit layout.

**Path:** `Setup → Customization → Modules and Fields → Quotes → Layouts`

### 4. Convert to Purchase Order Button

Confirm or create the **Convert to PO** button on the Quote detail page.

**Path:** `Setup → Customization → Modules and Fields → Quotes → Links and Buttons`

> If the button does not exist, a custom Deluge function can be written to auto-populate PO fields from the Quote record. Reference: [Zoho CRM — Create Purchase Orders from Quotes](https://www.zoho.com/crm/resources/tips/functions-create-purchase-orders-from-quotes.html)

### 5. Supervisor / Approver User Role

Ensure the approving supervisor has:
- An active Zoho CRM user account
- The **Approver** permission enabled on their Role
- Email notifications turned on for Approval requests

**Path:** `Setup → Users & Control → Users → [Supervisor] → Role`

---

## Current Layout Notes

- The Deals module uses a **NonProfit Deal Information** layout with custom fields: Master Agreement Link, Property, Nonprofit Organization, Fund Source / Program Type, Case Worker Name, Case Worker Contact Number, Assistance Status
- The **Property** field dropdown should match all active Stayable properties
- Deal Name field was not visible in the top section of the create form during initial testing — confirm field visibility in layout editor

---

## Reference: Active Stayable Properties

| Property | ID |
|---|---|
| Jacksonville West | 6802 |
| Jacksonville North | 812 |
| Kissimmee East | 2295 |
| Kissimmee West | 5399 |
| St. Augustine | 2535 |
| Lakeland | 4645 |
| Davenport | 44199 |
| Orlando OBT | 8700 |

---

## Questions / Open Items for Dev

- [ ] What stage name should trigger the Approval Process? (Confirm with Rob / supervisor)
- [ ] Is the "Convert to PO" button already configured on Quote detail pages?
- [ ] Does the NonProfit Deal layout expose the **Deal Name** field on the create form?
- [ ] Who is the designated approver — specific user, manager hierarchy, or role-based?
- [ ] Should approval be required for all quotes or only above a certain dollar threshold?

---

*This guide is based on the default Zoho CRM module structure and the current RISE8 / Stayable NonProfit CRM layout as observed on May 29, 2026. Screenshots available upon request.*
