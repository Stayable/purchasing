# Portal Award/Approve — Write-Path Activation Spec

**Last Updated:** 06/15/26
**Owner:** Kyle (executes the 3 setup steps below)
**Code already built:** `api/award.js` (commit `e64bacd`), Neon audit (`fa0fbcc`) — both inert until configured.
**Purpose:** let Rob (and allowlisted users) approve / award / decline a Procurement_Item directly in the `/review` portal, so Rob does not have to operate inside Zoho. Reverses the 06/03/26 read-only decision — see the Rollout decision log entry dated 06/15/26 and the attribution caveat below.

---

## Why this needs setup (what `api/award.js` requires, in order)

The endpoint is intentionally triple-gated. As of 06/15/26 **none** of the three is satisfied in production:

1. **Login active** — `SESSION_SECRET` set, else `401 auth_required`. The endpoint must know *who* clicked.
2. **Write token** — `ZOHO_WRITE_REFRESH_TOKEN` set, else `503 writes_not_configured`. This is a **separate, write-scoped** token; the existing portal token is read-only (`coql.READ,modules.READ`) and must NOT be reused.
3. **Two fields exist on `Procurement_Items`** — `Portal_Approved_By` + `Portal_Approved_At`. **Verified absent 06/15/26** via MCP `getFields` (40 fields; only `Approver` + `Awarded_Vendor` related). If absent, the PUT returns `INVALID_DATA`.

---

## Step 1 — Create the 2 fields (Zoho Settings UI; field creation is UI-only, no MCP)

Settings → Modules and Fields → **Procurement Items** → Edit Page Layout → add to the "Decision / Approval" section (or wherever `Approver` lives):

| Field Label | API name (must match exactly) | Field type | Required | Notes |
|---|---|---|---|---|
| Portal Approved By | `Portal_Approved_By` | Single Line (text), length ≥ 120 | No | App-level attribution — stamped with the logged-in portal user's email. |
| Portal Approved At | `Portal_Approved_At` | Date/Time | No | Stamped with the click timestamp (ISO, UTC). |

> The API name is what `api/award.js` writes to (lines 68–69). Zoho derives the API name from the label on first save — **verify** it lands as `Portal_Approved_By` / `Portal_Approved_At` (no trailing digits like `Portal_Approved_By1`). If Zoho appends a digit, either rename or tell me and I'll match the code to the real API name.
>
> Alternative if you'd rather not add fields: I can drop these two lines from `award.js` and rely solely on the Neon `portal_audit` log for "who approved." Trade-off: the attribution then lives only in the portal DB, not on the Zoho record itself. Default is to add the fields.

After creating, re-run `getFields` (I'll do this) to confirm before go-live.

## Step 2 — Mint a write-scoped refresh token

Use the new helper `get-write-refresh-token.ps1` (repo root). One-time:

1. Zoho API Console (`api-console.zoho.com`, logged in as `admin@rentstayable.com`) → your **Self Client** → Generate Code.
2. **Scope:** `ZohoCRM.modules.ALL` (read+write on records). Duration 10 min. Copy the grant code.
3. In the repo folder, run:
   ```
   powershell -ExecutionPolicy Bypass -File .\get-write-refresh-token.ps1
   ```
   Paste Client ID, Client Secret, and the grant code when prompted. It prints the refresh token to screen only (nothing secret is written to disk/repo).

> Datacenter = US (`accounts.zoho.com`). Grant code expires in ~3 min and is single-use — generate it right before running. The write token is a **distinct** Vercel env var from the read token; do not overwrite `ZOHO_REFRESH_TOKEN`.

## Step 3 — Set Vercel env vars + Redeploy

Vercel → project → Settings → Environment Variables (Production), then Redeploy:

| Var | Value | Enables |
|---|---|---|
| `SESSION_SECRET` | long random string | login (gate 1) — also needed for `/review` auth generally |
| `PORTAL_PW_JEFFERSON` / `PORTAL_PW_ADMIN` / `PORTAL_PW_ROB` | per-user passwords | who can sign in |
| `ZOHO_WRITE_REFRESH_TOKEN` | token from Step 2 | writes (gate 2) |
| *(optional)* `ZOHO_WRITE_CLIENT_ID` / `ZOHO_WRITE_CLIENT_SECRET` | if the write self-client differs from the read one | else defaults to `ZOHO_CLIENT_ID/SECRET` |
| *(optional)* `DATABASE_URL` | Neon connection string | persistent audit log of every approval |

---

## Verification (Claude, after Step 3)

1. MCP `getFields` → confirm `Portal_Approved_By` + `Portal_Approved_At` exist with the expected API names.
2. Logged-out POST to `/api/award` → expect `401`.
3. Logged-in approve on a **test/demo** item → expect `200`; then MCP `getRecord` confirms `Stage`, `Awarded_Vendor`, `Portal_Approved_By`, `Portal_Approved_At` all stamped.
4. **Do this against demo/`_DELETE` records only** — operational hold still bars real-data writes; delete demo data (`DEMO 061226`) + the 3 `_DELETE` records before any real load.

## Attribution caveat (must be understood before enabling)

Zoho's native `Modified_By` / audit will show the **service (OAuth) user**, not Rob — because the write goes through one server-side token. Real-person attribution lives in `Portal_Approved_By` + the Neon `portal_audit` log, not in Zoho's own audit trail. This is the exact reason the 06/03 decision kept the portal read-only. Enabling portal award accepts that trade-off in exchange for keeping Rob out of Zoho. True Zoho-native per-user attribution would require per-user OAuth (deferred).
