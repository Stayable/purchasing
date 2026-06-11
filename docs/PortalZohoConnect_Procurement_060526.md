# Portal ↔ Zoho Read-Only Connection — Build Runbook

**Date:** 06/05/26 · **Owner (build):** Claude · **Owner (Zoho/Vercel console):** Kyle · **Approver (go-live to Rob):** Rob
**Goal:** make `RobReviewPortal_Procurement_060326.html` read **live** Procurement_Items / Vendor_Quotes from Zoho, replacing the hardcoded mock data — while keeping the portal **read-only** (no writes; approvals still happen in Zoho via deep-link).

---

## ✅ CONNECTED + VERIFIED LIVE — 06/11/26

Portal at `/review` renders live Zoho data through the read-only proxy end-to-end (banner = "LIVE", board Spec=3, detail quote-comparison shows QT-0001/2/3 with landed 56.50/57.00/58.00, mock fully replaced). Two corrections were needed vs. this runbook's original instructions — **use these going forward**:

- **OAuth scope:** `ZohoCRM.coql.READ,ZohoCRM.modules.READ` — *not* `ZohoCRM.modules.READ` alone (that returns `OAUTH_SCOPE_MISMATCH` on the `/coql` endpoint). `ZohoCRM.modules.all.READ` is rejected by the self-client console as invalid.
- **COQL field names:** vendor name is `Vendor.Vendor_Name` (not `Vendor.Name`); `Owner.*` is not selectable via COQL (dropped — unused by the views).

**Done:** P1-A, P1-B, P1-C, P1-E, P1-F, P2-A, P2-B, P2-D (proxy already retries once on 401).
**Still open:** **P1-D access guard (endpoint is currently world-open and now serving real test data), P2-C (apply the guard), P2-E (drop mock banner — auto-handled: live render replaces it).** Plus the gated items below (real-data load, go-live, delete `_DELETE` test records).

---

## Confidence: ~90% (NOT 100%) — [historical, pre-connection]

The pattern (Vercel serverless function + Zoho read-only OAuth self-client) is standard and well-documented. Honest risk lives in three places:
1. **OAuth self-client refresh-token generation** — Zoho's grant→refresh exchange is fiddly the first time (10-min grant-token expiry, exact scope string, DC domain). Mitigation: do it once via curl, store the refresh token; it's long-lived.
2. **Datacenter domains** — org is **US** (`crm.zoho.com`), so accounts = `accounts.zoho.com`, API = `www.zohoapis.com`. A wrong DC = `INVALID_TOKEN`. Verified against the live org this session.
3. **Endpoint exposure** — the `/api` function is world-reachable. Serving vendor prices/spend to the open internet is unacceptable; we **must** add an access guard (see P1-D). This is a decision, not a code problem.

**Not at risk:** the portal staying read-only (READ scope only), the math/views (already proven on test data), Vercel functions coexisting with the static deploy (native).

**Certain:** 0 real records exist (only test/`_DELETE`), and the data load is on the operational hold — so even fully wired, the portal renders near-empty until real items land. **Today = connect + verify against the 3 test records.**

---

## Architecture

```
Browser (Rob)
   │  GET /api/procurement   (no secrets in the browser)
   ▼
Vercel Serverless Function  /api/procurement.js   ← holds refresh token + client secret (env vars, server-side)
   │  1. refresh access token (cached ~55 min)
   │  2. COQL read: Procurement_Items + Vendor_Quotes
   ▼
Zoho CRM  (ZohoCRM.modules.READ only)
```
- Portal HTML keeps its 5 views; JS swaps the mock arrays for `fetch('/api/procurement')`.
- Function is **read-only**: only GET/COQL, never create/update. Even if compromised, no write scope.

### Environment variables (Vercel project settings — never in the repo)
| Var | Value |
|---|---|
| `ZOHO_CLIENT_ID` | from the self-client |
| `ZOHO_CLIENT_SECRET` | from the self-client |
| `ZOHO_REFRESH_TOKEN` | from the one-time grant exchange |
| `ZOHO_ACCOUNTS_DOMAIN` | `https://accounts.zoho.com` |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.com` |
| `PORTAL_SHARED_SECRET` | guard for the `/api` endpoint (see P1-D) |

---

## Checklist (prioritized)

### P1 — Blockers (must clear to connect at all)

- [ ] **P1-A · Create the read-only OAuth self-client** — *Kyle, `api-console.zoho.com`.* App type **Self Client**. Scope: `ZohoCRM.modules.READ`. Generate a grant token (set ~10 min validity; use it immediately). **READ scope only — do not add write/ALL.**
- [ ] **P1-B · Exchange grant → refresh token** — *Kyle (or Claude-provided one-liner).* `curl -X POST "https://accounts.zoho.com/oauth/v2/token" -d "grant_type=authorization_code&client_id=…&client_secret=…&code=<grant>"`. Save the `refresh_token` from the response. (Access token expires hourly; the refresh token is the durable one.)
- [ ] **P1-C · Set the 6 env vars in Vercel** — *Kyle, Vercel dashboard → project → Settings → Environment Variables* (Production + Preview). CLI not installed locally; dashboard is the path.
- [ ] **P1-D · DECIDE the access guard** — *Kyle decides, Claude implements.* The `/api` endpoint and the portal are world-reachable. Options:
  - **(rec) Vercel Deployment Protection → Password / Vercel Authentication** — platform-level, covers HTML + API in one toggle. *Note: needs Vercel Pro.*
  - **Shared-secret header** — function rejects requests without `x-portal-key`; weaker (the portal is static, so the key would sit in client JS) — only viable if paired with the password layer.
  - **Decision needed before the endpoint goes public.** Until decided, test on a Preview URL only.
- [ ] **P1-E · Build `/api/procurement.js`** — *Claude.* Token refresh (in-memory cache), COQL reads, shape JSON for the 5 views. Can be written **now, blind** — runs once env vars land.
- [ ] **P1-F · Wire the portal** — *Claude.* Replace mock arrays with `fetch('/api/procurement')`; keep the mock banner until verified; graceful empty-state when 0 records.

### P2 — Verify + harden

- [ ] **P2-A · Deploy to a Preview URL and verify** against the 3 test records (queue, board counts, item detail + quotes, decisions, spend). *Claude builds, Kyle confirms.*
- [ ] **P2-B · Confirm field API names** via `getFields` before finalizing COQL (don't assume; `Landed_Cost_Unit`, `Target_Quantity`, `Awarded_Vendor`, `Estimated_Item_Level_Spend`, `Stage`, `Property_Scope` were reconciled this session — re-verify the rest). *Claude, via MCP.*
- [ ] **P2-C · Apply the access guard** chosen in P1-D; re-test that an unauthenticated request is rejected. *Claude + Kyle.*
- [ ] **P2-D · Token-refresh resilience** — handle expired access token (401 → refresh once → retry); log nothing sensitive. *Claude.*
- [ ] **P2-E · Drop the "SCAFFOLD — MOCK DATA" banner** once live data renders correctly. *Claude.*

### P3 — Polish / later

- [ ] **P3-A · Wire `/review` to the connected portal** in `vercel.json` (route already added; confirm it serves the live version).
- [ ] **P3-B · Spend rollup** computed server-side (group by Stage / Approver tier) rather than per-row in the browser.
- [ ] **P3-C · Light caching** (e.g., 60s) on the function to stay well under Zoho API rate limits if Rob refreshes often.

### Gated (NOT today — needs Rob / hold lift)

- [ ] ⛔ **Load real Procurement_Items** — on the operational hold only. Source resolved 06/06/26: **35 items** from `jefferson/ItemStaging_Procurement_052926.xlsx` (the "197" report is retired). Portal stays near-empty until the hold lifts and the load runs.
- [ ] ⛔ **Go-live to Rob** — sharing the live portal = go-live; gated on Rob lifting the hold (and on his operating-model confirmation).
- [ ] 🧹 **Delete the 3 test items + 3 test quotes (`_DELETE`)** before real go-live so they don't pollute Rob's view (manual — no MCP delete).

---

## Division of labor

| Kyle (console — can't be delegated) | Claude (build — can start now) |
|---|---|
| P1-A self-client · P1-B refresh token · P1-C env vars · P1-D guard decision · Vercel Pro toggle if chosen | P1-E function · P1-F wiring · P2-A/B/D/E · P3-A/B/C |

**Today's definition of done:** portal, on a protected Preview URL, renders the **3 live test records** from Zoho through the serverless read-proxy — proving the pipeline end-to-end. Real-data go-live stays gated.
