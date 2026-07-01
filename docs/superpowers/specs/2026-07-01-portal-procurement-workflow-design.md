# Portal Procurement Workflow — End-to-End Design

**Date:** 2026-07-01
**Author:** Kyle Estocapio (with Claude)
**Status:** DRAFT — awaiting Kyle review → writing-plans
**Supersedes/extends:** the current read + award-only portal. Rides on top of the live 3-module Zoho architecture (Procurement_Items, Vendors, Vendor_Quotes). Staying on Zoho — the deferred Neon rebuild (`2026-06-27-portal-data-layer-design.md`) is NOT a prerequisite.

---

## 1. Goal

Implement the full procurement loop **inside the portal**, so Rob and Jefferson each work in one place and every hand-off is a notification, not a verbal ping. Zoho remains the system of record; the portal writes to it.

The loop:

```
Rob        → [Create Item form] ──────────────→ Zoho (Stage: Spec)
                                                      │ notify
Jefferson  ← webapp bell + email ────────────────────┘
Jefferson  → [Add Vendors + Quotes in portal] ─→ Zoho (Stage: Bid)
Jefferson  → [Mark "Quotes ready"] ──────────────────┐ notify
Rob        ← webapp bell + email ─────────────────────┘  (Stage: Submitted)
Rob        → [View quotes + comms] → [Approve/Award] → Zoho (Stage: Approved)
                                                      │ notify
Jefferson  ← webapp bell + email → proceeds (PO/order)
```

## 2. Current state (what already exists — do not rebuild)

- **Read:** `api/procurement.js` — COQL read of Procurement_Items + Vendor_Quotes, shaped for all portal views.
- **Write (approve/award):** `api/award.js` — writes `Stage`, `Awarded_Vendor`, `Portal_Approved_By`, `Portal_Approved_At` back to Zoho. Uses `ZOHO_WRITE_REFRESH_TOKEN` (scope `ZohoCRM.modules.ALL`) — **the write scope for all new create endpoints already exists.**
- **Auth:** `api/_auth.js` (HMAC session cookie), `api/auth/login.js` + `logout.js`, Neon `portal_users` table, allowlist `rb@` / `jefferson@` / `admin@`. Login events already logged to a Neon audit table.
- **Comms:** `api/communications.js` + `api/_comms.js` + `api/_graph.js` — per-quote vendor email threads + cross-item attention sweep (Graph app-only Mail.Read).
- **UI:** React SPA (`portal/src`) — views Home/Board/Decisions/Items/Queue/Spend/Tracker + `ItemDetail`, `QuoteTable`, `DecisionModal`, `CommsPanel`. react-router, login-gated.
- **DB helper:** `api/_db.js` (Neon).

## 3. Roles & permissions

| Action | Rob (`rb@`) | Jefferson (`jefferson@`) | Kyle (`admin@`) |
|---|---|---|---|
| Create procurement item | ✅ | — | override (support/test only) |
| Add vendors + quotes | — | ✅ | override |
| Mark "quotes ready" | — | ✅ | override |
| Approve / award / decline | ✅ | — | override |
| View everything | ✅ | ✅ | ✅ |

- Kyle is **not** a workflow actor. He retains super-admin for testing/support only.
- Enforcement is server-side per endpoint (role derived from the session user), not just UI hiding.
- **Per-user passwords are required** (Phase 1) — the activity log and `Portal_Approved_By` are only trustworthy if each login = one real person. Today all three share `StayableProcess`; reseed unique passwords via `db/hash-password.js` UPSERT → Neon.

## 4. Data model

### 4.1 Zoho (writes — no schema changes needed beyond what's live)

- **Create item** → new `Procurement_Items` record, `Stage=Spec`.
- **Create vendor** → new `Vendors` record.
- **Create quote** → new `Vendor_Quotes` record, linked to its item + vendor; landed-cost formula fields compute in Zoho.
- Exact API field names are verified with `getFields` at build time before each create endpoint is wired (established pattern in this repo).

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
| actor | text | real logged-in user email |
| action | text | `item_created` \| `vendor_added` \| `quote_added` \| `quotes_ready` \| `approved` \| `awarded` \| `declined` |
| item_id | text | Zoho item id |
| detail | jsonb | action-specific payload (vendor name, quote id, decision note, etc.) |
| created_at | timestamptz | default now() |

Both are written **synchronously inside the same write endpoint** that performs the Zoho action. One shared helper (`api/_events.js`) records the activity row, inserts notification rows, and sends the email — called once per business event so the three never drift.

## 5. Endpoints (new)

| Endpoint | Method | Role | Does |
|---|---|---|---|
| `/api/items` | POST | Rob | Create Procurement_Items (Stage=Spec) → event: `item_created` → notify Jefferson |
| `/api/vendors` | POST | Jefferson | Create Vendors record → event: `vendor_added` (activity only, no notify) → returns new vendor for dropdown |
| `/api/vendors` | GET | any | List vendors for the quote-form dropdown |
| `/api/quotes` | POST | Jefferson | Create Vendor_Quotes linked to item+vendor → event: `quote_added` |
| `/api/items/ready` | POST | Jefferson | Set Stage=Submitted for an item → event: `quotes_ready` → notify Rob |
| `/api/award` | POST | Rob | *(exists)* + add event: `approved`/`awarded`/`declined` → notify Jefferson |
| `/api/notifications` | GET | any | List current user's notifications (unread first) |
| `/api/notifications/read` | POST | any | Mark one/all read |
| `/api/activity` | GET | any | Activity feed (filter by item_id, actor, action, date) |

All are session-gated; role checks 403 on mismatch. All write endpoints are idempotent-friendly (return the created record so the UI updates without a full refetch).

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

Submit → `POST /api/items` → Zoho record at `Stage=Spec` → Jefferson notified. Rob lands back on the item's detail page.

## 7. Jefferson's vendor + quote entry

### 7.1 Quote form

- Item is fixed (entered from an item's detail page).
- **Vendor** = dropdown fed by `GET /api/vendors`, plus a **"+ New vendor"** option.
- Cost fields (unit cost, quantity, shipping, tariff inputs) → landed cost computes in Zoho on save and is read back.
- Optional `Quote_Name` free-text label (field already exists), Risk/Quote notes.

### 7.2 Inline "create new vendor" (modal)

Clicking **"+ New vendor"**:
1. Opens the vendor-create form as a **modal overlay** — the quote form stays mounted underneath, so its state is never lost.
2. On save → `POST /api/vendors` → Zoho vendor created → modal closes.
3. The vendor dropdown refetches, the **new vendor is auto-selected**, and the quote form is exactly as Jefferson left it.

Modal chosen over a new browser tab because in-page state preservation is zero-risk (decision: Kyle, 07/01).

### 7.3 "Quotes ready"

When Jefferson has entered the quotes he wants Rob to see, a **"Mark quotes ready"** action on the item → `POST /api/items/ready` → `Stage=Submitted` → Rob notified. This is the explicit hand-back signal (not an implicit count).

## 8. Notifications (webapp + email)

- **Webapp:** a notification center in the app chrome — bell icon + unread count, dropdown list, click a notification → deep-link to the item + mark read. Polls `GET /api/notifications` on load and on an interval; no websockets.
- **Email:** via **Resend** (`from: procurement@rentstayable.com`). One small template per type. Sent inside `api/_events.js`. A send failure is logged but must **not** roll back the Zoho write or the webapp notification (email is best-effort; the in-app notification is the source of truth).

Trigger matrix:

| Event | Fires on | Recipient(s) |
|---|---|---|
| `item_created` | Rob creates item | Jefferson |
| `quotes_ready` | Jefferson marks ready | Rob |
| `decision_made` | Rob approves/awards/declines | Jefferson |

## 9. Activity log (both views)

- **Per-item timeline** on `ItemDetail` — chronological actor + action for that item (created by Rob → 3 quotes added by Jefferson → marked ready → awarded by Rob …).
- **Global feed page** — firm-wide recent activity, filterable by user / action / date.
- Backed by `GET /api/activity`. Read-only; the log is append-only.

## 10. Stage transitions (reuse existing `Stage` picklist)

`Spec` (created) → `Bid` (first quote added) → `Submitted` (marked ready) → `Approved` (awarded). No new picklist values. The deeper 11-step lifecycle reconciliation with Jefferson stays parked for Rob and is out of scope here.

## 11. Error handling

- Zoho write fails → endpoint returns the Zoho error, no Neon rows written, UI shows the message (no partial state).
- Neon activity/notification insert fails after a successful Zoho write → log it, still return success for the business action (Zoho is the record of truth); surface a non-blocking warning.
- Resend fails → swallow + log; webapp notification still delivered.
- Role mismatch → 403 before any write.
- Anonymous → 401 (existing gate).

## 12. Testing

- Unit: `_events.js` (activity + notification shaping), role-check helper, quote landed-cost input mapping, notification read/unread logic.
- Endpoint: each new endpoint — happy path, 401, 403, Zoho-failure, Neon-failure-after-Zoho-success.
- UI: create-item form validation; quote form draft survives the vendor modal; notification bell unread count; activity timeline render.
- Follows the repo's existing Vitest (portal) + node test (api) split. Every phase ships green before merge.

## 13. Phased build

- **Phase 0 — Prereqs (Kyle):** verify a Resend sending domain (DNS) + `RESEND_API_KEY` in Vercel; set **unique** portal passwords. *(Resend domain gates Phase 2 email only; Phases 1/3/4 don't need it.)*
- **Phase 1 — Create Item:** `POST /api/items` + Rob's form + server-side role gating + per-item stage set to Spec. *No external dependency — buildable now.*
- **Phase 2 — Notifications + activity spine:** Neon `notifications` + `activity_log` tables, `api/_events.js`, `GET/POST /api/notifications`, `GET /api/activity`, bell UI, global feed page, per-item timeline, Resend sender. Wire `item_created` → Jefferson as the first live trigger.
- **Phase 3 — Jefferson's entry:** `GET/POST /api/vendors` + `POST /api/quotes` + vendor/quote forms + the inline-vendor modal with draft preservation + `POST /api/items/ready` → notify Rob. Emits `vendor_added` / `quote_added` / `quotes_ready`.
- **Phase 4 — Close the loop:** add `approved`/`awarded`/`declined` events + Jefferson notification to the existing `api/award.js`; optional decline note.
- **Phase 5 (optional, deferred):** daily Vercel cron for stale-item reminders, reusing the 7-day threshold + existing attention logic.

## 14. Dependencies & open items

- **Resend domain verification** (DNS) — Kyle, gates Phase 2 email.
- **Unique portal passwords** — Kyle, Phase 1 (trustworthy activity log).
- Exact Zoho API field names for create payloads — verified via `getFields` at each phase's build.
- Quote **document upload** (attach a quote PDF to Vendor_Quotes) — not in this design; flag as a possible Phase 3 add if Jefferson needs it.
- This is an operating-model change (Jefferson moves data entry out of Zoho into the portal) — **still routes through Rob for sign-off** before Jefferson is cut over. Zoho stays a sanctioned parallel path during rollout.

## 15. Decision log (to mirror into `ZohoCRM_Rollout_052126.md` on approval)

- 07/01/26 — Full portal procurement loop (create → notify → quote-entry → review → approve → notify) approved for build on Zoho. Jefferson enters vendors/quotes in the portal (writes to Zoho). Email via Resend. Inline vendor-add = modal. Activity log per-item + global. Roles: Rob creates+approves, Jefferson enters, Kyle admin-override only.
