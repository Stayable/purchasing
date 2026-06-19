# Vendor Communications in the Review Portal — Design

**Date:** 2026-06-19
**Author:** Kyle Estocapio (`bke@rise8companies.com`) w/ Claude
**Status:** Design — pending user review
**Project:** RISE8 / Stayable overseas-procurement Zoho rollout — portal feature
**Companion docs:** `docs/ZohoCRM_Todo_052126.md`, `Zoho_Architecture.md`, `specs/PortalAwardWrite_Procurement_061526.md`

---

## 1. Why this exists

The original reason for adopting Zoho CRM was to **track vendor communications** — quotes, follow-ups, replies — so nothing gets missed. The portal work to date focused on the *award* step. When the award flow was shown to Rob, he asked the load-bearing question:

> "How will the vendor quotation emails show in the procurement items?"

That exposes a real architecture gap: **Zoho auto-associates inbound email to Contacts/Accounts, not to the custom `Procurement_Items` module.** A quotation email lands on the vendor's Contact record with no link up to the item it's a quote *for*. Rob — who reviews in the portal by design (06/02 decision: minimize his Zoho interaction) — has no consolidated view of the back-and-forth per item.

**Goal:** On each Procurement Item in the portal, show the full email correspondence with each quoting vendor — vendor messages *and* our replies — threaded chronologically, at the **per-quote** grain, so Rob can monitor the process (vendor quoted → we asked for a revision → they re-sent → we awarded).

**Critical reframe (06/20):** Rob's stated need — *"so he won't miss any"* — is a **triage** need, not just an archive. A per-item drill-down answers *"what's the status here?"* but not *"where am I about to drop the ball?"* — and the second is the one Rob raised. So this feature is a comms **monitor**, not just a comms **viewer**: the per-quote thread panel is paired with a **cross-item attention signal** (which vendors are awaiting our reply / have gone silent) surfaced on the item queue, and an explicit **email-only coverage boundary** so the absence of email is never mistaken for "nothing is happening" (the vendor may be on Alibaba chat).

## 2. Scope

### In scope
- A read-only **"Communications" panel** on portal item detail, surfaced **per `Vendor_Quote`** (each quote row → that vendor's thread) plus an item-level rollup.
- A **cross-item attention signal**: badges on the item queue/list — *"vendor replied — awaiting our response"* and *"thread silent ≥7 days"* — plus an optional "Communications needing attention" view. This is what makes it a monitor, not an archive.
- An explicit **email-only coverage label** on every comms surface ("Email only — Alibaba chat not shown"), so empty ≠ "nothing happening."
- A Graph-backed Vercel endpoint (`api/communications.js`) that reads scoped M365 mailboxes, matches messages to vendors, threads them, derives the attention state, and returns shaped JSON.
- Inbound **and** outbound (our replies) — both directions, because Graph reads the whole mailbox incl. Sent Items.
- Attribution model **A** (vendor-scoped) for MVP, with **B** (subject-token item precision) specced as a later phase.

### Out of scope (this spec)
- **Portal information-architecture restructure** (make `/review` the root, fold landing + `/tracker` + one-pagers into the SPA, redesign) — **separate spec #2**. The comms panel is independent of where the SPA is mounted.
- **Alibaba in-platform chat** — no API/IMAP/export exists; structurally unsyncable. A process problem (push vendors to email), not solvable here. Called out so Rob knows the coverage boundary.
- **Writing/sending email from the portal** — read-only only.
- **Pushing comms into Zoho via Deluge** — deferred; portal is Rob's surface, Zoho stays the procurement record. Revisit only if Jefferson needs threads visible while operating *inside* Zoho.
- **AI summarization of threads** — optional later enhancement, not MVP.
- **Manual "it's in Alibaba chat" note** — a Jefferson-entered note flagging that the latest movement is off-email. Deferred (needs a Zoho field or reuse of an existing note path); the email-only *label* ships now, the manual note comes later.

## 3. Architecture

```
Portal (React SPA, item detail)
   │  GET /api/communications?itemId=<id>   (session-gated, same auth as other portal endpoints)
   ▼
api/communications.js (Vercel function)
   │  1. Resolve item → quotes → vendors → vendor contact email addresses   (Zoho read, server-side)
   │  2. Authenticate to Microsoft Graph (app-only / client-credentials)
   │  3. Query each SCOPED mailbox for messages to/from those addresses (Inbox + Sent Items)
   │  4. Group by vendor + conversationId; interleave inbound/outbound chronologically
   │  5. Apply attribution (A: all-with-vendor; B: filter by subject token when present)
   ▼
Microsoft Graph  →  purchasing@ , jefferson@   (scoped via Application Access Policy)
```

### Source-of-truth split (unchanged principle)
- **Zoho** = procurement system of record (items, quotes, award, decisions).
- **Microsoft 365** = where email lives; not duplicated into Zoho.
- **Portal** = the window that joins them at read time. No email is copied or stored long-term.

### Microsoft Graph access — app-only, scoped
- **App registration** in Entra ID (Azure admin available): client credentials flow, **application** permission `Mail.Read`, admin consent granted.
- **Mailbox scoping is mandatory.** App-only `Mail.Read` grants *all* mailboxes by default — unacceptable. Constrain via a **mail-enabled security group** (members: `purchasing@`, `jefferson@`) bound with `New-ApplicationAccessPolicy`. Document the exact steps for Kyle.
- **Initial scoped mailbox set:** `purchasing@rentstayable.com`, `jefferson@rentstayable.com`. Extensible via env var (`GRAPH_MAILBOXES`) if vendor replies also originate from other mailboxes (e.g. Rob's). Long-term cleaner answer: route all vendor correspondence through `purchasing@` (also finishes the not-yet-built forwarding rule on the Todo).

> **Validated 06/19 probe:** this session's M365 connector is delegated to `bke@` only — searching `purchasing@` returns `403 ErrorAccessDenied`. There is **no shortcut**; reading those mailboxes requires the app-reg + admin consent above. Confirmed the 20 vendor Accounts + their contact-email match key are fully reachable in Zoho via MCP.

### Inert-until-configured
The endpoint returns a graceful "communications not yet connected" state until the Graph env vars are set — same pattern as the Zoho read proxy and the award write-path (build now, lights up when creds land). Portal renders an empty/disabled panel, never an error.

## 4. Matching & attribution

### Vendor match — deterministic
Resolve, server-side, the item's vendor email addresses:
`Procurement_Item` → its `Vendor_Quotes` → each quote's `Vendor` (Account) → that Account's Contact email(s).
A Graph message matches a vendor if its `from` (inbound) or any `to`/`cc` (outbound) address equals a vendor contact address.

> **Build note (from 06/19 probe):** the COQL traversal `Procurement_Item.Item_Name` from `Vendor_Quotes` is **invalid** (`INVALID_QUERY`). Resolve the item→quote→vendor chain via `getRelatedRecords` on the item (related list = Vendor_Quotes) and a follow-up lookup on each quote's `Vendor`, or query `Vendor_Quotes` filtered by the item lookup id directly — not via dotted-name traversal. Confirm exact field API names against live `getFields` at build time.

### Item attribution
A vendor can quote on multiple items, so "emails with vendor X" ≠ "emails about item Y."

- **Model A (MVP):** show *all* correspondence with the vendor, labeled honestly ("All correspondence with {vendor}"). Zero process change, zero AI. Acceptable because the per-quote grain already scopes the human's attention to the right vendor; over-inclusion across items is a known, labeled limitation.
- **Model B (phase 2):** subject-line token `[PI-<item-id-or-number>]`. When present, filter to it → exact item attribution; untokenized threads fall to an "other correspondence with this vendor" bucket. Token can later be auto-injected into outbound replies (template or helper). Deterministic, cheap, no AI.

C (AI fuzzy-match) is explicitly *not* the primary mechanism — at most a future helper to suggest filing for untokenized threads.

## 5. API contract

`GET /api/communications?itemId=<zoho-record-id>` — requires a valid portal session (reuse `api/_auth.js`).

Response (shape):
```json
{
  "itemId": "6342912000001543002",
  "configured": true,
  "attributionMode": "vendor",            // "vendor" (A) | "token" (B)
  "coverage": "email-only",               // surfaced as the UI label; Alibaba chat not included
  "itemAttention": "awaiting-our-reply",  // rollup of vendor states: needs-attention | stale | ok | none
  "vendors": [
    {
      "quoteId": "6342912000001...",       // the Vendor_Quote this thread belongs to
      "quoteName": "QT-0007",
      "vendorName": "Zhejiang Walrus New Material Co., Ltd.",
      "matchedAddresses": ["sales@..."],
      "messageCount": 5,
      "lastMessageAt": "2026-06-17T09:12:00Z",
      "lastDirection": "inbound",
      "attentionState": "awaiting-our-reply", // awaiting-our-reply (last msg inbound) | stale (silent >=7d) | ok | none (no email)
      "daysSinceLastMessage": 3,
      "messages": [
        {
          "id": "AAMk...",
          "conversationId": "AAQk...",
          "direction": "inbound",          // inbound | outbound
          "from": "sales@walrus...",
          "to": ["purchasing@rentstayable.com"],
          "subject": "Re: Quotation — Queen Mattress",
          "preview": "Dear team, attached please find...",
          "receivedAt": "2026-06-17T09:12:00Z",
          "hasAttachments": true,
          "webLink": "https://outlook.office365.com/..."   // open full email
        }
      ]
    }
  ]
}
```
- `configured: false` → portal shows the "not yet connected" state.
- No message bodies stored; `preview` is Graph's `bodyPreview`; full content opens via `webLink` in Outlook.

## 6. Attention state (the monitor logic)

Derived server-side per vendor, rolled up to the item. Reuses the **7-day stale threshold** already set org-wide (06/05/26 — same value as the stale-quote rule, kept consistent):
- `awaiting-our-reply` — the **last message is inbound** (vendor sent, we haven't replied). Highest priority; this is the "about to drop the ball" state.
- `stale` — **no message in ≥7 days** and the last was *ours* (we're waiting on them and they've gone quiet → chase).
- `ok` — recent two-way activity, last message outbound, <7 days.
- `none` — no email matched for this vendor (could mean Alibaba-only — see coverage label; never rendered as "resolved").

Item rollup = the most-urgent vendor state present (`awaiting-our-reply` > `stale` > `ok` > `none`).

## 7. Portal UI

- **Queue/list signal (the monitor — primary value):** item rows show an attention badge driven by `itemAttention` — e.g. amber *"vendor awaiting reply"*, grey *"silent 9d"*. Optional "Communications needing attention" filter/view listing every item+vendor in `awaiting-our-reply`/`stale`. This is what Rob scans to *not miss anything*.
- **Per-quote (primary drill-down):** in the quote-comparison table on item detail, each quote row gets a Communications affordance — a badge ("5 msgs · awaiting our reply · 3d") that expands a chronological thread. Inbound vs our-reply visually distinguished (alignment/label). Each message deep-links to the full email in Outlook.
- **Item-level rollup (secondary):** an item-detail "Communications" section aggregating all vendors' threads, newest-first.
- **Coverage label (everywhere comms render):** persistent *"Email only — Alibaba chat not shown"* note, so an empty/`none` state is never read as "nothing is happening."
- **States:** loading; empty ("no email found for these vendors yet — they may be communicating via Alibaba chat"); not-configured ("communications not yet connected"); error → falls back to empty, never breaks the page.

## 8. Performance, caching, security

- **Caching:** short server-side cache (~60s) per item to avoid hammering Graph on re-open. Edge cache **`private, no-store` + `Vary: Cookie`** — do **not** repeat the 06/16 CDN-shared-cache data leak; this payload is auth-gated and per-viewer.
- **Graph throttling:** batch address filters per mailbox; cap messages per vendor (e.g. latest 25, paginate on demand); log if truncated (no silent caps).
- **Secrets:** `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET`, `GRAPH_MAILBOXES` as Vercel env vars only — never in the repo or client. Client secret rotation noted in the runbook.
- **Governance:** Application Access Policy restricts the app to the two-mailbox security group. Document consent + policy so it's auditable.

## 9. Build sequence

1. Build `api/communications.js` + matching/threading/shaping/**attention-state** logic against the contract above; unit tests with mock Graph payloads; `node --check`. Endpoint returns `configured:false` until env vars exist.
2. Build the portal UI against the contract: **queue attention badges + "needs attention" view**, per-quote thread panel, item rollup, **persistent email-only coverage label**, empty/not-configured/error states; tests.
3. **Kyle (Azure admin, one-time ~1 hr):** app registration, `Mail.Read` application permission + admin consent, mail-enabled security group (purchasing@ + jefferson@), `New-ApplicationAccessPolicy`, set the 4 Vercel env vars, redeploy.
4. Claude verifies end-to-end: token acquisition, a known vendor thread renders on the right item, anon → 401, edge cache private.
5. **Phase 2 (B):** introduce the `[PI-…]` subject token + outbound auto-injection; flip `attributionMode` to `token` with the vendor-scoped fallback bucket.

## 10. Testing

- Unit: address-matching (inbound from-match, outbound to/cc-match, case-insensitivity, multi-address vendors), threading by `conversationId`, chronological interleave, attribution A vs B, truncation flag, **attention-state derivation** (last-inbound → awaiting-our-reply; ≥7d silent → stale; no email → none; item rollup picks most-urgent).
- Endpoint: session gate (anon → 401), `configured:false` path, error → empty fallback.
- Live (post-creds): real vendor thread on a known item; cache headers; scoped-mailbox policy denies an out-of-scope mailbox.

## 11. Open items / decisions captured
- Mailbox set confirmed as purchasing@ + jefferson@ "mostly"; `GRAPH_MAILBOXES` keeps it extensible. **Confirm with Kyle** whether any vendor replies leave from other mailboxes before go-live.
- Token format for phase 2 (`[PI-<id>]` vs `[PI-<sequence>]`) — decide at phase 2; record id is stable, sequence is human-friendlier.
- This feature does **not** depend on portal-restructure spec #2; they can proceed in parallel.
