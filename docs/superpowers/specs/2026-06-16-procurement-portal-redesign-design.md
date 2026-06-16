# Procurement Review Portal — Redesign (React SPA)

**Date:** 06/16/26
**Status:** Design — approved in brainstorm, pending written-spec review
**Owner:** Kyle (exec) · build by Claude
**Supersedes (UI only):** `RobReviewPortal_Procurement_060326.html` (static, dark "terminal" look)

---

## 1. Goal

Replace the single static-HTML review portal at `/review` with a clean, component-based **React SPA** in the style of the in-house `rewards` app, and fold in two flow changes Kyle logged 06/16:

1. **Decision note before submission** → writes to Zoho `Decision_Notes`.
2. **Award = pick a quote first, then Approve** → opens a confirmation modal that requires a "why it won" note, then writes back to Zoho.

The backend that went live 06/16 (auth, read proxy, write path) is **reused as-is** except for one small, additive change to `/api/award` (accept the note). No change to the data model, Vercel project, or domain.

This is a **frontend redesign**, not a re-architecture. Adapts further once Jefferson's portal review lands (expected 06/17).

## 2. Scope

**In:** new React SPA served at `/review`; sidebar dashboard shell; KPI row; two-pane list/detail; quote-comparison table with quote selection; hybrid approve/award modal; decisions log with after-the-fact note edit; reuse of existing auth + read/write APIs; Vercel build wiring so the SPA coexists with the existing static site.

**Out (this spec):** changes to Zoho modules/fields; the `/tracker` page; the landing `index.html`; Jefferson's not-yet-received feedback; OTP/2FA; per-user Zoho OAuth attribution (still deferred); Phase 0.5 webapp decision (separate gate).

## 3. Stack (recommended — confirm in review)

Mirror `rewards`' libraries, modern build:

- **Vite + React 18** (rewards uses CRA/`react-scripts`, which is effectively deprecated and slow — Vite is the modern equivalent, same component model). *Confirm point: match rewards' CRA exactly for consistency, or use Vite.* Recommendation: **Vite.**
- **react-router-dom 6** — view routing (same as rewards).
- **recharts** — spend/board charts (same as rewards).
- **axios** — API calls (same as rewards).
- Plain CSS modules or a small token file for the Stayable brand palette (no heavy UI kit needed; keep bundle lean).

## 4. Deployment / coexistence (the main technical risk — validate first)

The Vercel project currently serves static files (`index.html`, `ZohoProcurementTracker_052626.html`) + `/api/*` serverless functions, with `vercel.json` rewrites (`/review`, `/tracker`). Adding a Vite build must not break those.

**Approach:** SPA lives in a subfolder (e.g. `portal/`), Vite configured with `base: '/review/'`, build output emitted into the deploy as `/review/*`. `vercel.json`:
- `/api/*` → serverless functions (unchanged).
- `/review` and `/review/(.*)` → SPA `index.html` (client-side routing fallback).
- `/`, `/tracker`, infographics → existing static files (unchanged).
- ~~Vercel **Build Command** runs the Vite build~~ — **superseded, see RESOLVED below.**

**RESOLVED 06/16/26 (Task 1, verified on preview):** the Vercel-build approach failed — setting a `buildCommand` (or even just a root `build` script, which Vercel auto-runs) triggers Vercel's single-output-directory model, which errors on this hybrid static-site+`/api` repo (`No Output Directory named "public"`). **Final approach: commit the Vite build output (`review/`) as static files; NO Vercel build.** The root build script is renamed `build:portal` (so Vercel does NOT auto-build and stays a zero-build static deploy serving root files + `review/` + `/api` functions, exactly as before). Rebuild locally with `npm run build:portal` (or `npm --prefix portal run build`) and commit the regenerated `review/` whenever the SPA changes. `vercel.json` only adds the `/review` + `/review/(.*)` → `/review/index.html` rewrites. Proven on the `portal-redesign` preview: `/review` serves the SPA, `/tracker` serves the static tracker, `/api` functions deploy.

## 5. Layout (approved: A+B combined)

**Sidebar dashboard shell** with a **KPI row + two-pane list/detail** main area:

- **Left sidebar:** brand mark; nav — Queue · Board · Items · Decisions · Spend; "signed in as <user> / Sign out" at the bottom.
- **Top of main area:** KPI cards — Pending (Submitted) spend · Approved spend · # over $100K (from `/api/procurement` `spend` + `counts`).
- **Main area:** list (left) + detail (right) two-pane that stacks on mobile.

**Views:**
- **Queue** — items at `Stage = Submitted` (the approval queue); click → detail.
- **Board** — items grouped by Stage (kanban-ish columns or a grouped list).
- **Items** — all pipeline items, sortable by stage/spend.
- **Decisions** — log of decided items (Approved / Approved-with-Conditions / Declined) with notes; supports after-the-fact note edit.
- **Spend** — rollup + a recharts chart (pending vs approved, by tier/property).

## 6. Item detail + approve/award flow (approved hybrid)

Detail pane shows: item header (name, Stage badge, property, target qty, est. spend, approver tier), then the **quote-comparison table** (one row per Vendor_Quote: vendor, landed/unit, total landed, lead, spec match), with a **radio to select the winning quote** (recommended/lowest-landed pre-highlighted), then the action bar.

**Flow:**
1. User selects a quote (radio). `Approve & Award` is disabled until a quote is chosen.
2. Click an action → **confirmation modal**:
   - **Approve & Award** — modal shows the awarded vendor + amount summary + **required** "why it won" note.
   - **Approve w/ Conditions** — same modal; required note = the conditions.
   - **Decline** — modal; required note = the reason; no quote needed, nothing awarded.
3. Confirm → `POST /api/award` → on success, detail refreshes to the decided state.

**On confirm, writes to Zoho:** `Stage` → Approved / Approved-with-Conditions / Declined; `Awarded_Vendor` → selected quote (not on Decline); `Decision_Notes` → the note; `Portal_Approved_By` → session user; `Portal_Approved_At` → today (Date).

**Notes after the fact:** from the Decisions view, edit a decided item's note → note-only write to `Decision_Notes` (reuses the write path; see §7).

## 7. Backend (reused; one additive change)

- **`GET /api/procurement`** — unchanged. Returns `{generatedAt, live, viewer, counts, queue[], items[], quotes[], decisions[], spend{}}`. The SPA renders entirely from this shape.
- **`POST /api/award`** — **extend** to accept an optional `note` and write it to `Decision_Notes` (currently it writes Stage/Awarded_Vendor/Portal_Approved_By/At but **not** the note). Add an `action: "note"` (or equivalent) that updates `Decision_Notes` only, for the notes-after-the-fact edit. Still session-gated; still uses the write-scoped token.
- **`/api/auth/login` · `/api/auth/logout`** — unchanged (HMAC session cookie, Neon-backed user store).
- Auth/session model, Neon `portal_audit`, env vars — unchanged.

## 8. Data flow

SPA boot → `GET /api/procurement` (sends session cookie). 401 → show login screen (POST `/api/auth/login`). Success → hydrate all views from the one payload. Actions → `POST /api/award` → re-fetch `/api/procurement` to refresh. No client-side caching of Zoho data beyond the in-memory fetch (matches the no-store posture set 06/16).

## 9. Non-goals / deferred

- Real-time updates / websockets — re-fetch on action is enough.
- Editing item/quote data in the portal — read + decide only; Jefferson still operates in Zoho.
- Per-user Zoho-native attribution — still the deferred OAuth build.

## 10. Open questions / confirm points

1. **Stack:** Vite (recommended) vs match rewards' CRA exactly?
2. **Deployment:** single Vercel project with a Vite build + static coexistence (preferred) vs a separate project/subdomain for the SPA?
3. **Jefferson's feedback (06/17):** fold into this spec before building, or build the agreed shell first and iterate on his notes?

## 11. Risks

- **Vercel build/static coexistence** (§4) — the one thing to prove before committing to the single-project path.
- Scope creep from Jefferson's feedback — keep this spec as the baseline; treat his notes as a tracked delta.
- Bundle bloat — keep deps to the rewards set (router/recharts/axios); no UI kit.

## 12. Testing

- API contract: SPA renders correctly from a captured `/api/procurement` payload (queue/board/detail/decisions/spend).
- Auth: 401 → login overlay; bad password → error; valid → hydrate.
- Approve/award: each action opens the right modal; note required; confirm posts the correct `/api/award` body; UI refreshes to decided state. Exercise against a `Test_Delete` record, not the 2 demo keepers.
- Deploy smoke test: `/review` SPA loads, `/`, `/tracker`, `/api/procurement` all still work post-build.
