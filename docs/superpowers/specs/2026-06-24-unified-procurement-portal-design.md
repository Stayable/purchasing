# Unified Procurement Portal — Design Spec

**Date:** 2026-06-24
**Author:** Kyle Estocapio (decisions) / Claude (drafting)
**Status:** Approved (design) — pending spec review → implementation plan
**Supersedes/extends:** the deferred "Phase 5 — Portal IA restructure" item in the vendor-communications plan (`docs/superpowers/plans/2026-06-20-vendor-communications-portal.md`).

## 1. Goal

Consolidate the procurement portal from a static landing page + standalone HTML one-pagers + a `/review` React SPA into a **single React application served at the site root**, login-gated as a whole, with every page sharing one design system and real per-page URLs.

Today the deployment is fragmented:
- `index.html` — public static landing (root)
- `ZohoProcurementTracker_052626.html` — pipeline tracker (`/tracker`)
- `RobReviewPortal_Procurement_060326.html` — old review portal (superseded by the SPA)
- `infographics/*.html` — 4 internal one-pagers (Operating Model, Process Infographic, Process V2, Architecture Comparison)
- `portal/` (Vite+React SPA, built into `review/`) — served at `/review`, views Board/Queue/Items/Decisions/Spend + comms; nav by internal view-state, **no URL router**; data login-gated via `/api/procurement` (401 → login overlay).

## 2. Decisions (locked with Kyle, 2026-06-24)

1. **Login-gated everything.** The root URL sits behind a login wall. Visiting `/` (or any route) prompts sign-in; nothing renders until authenticated — including the info/tracker pages.
2. **Fold in all standalone pages** as redesigned pages inside the app: Home/landing, Tracker, Operating Model + Process info, Architecture Comparison. (Data views Queue/Items/Decisions/Spend/Board + Comms already exist and stay.)
3. **Real URLs** via `react-router-dom` (`BrowserRouter`). Old `/review` and `/tracker` links keep working via redirects.
4. **Tracker** = a new **pipeline-by-stage** view reusing the live data hook (not a 1:1 port of the old standalone HTML), since the old tracker overlaps Board/Items.
5. **Info pages** rebuilt in the new design system (conveying the same content), **not** pixel-copies of the existing infographics.

## 3. Architecture & deploy topology

- **Promote the SPA to root.** Vite `base` changes from `/review/` to `/`. The build output is served from the site root; the SPA's `index.html` replaces the static landing `index.html`.
- **Build/deploy pattern unchanged otherwise:** continue committing built assets (no Vercel build step), per the established repo convention (`build:portal` script; built output committed). Confirm Vite `build.outDir` so the committed output lands where `vercel.json` serves root.
- **`vercel.json` rewrites:** catch-all so react-router owns client routing —
  - everything except `/api/*` and static assets → the SPA `index.html`
    (e.g. `{ "source": "/((?!api/).*)", "destination": "/index.html" }`, with asset paths excluded as needed).
  - **Redirects** (301/308) preserving old links: `/review → /`, `/review/(.*) → /`, `/tracker` stays `/tracker` (now an SPA route).
- **Headers:** keep the existing security headers (`noindex`, `nosniff`, `SAMEORIGIN`, referrer policy). The `/api/communications` + `/api/procurement` private/no-store + `Vary: Cookie` behavior is untouched.
- **Files removed once content is ported:** `RobReviewPortal_Procurement_060326.html`, `ZohoProcurementTracker_052626.html`, `infographics/ArchitectureComparison_*.html`, `infographics/ProcurementOperatingModel_*.html`, `infographics/ProcurementProcessInfographic_*.html`, `infographics/ProcurementProcessV2_*.html`. Their information is rebuilt as React pages.
- **CLAUDE.md update:** the "Vercel static deploy depends on `index.html`, `vercel.json`, and `ZohoProcurementTracker_052626.html` staying at root" note is now obsolete — `index.html` becomes the SPA shell, the tracker HTML is removed. Update the structure map + the deploy note, and log the change in `ZohoCRM_Rollout_052126.md` decision log.

## 4. Routing & the whole-app gate

- **Router:** `react-router-dom` `BrowserRouter`. Routes:
  - `/` — Home
  - `/queue` — approval queue
  - `/items` — items + per-quote comms
  - `/decisions` — decisions log
  - `/spend` — spend rollup
  - `/tracker` — pipeline-by-stage
  - `/how-it-works` — Operating Model + Process
  - `/architecture` — Current-vs-Rob reference
  - `*` — not-found → redirect to `/`
- **Whole-app gate:** new endpoint **`GET /api/session`** returns `200 {email}` when the signed session cookie is valid (reuse `api/_auth.js` `sessionEmail`), else `401`. On app mount, an auth-state hook calls it:
  - **401 / no session** → render the existing login screen for *every* route (nothing else shows).
  - **200** → render the app shell + routed pages; store `email` for the "signed in as / sign out" UI.
  - This is required because info/tracker pages don't fetch the data API, so the data-API 401 alone would not gate them. The gate centralizes auth at the shell.
- Login/logout continue to use the existing `api/auth/login.js` / `api/auth/logout.js`. After successful login, re-check `/api/session` and render the app.

## 5. Pages

- **Home (`/`)** — restyled landing/dashboard replacing `index.html`: brand header, quick KPI cards (reuse the existing summary cards), and nav cards into each section. First thing seen after login.
- **Tracker (`/tracker`)** — pipeline-by-stage view: items grouped by `Stage`, reusing the live data hook used by Board/Items. Shows stage counts and per-item summary; not a re-import of the old HTML. (Stuck-item ≥7d highlight optional, consistent with the existing stale threshold.)
- **How it works (`/how-it-works`)** — Operating Model + Process content as clean React content pages in the app design system.
- **Architecture (`/architecture`)** — the Current-vs-Rob architecture reference, same treatment, internal.
- **Queue / Items / Decisions / Spend** — unchanged behavior, now real routes; Items keeps the comms panel + attention badges.

## 6. Design system

Extract the SPA's existing visual tokens and primitives (sidebar, KPI cards, stage/attention badges, quote/data table, modal) into shared components so ported pages match automatically. The Sidebar gains the new nav entries (Home, Tracker, How it works, Architecture) alongside the existing data views. No visual redesign of the existing data views — they define the system the new pages adopt.

## 7. Components & boundaries

- `App` / router shell — owns routing + the auth gate; renders login screen vs. routed app.
- `useSession` hook — calls `/api/session`, exposes `{ status, email }`.
- `Sidebar` — extended nav (existing + new routes), active-route aware.
- New page components: `HomePage`, `TrackerPage`, `HowItWorksPage`, `ArchitecturePage`.
- Existing view components reused as route elements: Queue/Items/Decisions/Spend/Board.
- `api/session.js` — new read-only auth-check endpoint (`sessionEmail` → 200/401), `private, no-store`.

## 8. Testing

- **Vitest:** new pages render; router resolves each path; the gate renders login when `useSession` is unauthenticated and the app when authenticated; Sidebar marks the active route.
- **node:test:** `api/session.js` returns 401 without a valid cookie and 200 `{email}` with one (mirror the `_auth` test pattern).
- **Regression:** existing 24 API tests + existing portal Vitest stay green. Smoke after deploy: anon → login wall at `/`, `/queue`, `/tracker`; old `/review` and `/tracker` resolve (redirect/route); `/api/*` still 401 anon.

## 9. Out of scope

- No change to the procurement data model, Zoho modules, or the comms matching logic.
- No change to the comms `[RAOP]` Azure propagation work (separate track).
- No new data features; this is an IA/consolidation + design-unification effort.
- No public (unauthenticated) pages — explicitly excluded by Decision 1.

## 10. Risks / notes

- **Asset base path:** moving from `/review/` to `/` requires Vite `base: '/'`; verify committed asset URLs resolve at root.
- **Deep-link refresh:** the catch-all rewrite must serve `index.html` for unknown paths or hard refreshes 404. Test `/items` refresh explicitly.
- **Old-link redirects:** confirm `/review` bookmarks (Rob/Jefferson) redirect cleanly.
- **Info-page fidelity:** rebuilt pages convey the same content, not pixel-identical to the old infographics — confirmed acceptable (Decision 5).
