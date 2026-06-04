# Zoho Award Workflow — `Quote_Status → Awarded` stamps the parent item

**For:** Kyle (builder, Zoho super-admin) · **Date:** 060326 · **Status:** SCAFFOLD — ready to build in Zoho UI. Held-state config build (no real data load) is in-bounds; this only wires automation, it does not go live with data.
**Implements:** `specs/ZohoModuleSpec_Quotes_060226.md` §"Award workflow" + `docs/ZohoBuildWalkthrough_Procurement_060326.md` §5 (Task 10 remaining item **b**).
**Architecture of record:** `Zoho_Architecture.md`

---

## What this automates

When a `Vendor_Quotes` record's **`Quote_Status`** is set to **`Awarded`**, stamp the **parent** `Procurement_Items` record's **`Awarded_Vendor`** lookup to point back at that winning quote — structurally enforcing *one award = one quote*. Optionally flip the losing sibling quotes on the same item to `Declined`.

```
VENDOR_QUOTES (Quote_Status → Awarded)
      │  Procurement_Item lookup
      ▼
PROCUREMENT_ITEMS.Awarded_Vendor  ◄── stamped = the awarded quote
```

---

## Why this needs a Deluge custom function (not a plain field update)

Verified against the workflow-rule + field-update MCP schemas (06/03/26):

1. **The value is dynamic — the triggering quote's own record ID.** A workflow *field update* (`createFieldUpdates`) writes only a **static** literal. It cannot write "this record's id."
2. **The target is the parent record (child → parent, cross-module).** A standard field update writes the same record; cross-module writes need a function.
3. **MCP cannot author the function.** A workflow rule's `functions` action only *references* a pre-existing Deluge function by ID; there is no `Create_Functions` operation in the connected Zoho MCP servers. **Custom-function authoring is Zoho-UI-only.**

Net: build the function in the UI, then attach it to a workflow rule (the rule wizard attaches the function inline — so the whole thing is one UI flow). MCP adds nothing to this particular build; do it in Settings.

---

## Verified deployed API names (06/03/26, live org via MCP)

| Object | API name | Type | Note |
|---|---|---|---|
| Module | `Vendor_Quotes` | custom (internal `CustomModule3`) | use `Vendor_Quotes` in Deluge |
| Module | `Procurement_Items` | custom | parent |
| Field | `Vendor_Quotes.Quote_Status` | picklist | values incl. exact `Awarded`, `Declined` |
| Field | `Vendor_Quotes.Procurement_Item` | lookup → `Procurement_Items` | parent link |
| Field | `Procurement_Items.Awarded_Vendor` | lookup → `Vendor_Quotes` | the stamp target |

---

## Step 1 — Create the Deluge custom function

Settings → Developer Space → **Functions** → **New Function**
- **Name:** `stampAwardedVendor`
- **Display Name:** Stamp Awarded Vendor on Item
- **Category:** Automation (Standalone)
- **Arguments:** one argument — name **`vqId`**, type **String**. (Mapped to the triggering quote's record ID in Step 2.)

```deluge
// stampAwardedVendor(vqId)
// Fired when a Vendor Quote's Quote_Status becomes "Awarded".
// Stamps the parent Procurement_Item.Awarded_Vendor = this quote, and
// (optionally) declines the losing sibling quotes on the same item.

quote = zoho.crm.getRecordById("Vendor_Quotes", vqId.toLong());

// Guard: lookup to the parent item must be present (it is a required field).
itemMap = quote.get("Procurement_Item");
if(itemMap != null)
{
    itemId = itemMap.get("id");

    // 1) Stamp the winning quote onto the parent item.
    upd = Map();
    upd.put("Awarded_Vendor", vqId);   // lookup accepts the related record id
    stampResp = zoho.crm.updateRecord("Procurement_Items", itemId, upd);
    info "Award stamp -> " + stampResp;

    // 2) OPTIONAL — decline the losing siblings on the same item.
    //    Leave commented to require the operator to consciously close losers
    //    (per Quotes spec §"Award workflow"). Uncomment to automate.
    /*
    siblings = zoho.crm.searchRecords("Vendor_Quotes", "(Procurement_Item:equals:" + itemId + ")");
    if(siblings != null && siblings.size() > 0)
    {
        for each sib in siblings
        {
            sibId = sib.get("id");
            sibStatus = ifnull(sib.get("Quote_Status"), "");
            if(sibId != vqId && sibStatus != "Declined" && sibStatus != "Awarded")
            {
                d = Map();
                d.put("Quote_Status", "Declined");
                zoho.crm.updateRecord("Vendor_Quotes", sibId, d);
            }
        }
    }
    */
}
else
{
    info "stampAwardedVendor: quote " + vqId + " has no Procurement_Item; skipped.";
}
```

Save. (Standalone function uses the org connection — no extra OAuth scope to configure here.)

> **Note on `Awarded_Vendor` writing back to `Vendor_Quotes`:** `Awarded_Vendor` is a lookup on the *item* pointing to a *quote*. Setting it to `vqId` (the quote's id) is the intended back-reference — confirmed in the 06/02 3-quote test where `Awarded_Vendor` accepted the winning quote.

---

## Step 2 — Create the workflow rule that calls it

Settings → Automation → **Workflow Rules** → **Create Rule**
- **Module:** Vendor Quotes
- **Rule name:** `Award — stamp parent item`
- **When:** *On a record action* → **Edit** (also tick **Create** if a quote can be logged as Awarded outright) → field **Quote Status** is modified.
- **Condition:** `Quote Status` **is** `Awarded`.
- **Instant action:** **Function** → choose **`stampAwardedVendor`** → map the argument:
  - `vqId` → insert the record-ID merge field for this module (the argument-mapping picker lists the Vendor Quote **Id**).
- Save and **activate**.

Behavioral notes:
- Trigger on **edit when Quote Status is modified** (not "any edit") so the function runs only on the status transition, not on every save.
- Re-award edge case: if a user moves the award to a different quote later, that second quote's transition to `Awarded` re-stamps `Awarded_Vendor` to the new quote — correct. (The old winner is not auto-reverted; if sibling-decline is left manual, the operator manages losers.)

---

## Step 3 — Verify (held-state, on the existing `_DELETE` test records)

Re-uses the 06/02 test item + 3 quotes already in the org (flagged `_DELETE`). No new/real data needed.

1. Open the test item's best quote (VendorC — lowest landed cost $56.50).
2. Set its `Quote_Status = Awarded`, save.
3. Open the parent test item → confirm **`Awarded_Vendor`** now points to that quote (QT-000x).
4. If sibling-decline was enabled, confirm VendorA/VendorB quotes flipped to `Declined`; if left manual, confirm they are unchanged (expected).
5. Re-run by awarding a different sibling → confirm `Awarded_Vendor` re-stamps.

**Pass:** parent stamp resolves to the awarded quote on the status transition, and re-award re-points cleanly.

---

## Open decision for Kyle

- **Auto-decline siblings?** Default in this scaffold = **manual** (block commented out), matching the Quotes-spec lean toward conscious loser-closure. Uncomment the optional block in Step 1 to automate. *(This is separate from the stale-bid follow-up timer, which is set to 7 days — Kyle 06/05/26 — and is NOT part of this rule.)*

## Out of scope here
- The 3 **validation-rule gates** (Spec→Bid, FL→Recommend, Awarded→Approved) — those are Validation Rules, built separately (Task 10 item **a**).
- Grouped landed-cost report + Kanban (item **c**), vendor migration (item **d**), `_DELETE` cleanup (item **e**).
