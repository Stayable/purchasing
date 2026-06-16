# Procurement Review Portal Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static dark `/review` portal with a Vite + React SPA (rewards-style) that renders live Zoho data and runs the hybrid approve/award flow, reusing the existing backend.

**Architecture:** New SPA lives in `portal/` (Vite, `base:'/review/'`, builds to repo-root `review/`). Vercel serves it at `/review` alongside the unchanged `index.html`, `/tracker`, and `/api/*` serverless functions. The SPA reads from `GET /api/procurement` and writes via `POST /api/award` (extended to accept a decision note → `Decision_Notes`). Auth is the existing HMAC session cookie.

**Tech Stack:** Vite, React 18, react-router-dom 6, recharts, axios; Vitest + React Testing Library (SPA tests); node:test (backend). Spec: `docs/superpowers/specs/2026-06-16-procurement-portal-redesign-design.md`.

**Reference design system:** `C:\Users\Kyle Estocapio\Git-Claude\rewards\client` (React 18 / router / recharts / axios). Match its component conventions and visual feel.

---

## File Structure

```
portal/
  package.json            # SPA deps + scripts (vite, react, router, recharts, axios, vitest, RTL)
  vite.config.js          # base:'/review/', outDir:'../review', test config
  index.html              # Vite entry
  src/
    main.jsx              # React root + router
    App.jsx               # shell: sidebar + routes + auth gate
    api.js                # axios client: getProcurement(), postAward(), login(), logout()
    api.test.js           # Vitest: response shaping + postAward body builder
    useProcurement.js     # hook: fetch + loading/error/401 + refetch
    auth/
      LoginScreen.jsx     # email/password overlay on 401
    components/
      Sidebar.jsx         # nav + signed-in-as/sign-out
      KpiRow.jsx          # pending/approved/over-$100K cards
      ItemList.jsx        # left pane list (sortable)
      QuoteTable.jsx      # quote-comparison + radio quote-select
      DecisionModal.jsx   # hybrid approve/award/decline confirm + required note
      StageBadge.jsx      # stage pill
    views/
      QueueView.jsx       # Stage=Submitted
      BoardView.jsx       # grouped by Stage
      ItemsView.jsx       # all items + detail pane
      DecisionsView.jsx   # decided log + after-the-fact note edit
      SpendView.jsx       # rollup + recharts
    money.js              # formatUSD + tier helpers
    money.test.js         # Vitest
review/                   # BUILD OUTPUT (gitignored) — Vite writes here
api/award.js              # MODIFY: accept `note` -> Decision_Notes; action:"note"
api/award.note.test.js    # node:test for the record-builder
vercel.json               # MODIFY: /review rewrites -> SPA
package.json              # MODIFY: root build script invokes the portal build
.gitignore                # MODIFY: ignore /review build output + portal/node_modules
```

Component boundaries: `api.js` is the only module that talks HTTP; views render from the hook's data and never fetch directly; `DecisionModal` owns the write call. Keep each file one responsibility.

---

## Task 1: Scaffold SPA + prove Vercel coexistence (DO THIS FIRST)

This task de-risks the one unknown (a built SPA at `/review` coexisting with the static site + `/api`). Ship a trivial SPA, deploy to a **preview**, confirm everything still serves, before building real UI.

**Files:**
- Create: `portal/package.json`, `portal/vite.config.js`, `portal/index.html`, `portal/src/main.jsx`, `portal/src/App.jsx`
- Modify: `vercel.json`, root `package.json`, `.gitignore`

- [ ] **Step 1: Create `portal/package.json`**

```json
{
  "name": "stayable-procurement-portal-spa",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/react": "^14.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "jsdom": "^24.0.0",
    "vite": "^5.1.0",
    "vitest": "^1.3.0"
  }
}
```

- [ ] **Step 2: Create `portal/vite.config.js`**

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/review/",
  plugins: [react()],
  build: { outDir: "../review", emptyOutDir: true },
  server: { proxy: { "/api": "http://localhost:3000" } }, // local dev against `vercel dev`
  test: { environment: "jsdom", globals: true, setupFiles: [] },
});
```

- [ ] **Step 3: Create `portal/index.html`, `portal/src/main.jsx`, `portal/src/App.jsx` (minimal placeholder)**

`portal/index.html`:
```html
<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Procurement Review</title></head>
  <body><div id="root"></div><script type="module" src="/review/src/main.jsx"></script></body>
</html>
```
`portal/src/main.jsx`:
```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
createRoot(document.getElementById("root")).render(
  <BrowserRouter basename="/review"><App /></BrowserRouter>
);
```
`portal/src/App.jsx` (placeholder to prove the deploy):
```jsx
export default function App() {
  return <div style={{ padding: 24, fontFamily: "system-ui" }}>Procurement Review SPA — coexistence OK</div>;
}
```

- [ ] **Step 4: Update root `package.json` build script**

Add a `build` script so Vercel builds the SPA (installs portal deps, then builds):
```json
{
  "private": true,
  "name": "stayable-procurement-portal",
  "description": "Static procurement portal + read-only Zoho proxy + Neon-backed portal auth (Vercel serverless).",
  "scripts": {
    "db:setup": "node db/setup.js",
    "db:seed": "node db/setup.js --seed",
    "build": "cd portal && npm install && npm run build"
  },
  "dependencies": { "@neondatabase/serverless": "^1.0.0" }
}
```

- [ ] **Step 5: Update `vercel.json`** — point `/review` at the built SPA, keep everything else

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "trailingSlash": false,
  "buildCommand": "npm run build",
  "rewrites": [
    { "source": "/tracker", "destination": "/ZohoProcurementTracker_052626" },
    { "source": "/review", "destination": "/review/index.html" },
    { "source": "/review/(.*)", "destination": "/review/index.html" }
  ],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Robots-Tag", "value": "noindex, nofollow" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ]}
  ]
}
```
Note: real built assets under `/review/assets/*` are served from the filesystem (Vercel checks static files before applying rewrites), so the catch-all only catches client-side routes. The old `RobReviewPortal_Procurement_060326.html` stays in the repo until Task 10 confirms parity, then is removed.

- [ ] **Step 6: Update `.gitignore`** — add the build output + SPA deps

```
/review/
portal/node_modules/
```

- [ ] **Step 7: Local build smoke**

Run (PowerShell): `cd portal; npm install; npm run build`
Expected: build succeeds, files appear in `review/` (e.g. `review/index.html`, `review/assets/*`).

- [ ] **Step 8: Commit**

```
git add portal vercel.json package.json .gitignore
git commit -m "Portal SPA: Vite scaffold + Vercel coexistence wiring (placeholder UI)"
git push origin main
```

- [ ] **Step 9: Verify the preview deploy (the actual de-risk)**

After the push deploys, fetch via the Vercel MCP / custom domain and confirm ALL still work:
- `GET /review` → SPA placeholder HTML (200)
- `GET /` → landing `index.html` (200)
- `GET /tracker` → tracker (200)
- `GET /api/procurement` → JSON 200 (with auth header) — backend untouched
Expected: all 200, SPA renders the placeholder. **If `/` or `/tracker` or `/api` broke, STOP** — switch to the fallback (separate Vercel project/subdomain for `portal/`) before continuing. Report which path broke.

---

## Task 2: API client + money helpers (pure, testable)

**Files:**
- Create: `portal/src/api.js`, `portal/src/api.test.js`, `portal/src/money.js`, `portal/src/money.test.js`

- [ ] **Step 1: Write failing test `portal/src/money.test.js`**

```js
import { describe, it, expect } from "vitest";
import { formatUSD } from "./money.js";
describe("formatUSD", () => {
  it("formats whole dollars", () => { expect(formatUSD(49600)).toBe("$49,600"); });
  it("handles null", () => { expect(formatUSD(null)).toBe("—"); });
});
```

- [ ] **Step 2: Run it, verify fail** — `cd portal && npx vitest run money.test.js` → FAIL (no `formatUSD`).

- [ ] **Step 3: Implement `portal/src/money.js`**

```js
export function formatUSD(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
```

- [ ] **Step 4: Run, verify pass.**

- [ ] **Step 5: Write `portal/src/api.test.js`** (test the postAward body builder — pure function)

```js
import { describe, it, expect } from "vitest";
import { buildAwardBody } from "./api.js";
describe("buildAwardBody", () => {
  it("award includes quoteId + note", () => {
    expect(buildAwardBody({ itemId: "1", action: "approve", quoteId: "9", note: "why" }))
      .toEqual({ itemId: "1", action: "approve", quoteId: "9", note: "why" });
  });
  it("decline omits quoteId", () => {
    expect(buildAwardBody({ itemId: "1", action: "decline", quoteId: "9", note: "no" }))
      .toEqual({ itemId: "1", action: "decline", note: "no" });
  });
});
```

- [ ] **Step 6: Run, verify fail.**

- [ ] **Step 7: Implement `portal/src/api.js`**

```js
import axios from "axios";
const http = axios.create({ withCredentials: true });

export function buildAwardBody({ itemId, action, quoteId, note }) {
  const body = { itemId, action, note };
  if (action !== "decline" && quoteId) body.quoteId = quoteId;
  return body;
}
export async function getProcurement() { return (await http.get("/api/procurement")).data; }
export async function postAward(args) { return (await http.post("/api/award", buildAwardBody(args))).data; }
export async function login(email, password) { return (await http.post("/api/auth/login", { email, password })).data; }
export async function logout() { return (await http.post("/api/auth/logout")).data; }
```

- [ ] **Step 8: Run tests, verify pass. Commit** `feat(portal): api client + money helpers + tests`.

---

## Task 3: Data hook + auth gate

**Files:** Create `portal/src/useProcurement.js`, `portal/src/auth/LoginScreen.jsx`. Modify `portal/src/App.jsx`.

- [ ] **Step 1: Implement `portal/src/useProcurement.js`**

```jsx
import { useCallback, useEffect, useState } from "react";
import { getProcurement } from "./api.js";
export function useProcurement() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | unauth | error
  const load = useCallback(async () => {
    setStatus("loading");
    try { setData(await getProcurement()); setStatus("ready"); }
    catch (e) { setStatus(e?.response?.status === 401 ? "unauth" : "error"); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, status, reload: load };
}
```

- [ ] **Step 2: Implement `portal/src/auth/LoginScreen.jsx`** — email/password, calls `login()`, then `onAuthed()`.

```jsx
import { useState } from "react";
import { login } from "../api.js";
export default function LoginScreen({ onAuthed }) {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr("");
    try { await login(email, pw); onAuthed(); }
    catch { setErr("Invalid email or password."); } finally { setBusy(false); }
  }
  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <h1>Procurement Review</h1>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} required />
        {err && <p className="err">{err}</p>}
        <button disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Wire `App.jsx`** — show `LoginScreen` when `status==="unauth"`, shell otherwise.

```jsx
import { useProcurement } from "./useProcurement.js";
import LoginScreen from "./auth/LoginScreen.jsx";
import Shell from "./components/Shell.jsx"; // built in Task 4
export default function App() {
  const { data, status, reload } = useProcurement();
  if (status === "unauth") return <LoginScreen onAuthed={reload} />;
  if (status === "loading") return <div className="center">Loading…</div>;
  if (status === "error") return <div className="center">Couldn’t reach the server. <button onClick={reload}>Retry</button></div>;
  return <Shell data={data} reload={reload} />;
}
```

- [ ] **Step 4: Build to verify no syntax errors** — `cd portal && npm run build` → success. **Commit** `feat(portal): data hook + login gate`.

---

## Task 4: App shell (sidebar + routes + KPI row)

**Files:** Create `portal/src/components/Shell.jsx`, `Sidebar.jsx`, `KpiRow.jsx`, `StageBadge.jsx`, `portal/src/styles.css`. Import `styles.css` in `main.jsx`.

- [ ] **Step 1: `StageBadge.jsx`** — pill with color per stage (Submitted=amber, Approved=green, Declined=red, others=slate).

```jsx
const COLORS = { Submitted:["#fef3c7","#92400e"], Approved:["#dcfce7","#166534"], "Approved-with-Conditions":["#dbeafe","#1e40af"], Declined:["#fee2e2","#991b1b"] };
export default function StageBadge({ stage }) {
  const [bg,fg] = COLORS[stage] || ["#f1f5f9","#475569"];
  return <span className="badge" style={{ background:bg, color:fg }}>{stage}</span>;
}
```

- [ ] **Step 2: `Sidebar.jsx`** — `NavLink`s (Queue/Board/Items/Decisions/Spend) + signed-in-as (`data.viewer`) + Sign out (`logout()` then reload).

- [ ] **Step 3: `KpiRow.jsx`** — three cards from `data.spend` + `data.counts`: Pending `formatUSD(spend.pendingSubmitted)`, Approved `formatUSD(spend.approvedTotal)`, `spend.overHundredK` over $100K.

- [ ] **Step 4: `Shell.jsx`** — flex layout: `<Sidebar>` + main `(<KpiRow/> + <Routes>)`. Routes map to the five views (Task 5/6), default redirect `/` → Queue. Pass `data` + `reload` down.

```jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar.jsx"; import KpiRow from "./KpiRow.jsx";
import QueueView from "../views/QueueView.jsx"; import BoardView from "../views/BoardView.jsx";
import ItemsView from "../views/ItemsView.jsx"; import DecisionsView from "../views/DecisionsView.jsx"; import SpendView from "../views/SpendView.jsx";
export default function Shell({ data, reload }) {
  return (
    <div className="shell">
      <Sidebar viewer={data.viewer} />
      <main className="main">
        <KpiRow spend={data.spend} counts={data.counts} />
        <Routes>
          <Route path="/" element={<Navigate to="/queue" replace />} />
          <Route path="/queue" element={<QueueView data={data} reload={reload} />} />
          <Route path="/board" element={<BoardView data={data} reload={reload} />} />
          <Route path="/items" element={<ItemsView data={data} reload={reload} />} />
          <Route path="/decisions" element={<DecisionsView data={data} reload={reload} />} />
          <Route path="/spend" element={<SpendView data={data} />} />
        </Routes>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: `styles.css`** — Stayable palette (dark slate sidebar `#1e293b`, blue accent `#2563eb`, light content), `.shell`(flex), `.sidebar`, `.main`, `.kpi`, `.badge`, `.login-*`, table styles. Mirror the rewards look (clean, light content area). Responsive: sidebar collapses under 768px.

- [ ] **Step 6: Build, verify success. Commit** `feat(portal): shell, sidebar, KPI row, theme`.

---

## Task 5: Read-only views (Queue / Board / Items / Decisions / Spend skeleton)

**Files:** Create `portal/src/components/ItemList.jsx`, `views/QueueView.jsx`, `BoardView.jsx`, `ItemsView.jsx`, `DecisionsView.jsx`, `SpendView.jsx`.

- [ ] **Step 1: `ItemList.jsx`** — props `{ items, selectedId, onSelect }`; renders rows (name, `StageBadge`, property, `formatUSD(spend)`, quote count, awarded vendor); highlights `selectedId`; `onClick → onSelect(item.id)`.

- [ ] **Step 2: `QueueView.jsx`** — `data.queue` (already Stage=Submitted) in `ItemList` (left) + detail (right, Task 6). Empty state: "No items awaiting decision."

- [ ] **Step 3: `BoardView.jsx`** — group `data.items` by `stage` into columns in the canonical order (Spec, Bid, Level, FL-Validate, Recommend, Submitted, Approved, Approved-with-Conditions, Declined, Need-More-Info); each card click selects into the detail pane.

- [ ] **Step 4: `ItemsView.jsx`** — all `data.items` in `ItemList`, sortable by stage then spend; + detail pane.

- [ ] **Step 5: `DecisionsView.jsx`** — `data.decisions` (date, name, stage, approver, note) as a log; each row expandable to edit the note (Task 9 wires the write).

- [ ] **Step 6: `SpendView.jsx`** — skeleton now (numbers only from `data.spend`); recharts chart added in Task 10.

- [ ] **Step 7: Build, verify. Commit** `feat(portal): queue/board/items/decisions/spend views`.

---

## Task 6: Item detail + quote table + quote selection

**Files:** Create `portal/src/components/QuoteTable.jsx`, `portal/src/components/ItemDetail.jsx`. Used by Queue/Items/Board detail panes.

- [ ] **Step 1: `QuoteTable.jsx`** — props `{ quotes, selectedQuoteId, onSelect }`. Rows = quotes for the item (filter `data.quotes` by `itemId`); columns vendor / landed-unit / total landed / lead / spec; a radio per row → `onSelect(quote.id)`; pre-highlight the lowest `totalLanded` as recommended.

- [ ] **Step 2: `ItemDetail.jsx`** — props `{ item, quotes, reload }`. Header (name, `StageBadge`, property, target qty, `formatUSD(spend)`, approver tier). If non-terminal (stage not Approved/Declined/Approved-with-Conditions): render `QuoteTable` + action bar (Approve & Award [disabled until a quote selected], Approve w/ Conditions, Decline) that opens `DecisionModal` (Task 7). If terminal: show the recorded decision (awarded vendor, `decisionNotes`, `Portal_Approved_By/At`) read-only.

- [ ] **Step 3: Local state** — `selectedQuoteId` in `ItemDetail`; default to the recommended (lowest landed) quote id.

- [ ] **Step 4: Build, verify. Commit** `feat(portal): item detail + quote-comparison table + quote select`.

---

## Task 7: DecisionModal (the hybrid approve/award flow)

**Files:** Create `portal/src/components/DecisionModal.jsx`. Wire into `ItemDetail`.

- [ ] **Step 1: `DecisionModal.jsx`** — props `{ item, action, quote, onClose, onDone }`.
  - Title per action (Approve & Award / Approve w/ Conditions / Decline).
  - For award/conditions: vendor+amount summary block from `quote`.
  - Required `<textarea>` note (label varies: "Why this vendor won" / "Conditions" / "Reason for decline"); Confirm disabled until non-empty.
  - Confirm → `postAward({ itemId:item.id, action, quoteId:quote?.id, note })`; on success `onDone()` (which calls `reload()` + closes); on error show inline message, keep modal open.

```jsx
import { useState } from "react";
import { postAward } from "../api.js";
import { formatUSD } from "../money.js";
const LABEL = { approve:"Approve & Award", approve_conditions:"Approve w/ Conditions", decline:"Decline" };
const NOTE_LABEL = { approve:"Why this vendor won", approve_conditions:"Conditions of approval", decline:"Reason for decline" };
export default function DecisionModal({ item, action, quote, onClose, onDone }) {
  const [note, setNote] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function confirm() {
    setBusy(true); setErr("");
    try { await postAward({ itemId: item.id, action, quoteId: quote?.id, note }); onDone(); }
    catch (e) { setErr(e?.response?.data?.error || "Write failed."); setBusy(false); }
  }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">{LABEL[action]}</div>
        <div className="modal-body">
          {action !== "decline" && quote && (
            <div className="award-summary">
              <div className="label">Awarding to</div>
              <div className="vendor">{quote.vendorName}</div>
              <div>{formatUSD(quote.landedUnit)} / unit · <b>{formatUSD(quote.totalLanded)}</b> landed · {quote.leadDays}d · {quote.specMatch}</div>
            </div>
          )}
          <label className="req">{NOTE_LABEL[action]} *</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Writes to Zoho Decision_Notes…" />
          {err && <p className="err">{err}</p>}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy || !note.trim()} onClick={confirm}>
            {busy ? "Saving…" : action === "decline" ? "Confirm Decline" : "Confirm & Award"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into `ItemDetail`** — action buttons set `{action, quote}` state that mounts `DecisionModal`; `onDone = () => { reload(); setModal(null); }`.

- [ ] **Step 3: Build, verify. Commit** `feat(portal): hybrid approve/award/decline modal`.

---

## Task 8: Backend — `/api/award` accepts the note (+ note-only action)

**Files:** Modify `api/award.js`. Create `api/award.note.test.js` (node:test).

- [ ] **Step 1: Write failing test `api/award.note.test.js`** — extract a pure `buildRecord(itemId, action, quoteId, note, viewer, today)` from award.js and test it.

```js
const test = require("node:test"); const assert = require("node:assert");
const { buildRecord } = require("./award.js");
test("approve builds award record with note", () => {
  const r = buildRecord("1", "approve", "9", "why it won", "rb@x.com", "2026-06-17");
  assert.equal(r.Stage, "Approved");
  assert.deepEqual(r.Awarded_Vendor, { id: "9" });
  assert.equal(r.Decision_Notes, "why it won");
  assert.equal(r.Portal_Approved_By, "rb@x.com");
  assert.equal(r.Portal_Approved_At, "2026-06-17");
});
test("decline omits award, keeps note", () => {
  const r = buildRecord("1", "decline", null, "230V no UL", "rb@x.com", "2026-06-17");
  assert.equal(r.Stage, "Declined");
  assert.equal("Awarded_Vendor" in r, false);
  assert.equal(r.Decision_Notes, "230V no UL");
});
test("note action only updates Decision_Notes", () => {
  const r = buildRecord("1", "note", null, "added later", "rb@x.com", "2026-06-17");
  assert.deepEqual(Object.keys(r).sort(), ["Decision_Notes", "id"].sort());
  assert.equal(r.Decision_Notes, "added later");
});
```

- [ ] **Step 2: Run, verify fail** — `node --test api/award.note.test.js` → FAIL (no `buildRecord` export / behavior).

- [ ] **Step 3: Refactor `api/award.js`** — add `ACTION_STAGE.note` handling, export + use `buildRecord`, include `Decision_Notes` from the request `note`.

```js
const ACTION_STAGE = { approve: "Approved", approve_conditions: "Approved-with-Conditions", decline: "Declined" };
function buildRecord(itemId, action, quoteId, note, viewer, today) {
  const r = { id: String(itemId) };
  if (action === "note") { r.Decision_Notes = note || ""; return r; }
  r.Stage = ACTION_STAGE[action];
  r.Portal_Approved_By = viewer;
  r.Portal_Approved_At = today;            // Date field -> YYYY-MM-DD
  if (note) r.Decision_Notes = note;
  if (action !== "decline" && quoteId) r.Awarded_Vendor = { id: String(quoteId) };
  return r;
}
module.exports.buildRecord = buildRecord;
```
In the handler: read `{ itemId, action, quoteId, note }`; validate `action` ∈ {approve, approve_conditions, decline, note}; `const record = buildRecord(itemId, action, quoteId, note, viewer, new Date().toISOString().slice(0,10));` then PUT as today. Keep the session gate + 503-without-write-token + audit row (`detail` now includes `note`).

- [ ] **Step 4: Run, verify pass.** Also `node --check api/award.js`.

- [ ] **Step 5: Commit** `feat(api): award accepts decision note -> Decision_Notes; add note-only action`.

---

## Task 9: Decisions after-the-fact note edit

**Files:** Modify `portal/src/views/DecisionsView.jsx`.

- [ ] **Step 1:** Each decision row gets an "Edit note" affordance → inline `<textarea>` prefilled with `decisionNotes` + Save.
- [ ] **Step 2:** Save → `postAward({ itemId, action: "note", note })` → on success `reload()`.
- [ ] **Step 3:** Build, verify. **Commit** `feat(portal): edit decision note after the fact`.

---

## Task 10: Spend chart, parity check, cut over, cleanup

**Files:** Modify `portal/src/views/SpendView.jsx`; delete `RobReviewPortal_Procurement_060326.html`; remove its `vercel.json` reference if any remnant.

- [ ] **Step 1:** `SpendView.jsx` — add a recharts `BarChart` (pending vs approved; optionally by approver tier from `data.items`).
- [ ] **Step 2:** Build, push, deploy. **Full smoke on the deployed custom domain:** anon `/api/procurement` → 401; login `rb@`/password → SPA hydrates; Queue shows the `Queen Mattresses` demo item; open it → quote table; **exercise Approve & Award on a `Test_Delete` record** (not the 2 demo keepers) → modal → confirm → Zoho write confirmed via MCP `getRecord`; `/`, `/tracker` still 200.
- [ ] **Step 3:** Once parity confirmed, delete `RobReviewPortal_Procurement_060326.html` and commit `chore: retire static review portal (replaced by SPA)`.
- [ ] **Step 4:** Update `docs/ZohoCRM_Todo_052126.md` + the rollout decision log: redesign shipped; note the `/api/award` note extension; carry forward the (still-open) demo-data delete + unique-passwords items.

---

## Self-Review notes (author)

- **Spec coverage:** stack (T1), deployment coexistence (T1), shell A+B layout (T4), five views (T5), detail+quote-select (T6), hybrid modal both enhancements (T7), backend note write (T8), notes-after (T9), spend chart + cutover (T10). All §-sections covered.
- **Backend honesty:** `/api/award` is *not* untouched — T8 adds the note + note-action. `/api/procurement` and auth are untouched.
- **Type consistency:** `buildAwardBody` (client) → `{itemId,action,quoteId?,note}` matches `buildRecord` (server) inputs; `action` vocabulary `approve|approve_conditions|decline|note` shared across T2/T7/T8/T9.
- **Risk gate:** T1 Step 9 is a hard STOP if static/`api` coexistence breaks — fallback to a separate Vercel project/subdomain.
- **Demo safety:** all write testing uses `Test_Delete` records, never the 2 keepers.
