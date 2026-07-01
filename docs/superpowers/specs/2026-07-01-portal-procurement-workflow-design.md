# Portal Procurement Workflow — End-to-End Design

**Date:** 2026-07-01 (rev. 2026-07-02 — Jefferson stays in Zoho; portal entry built-but-hidden; Zoho→portal webhook bridge)
**Author:** Kyle Estocapio (with Claude)
**Status:** DRAFT — awaiting Kyle review → writing-plans
**Supersedes/extends:** the current read + award-only portal. Rides on top of the live 3-module Zoho architecture (Procurement_Items, Vendors, Vendor_Quotes). Staying on Zoho — the deferred Neon rebuild (`2026-06-27-portal-data-layer-design.md`) is NOT a prerequisite.

---

## 1. Goal

Implement the full procurement loop so Rob works entirely in the **portal** and Jefferson works entirely in **Zoho** (his preference), with every hand-off pushed as a notification instead of a verbal ping. Zoho remains the system of record; the portal writes to it for Rob's actions and reacts to it for Jefferson's.

**Interim loop (Jefferson in Zoho — what we build now):**

```
Rob        → [Portal: Create Item form] ───────────→ Zoho (Stage: Spec)
                                                           │ notify (portal fires)
Jefferson  ← webapp bell + email ──────────────────────────┘
Jefferson  → [ZOHO: add Vendors + Quotes] ──────────→ Zoho (Stage: Bid)
Jefferson  → [ZOHO: set Stage = Submitted] ────────────────┐ Zoho workflow rule → webhook
Portal     ← /api/hooks/zoho (secret-checked) ─────────────┘
Rob        ← webapp bell + email ──────────────────────────  (quotes ready)
Rob        → [Portal: view quotes + comms] → [Approve/Award] → Zoho (Stage: Approved)
                                                           │ notify (portal fires)
Jefferson  ← webapp bell + email → proceeds (PO/order in Zoho)
```

**Future flip (deferred, built hidden):** the portal's vendor/quote entry forms are built behind a feature flag and **not shown to Jefferson**. If, after the build, the process and UI prove out, we flip his view and he enters quotes in the portal too — at which point those actions fire events directly and the webhook bridge becomes redundant for in-portal items.

## 2. Current state (what already exists — do not rebuild)

- **Read:** `api/procurement.js` — COQL read of Procurement_Items + Vendor_Quotes, shaped for all portal views.
- **Write (approve/award):** `api/award.js` — writes `Stage`, `Awarded_Vendor`, `Portal_Approved_By`, `Portal_Approved_At` back to Zoho. Uses `ZOHO_WRITE_REFRESH_TOKEN` (scope `ZohoCRM.modules.ALL`) — **the write scope for all new create endpoints already exists.**
- **Auth:** `api/_auth.js` (HMAC session cookie), `api/auth/login.js` + `logout.js`, Neon `portal_users` table, allowlist `rb@` / `jefferson@` / `admin@`. Login events already logged to a Neon audit table.
- **Comms:** `api/communications.js` + `api/_comms.js` + `api/_graph.js` — per-quote vendor email threads + cross-item attention sweep (Graph app-only Mail.Read).
- **UI:** React SPA (`portal/src`) — views Home/Board/Decisions/Items/Queue/Spend/Tracker + `ItemDetail`, `QuoteTable`, `DecisionModal`, `CommsPanel`. react-router, login-gated.
- **DB helper:** `api/_db.js` (Neon).

## 3. Roles & permissions

| Action | Where (interim) | Rob (`rb@`) | Jefferson (`jefferson@`) | Kyle (`admin@`) |
|---|---|---|---|---|
| Create procurement item | Portal | ✅ | — | override |
| Add vendors + quotes | **Zoho** | — | ✅ (Zoho) | override |
| Signal "quotes ready" | **Zoho** (Stage=Submitted) | — | ✅ (Zoho) | override |
| Approve / award / decline | Portal | ✅ | — | override |
| View everything | Portal | ✅ | ✅ | ✅ |

- Kyle is **not** a workflow actor — super-admin for testing/support only.
- Enforcement is server-side per endpoint (role from the session user), not just UI hiding.
- The portal's **vendor/quote entry forms are built but gated off** by a feature flag (`PORTAL_ENTRY_ENABLED`, default off / not shown to Jefferson). They exist in the codebase, are tested, and can be enabled per the future flip.
- **Per-user passwords are required** (Phase 0) — the activity log and `Portal_Approved_By` are only trustworthy if each login = one real person. Today all three share `StayableProcess`; reseed unique passwords via `db/hash-password.js` UPSERT → Neon.

## 4. Data model

### 4.1 Zoho (writes/reads — no schema changes needed beyond what's live)

- **Create item** (Rob, portal) → new `Procurement_Items` record, `Stage=Spec`.
- **Vendors + Quotes** (Jefferson, Zoho) → entered natively in Zoho; the portal reads them via `api/procurement.js`.
- **Stage=Submitted** (Jefferson, Zoho) → triggers a Zoho workflow rule that POSTs to the portal webhook.
- **Approve/award** (Rob, portal) → `api/award.js` writes Stage/Awarded_Vendor/stamps.
- Exact API field names are verified with `getFields` at build time (established pattern in this repo).

### 4.2 Neon (new tables)

**`notifications`**
| col | type | notes |
|---|---|---|
| id | serial pk | |
| recipient | text | portal user email |
| type | text | `item_created` \| `quotes_ready` \| `decision_made` |
| item_id | text | Zoho Procurement_Items id (deep-link target) |
| title | text | rendered summary |
| body | text | rendered detail |
| read_at | timestamptz null | null = unread |
| created_at | timestamptz | default now() |

**`activity_log`**
| col | type | notes |
|---|---|---|
| id | serial pk | |
| actor | text | real logged-in user email, or `jefferson@ (via Zoho)` for webhook-sourced events |
| action | text | `item_created` \| `quotes_ready` \| `approved` \| `awarded` \| `declined` (+ `vendor_added`/`quote_added` once the portal entry flip is live) |
| item_id | text | Zoho item id |
| detail | jsonb | action-specific payload (decision note, awarded quote, etc.) |
| created_at | timestamptz | default now() |

Both are written by one shared helper (`api/_events.js`) — it records the activity row, inserts notification rows, and sends the email in a single call per business event so the three never drift. It's invoked from portal write endpoints **and** from the Zoho webhook receiver.

## 5. Endpoints (new)

| Endpoint | Method | Auth | Does |
|---|---|---|---|
| `/api/items` | POST | session, Rob | Create Procurement_Items (Stage=Spec) → event `item_created` → notify Jefferson |
| `/api/hooks/zoho` | POST | shared secret (no session) | Zoho workflow rule calls this when Stage→Submitted → event `quotes_ready` → notify Rob |
| `/api/award` | POST | session, Rob | *(exists)* + event `approved`/`awarded`/`declined` → notify Jefferson |
| `/api/notifications` | GET | session | List current user's notifications (unread first) |
| `/api/notifications/read` | POST | session | Mark one/all read |
| `/api/activity` | GET | session | Activity feed (filter by item_id, actor, action, date) |
| `/api/vendors` | GET/POST | session, Jefferson | **Flag-gated (off).** List/create Vendors — for the future portal-entry flip |
| `/api/quotes` | POST | session, Jefferson | **Flag-gated (off).** Create Vendor_Quotes linked to item+vendor — future flip |
| `/api/items/ready` | POST | session, Jefferson | **Flag-gated (off).** In-portal "quotes ready" (Stage=Submitted) — future flip; interim uses the Zoho webhook instead |

- Session endpoints role-check and 403 on mismatch.
- `/api/hooks/zoho` is **not** session-gated (Zoho can't hold a portal cookie); it authenticates via a shared secret header/token and validates the payload's item id against Zoho before firing.

## 6. Create Item form (Rob)

Fields (mapped to `Procurement_Items`):

| Field | Type | Required |
|---|---|---|
| Item name | text | ✅ |
| Category | picklist: FF&E / OS&E / Appliance / Building Material / Soft Goods | ✅ |
| Property scope | picklist: 9 properties + Portfolio-wide | ✅ |
| Target quantity | number | ✅ |
| Needed-by date | date | — |
| Specs / description | textarea | ✅ |
| US baseline cost/unit | number | — |

Submit → `POST /api/items` → Zoho record at `Stage=Spec` → Jefferson notified. The notification + the item's portal detail page both carry an **"Open in Zoho"** deep-link so Jefferson goes straight to the record to add vendors/quotes.

## 7. Jefferson's vendor + quote entry — TWO modes

### 7.1 Interim (live now): Zoho

Jefferson adds Vendors and Vendor_Quotes natively in Zoho, exactly as today. When the quotes are ready for Rob, he sets the item's **Stage = Submitted** in Zoho. A Zoho workflow rule fires the webhook (§5, §8). No portal interaction required from Jefferson.

### 7.2 Future flip (built hidden behind `PORTAL_ENTRY_ENABLED`): Portal

Built and tested now, shown to no one until we decide to flip Jefferson's view:

- **Quote form:** item fixed; **Vendor** dropdown from `GET /api/vendors` + a **"+ New vendor"** option; cost inputs → landed cost computes in Zoho; optional `Quote_Name`, notes.
- **Inline "create new vendor" (modal):** clicking "+ New vendor" opens the vendor form as a **modal overlay** — the quote form stays mounted underneath so its state is never lost. On save → `POST /api/vendors` → Zoho vendor created → modal closes → dropdown refetches → new vendor auto-selected → quote form exactly as Jefferson left it. (Modal chosen over a new tab for zero-risk in-page state; decision Kyle 07/01.)
- **"Mark quotes ready":** `POST /api/items/ready` (Stage=Submitted), which fires the event directly — making the webhook redundant for in-portal items.

When flipped, `vendor_added`/`quote_added` also start populating the activity log.

## 8. Notifications (webapp + email)

- **Webapp:** a notification center in the app chrome — bell icon + unread count, dropdown list, click → deep-link to the item + mark read. Polls `GET /api/notifications` on load and on an interval; no websockets.
- **Email:** via **Resend** (`from: procurement@rentstayable.com`). One small template per type. Sent inside `api/_events.js`. A send failure is logged but must **not** roll back the Zoho write or the webapp notification (email is best-effort; the in-app notification is the source of truth).

Trigger matrix:

| Event | Fires from (interim) | Recipient |
|---|---|---|
| `item_created` | Portal `POST /api/items` (Rob) | Jefferson |
| `quotes_ready` | **Zoho webhook** `/api/hooks/zoho` (Jefferson set Stage=Submitted in Zoho) | Rob |
| `decision_made` | Portal `POST /api/award` (Rob) | Jefferson |

*(After the future flip, `quotes_ready` can also originate from `POST /api/items/ready`; the webhook stays as a safety net / for any records still moved in Zoho.)*

## 9. Activity log (both views)

- **Per-item timeline** on `ItemDetail` — chronological actor + action for that item.
- **Global feed page** — firm-wide recent activity, filterable by user / action / date.
- Backed by `GET /api/activity`. Read-only; append-only.
- **Interim coverage:** the portal log captures `item_created` (Rob), `quotes_ready` (Jefferson, via Zoho→webhook, actor recorded as `jefferson@ (via Zoho)`), and `approved`/`awarded`/`declined` (Rob). Jefferson's individual vendor/quote adds happen in Zoho and are **not** in the portal log during the interim — they live in Zoho's own record history. They begin appearing in the portal log only after the future entry flip (§7.2). This gap is acceptable and explicitly noted.

## 10. Stage transitions (reuse existing `Stage` picklist)

`Spec` (Rob creates) → `Bid` (Jefferson adds quotes in Zoho) → `Submitted` (Jefferson sets in Zoho → webhook) → `Approved` (Rob awards). No new picklist values. The deeper 11-step lifecycle reconciliation with Jefferson stays parked for Rob and is out of scope here.

## 11. Error handling

- Zoho write (portal action) fails → return the Zoho error, no Neon rows, no partial state.
- Webhook: bad/absent secret → 401; unknown item id → 400 (validate against Zoho before firing); duplicate delivery → de-dupe on `(item_id, type)` within a short window so a re-sent webhook doesn't double-notify Rob.
- Neon insert fails after a successful Zoho write → log it, still return success for the business action (Zoho is the record of truth); non-blocking warning.
- Resend fails → swallow + log; webapp notification still delivered.
- Role mismatch → 403; anonymous → 401 (existing gate).

## 12. Testing

- Unit: `_events.js` (activity + notification + email shaping), role-check helper, webhook secret + de-dupe logic, notification read/unread logic, (flagged) quote landed-cost input mapping.
- Endpoint: each new endpoint — happy path, 401/403, Zoho-failure, Neon-failure-after-success; webhook — good secret, bad secret, unknown item, duplicate.
- UI: create-item form validation; notification bell unread count; activity timeline render; global feed filters; (flag-on) quote form draft survives the vendor modal.
- Repo's existing Vitest (portal) + node test (api) split. Every phase ships green before merge.

## 13. Phased build

- **Phase 0 — Prereqs (Kyle):** Resend sending domain verified (DNS) + `RESEND_API_KEY` in Vercel; unique portal passwords; **Zoho workflow rule** on Procurement_Items (Stage→Submitted → webhook to `/api/hooks/zoho`) + a shared `ZOHO_WEBHOOK_SECRET` in Vercel. *(Resend gates Phase 2 email; the webhook rule gates the Rob-side notify in Phase 2.)*
- **Phase 1 — Create Item (Rob):** `POST /api/items` + Rob's form + server-side role gating + Stage=Spec + "Open in Zoho" deep-link. *No external dependency — buildable immediately.*
- **Phase 2 — Notifications + activity spine + webhook:** Neon `notifications` + `activity_log`, `api/_events.js`, `GET/POST /api/notifications`, `GET /api/activity`, bell UI, global feed, per-item timeline, Resend sender, and the `/api/hooks/zoho` receiver. Wires `item_created` → Jefferson and `quotes_ready` → Rob. **After this + Phase 3 the interim loop is fully live with Jefferson in Zoho.**
- **Phase 3 — Close the loop:** add `approved`/`awarded`/`declined` events + Jefferson notification to `api/award.js`; optional decline note.
- **Phase 4 — (Deferred, built hidden) Portal entry for Jefferson:** `GET/POST /api/vendors`, `POST /api/quotes`, `POST /api/items/ready`, vendor/quote forms + inline-vendor modal with draft preservation, all behind `PORTAL_ENTRY_ENABLED` (off). Enables `vendor_added`/`quote_added` activity. Not shown to Jefferson until the process + UI are validated and Rob signs off on the cutover.
- **Phase 5 — (Optional) reminders:** daily Vercel cron for stale-item reminders, reusing the 7-day threshold + existing attention logic.

## 14. Dependencies & open items

- **Resend domain verification** (DNS) + `RESEND_API_KEY` — Kyle, gates Phase 2 email.
- **Zoho workflow rule** (Stage→Submitted → webhook) + `ZOHO_WEBHOOK_SECRET` — Kyle, gates the Rob-side "quotes ready" notify. Built in Zoho UI (like the validation gates).
- **Unique portal passwords** — Kyle, Phase 0 (trustworthy activity log).
- **`PORTAL_ENTRY_ENABLED` flag** — off by default; the switch that later reveals Jefferson's portal entry.
- Exact Zoho API field names for create payloads — verified via `getFields` at each phase's build.
- Quote **document upload** (attach a quote PDF to a Vendor_Quote) — not in this design; possible Phase 4 add.
- Operating-model note: this keeps Jefferson in Zoho, so it is **not** a cutover — but the future flip (Phase 4 reveal) is, and that still routes through Rob for sign-off.

## 15. Decision log (to mirror into `ZohoCRM_Rollout_052126.md` on approval)

- 07/01/26 — Portal procurement loop approved for build on Zoho. Email via Resend; inline vendor-add = modal; activity log per-item + global; roles Rob creates+approves / Jefferson enters / Kyle admin-override only.
- 07/02/26 — **Jefferson stays in Zoho for the interim** (his preference). Portal vendor/quote entry is built but hidden behind `PORTAL_ENTRY_ENABLED`; reveal only if process + UI prove out (Rob sign-off). "Quotes ready → notify Rob" bridged by a **Zoho workflow rule → `/api/hooks/zoho` webhook** (Stage=Submitted), not a portal button, so Jefferson never leaves Zoho.
