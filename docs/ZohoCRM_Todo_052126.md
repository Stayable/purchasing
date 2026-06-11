# Zoho CRM Rollout — TODO

**Spearhead:** Kyle Estocapio (`bke@rise8companies.com`) — Vercel admin + Zoho super admin
**Approver:** Rob Beyer (procurement decisions, architectural shifts)
**Operator:** Jefferson Gomez (day-to-day Zoho use)
**Companion doc:** `ZohoCRM_Rollout_052126.md`
**Last Updated:** 06/12/26

Status legend: 🔲 not started · ⏳ in progress · ✅ done · ⚠️ blocked
Priority legend: **[P1]** critical / blocker · **[P2]** important, after P1s in same phase · **[P3]** defer-able / nice-to-have

---

## Top Priorities — Active Sprint (refreshed 05/29/26)

**Done this session (06/12/26):**
- ✅ **Portal login BUILT (per-user password + 30-day signed session) — `16018c4`.** Server-side gate for `/review`: `api/_auth.js` (HMAC-signed HttpOnly+Secure cookie, constant-time password check, allowlist `jefferson@`/`admin@`/`rb@`), `api/auth/login.js` (+ logs `login`/`login_failed` for the access audit), `api/auth/logout.js`; `api/procurement.js` requires a valid session when `SESSION_SECRET` is set; portal login overlay on 401 + "signed in as / sign out". Verified `node --check` + **10/10 auth unit tests**. **INERT until `SESSION_SECRET` is set** (portal stays open/live until then — no regression). **This RESOLVES P1-D** — once activated the endpoint is no longer world-open; no Vercel Pro / password-protection needed. **OTP via Resend = the planned next layer** (plumbing built to accept it; user said "do not do OTP yet").
  - 🔲 **ACTIVATION PENDING (Kyle, ~5 min):** set 4 Vercel env vars — `SESSION_SECRET` (long random) + `PORTAL_PW_JEFFERSON` / `PORTAL_PW_ADMIN` / `PORTAL_PW_ROB` — then Redeploy. Then Claude verifies 401-without-session + login render. *(Kyle said "you can add them yourself + make it changeable" — I can't write Vercel env from here, no CLI/MCP; passwords must NOT go in the repo. They're already changeable via the dashboard. Resolve how he wants the values set.)*
- ✅ **Landing page (`index.html`) — `9d5c51b`:** added **Executive Review (Rob) → `/review`** CTA (was missing), removed the **GitHub "Documentation Repo"** link (no public repo pointer from a world-reachable page).
- ✅ **Ran the `/tracker` pipeline prompt live via MCP (one-off):** 3 active items, all at Spec, all flagged ⚠ STUCK (≥7d) — but stale test data, not a real backlog. **Gap found:** module has **no stage-entry timestamp** → "days at current stage" can only be approximated from `Modified_Time`. If an accurate stuck-clock is wanted, spec a `Stage_Entered_Date` field stamped by a workflow rule. *(`/tracker` itself is still the LLM-prompt demo; real `/api/pipeline` wire-up is the gated Phase 0.5 decision.)*

**Done prior session (06/11/26):**
- ✅ **PORTAL IS LIVE ON REAL ZOHO DATA — P1-A/B/C/E/F + P2-A/B/D done.** `/review` renders live Procurement_Items + Vendor_Quotes through the read-only Vercel proxy, verified by headless render (banner "LIVE"; board Spec=3; detail shows QT-0001/2/3 landed 56.50/57.00/58.00; mock fully replaced; 0 secrets in browser). **Two runbook corrections, now canon:** (1) OAuth scope = `ZohoCRM.coql.READ,ZohoCRM.modules.READ` (modules.READ alone → `OAUTH_SCOPE_MISMATCH`; `modules.all.READ` rejected by console); (2) COQL vendor name = `Vendor.Vendor_Name`, and `Owner.*` not selectable (dropped). Proxy field-name + portal detail-selection fixes committed (`b387c1e`→head).
- ✅ **P1-D access guard — SOLVED 06/12 by the portal login** (see this-session block). No Vercel Pro needed. Remaining: **activate it** (Kyle sets the 4 env vars) + delete the 3 `_DELETE` test records before any real-data load.

**Done prior session (06/09/26):**
- ✅ **#11 — `Gainesville (2900)` added to `Property_Scope` (Kyle, confirmed via MCP `getFields` 06/09/26).** Picklist now carries all 9 properties + Portfolio-wide + None. **Verified it lives on `Procurement_Items` only** — `Vendor_Quotes` and `Vendors` have no property field (quotes read property up through the item lookup; vendors are global). **⚠️ Leftover (Kyle, ~10 sec):** the `Portfolio-wide (all 8 properties)` option label still says **8** — relabel to **9** next time in that screen.
- ✅ **#4 — Stray "Batteries" Account inspected (Claude, MCP).** Confirmed orphan: id `…1418001`, `Vendor_Type` null, created 05/26 14:51:48 (2.5 hr after the 12:24:20 bulk import), **0 linked Contacts**, distinct from `GP Batteries Inc` (`…1416034`). Safe to delete. **No MCP delete tool exists** → 30-sec UI delete remains Kyle's (Accounts → Batteries → Delete).
- ✅ **13a P1-F DONE — portal wired to live Zoho (Claude).** `RobReviewPortal_Procurement_060326.html` now fetches `/api/procurement` on load and re-renders all 5 views (queue, board, detail+quote-compare, decisions, spend) from live JSON, with **mock scaffold as fallback** (any fetch/auth/Zoho failure leaves the mock untouched) and an explicit **empty-state** ("LIVE — 0 items, expected during hold"). Reads optional `?key=` → `x-portal-key` header for shared-secret guard. Stage labels mapped exact-to-live (`Spec…Need-More-Info`); approver-tier badge derived from the live `Approver` picklist. Inline JS syntax-checked (`node --check`). **Renders mock until Kyle's env vars (P1-A/B/C) land — then it lights up automatically.** Next: P2-A verify on a protected Preview against the 3 test records once env vars are set.
- ✅ **Item-load scope RESOLVED = 35 items (Kyle, 06/06/26)** — retired the "197-item filtered purchase report" hunt. Canonical source = Jefferson's `jefferson/ItemStaging_Procurement_052926.xlsx` (35 data rows verified: 20 Home Depot + 15 Amazon top-by-spend, per `JeffersonHandback_052926.md`). The 197 figure originated in the 05/27 test-account source chat (200 rows ≥$100 − 3 fee entries); the underlying file was never located and is no longer needed for Phase 1. **Side effect:** the 5 originally-named Task 5 test items (PTAC9000BTU, PressureWasher4400PSI, MiniSplit23000BTU, ArcWelderAC225S, ExtensionLadder40FT) are NOT in the 35 (closest match: `Seasons9000BtuPa`) — Task 5 test batch must be picked from the staging file instead. Decision logged in `ZohoCRM_Rollout_052126.md`; propagated to `Zoho_Architecture.md` + portal-connect runbook.

**Done prior session (06/04–06/05/26):**
- ✅ **Wired the Rob review portal route** — added `/review` → `/RobReviewPortal_Procurement_060326` to `vercel.json`. **Deep-link verified vs live Zoho via MCP:** `Procurement_Items` → `module_name: CustomModule1` (id `…1418753`); the portal's hardcoded `tab/CustomModule1` is correct — that go-live blocker is cleared. **Headless-Chrome QA passed** — all 5 views render, design matches `index.html`, mock banner + timestamp present. Committed `b4a8961`.
- ✅ **Built Rob-facing operating-model flow one-pager** — `infographics/ProcurementOperatingModel_RISE8_060426.html`: two-tier model (Zoho backend / read-only portal window) + 8-step lifecycle + read-up/deep-link connector + 3 rationale cards. Refined the hero (Rob *can* open Zoho directly anytime) and added an **"automated notifications" callout** (portal+email for Rob; Microsoft Teams for the team). QA-rendered. Commits `503c5d2`, `a6fb65a`. **Not wired to a route** (offered `/model`, awaiting go-ahead).
- ✅ **Property `2900` RESOLVED = Stayable Gainesville (Alachua County)** — confirmed real 9th property by Kyle (was Rob's v2 picklist addition). Canon 8 → 9 across 12 files (CLAUDE.md, Procurement_Items spec, build walkthrough, `Zoho_Architecture.md`, `Update_053026v2`, Rollout decision log, Todo, `/tracker` dropdown, landing table/stat, humidity-rule doctrine + infographic). Commit `7d100a9`. **Remaining action (Kyle):** add `Gainesville (2900)` to the `Property_Scope` picklist in Zoho UI (field-edit is UI-only, no MCP).

**Done this session (05/30/26):**
- ✅ Built local orientation infographic `infographics/ProcurementProcessInfographic_RISE8_053026.html` — self-contained HTML one-pager from `Zoho_Architecture.md`: the model, 5-stage workflow, FL gates, roles, built/partial/proposed/on-hold status board. Local learning artifact, **not** a Vercel deploy file. Committed + pushed to `main`.
- ✅ Reviewed **Rob's 05/30 three-module build spec** (Vendors → Procurement Items → Quotes) against the architecture-of-record; captured verbatim → `docs/ZohoArchitecture_RobFeedback_053026.md`. Finding: Rob's "Quotes" module ≈ the shelved `Vendor_Bids` child module, re-derived + improved (landed-cost formulas, per-quote spec-sheet upload, certifications) → **reopens open decision §13 #1** (subform vs child module).
- ✅ Built `infographics/ArchitectureComparison_CurrentVsRob_053026.html` — visual current-vs-Rob comparison + **Section 5 proposed final design** (3-col Original / Rob's / Recommended).
- ✅ Wrote `docs/ZohoArchitecture_Update_053026v2.md` — recommended final design: **native Vendors** (Rob's, already enabled) + keep custom `Procurement_Items` + build a **Quotes child module**; keep field-based PO; standardize quotes to USD. Open flags: Property `2900` (confirm w/ Rob), Professional custom-module count cap, `Stage`↔`Sourcing_Status` overlap, `Winning_Vendor` disposition.
- ✅ Verified live org = **Professional**; native **Vendors** module already enabled/customizable (Rob touched 04/15) — his "custom modules need Enterprise" caution does **not** hold here.
- ✅ Polished Rob-facing cover note (Kyle sent it).
- ✅ **Loaded 43 Non-Profit Sales partner Accounts** to live Zoho via MCP — `CRM Use Case = Non-Profit Sales`, **Non Profit Accs** layout (`…457398`), each linked 1:1 to its existing Contact; duplicate orgs (Catholic Charities ×3, HSN ×2) kept as per-county records. Kyle added 4 `Organization_type` picklist values. Payload archived `outputs/NonProfitAccounts_Import_053026.json`. Account IDs `…456002`–`…456044`.
- ✅ Organized root → deploy/entry files only. New `infographics/`; moved import CSV + module-layout screenshot → `reference/` (renamed to convention). Updated CLAUDE.md structure map (+`infographics/`, +`jefferson/`) and path refs in Todo/RobFeedback/Update v2. **All committed + pushed to `main`** (`e2b24e9`; in sync).

**Done prior session (05/29/26):**
- ✅ Created `CRM_Use_Case` firewall field on Accounts (multi-select, required; single→multi recreate) and backfilled all **21** vendor Accounts to `Procurement`.
- ✅ Reconciled + renamed Kate's non-profit tracker → `docs/ZohoBuildTracker_NonProfitSales_Kate_052926.md` (stale cross-module assumptions fixed vs live Zoho).
- ✅ Decided procurement multi-vendor bidding = **`Contact_Tracking` subform** on Procurement_Items (chose over `Vendor_Bids` child module [superseded] and Jefferson's standard-suite guide). Wrote `specs/ZohoModuleSpec_ContactTrackingSubform_052926.md`.
- ✅ PO handling decided: `PO_Number`/`PO_Status` fields + attach PDF from Jefferson's template (Excel; sample committed at `reference/FSCP Linen Default PO for Properties NP 3.xlsx`). No PO/Quotes/Products modules.
- ✅ Annotated Jefferson's `ZohoProcurementProcessGuide` (process adopted, module mapping redirected).
- ✅ Created **`Zoho_Architecture.md`** — single consolidated architecture + CEO proposal (production-hold framing, ownership matrix, Claude Desktop handback instruction). Folded the separate proposal file in.
- ✅ Built **visual guide** `reference/ZohoArchitecture_VisualGuide_052926.png` (headless-Chrome render).
- ✅ Created R&D feedback intake `docs/ZohoArchitecture_Feedback_052926.md` (Claude-analysis path primary, chat Kyle secondary).
- ✅ Reorganized repo: `docs/` `specs/` `reference/` (deploy + entry files kept at root; Vercel intact). Updated CLAUDE.md structure map + resume skill paths.
- ✅ 6 new decision-log entries in `ZohoCRM_Rollout_052126.md`. Team message sent to R&D.

**Done prior session (05/28/26):**
- ✅ MCP auth (all 3 Zoho servers connected)
- ✅ Vercel project linked + custom domain `procurement.rentstayable.com` live
- ✅ Task 2 — `Procurement_Items` module shell created (Kyle, in Zoho UI)
- ✅ Task 3 — 19 custom fields + 7 picklists deployed (Kyle, in Zoho UI). Required flags set on the 11 spec'd fields (per layout screenshot proof). Two over-required fields (`US_Baseline_Cost_Unit`, `Decision_Notes`) un-flagged on review.
- ✅ Task 4 (partial) — Layout sections + permissions done (per screenshot). Workflow rules still pending.
- ✅ Task 9 — HTML tracker repointed Deals → Procurement_Items, deployed at `/tracker`. Demo-mode banner makes the unauthenticated-API-call state explicit. v1 vendor tracker deleted.
- ✅ Static portal landing live at `procurement.rentstayable.com` with Tracker + Zoho + Docs CTAs.
- ✅ Spec doc reconciled to deployed API names (`Name`, `Est_Tariff_Rate`, `US_Baseline_Cost_Unit`, `Sharepoint_Folder_Link`).
- ✅ Phase 0.5 Webapp Decision section added — gated to 06/21/26 with explicit trigger conditions.

**Active, next session:**

> ✅ **ARCHITECTURE APPROVED (06/02/26).** Rob approved the v2 merged design (`docs/ZohoArchitecture_Update_053026v2.md`). On-approval checklist **done this session:** wrote `specs/ZohoModuleSpec_Quotes_060226.md`; marked the `Contact_Tracking` subform spec superseded; folded v2 into `Zoho_Architecture.md`; logged the decision in `ZohoCRM_Rollout_052126.md`; verified edition = Professional + only 1 custom module live (headroom fine). **Build path is now the `Vendor_Quotes` child module, NOT the subform.**
>
> 📋 **Build runbook:** `docs/ZohoBuildWalkthrough_Procurement_060326.md` — tab-by-tab build of all 3 modules + fields + connections + validation/workflow rules + a 3-quote test script + pre-staged MCP payloads. Visual: `infographics/ProcurementProcessV2_RISE8_060326.html` (+ PDF).
>
> ⚠️ **Operational hold still applies** (separate from architecture approval): no real data-load, no go-live/onboarding, no live tracker writes, 2FA still open. Held-state build of the approved modules/fields may proceed.
>
> ✅ **Stale-bid threshold = 7 days — SET by Kyle 06/05/26.** Compromise between Jefferson's recommended 3 (overseas vendors go quiet fast) and the prior 14. Sets the Quote follow-up workflow timer (days a Vendor_Quote / item-at-Bid can sit without movement before it's flagged + the vendor is chased). Propagated to all live specs (Quotes, Procurement_Items, WorkflowRulesSpec, ValidationGates, AwardWorkflow, ZohoSetupTasks P6) + the `/tracker` stuck-item filter default. Revisit if Rob objects. **No remaining Rob gate on this** — buildable once the operational hold lifts.
>
> ✅ **Property `2900` = Stayable Gainesville (Alachua County) — CONFIRMED by Kyle 06/04/26.** Real 9th property (was Rob's v2 addition, not a typo). Canon updated to 9 properties across CLAUDE.md, Procurement_Items spec (`Property_Scope` now 10 values incl. Portfolio-wide), build walkthrough, `Zoho_Architecture.md`, and the `/tracker` + landing dropdowns/tables. **Remaining action (Kyle):** add the `Gainesville (2900)` value to the `Property_Scope` picklist in Zoho UI — field-edit is UI-only, no MCP.

> 🆕 **IN PROGRESS — Rob visibility portal (read-only Layer 1) [greenlit 06/02/26, design pending].** Use `procurement.rentstayable.com` as a **read-only review portal for Rob** (Jefferson still operates in Zoho; Rob still approves). Zoho = backend/system of record; portal = window. Views: approval queue (Stage=Submitted) · status board by Stage · item detail w/ side-by-side quote comparison · decisions log · optional spend rollup. **✅ APPROVAL MODEL CONFIRMED 06/03/26 — REVIEW-ONLY portal + deep-link; Rob approves natively in his Zoho seat (`rb@`).** Chosen over approve-in-portal (which breaks Zoho audit attribution — writes show as the OAuth/service user, not Rob; needs write scopes; needs `Stage→Approved` gate error-handling; turns portal login into a spend control). Portal stays read-only; surfaces the approval queue and deep-links to the record. Structured Approve/Reject via Zoho Approval Process / Blueprint (`isBlueprintSupported:true`) is an optional later add — portal stays read-only either way. Decision logged in `ZohoCRM_Rollout_052126.md`. **Still needs from Kyle:** a Zoho OAuth self-client with **read-only** scopes (`ZohoCRM.modules.READ`, client id/secret, server-side only). **✅ Read-only scaffold built 06/03/26:** `RobReviewPortal_Procurement_060326.html` (root) — 4 views (approval queue `Stage=Submitted` · status board · item detail w/ side-by-side quote comparison · decisions log) + spend rollup, mock data, matches `index.html` design system, deep-links to Zoho for approval. **✅ WIRED + QA'd 06/04/26:** route added to `vercel.json` (`/review` → `/RobReviewPortal_Procurement_060326`); headless-Chrome render confirms all 5 views display correctly (approval queue, status board, item detail w/ winning-quote highlight, decisions log, spend rollup), design matches `index.html`, mock banner + timestamp present. **✅ Deep-link verified vs live Zoho:** `Procurement_Items` → `module_name: CustomModule1` (id `…1418753`, confirmed via MCP `getModuleByApiName`) — the portal's hardcoded `tab/CustomModule1` is correct; this go-live blocker is cleared. **Timing caveat:** 0 real items in Zoho yet (hold on) — scaffold can be built now but renders empty until real items land. This is the Phase 0.5 "Option B" lightweight variant; the heavy operational webapp (Jefferson-in-portal) stays gated to 06/21. Not yet folded into `Zoho_Architecture.md` (per "discuss first").

0. **[P1]** Task 10 (v2) — ✅ **MODULES BUILT + 3-QUOTE TEST PASSED (06/02/26).** Vendors (6 custom fields), `Vendor_Quotes` module (auto-number, 2 lookups, 2 landed-cost formulas, 7 picklists), Procurement_Items deltas (`Target_Quantity`, `Awarded_Vendor`→Vendor_Quotes; `Bid_Count`/`Winning_Vendor` removed) — all verified via MCP; landed-cost math + award lookup confirmed. Runbook + deployed API names: `docs/ZohoBuildWalkthrough_Procurement_060326.md`.
   - **Remaining before go-live:** (a) **3 validation-rule gates** (Spec→Bid / FL→Recommend / Awarded→Approved — manual UI, Validation Rules not workflow rules) — ✅ **SPEC'D 06/03/26** `specs/ZohoValidationGates_Procurement_060326.md` (exact picklist values verified vs live; flags stray `Florida_Validation_Status = Option 2` for picklist cleanup); (b) **award workflow** — ✅ **SCAFFOLDED 06/03/26** → `specs/ZohoAwardWorkflow_Procurement_060326.md` (exact Deluge `stampAwardedVendor` fn + UI wiring + held-state test, verified vs live API names). **Correction:** MCP can NOT build this — custom-function authoring is Zoho-UI-only (no `Create_Functions` op), and the stamp value is dynamic + cross-module so a static field-update can't do it. Kyle builds the fn + rule in Settings; (c) **grouped landed-cost report + Kanban**; (d) **migrate 21 vendor Accounts + 20 Contacts** into the Vendors module (only 1 Vendor record exists now); (e) **delete the `_DELETE` test records** (3 vendors + 1 item + 3 quotes — manual, no MCP delete tool).
1. ✅ **[P1]** ~~Task 5 prerequisite — locate the 197-item filtered purchase report~~ — **RESOLVED 06/06/26: scope = 35 items; source = `jefferson/ItemStaging_Procurement_052926.xlsx`** (20 Home Depot + 15 Amazon top-by-spend; 35 data rows verified). The 197 report (from the 05/27 test-account chat) is retired — not needed for Phase 1. Tasks 5/6 are now gated only on the operational hold + workflow rules, not on a missing file.
2. **[P2]** Task 4 finish — Configure the **5 workflow rules** via `zoho-crm-workflows` MCP (Stage→Bid blocked unless Spec_Sheet_Status=COO Signed Off; Stage→Recommend blocked unless Florida_Validation_Status=Passed; Stage→Approved blocked unless Winning_Vendor populated; alert on items stuck at Bid >7 days [threshold set 06/05/26]; auto-suggest Approver from spend tier).
3. **[P2]** Task 5 — Test-load 5 items via `zoho-crm-data` MCP, **picked from the 35-item staging file** (`jefferson/ItemStaging_Procurement_052926.xlsx`). The originally-named 5 (PTAC9000BTU etc.) came from the retired 197 analysis and are mostly absent from the staging file — select replacements spanning Appliance / Building Material / Amazon soft goods (e.g. `Seasons9000BtuPa`, a Vissani refrigerator, a mattress row). **Gated on workflow rules (#2) + operational hold.** Kyle explicitly vetoed placeholder test records — these are real staged items.
4. ⏳ **[P3]** Stray "Batteries" Account cleanup — Account ID `…1418001`. **Inspected 06/09/26 (Claude):** confirmed orphan — `Vendor_Type` null, created 05/26 14:51:48 (2.5 hr after the 12:24:20 bulk import), **0 linked Contacts**, distinct from `GP Batteries Inc` (`…1416034`). Safe to delete. **No MCP delete tool** → remaining action is Kyle's 30-sec UI delete (Accounts → Batteries → Delete).
5. ✅ **[P3]** ~~Receive Kate's Non-Profit module spec~~ — received + reconciled 05/29/26 (`docs/ZohoBuildTracker_NonProfitSales_Kate_052926.md`). Non-Profit build itself still gated on Rob's approval (production hold). **⚠️ 05/30: 43 partner Accounts + matching Contacts now loaded to live Zoho at Kyle's direction — this is ahead of the documented hold (`Zoho_Architecture.md` §14 says the 48 non-profit partners stay out). Flag for Rob/Kate reconciliation; Kate to verify the 43 records and continue the Non-Profit build.**
6. **[P2]** Task 7 — Locate current `OverseasProcSOP_RISE8` doc (SharePoint / OneDrive). Once surfaced, rewrite Smartsheet refs → Zoho. Owner: Kyle to locate; rewrite is Claude.
7. **[P3]** Task 6 — Push the remaining **30** staged items (35 − 5 test batch) from `jefferson/ItemStaging_Procurement_052926.xlsx` (gated on Task 5). The old "remaining 192" figure died with the 197 scope (resolved 06/06/26).
8. **[P3]** Task 8 — Audit 6 vendor-adjacent Smartsheets (Vendor Relationship Tracker, Overseas Vendor Tracking, Overseas Vendor Progress Report, Vendor Matrix, Vendor Masterlist, Preferred Vendor Matrix) — purely investigative; route findings to Rob.
9. **[P1]** Phase 1 Security gates: re-open 2FA decision (`admin@`, `jefferson@`) — currently on hold per Rob.
10. **[P3]** Replace 20 vendor contact placeholder Last Names (Jefferson follow-up).
11. ✅ **[P2]** ~~Add `Gainesville (2900)` to the `Property_Scope` picklist~~ — **DONE (Kyle), confirmed via MCP 06/09/26.** Lives on `Procurement_Items` only. **⚠️ Tiny leftover:** relabel the `Portfolio-wide (all 8 properties)` option → `9` (UI, ~10 sec).
12. **[P3]** Notification workflows (surfaced on the operating-model one-pager as "optional"): (a) **Rob** — alert when an item hits `Stage=Submitted` / spend crosses an Approver tier (portal + email); (b) **team** — Microsoft Teams channel alerts on stage changes, vendor awards, stale quotes. Zoho workflow rule → email/webhook (Teams connector). **Not built.** The stale-quote alert uses the **stale-bid threshold = 7 days** (set 06/05/26). Owner: Kyle.
13a. **[P1] ⏳ IN PROGRESS (06/05/26) — Connect the portal to live Zoho (read-only).** Runbook: `docs/PortalZohoConnect_Procurement_060526.md`. **Confidence ~90%.** Status:
   - ✅ **P1-E DONE** — `api/procurement.js` built + syntax-checked + pushed (`624365a`). Refresh-token auth (cached), COQL reads of Procurement_Items + Vendor_Quotes against **verified live field names** (getFields run this session — P2-B effectively done), shaped JSON for all 5 views, read-only, optional `PORTAL_SHARED_SECRET` guard. Inert until env vars land. No `vercel.json` change needed (auto-detects `/api`).
   - ⏳ **P1-A/B/C — Kyle, in progress** — creating the read-only OAuth self-client (`ZohoCRM.modules.READ`), exchanging the grant code → refresh token (PowerShell `Invoke-RestMethod` one-liner; multi-line paste mangling was the snag), then setting Vercel env vars (`ZOHO_CLIENT_ID/SECRET/REFRESH_TOKEN` + optional `PORTAL_SHARED_SECRET`) and redeploying.
   - 🔲 **P1-D — DECISION PENDING (Kyle)** — access guard for the world-reachable `/api`. Rec: Vercel Deployment Protection → Password (needs Pro). Shared-secret is only a stopgap (leaks in static client JS).
   - ✅ **P1-F — DONE (Claude, 06/09/26)** — portal fetches `/api/procurement` and re-renders all 5 views from live JSON; mock scaffold is the fallback on any failure; explicit empty-state when connected with 0 items; optional `?key=` shared-secret header. Inline JS `node --check` clean. Renders mock until env vars land. **Next: P2-A** verify on a protected Preview against the 3 test records (after P1-A/B/C env vars).
   - ⛔ Real-data go-live stays gated (0 real records + operational hold). Pre-go-live: delete the 3 `_DELETE` test items/quotes.
13. **[P3]** Decide whether to wire the operating-model one-pager (`infographics/ProcurementOperatingModel_RISE8_060426.html`) to a clean route (e.g. `/model`) for sharing with Rob, or keep it local/internal. Owner: Kyle.

**Out of scope this sprint:** Phase 2 sales-team rollout (Bea/Crystal seats + non-profit pipeline; Kate's module-build doesn't trigger this), Phase 3 (Special Projects), Phase 1 email integration (purchasing@ forwarding), Phase 1 Deals-module cleanup (partially obviated by pivot).

**🧪 Sandbox experiments (NOT in the approved plan — do not fold into the architecture):**
- **Contact Roles evaluation** — `docs/Experiment_ContactRoles_060326.md`. Conclusion: Deals-only, Contacts-not-Vendors, no commercial fields → **does not replace `Vendor_Quotes`**. Parked as a possible Track-3 (Vendor/Professional Selection) tool. Isolated test on the 2 existing test Deals only; touches nothing in procurement.

---

## Phase 0 — Tooling & Infrastructure (NEW — 05/27/26)

Added 05/27/26. Captures the build-systems work that gates everything downstream — MCP for Zoho writes, Vercel for tracker hosting. Owned by Kyle as spearhead.

### Zoho MCP

- [x] ✅ **[P1]** Register 3 Zoho-native MCP servers at user scope — **done 05/27/26.** Servers in `C:\Users\Kyle Estocapio\.claude.json` (NOT in repo settings; URLs contain embedded API keys):
  - `zoho-crm-data` — CRM Data & Metadata Operations (record CRUD + metadata read)
  - `zoho-crm-workflows` — CRM Automation & Workflows (workflow rules, field updates, email notifications)
  - `zoho-crm-activities` — CRM Activities & Engagement (tasks, notes, comms)
  - Created in Zoho MCP Console (zoho.com/mcp) under `admin@rentstayable.com`, Authorization mode = **Authorization via Connections** (org-level).
- [x] ✅ **[P1]** Authenticate the 3 servers in `/mcp` — **done 05/28/26.** All 3 (`zoho-crm-data`, `zoho-crm-workflows`, `zoho-crm-activities`) connected this session. Unblocks Task 4 workflow rules, Tasks 5/6 record creation, Task 9 repoint validation.
- [ ] 🔲 **[P2]** Do NOT authenticate the `claude.ai Zoho CRM` MCP visible in `/mcp list` — it's a separate generic Zoho integration hosted through claude.ai that overlaps with the 3 Zoho-native servers. Keep the surface area scoped.
- [ ] 🔲 **[P2]** Document the MCP setup steps in a new `ZohoMCP_Setup_052726.md` so the install is reproducible (re-auth on token expiry, second machine, etc.). Owner: Kyle. Status: optional — do after MCP auth is verified working.

**Important scope correction (05/27/26 PM):** None of Zoho's 10 prebuilt MCP servers covers *creating* custom modules or *creating* fields. Those operations remain admin-UI only. Tasks 2 and 3 below are reclassified as manual Zoho Settings work, not MCP work. MCP coverage applies to workflow rules, records, and activities only.

### Vercel hosting

- [x] ✅ **[P1]** Create Vercel project linked to `github.com/Stayable/purchasing` — **done 05/28/26** (Kyle). Repo root is the deploy root; static HTML, no build step. Production deploy of `ZohoProcurementTracker_052626.html` remains gated on Task 9.
- [ ] 🔲 **[P2]** Configure Vercel project settings: production branch = `main`, deploy previews on PRs disabled (single-branch workflow per `CLAUDE.md`), set custom domain only if Rob approves a subdomain on `rentstayable.com`. Owner: Kyle.
- [x] ✅ **[P1]** Static portal (Option A) deployed to `procurement.rentstayable.com` — **done 05/28/26.** Custom domain attached, SSL via Vercel. Build = `index.html` + `vercel.json` (no compile step).
- [ ] ⚠️ **[P2]** **GATED ON TASK 9** — Deploy repointed `ZohoProcurementTracker_052626.html` (subpath of `procurement.rentstayable.com` or replaces root). Owner: Kyle. Do not deploy before Task 9 ships: the current HTML is wired to the Deals architecture and would actively mislead Jefferson. Once Task 9 lands and is committed to `main`, the Vercel build auto-promotes.
- [ ] 🔲 **[P3]** Share `procurement.rentstayable.com` URL with Rob + Jefferson; add it to `CLAUDE.md` reference list. Owner: Kyle, post-QA.
- [ ] 🔲 **[P3]** Decide whether `ZohoVendorTracker_Procurement_052626.html` (the v1 vendor tracker, superseded by `ZohoProcurementTracker`) is deployed alongside or removed. Owner: Kyle. Current recommendation: do not deploy v1 — Vercel should serve only the canonical tracker to avoid drift.

### Repo hygiene (for the Vercel deploy)

- [ ] 🔲 **[P3]** Add a minimal `index.html` or `vercel.json` to route the Vercel root URL to `ZohoProcurementTracker_052626.html`. Owner: Kyle. Without this, visitors hit a 404 at `/` even though the file is deployed.
- [ ] 🔲 **[P3]** Confirm no secrets/credentials accidentally embedded in either HTML tracker before deploy. Owner: Kyle. Static deploy = world-readable.

---

## Phase 0.5 — Webapp Decision (deferred to 06/21/26 checkpoint)

Added 05/28/26. The `procurement.rentstayable.com` static portal (Option A) is live. Whether to invest in a custom interactive webapp (Option B) that talks to the Zoho API directly is **deferred to the Phase 1 validation checkpoint (target 06/21/26)** to anchor the decision in real Jefferson workflow data, not speculation.

### Decision gate
- **Gate date:** 06/21/26 (Phase 1 Validation Checkpoint)
- **Decision owner:** Kyle, with Rob's sign-off if Option B is chosen
- **Inputs required before the gate:**
  - [ ] Jefferson logs ≥5 procurement items in Zoho native UI for 2+ weeks
  - [ ] Friction log captured: which specific Zoho UI steps slow Jefferson down (FL-Validation entry, Stage advance, Linked Vendors related-list management, Decision_Notes drafting, etc.)
  - [ ] Volume forecast: how many items/week will move through the system in steady state
  - [ ] Multi-user check: will Bea/Crystal/Rob touch procurement items, or just Jefferson

### Options to revisit at the gate

|  | Option A (current) | Option B |
|---|---|---|
| State | ✅ Live (`procurement.rentstayable.com` once DNS lands) | Not built |
| What it is | Static branded portal · Zoho deep-link · `noindex`, internal-only | Interactive webapp with Zoho OAuth + API integration; replaces or augments Zoho native UI for procurement-specific workflows |
| Dev cost | Shipped | 2–5 days build + 2–5 hr/mo ongoing maintenance |
| $ cost | $0 ongoing | ~$252–500/yr (Vercel Pro seat + token store + monitoring) |
| New risks | None material | Jefferson coupled to webapp reliability · framework upgrade load · Zoho API rate-limit ceiling · drift if data caches creep in |
| Reversibility | N/A | Hard once Jefferson depends on it — owned forever |

### Trigger conditions to commit to Option B
Go to B only if **all three** are true at 06/21/26:
1. Jefferson has identified ≥3 specific Zoho-native UI frictions that a custom UI would fix (not "I just want it prettier")
2. Volume justifies it (>20 procurement items/month sustained, or multi-user concurrent workflow)
3. The friction is durable — can't be fixed by a Zoho layout tweak, a custom button, a Deluge script, or a workflow rule

If any is false → **stay on A.** Iterate the static portal (add status feeds, dashboards, links) without an SPA build.

### If we go to B
- Spawn `ZohoWebApp_Spec_<MMDDYY>.md` with: framework choice, OAuth flow, deployment topology, scope cuts, owner.
- Add `app/` (or `phase-0.5/`) subdir for code — keep the markdown archive distinct from JS.
- Pause `ZohoProcurementTracker_052626.html` edits (Task 9 still ships, but no further investment beyond the repoint) — it would be wasted work once B is the real UI.

---

## 05/27/26 Architecture Pivot — Procurement_Items custom module

Reverses the original "Deals pipeline" approach. See `ZohoTaskUpdate_RISE8_052726.md` (imported 05/27) and the matching decision-log entries in `ZohoCRM_Rollout_052126.md`.

- [x] ✅ **[P1]** Task 1 — Subscription upgrade — **N/A**, account is already on Professional with 3 seats (admin@, jefferson@, rb@rise8companies.com)
- [x] ✅ **[P1]** Activate 3rd seat: rb@rise8companies.com — done 05/27/26 (pulled forward from Phase 3)
- [x] ✅ **[P1]** Restore the 4 source artifacts to this repo — done 05/27/26 (pulled from `claude/zoho-crm-reintroduction-CSKYu` where Rob uploaded them)
- [ ] 🔲 **[P1]** Task 2 — Create `Procurement_Items` custom module shell **manually in Zoho Settings UI** (Settings → Modules and Fields → Create New Module). Owner: Kyle. ~10 min. Singular label "Procurement Item", plural "Procurement Items", primary field `Item_Name`. Spec: `ZohoModuleSpec_ProcurementItems_052626.md`. **Reclassified 05/27/26:** no prebuilt MCP covers module creation.
- [ ] 🔲 **[P1]** Task 3 — Create 19 custom fields + 7 picklists **manually in Zoho Settings UI** on the new Procurement_Items module. Owner: Kyle. ~30 min. Use the spec doc as the field-by-field source of truth. Field labels already shortened to 25-char Zoho cap; API names per spec. **Reclassified 05/27/26:** no prebuilt MCP covers field creation either. Gated on Task 2.
- [ ] 🔲 **[P2]** Task 4 — Layout sections + permissions **manual UI**; 5 workflow rules **via `zoho-crm-workflows` MCP** once authenticated. Owner: Kyle. Permissions: Admin full, Procurement team R/W, others read-only. Add 3 related lists (Linked Vendors, Activities, Attachments). Gated on Task 3.
- [ ] ⚠️ **[P2]** Task 5 — Test-load 5 items **via `zoho-crm-data` MCP**, picked from the 35-item staging file (`jefferson/ItemStaging_Procurement_052926.xlsx`) — **GATED on Task 4** + operational hold. Owner: Kyle. *(Scope resolved 06/06/26: 197 report retired; originally-named 5 test items mostly absent from the staging file — pick replacements from it.)*
- [ ] ⚠️ **[P3]** Task 6 — Push the remaining **30** staged items (35 − 5) **via `zoho-crm-data` MCP** — **GATED on Task 5.** Owner: Kyle. *(Was "remaining 192" under the retired 197 scope.)*
- [ ] 🔲 **[P2]** Task 7 — Rewrite `OverseasProcSOP_RISE8` doc (Smartsheet → Zoho) — Owner: Kyle. Action: locate the current SOP doc (likely SharePoint / OneDrive) and add it to the repo or reference its canonical location.
- [ ] 🔲 **[P3]** Task 8 — Resolve 6 vendor-adjacent Smartsheets (Vendor Relationship Tracker, Overseas Vendor Tracking, Overseas Vendor Progress Report, Vendor Matrix, Vendor Masterlist, Preferred Vendor Matrix) — Owner: Kyle to audit; Rob to approve retire/rename decisions. No Smartsheet MCP in this environment — surface the audit findings here, route the decision to Rob.
- [x] ✅ **[P2]** Task 9 — Repoint `ZohoProcurementTracker_052626.html` from Deals → Procurement_Items — **done 05/28/26.** All visible UI, picklists, field labels, and LLM prompt strings updated to deployed module reality. Tracker now reachable at `procurement.rentstayable.com/tracker` (via vercel.json rewrite). Portal landing has a new "Open Procurement Tracker" CTA. v1 vendor tracker (`ZohoVendorTracker_Procurement_052626.html`) deleted from repo. **Note:** the tracker runs in DEMO MODE (banner present) — buttons render the prompt that would be sent but no API call fires. Real backend wire-up is gated to the 06/21/26 Phase 0.5 webapp decision.

**Note on the 05/26 vendor import:** The 19 Accounts + 20 Contacts imported yesterday remain valid. Under the new architecture they will sit on Procurement_Items records as the "Linked Vendors" related list rather than as Deal parents. No data migration needed.

---

## Phase 1 — Procurement (Active — original Deals-based plan, partially superseded by 05/27 pivot)

### Security & Governance (do these FIRST)

- [ ] 🔲 **[P1]** Confirm `admin@rentstayable.com` is a real Microsoft 365 mailbox (not a forwarding alias)
- [ ] ⚠️ **[P1]** Enable 2FA on `admin@rentstayable.com` Super Admin account — **ON HOLD per Rob 05/20/26**
- [ ] ⚠️ **[P1]** Enable 2FA on Jefferson's account (`jefferson@rentstayable.com`) — **ON HOLD per Rob 05/20/26**
- [ ] ⚠️ **[P1]** Generate and store recovery codes for both accounts in RISE8 password manager — **ON HOLD per Rob 05/20/26**
- [ ] 🔲 **[P2]** Document Super Admin recovery procedure in case Rob's account is locked

### Email Integration

- [x] ✅ **[P1]** Connect Jefferson's personal mailbox (`jefferson@rentstayable.com`) via IMAP/OAuth — done 05/20/26
  - Setup → Channels → Email → IMAP Configuration
  - **05/26/26 status check:** Configuration Status = Working, Sync Status = Completed. Mail tab appears empty — diagnosed as expected behavior at this stage: no Accounts/Contacts imported yet, so emails do not auto-associate to records. Do NOT reconnect. Once vendor Accounts + Contacts are imported, re-verify. Secondary check: open Email Sync Preferences accordion and confirm date range / folder selection (default IMAP often syncs only forward-from-now, INBOX only).
- [ ] 🔲 **[P1]** Set up M365 forwarding rule on `purchasing@rentstayable.com` → `jefferson@rentstayable.com` (keep copy in purchasing@ for audit). Required because Zoho Professional has no true shared inbox; Organization Emails is outbound-only.
- [ ] 🔲 **[P1]** Add `purchasing@rentstayable.com` as Organization Email (shared mailbox — outbound only)
  - Setup → Channels → Email → Organization Emails
- [ ] 🔲 **[P1]** Grant Jefferson Send-As permission on `purchasing@`
- [ ] 🔲 **[P1]** Test inbound: send a test email to `purchasing@` from a Gmail account, confirm it appears in Jefferson's Zoho inbox view
- [ ] 🔲 **[P1]** Test outbound: have Jefferson reply from `purchasing@` inside Zoho, confirm the thread logs against a test record

### Pipeline Configuration

- [ ] 🔲 **[P2]** Rename default Deals pipeline to **"Procurement"**
- [ ] 🔲 **[P2]** Configure stages: Inquiry → Quote Requested → Quote Received → PO Issued → In Production → In Transit → Received → Closed
- [ ] 🔲 **[P3]** Set stage probabilities and forecast categories
- [ ] 🔲 **[P2]** Add custom field on Deals: **Property ID** (dropdown: 6802, 2295, 5399, 2535, 4645, 44199, 812, 8700)
- [ ] 🔲 **[P2]** Add custom field on Deals: **Vendor Country** (China, Vietnam, India, Mexico, USA, Other)
- [ ] 🔲 **[P2]** Add custom field on Deals: **PO Value (USD)**
- [ ] 🔲 **[P2]** Add custom field on Deals: **Expected Ship Date**
- [ ] 🔲 **[P2]** Add custom field on Deals: **Expected Arrival Date**
- [ ] 🔲 **[P2]** Add custom field on Accounts: **Vendor Type** (Overseas Manufacturer, US Distributor, Freight Forwarder, Inspection Service)
- [ ] 🔲 **[P3]** Add custom field on Accounts: **Alibaba Profile URL**

### Module Cleanup (prevent sprawl)

- [ ] 🔲 **[P2]** Disable Quotes module
- [ ] 🔲 **[P2]** Disable Invoices module
- [ ] 🔲 **[P2]** Disable native Vendors module (we use Accounts with Vendor Type tag instead)
- [ ] 🔲 **[P2]** Disable Price Books module
- [ ] 🔲 **[P2]** Disable Sales Orders module
- [ ] 🔲 **[P2]** Disable Purchase Orders module (we use Deals instead)
- [ ] 🔲 **[P2]** Disable Campaigns module
- [ ] 🔲 **[P2]** Disable Visits module
- [ ] 🔲 **[P3]** Hide Forecasts module from Phase 1 nav

### Products Module (SKU catalog)

- [ ] 🔲 **[P2]** Activate Products module
- [ ] 🔲 **[P3]** Define top-level product categories (Mattresses, Linens, Case Goods, FF&E, OS&E, Lighting, Appliances)
- [ ] 🔲 **[P3]** Add initial SKU set for mattresses (size × type × thickness)
- [ ] 🔲 **[P2]** Configure Products to attach to Deals as line items

### Data Import

- [x] ✅ **[P2]** Source current Alibaba vendor list — received 05/26/26 from Jefferson, **revised 05/26/26** (`For_upload_in_Zoho_1.xlsx`, 19 rows after dedupe)
- [x] ✅ **[P2]** Resolve major data quality issues with Jefferson:
  - ✅ Row 13/23 duplicate — Hangzhou DE & E Smart Home dropped (was the bad row).
  - ✅ Walrus ambiguity — "Walrus Floors" / `@kimayfloors.com` dropped. Zhejiang Walrus retained.
  - ✅ Mesa — collapsed to 1 vendor row with 2 emails separated by `;` (will split into 1 Account + 2 Contacts on import).
- [ ] 🔲 **[P2]** Remaining cleanup on import side (no further Jefferson input needed):
  - GP Batteries kept by Jefferson → set `Vendor Type = Other` (personal Yahoo, American name, not overseas manufacturer pattern); Rob/Jefferson can reclassify post-import.
  - Trim trailing whitespace on rows 5 + 15.
  - Drop the unlabeled leading index column (1–19) — header is misaligned in revised file.
  - Split Mesa row into 1 Account + 2 Contacts (Jessica + sales@).
- [x] ✅ **[P2]** Format vendor list to Zoho **Accounts** import template — produced `outputs/Accounts_RISE8_052626.xlsx` (19 Accounts)
- [x] ✅ **[P2]** Format contacts to Zoho **Contacts** import template — produced `outputs/Contacts_RISE8_052626.xlsx` (20 Contacts; Mesa split into 2)
- [x] ✅ **[P1]** Pre-import: Vendor Type custom field created in Zoho (Pick List on Accounts layout) — done 05/26/26
- [x] ✅ **[P1]** Uploaded `Accounts_RISE8_052626.xlsx` (19 Accounts) — done 05/26/26
- [x] ✅ **[P1]** Uploaded `Contacts_RISE8_052626.xlsx` (20 Contacts) — done 05/26/26. Account Name lookup confirmed working (clicking from Contact → opens Account record).
- [ ] 🔲 **[P2]** Post-import cleanup: replace placeholder Last Names with actual surnames as Jefferson confirms them with each vendor.
- [ ] 🔲 **[P2]** Post-import: reclassify GP Batteries Vendor Type from "Other" to correct value (likely US Distributor) once confirmed.
- [ ] 🔲 **[P2]** Re-check Jefferson IMAP Mail tab — now that Accounts + Contacts exist, vendor emails should start auto-associating to records.
- [ ] 🔲 **[P2]** Log 1–2 active in-flight Alibaba orders as test Deals to validate structure

### Workflow Rules (automation — set up AFTER data is in)

- [ ] 🔲 **[P3]** Auto-assignment rule: emails to `purchasing@` auto-create or attach to matching Vendor Account
- [ ] 🔲 **[P3]** Stage change notification: alert Rob when any Deal >$10k moves to "PO Issued"
- [ ] 🔲 **[P3]** Stale Deal alert: notify Jefferson when a Deal sits in "Quote Requested" >7 days

### Training & Handoff

- [ ] 🔲 **[P2]** 30-minute walkthrough with Jefferson on Procurement pipeline
- [ ] 🔲 **[P2]** Document common workflows (new vendor inquiry, PO issuance, shipment tracking) in a quick-reference card
- [ ] 🔲 **[P2]** Confirm Jefferson is logging Deals daily for 2 consecutive weeks before Phase 2 starts

---

## Phase 1 Validation Checkpoint (target: 06/21/26)

Before moving to Phase 2, verify:

- [ ] 🔲 **[P1]** Jefferson has logged at least 5 active Procurement Deals
- [ ] 🔲 **[P1]** Jefferson is using the system without daily prompting from Rob
- [ ] 🔲 **[P1]** At least one full vendor cycle (Inquiry → Received) has gone through the system
- [ ] 🔲 **[P1]** No major friction points or "this doesn't work for me" complaints from Jefferson
- [ ] 🔲 **[P1]** `purchasing@` email integration is reliable (no missed threads)

---

## Phase 2 — Non-Profit Sales (Bea & Crystal)

### Seat Expansion

- [ ] 🔲 **[P1]** Confirm Phase 1 stability checkpoint passed
- [ ] 🔲 **[P1]** Add 2 seats (total billing: $140/mo monthly, or ~$92/mo savings at annual)
- [ ] 🔲 **[P1]** Invite Bea as Standard user
- [ ] 🔲 **[P1]** Invite Crystal as Standard user

### Mailbox Connections

- [ ] 🔲 **[P1]** Connect Bea's personal mailbox via IMAP/OAuth
- [ ] 🔲 **[P1]** Connect Crystal's personal mailbox via IMAP/OAuth
- [ ] 🔲 **[P2]** Decide on shared `nonprofits@rentstayable.com` alias (recommended) and provision if approved
- [ ] 🔲 **[P2]** If provisioned, connect as Organization Email and grant both Bea and Crystal access

### Pipeline Configuration

- [ ] 🔲 **[P1]** Create second Deal pipeline: **"Non-Profit Sales"**
- [ ] 🔲 **[P1]** Configure stages: Lead → Qualified → Proposal → MOU → Active → Renewing → Lost
- [ ] 🔲 **[P2]** Configure territory assignment: Bea = north FL properties, Crystal = central FL properties (or other agreed split)
- [ ] 🔲 **[P2]** Add custom field on Accounts: **Non-Profit Type** (Housing, Veterans, Faith-Based, Disaster Relief, Government Contract, Other)
- [ ] 🔲 **[P2]** Add custom field on Accounts: **501(c)(3) Status** (Verified, Pending, N/A)
- [ ] 🔲 **[P2]** Add custom field on Deals: **Target Property** (linked to Property ID dropdown)
- [ ] 🔲 **[P2]** Add custom field on Deals: **Estimated Monthly Room Nights**

### Data Import

- [ ] 🔲 **[P2]** Pull non-profit list from Candid (per organization context)
- [ ] 🔲 **[P2]** Filter to Florida-based housing/relief organizations near each property
- [ ] 🔲 **[P2]** Import as Leads (not Accounts — they need to be qualified first)
- [ ] 🔲 **[P2]** Assign Leads to Bea or Crystal based on geography

### Training & Handoff

- [ ] 🔲 **[P2]** 60-minute joint walkthrough with Bea + Crystal
- [ ] 🔲 **[P3]** Set weekly Bea/Crystal pipeline review cadence (CRM dashboard)

---

## Phase 3 — Special Projects (Rob + Claude)

Triggered on-demand when Rob has a structured-selection project (bankruptcy attorney, broker selection, etc.).

### When Triggered

- [ ] 🔲 **[P1]** Determine if Rob needs his own dedicated seat at this point (`rb@rise8companies.com`)
- [ ] 🔲 **[P1]** Create third Deal pipeline: **"Special Projects"**
- [ ] 🔲 **[P1]** Configure stages: Sent → Responded → Interviewed → Shortlisted → Selected → Declined
- [ ] 🔲 **[P2]** Set up Zoho BCC dropbox address for auto-logging Rob's outbound emails
- [ ] 🔲 **[P1]** First test project: bankruptcy attorney selection (15 candidates)

---

## Day 90 Review (target: 08/19/26)

- [ ] 🔲 **[P1]** Pull usage report: Deals created, emails logged, stage progressions
- [ ] 🔲 **[P1]** Confirm adoption criteria met (see Rollout doc Section 9)
- [ ] 🔲 **[P1]** Decision: switch to annual billing (saves ~$48/seat/month) or continue monthly
- [ ] 🔲 **[P2]** Update `ZohoCRM_Day90Review_081926.md` with findings
- [ ] 🔲 **[P2]** Log decision in main Rollout doc decision log

---

## Recurring Maintenance (post-deployment)

- [ ] 🔲 **[P2]** Monthly: review user activity, flag inactive seats
- [ ] 🔲 **[P2]** Quarterly: audit custom fields, remove unused ones
- [ ] 🔲 **[P2]** Quarterly: review module enablement, confirm no sprawl creeping in
- [ ] 🔲 **[P1]** Annually: rotate Super Admin password, regenerate recovery codes
- [ ] 🔲 **[P2]** Annually: review tier (Standard vs. Professional vs. Enterprise) against actual usage
- [ ] 🔲 **[P2]** Monthly: export CRM data backup to OneDrive `/outputs` (insurance against vendor lock or repeat abandonment)
