# Portal Data Layer — Rebuild the 3 Procurement Modules In-App on Neon (Retire Zoho)

**Date:** 2026-06-27
**Status:** DRAFT — awaiting Kyle's review, then `writing-plans`
**Owner:** Kyle (spearhead). **Approver:** Rob (operating-model change — Jefferson moves out of Zoho into the portal).
**Companion:** `docs/ZohoCRM_Rollout_052126.md` (decision log), `docs/ZohoCRM_Todo_052126.md` (tasks)

---

## 1. Context & decision

The portal (`procurement.rentstayable.com`) has become the system everyone looks at — Rob committed to it as the system of record (06/25/26). Today Zoho CRM is the data **store** (three custom modules) and the portal is a **window** that reads Zoho and writes back only approvals. That split means: Jefferson works in Zoho's CRM UI, everyone else lives in the portal, and RISE8 pays ~$105/mo (3 seats × $35) for a backend the portal increasingly duplicates.

**Decision (Kyle, 06/26–27/26):** rebuild the three procurement modules **inside the portal**, backed by the existing Neon Postgres database, with **Excel/CSV import + manual entry + relationships**, and retire Zoho as the procurement store. All three Zoho modules were emptied 06/26/26, so **migration cost is zero** — this is the cheapest possible moment to switch.

Why this is lower-risk than a generic rebuild:
- The portal already defines a **stable JSON data contract** (`/api/procurement` returns `items[] / quotes[] / queue / decisions / spend / counts`). If Neon returns the *same shape*, the entire existing dashboard / board / item-detail / decisions / spend UI keeps working untouched. **We swap the engine, not the app.**
- Neon is **already wired** (`api/_db.js`, `@neondatabase/serverless`, the `db()` helper + `portal_users` / `portal_audit`). We add three tables; we don't stand up new infrastructure.

## 2. Goals / non-goals

**Goals (Phase A):**
- Three Neon tables (`items`, `vendors`, `quotes`) with the two relationships the UI already expects.
- `/api/procurement` reads from Neon, returns the **identical JSON contract** (no front-end rewrite).
- **Excel/CSV import**: upload → map columns → bulk insert (seed Jefferson's real data: 35 items from `jefferson/ItemStaging_Procurement_052926.xlsx`, vendors from `jefferson/IntlVendorContacts_RISE8_052926.md`).
- **Manual add/edit** forms for all three entities, with relationship pickers (quote → item, quote → vendor).
- **Computed landed cost** (replaces Zoho's formula fields).
- Jefferson's real data live in the portal; Zoho no longer needed for daily procurement use.

**Non-goals (deferred to Phase B — explicit YAGNI):**
- Hard **stage-gate enforcement** (the 5-stage validation rules). Phase A keeps `stage` a plain editable field.
- **Attachments** (spec sheets, PO PDFs, certifications) via Vercel Blob.
- **Formal Zoho decommission.** Zoho stays a dormant cold backup until Phase A is proven; cancel/downgrade after.
- Dual-write to both systems (rejected — contradicts the point of dropping Zoho).

## 3. Architecture

```
Browser (existing React SPA, unchanged)
  │  GET /api/procurement        → reads Neon (was: Zoho COQL)   ← engine swap
  │  POST /api/items|vendors|quotes (create/edit)                ← new (manual entry)
  │  POST /api/import            (Excel/CSV → map → bulk insert) ← new
  │  POST /api/award             (approve/award) → writes Neon   ← repoint (was Zoho)
  ▼
Vercel serverless functions (api/*) — session-gated via _auth.js (unchanged)
  ▼
Neon Postgres (api/_db.js) — portal_users, portal_audit (existing) + items, vendors, quotes (new)
```

Auth/session model is unchanged (`_auth.js` — signed cookie, Neon-backed `portal_users`). Every write is audited to `portal_audit` (already built). Real-person attribution continues via the session email, written to `items.approved_by` / row `created_by` / `updated_by`.

## 4. Data model (Neon Postgres)

Mirrors the three retired Zoho modules and the fields the UI contract already consumes. IDs are app-generated text (keep the `id` field a string so the existing front-end, which treats ids as opaque strings, needs no change).

```sql
CREATE TABLE IF NOT EXISTS vendors (
  id           text PRIMARY KEY,            -- e.g. 'v_' || nanoid
  name         text NOT NULL,
  vendor_type  text,                        -- e.g. 'Overseas Manufacturer'
  email        text,
  country      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  created_by   text,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  updated_by   text
);

CREATE TABLE IF NOT EXISTS items (
  id                     text PRIMARY KEY,  -- e.g. 'i_' || nanoid
  name                   text NOT NULL,
  stage                  text,              -- Spec|Bid|Level|FL-Validate|Recommend|Submitted|Approved|Approved-with-Conditions|Declined|Need-More-Info
  property_scope         text,              -- '4645' | 'Portfolio-wide (all 9 properties)' | ...
  est_spend              numeric,
  approver               text,              -- COO | CEO | CEO + IC
  target_qty             integer,
  target_decision_date   date,
  fl_validation_status   text,              -- Passed | Failed | Pending
  spec_sheet_status      text,              -- e.g. 'COO Signed Off'
  decision_notes         text,
  awarded_quote_id       text REFERENCES quotes(id) ON DELETE SET NULL,  -- see note
  approved_by            text,
  approved_at            timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now(),
  created_by             text,
  updated_at             timestamptz NOT NULL DEFAULT now(),
  updated_by             text
);

CREATE TABLE IF NOT EXISTS quotes (
  id            text PRIMARY KEY,           -- e.g. 'q_' || nanoid  (display name 'QT-0001' optional)
  item_id       text NOT NULL REFERENCES items(id)   ON DELETE CASCADE,
  vendor_id     text NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  unit_price    numeric,
  qty           integer,
  freight       numeric,                    -- freight total (currency)
  duty          numeric,                    -- duty/tariff total (currency)  [see §7 — confirm rate vs amount]
  incoterm      text,                       -- DDP required by doctrine; FOB flagged
  lead_days     integer,
  spec_match    text,
  status        text,                       -- Quote_Status
  currency      text DEFAULT 'USD',
  date_received date,
  -- computed landed cost (generated columns; see §7):
  total_landed  numeric GENERATED ALWAYS AS (COALESCE(unit_price,0)*COALESCE(qty,0) + COALESCE(freight,0) + COALESCE(duty,0)) STORED,
  landed_unit   numeric GENERATED ALWAYS AS (CASE WHEN COALESCE(qty,0) > 0 THEN (COALESCE(unit_price,0)*qty + COALESCE(freight,0) + COALESCE(duty,0))/qty ELSE NULL END) STORED,
  created_at    timestamptz NOT NULL DEFAULT now(),
  created_by    text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    text
);

CREATE INDEX IF NOT EXISTS quotes_item_idx   ON quotes (item_id);
CREATE INDEX IF NOT EXISTS quotes_vendor_idx ON quotes (vendor_id);
```

**Circular-FK note:** `items.awarded_quote_id` → `quotes.id` and `quotes.item_id` → `items.id` reference each other. Create both tables without the `awarded_quote_id` FK, then add it via `ALTER TABLE ... ADD CONSTRAINT` (or leave `awarded_quote_id` un-constrained text and enforce in app code). The plan will pick one; both are fine.

**Relationships (what the UI renders today):**
- A **quote** belongs to exactly one **item** (`item_id`) and one **vendor** (`vendor_id`).
- An **item** points to its winning quote (`awarded_quote_id`) → resolves to the awarded vendor name (the contract's `awardedVendorName`).

## 5. Read path — repoint `/api/procurement` to Neon

Replace the two Zoho COQL calls with two Neon queries, then build the **exact same response object** (`items`, `quotes`, `queue`, `decisions`, `spend`, `counts`, `viewer`, `generatedAt`, `live`). Field-by-field mapping is 1:1 with the current proxy (see `api/procurement.js` lines 110–174):

| Contract field | Neon source |
|---|---|
| `items[].spend` | `items.est_spend` |
| `items[].awardedVendorName` | join `items.awarded_quote_id` → `quotes` → `vendors.name` |
| `quotes[].landedUnit / totalLanded` | `quotes.landed_unit / total_landed` (computed) |
| `quotes[].vendorName` | `vendors.name` via `quotes.vendor_id` |
| ... | (remaining fields map directly by name) |

`Cache-Control: private, no-store` + `Vary: Cookie` headers stay (the data-leak fix from 06/16 — must not change).

## 6. Write paths

- **`POST /api/items`, `/api/vendors`, `/api/quotes`** (create + edit; id present = update). Session-gated; writes `created_by`/`updated_by` from the session email; audited. Validate FKs (quote's item_id + vendor_id must exist).
- **`POST /api/award`** — repoint the existing approve/award endpoint from Zoho to Neon: set `items.stage`, `items.awarded_quote_id`, `items.approved_by`, `items.approved_at`. Keep its current request/response contract so the front-end modal is unchanged.
- **`POST /api/import`** — see §8.

## 7. Landed-cost computation

Phase A mirrors the **subset of inputs the Zoho `Vendor_Quotes` module actually captured** (unit price, qty, freight, duty), computed as Postgres `GENERATED` columns (§4):
- `total_landed = unit_price*qty + freight + duty`
- `landed_unit  = total_landed / qty`

⚠️ **Verify before build:** confirm the prior Zoho `Total_Landed_Cost` / `Landed_Cost_Unit` formula and whether `Duty_Tariff` was a **rate (%)** or an **amount**. If it was a rate, the generated column becomes `unit_price*qty*(1+duty_rate) + freight`. Do not guess at build time — read the Zoho formula or ask Jefferson.

The full "Level"-stage landed-cost model (ocean freight, drayage, demurrage, broker, FX ±5%, QC, defect allowance, cost-per-year-of-service vs. US baseline — per `ProjectInstructions_OverseasProc_052626.md` §Level) is **richer than what Zoho stored**. Reproducing it fully is a **Phase B** option; Phase A matches today's UI.

## 8. Excel/CSV import

Flow: **upload file → server parses → returns detected columns → user maps columns to fields → confirm → bulk insert.**
- Parse server-side (a small dependency such as `xlsx`/SheetJS for `.xlsx`, native CSV parse for `.csv`).
- **Per-entity import** (choose target: items / vendors / quotes). Items + vendors are the bulk-load cases (Jefferson's files); quotes are usually manual but importable.
- **Column-mapping UI**: show source headers, let the user map each to a target field; remember a sensible default mapping for the known staging files.
- **Relationships on import:** quotes reference item + vendor by **name** in a spreadsheet → resolve names to ids on insert; report unmatched rows rather than silently dropping.
- **Validation + dry-run:** preview row count + errors before committing; reject the batch on hard errors (missing required field, unresolved FK).
- Source files for the first real load: `jefferson/ItemStaging_Procurement_052926.xlsx` (35 rows: 20 Home Depot + 15 Amazon), `jefferson/IntlVendorContacts_RISE8_052926.md`. **Finalize the column→field mapping by reading the actual file during the plan** — don't hard-code unverified columns.

## 9. UI

Reuse the existing SPA design system (the refined-light/navy system). Add:
- **Add/Edit forms** for item, vendor, quote (modal or page) with relationship pickers (dropdown of items / vendors).
- **Import screen** (upload + mapping + dry-run preview).
- Everything else (dashboard, board, detail, decisions, spend) renders from the unchanged contract — no change.

## 10. Cutover (recommended default — confirm)

**Neon primary, Zoho cold backup.** Repoint the portal to Neon as the live store; leave the (empty) Zoho account dormant as a fallback for a few weeks; cancel/downgrade Zoho seats once Phase A is proven in daily use. Lowest risk, trivial rollback (flip the read source back). Alternatives considered: hard cutover (no fallback) and dual-write (rejected — defeats the purpose).

## 11. Testing

- Unit: landed-cost computation, import column-mapping + name→id resolution, FK validation, the read-shaper (Neon rows → contract JSON) — assert byte-shape parity with the current contract.
- The existing portal + api test suites (21 portal / 26 api) must stay green; the `/api/procurement` shaper tests get a Neon-fixture variant.
- Manual: import the 35-item file into a Neon **branch/dev DB**, confirm all five views render identically to the Zoho-backed version.

## 12. Conventions

- Files follow the repo: serverless in `api/`, SPA in `portal/src`, built into `review/`; `npm run build:portal` + commit both. Schema additions in `db/schema.sql` (idempotent `CREATE TABLE IF NOT EXISTS`).
- Update the decision log in `ZohoCRM_Rollout_052126.md` and the Todo when this lands (three-doc sync rule).

## 13. Open questions for Kyle (resolve at review)

1. **Cutover** — confirm "Neon primary, Zoho cold backup" (§10) or override.
2. **Landed-cost / `Duty_Tariff`** — rate or amount? (§7) Needed for the generated column.
3. **Phase A scope** — is manual add/edit + import enough for v1, with stage-gates + attachments in Phase B? (recommended) Or pull anything from B forward?
4. **Display ids** — keep human-friendly `QT-0001` quote labels, or just internal ids + item/vendor names in the UI? (cosmetic)
