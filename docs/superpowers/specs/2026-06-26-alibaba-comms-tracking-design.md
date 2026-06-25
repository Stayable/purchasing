# Alibaba Communications Tracking — Design Spec

**Date:** 2026-06-26
**Author:** Kyle (decisions) / Claude (drafting)
**Status:** Draft for the Jefferson meeting (06/27) — build after meeting confirms the open questions
**Related:** extends the email-only vendor-communications monitor (`api/_comms.js`, `api/_graph.js`, `api/communications.js`, `CommsPanel`). Context: [[alibaba-chat-untracked]].

## Context

The vendor-communications monitor is **email-only** — it reads `purchasing@`/`jefferson@` via Microsoft Graph and matches messages to vendors by `Vendors.Email`. Alibaba Message Center chat is the other major channel and is currently invisible, so a vendor who only talks on Alibaba shows as "no email found / silent," which is misleading now that this portal is the committed system of record (Rob dropped the third-party-system search, 06/25/26).

**Hard constraint:** Alibaba's buyer-side Message Center has no official export/API. Full automatic transcript mirroring only exists via scraping (brittle + against Alibaba ToS) — explicitly out of scope. The achievable goal is **activity signal + the substance Jefferson captures**, merged into the existing per-quote comms timeline and attention logic.

## Decision (Kyle, 06/26/26)

Build **A + B layered**, defer **C** (browser scraping):
- **A — Alibaba email-notification capture (automatic).** If Alibaba emails new-message notifications to the bound mailbox, detect them in the existing Graph sweep, tag them as the "Alibaba" channel, surface the preview, and feed the activity signal. *Gated on confirming notifications actually arrive (Jefferson).*
- **B — Structured manual log (reliable backbone).** A "Log Alibaba message" action in the portal writes a structured entry (date, direction, summary/pasted text) to Zoho; it renders in the same per-quote comms timeline tagged "Alibaba" and feeds the same attention signal.
- **C — deferred.** Brittle + ToS risk + maintenance; revisit only if A+B prove insufficient.

## Open questions for Jefferson (resolve at 06/27 meeting → finalize this spec)

1. **Does Alibaba email new-message notifications to `purchasing@` (or `jefferson@`)?** What sender domain (`@message.alibaba.com`, `@service.alibaba.com`, …)? Do they include a content preview, and do they name the supplier/company?
2. **Is the Alibaba account bound to a shared mailbox we read, or a personal one?** (Determines whether A is even possible without rebinding.)
3. **What does Jefferson need captured per Alibaba exchange?** (price, MOQ, lead time, sample status, free-text?) → defines B's form fields.
4. **Log granularity:** per individual message, or one running log per vendor/quote updated as the conversation evolves?
5. **Volume:** roughly how many Alibaba conversations active at once / messages per week? (Sizing.)
6. **Who logs:** only Jefferson, or others too? (Attribution + permissions.)

## Architecture (to finalize post-meeting)

**Storage (B):** Alibaba log entries live in Zoho, attached to the `Vendor_Quote` (and/or `Procurement_Item`). Candidate: a dedicated child/notes mechanism vs. a structured multiline field. Leaning to **Notes on the Vendor_Quote** (already supported via the activities MCP) with a small JSON/structured convention, OR a purpose field if Jefferson wants strict fields. Decide after Q3/Q4.

**Merge into the timeline:** `api/communications.js` already returns per-quote message threads from Graph. Extend it to also read the quote's Alibaba entries from Zoho and **merge** them into the same `messages[]`, each tagged `channel: "email" | "alibaba"`. `_comms.js` attention logic already evaluates the latest message regardless of source — so an Alibaba entry dated today correctly clears a false "silent."

**Approach A pipeline:** in the Graph sweep, classify messages whose sender domain is Alibaba's as `channel: "alibaba"`, extract preview + supplier name, and attach to a vendor by name-match (fuzzy — flag low-confidence as "Alibaba activity, unmatched"). Lower matching confidence than email (sender is Alibaba, not the vendor), so treat A as an *activity signal + preview*, with B carrying authoritative content.

**UI (`CommsPanel`):** messages already render newest-first with expand-to-read. Add (1) a channel tag/icon per message (Email vs Alibaba), and (2) a "Log Alibaba message" affordance opening a small form → `POST /api/comms-log` → writes the Zoho entry → reloads the thread. Coverage label updates from "Email only" to reflect Alibaba logging.

## Testing (to detail in the plan)

- Pure merge/classify logic in `_comms.js` (email + alibaba entries → ordered thread; attention across channels) — unit tests first (TDD), mirroring the existing comms tests.
- `POST /api/comms-log` — auth-gated, validates itemId/quoteId, writes to Zoho; node test for the payload builder + guards.
- Alibaba-notification classifier (A) — pure function: sender-domain → channel + parsed preview/supplier; unit tested with sample notification shapes (collect a real sample from Jefferson first).
- Portal: the log form + channel tags render; existing comms tests stay green.

## Out of scope

- Full Alibaba transcript scraping / RPA / browser extension (Approach C).
- Any change to the email matching or the RBAC/Graph setup.

## Self-review notes

- Storage choice (Notes vs field) is intentionally left as a post-meeting decision (depends on Q3/Q4) — flagged, not a hidden TBD.
- A's vendor-matching is acknowledged as fuzzy; B is the authoritative-content path, so the design doesn't over-rely on A.
