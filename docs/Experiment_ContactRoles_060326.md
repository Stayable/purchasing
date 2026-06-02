# SANDBOX EXPERIMENT — Zoho Contact Roles (NOT part of the procurement plan)

> 🧪 **This is an isolated evaluation, explicitly OUTSIDE the approved v2 architecture.** It does not change `Zoho_Architecture.md`, the specs, or the build walkthrough. Nothing here is built into the procurement system. Logged separately at Kyle's request so the idea is captured and tested without contaminating the plan of record.

**Date:** 060326 · **Owner:** Kyle · **Status:** Evaluation only.
**Question:** Does Zoho's **Contact Roles** feature replace the `Vendor_Quotes` child module for "one procurement item, multiple vendor contacts across companies"?

---

## What Contact Roles is

A native Zoho feature on the **Deals** module: a `Contact Roles` related list that attaches **multiple Contacts to one Deal**, each tagged with a role from a customizable picklist (Decision Maker, Influencer, Economic Buyer, …). The association is **contact-to-deal**, so the contacts can come from different Accounts — the Deal's single `Account_Name` is unaffected. Up to 100 roles per API call; insert/update/delete via API. A contact's role is **per-deal**, not a global property.

---

## Verdict up front

**Contact Roles does NOT replace `Vendor_Quotes` for procurement bidding.** It solves a different problem (tagging *people* by role), not ours (comparing *commercial offers* on landed cost). Keep the approved plan. Contact Roles is worth a look only for **Track 3 (Vendor / Professional Selection)** — the mini-RFP use case — if that ever runs on Deals. Three hard reasons below.

---

## Why it doesn't fit procurement (the comparison layer)

| # | Constraint | Impact |
|---|---|---|
| 1 | **Deals-only feature.** Contact Roles is native to the standard **Deals** module. Our procurement item lives on the **custom `Procurement_Items` module** (`generated_type: custom`, verified 06/02/26) — deliberately *not* Deals (Deals = Kate's Non-Profit pipeline). Contact Roles is not offered on custom modules. | Can't attach it to our item module at all. *(Confirm in Settings whether this org's edition extends Contact Roles beyond Deals — historically it does not.)* |
| 2 | **Contacts, not Vendors.** Contact Roles links **Contacts** (people). Under v2 the procurement supplier master moved to the native **Vendors** module, and quotes link to Vendors. Contact Roles would reintroduce Contacts-as-suppliers — the thing v2 moved away from. | Wrong entity; breaks the vendor master model. |
| 3 | **No commercial fields.** A Contact Role carries a *role label* and nothing else — no Unit Price, MOQ, Freight, Duty, Inspection, **Landed Cost formula**, Lead Time, Incoterm, Spec Match, Sample Status, or per-quote Spec Sheet upload. | It cannot hold a quote. The entire value of `Vendor_Quotes` — leveling offers on true landed cost — is impossible. |

The user's framing ("multiple vendor contacts to compare across companies") sounds like a match, but the operative word is **compare**: comparison requires per-offer commercial data + the landed-cost formula. Contact Roles has no fields to compare. It answers "who are the people involved," not "whose offer is cheapest all-in."

---

## Where Contact Roles genuinely is useful

- **Stakeholder mapping on a Deal-based workflow** — tagging the buyer, the financial approver, outside counsel, the freight forwarder, the inspection rep, each from a different company, by role. Pure "who's who," no terms.
- **Track 3 — Vendor / Professional Selection (mini-RFPs):** the bankruptcy-attorney-from-15-candidates / broker-selection use case. If that runs on **Deals**, Contact Roles could lightly track the candidate people and their role/relationship — *but* even there, if you need per-candidate **scores or terms**, you still need fields (a child module or subform), which Contact Roles doesn't provide. So it's a partial fit at best.

This matches the original note's own caveat: *"Reserve the junction-module approach for many accounts (not contacts) tied to many items."* Contact Roles is the contacts-to-one-deal tool; `Vendor_Quotes` is the offers-to-one-item tool. Different jobs.

---

## How to run the sandbox test (if we want to, separately)

Use the **2 existing test Deals** — do not touch Procurement_Items.
1. Deals → Settings → enable/confirm the **Contact Roles** related list; customize the role picklist (e.g. Manufacturer, Sourcing Agent, Freight Forwarder, Inspector).
2. Open a test Deal → Contact Roles → add 3 Contacts from **3 different Accounts**, each a different role.
3. Confirm: contacts from different accounts coexist; the Deal's `Account_Name` stays single; roles are per-deal.
4. Probe the limit: there is **nowhere to record a price or landed cost** on a role — confirm the gap firsthand.
5. (Optional API) `Deals/{id}/Contact_Roles` insert/update/delete to confirm programmatic management.

**Success = understanding, not adoption.** Expected conclusion: great for people/roles, useless for offer comparison → file under Track-3 candidate tooling, leave the procurement plan unchanged.

---

## Disposition

- **Procurement (v2):** unchanged. `Vendor_Quotes` remains the bidding/comparison layer.
- **Contact Roles:** parked as a Track-3 evaluation. Revisit when Vendor/Professional Selection is scoped — and even then, pair it with real scoring fields, don't rely on roles alone.
- **Not routed to Rob** as a decision; this is a builder sandbox note.
