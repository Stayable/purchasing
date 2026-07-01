# Portal Workflow — Phase 1: Create Item (Rob) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Rob create a Procurement_Items record from the portal (Stage=Spec), writing to Zoho, so the workflow has a portal-side origin. No external setup required.

**Architecture:** New session-gated, role-gated serverless endpoint `POST /api/items` that writes a new Procurement_Items record via a shared Zoho-write helper. A React modal form (`NewItemModal`) posts to it and reloads portal data on success. A "+ New item" button appears only for creators (rb@, admin@).

**Tech Stack:** Vercel serverless (CommonJS, Node 24), Zoho CRM v8 REST, React 18 (Vite), Vitest (portal), node:test (api).

## Global Constraints

- File-naming for docs/artifacts: `DocType_Identifier_MMDDYY.ext` (does not apply to source files).
- Writes use `ZOHO_WRITE_REFRESH_TOKEN` (scope `ZohoCRM.modules.ALL`) — already configured in Vercel.
- Endpoint auth: session cookie required (`SESSION_SECRET` enables auth). Role gate: **only `rb@rise8companies.com` + `admin@rentstayable.com` may create.**
- Zoho field API names (verified live 07/02/26 via getFields): `Name` (text, mandatory), `Category` (picklist), `Property_Scope` (picklist), `Target_Quantity` (integer), `Target_Decision_Date` (date), `Description` (textarea), `US_Baseline_Cost_Unit` (currency), `Stage` (picklist, set to `Spec`).
- Category picklist (exact): Appliances, Building Materials, Electrical, Electronics, FF&E, Flooring & Wall Covering, Furniture, Hardware, Hardware & Tools, Kitchen & Bath, Lighting, Linens, OS&E, Outdoor / Garden, Paint & Supplies, Plumbing, Soft Goods, Other.
- Property_Scope picklist (exact, verbatim incl. the "(all 8 properties)" legacy label): Portfolio-wide (all 8 properties), Lakeland (4645), Kissimmee East (2295), Jacksonville West (6802), Jacksonville North (812), Kissimmee West (5399), St. Augustine (2535), Davenport (44199), Orlando OBT (8700), Gainesville (2900).
- Don't touch the live `api/award.js` write path in this phase.

---

## File structure

- `api/_zohoWrite.js` (new) — shared write helper: `getWriteToken()`, `createRecord(module, record)`. Extracted so items.js and future create endpoints don't duplicate token logic.
- `api/items.js` (new) — `POST /api/items` handler + exported pure `buildItemRecord(input)`.
- `api/items.test.js` (new) — node:test unit tests for `buildItemRecord`.
- `portal/src/roles.js` (new) — `canCreateItems(viewer)` role helper.
- `portal/src/roles.test.js` (new) — vitest for the helper.
- `portal/src/api.js` (modify) — add `createItem(payload)`.
- `portal/src/components/NewItemModal.jsx` (new) — the create form.
- `portal/src/components/NewItemModal.test.jsx` (new) — vitest for the form.
- `portal/src/views/ItemsView.jsx` (modify) — add the gated "+ New item" button + modal wiring.

---

### Task 1: Shared Zoho-write helper

**Files:**
- Create: `api/_zohoWrite.js`

**Interfaces:**
- Produces: `getWriteToken(): Promise<string>` and `createRecord(module: string, record: object): Promise<{id: string}>` (throws `Error("writes_not_configured")` / `Error("zoho_write_failed:"+detail)` on failure).

- [ ] **Step 1: Write the helper**

```js
// api/_zohoWrite.js — shared Zoho write helpers (token refresh + record create).
// Underscore prefix = not a route. Uses the SEPARATE write-scoped token so the
// read proxy stays least-privilege (mirrors api/award.js).
const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";
const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";

let cachedToken = null, cachedExp = 0;
async function getWriteToken() {
  const now = Date.now();
  if (cachedToken && now < cachedExp) return cachedToken;
  const refresh = process.env.ZOHO_WRITE_REFRESH_TOKEN;
  const cid = process.env.ZOHO_WRITE_CLIENT_ID || process.env.ZOHO_CLIENT_ID;
  const secret = process.env.ZOHO_WRITE_CLIENT_SECRET || process.env.ZOHO_CLIENT_SECRET;
  if (!refresh || !cid || !secret) throw new Error("writes_not_configured");
  const params = new URLSearchParams({ grant_type: "refresh_token", client_id: cid, client_secret: secret, refresh_token: refresh });
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${params.toString()}`, { method: "POST" });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("token_refresh_failed");
  cachedToken = j.access_token;
  cachedExp = now + (Number(j.expires_in || 3600) - 300) * 1000;
  return cachedToken;
}

// Create one record. Returns { id } on success; throws on failure.
async function createRecord(module, record) {
  const token = await getWriteToken();
  const r = await fetch(`${API}/crm/v8/${module}`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [record] }),
  });
  const j = await r.json().catch(() => ({}));
  const row = j && j.data && j.data[0];
  if (!r.ok || !row || row.code !== "SUCCESS") {
    throw new Error("zoho_write_failed:" + JSON.stringify(row || j));
  }
  return { id: row.details && row.details.id };
}

module.exports = { getWriteToken, createRecord };
```

- [ ] **Step 2: Syntax-check**

Run: `node --check api/_zohoWrite.js`
Expected: no output, exit 0.

- [ ] **Step 3: Commit**

```bash
git add api/_zohoWrite.js
git commit -m "feat(api): shared Zoho write helper (getWriteToken + createRecord)"
```

---

### Task 2: `buildItemRecord` (pure) + tests

**Files:**
- Create: `api/items.test.js`
- Create: `api/items.js` (partial — export the pure fn; handler added Task 3)

**Interfaces:**
- Produces: `buildItemRecord(input: object): object` — maps portal form fields to a Zoho Procurement_Items payload with `Stage:"Spec"`. Consumed by the Task 3 handler.

- [ ] **Step 1: Write the failing test**

```js
// api/items.test.js
const test = require("node:test");
const assert = require("node:assert");
const { buildItemRecord } = require("./items.js");

test("maps required fields and forces Stage=Spec", () => {
  const rec = buildItemRecord({
    name: "Queen Mattress 12in",
    category: "FF&E",
    property: "Lakeland (4645)",
    targetQty: 120,
    description: "Medium-firm, hotel contract grade",
  });
  assert.equal(rec.Name, "Queen Mattress 12in");
  assert.equal(rec.Category, "FF&E");
  assert.equal(rec.Property_Scope, "Lakeland (4645)");
  assert.equal(rec.Target_Quantity, 120);
  assert.equal(rec.Description, "Medium-firm, hotel contract grade");
  assert.equal(rec.Stage, "Spec");
});

test("omits optional empty fields", () => {
  const rec = buildItemRecord({ name: "X", category: "OS&E", property: "Gainesville (2900)", targetQty: 5, description: "d" });
  assert.ok(!("Target_Decision_Date" in rec));
  assert.ok(!("US_Baseline_Cost_Unit" in rec));
});

test("includes optional fields when provided", () => {
  const rec = buildItemRecord({
    name: "X", category: "OS&E", property: "Gainesville (2900)", targetQty: 5, description: "d",
    neededBy: "2026-08-01", baselineUnitCost: 42.5,
  });
  assert.equal(rec.Target_Decision_Date, "2026-08-01");
  assert.equal(rec.US_Baseline_Cost_Unit, 42.5);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/items.test.js`
Expected: FAIL — `Cannot find module './items.js'` (or buildItemRecord undefined).

- [ ] **Step 3: Write minimal implementation**

```js
// api/items.js — portal-initiated CREATE of a Procurement_Items record (Stage=Spec).
// Session-gated + role-gated (only creators may POST). Writes via api/_zohoWrite.js.

// Map the portal create-item form to a Zoho Procurement_Items payload.
// Only Name/Category/Property_Scope/Target_Quantity/Description are required by the form;
// Stage is always forced to "Spec"; optional fields are included only when present.
function buildItemRecord(input) {
  const rec = {
    Name: String(input.name || "").trim(),
    Category: input.category,
    Property_Scope: input.property,
    Target_Quantity: Number(input.targetQty),
    Description: String(input.description || ""),
    Stage: "Spec",
  };
  if (input.neededBy) rec.Target_Decision_Date = input.neededBy; // YYYY-MM-DD
  if (input.baselineUnitCost != null && input.baselineUnitCost !== "") {
    rec.US_Baseline_Cost_Unit = Number(input.baselineUnitCost);
  }
  return rec;
}

module.exports.buildItemRecord = buildItemRecord;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test api/items.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add api/items.js api/items.test.js
git commit -m "feat(api): buildItemRecord maps create-item form to Zoho payload"
```

---

### Task 3: `POST /api/items` handler (session + role gate + create)

**Files:**
- Modify: `api/items.js`

**Interfaces:**
- Consumes: `buildItemRecord` (Task 2), `_auth.js` (`authEnabled`, `sessionEmail`, `readJson`, `norm`), `_zohoWrite.js` (`createRecord`), `_db.js` (`audit`).
- Produces: HTTP `POST /api/items` → `201 {ok:true, id}` on success; `401`/`403`/`400`/`503`/`502` on failure.

- [ ] **Step 1: Add the require + role constant at the top of `api/items.js`**

Insert above `buildItemRecord`:

```js
const auth = require("./_auth.js");
const zw = require("./_zohoWrite.js");
const dbm = require("./_db.js");

// Only these users may create procurement items (Rob + Kyle-admin override).
const CREATORS = ["rb@rise8companies.com", "admin@rentstayable.com"];
const REQUIRED = ["name", "category", "property", "targetQty", "description"];
```

- [ ] **Step 2: Append the handler + exports at the bottom of `api/items.js`**

```js
const handler = async (req, res) => {
  if (!auth.authEnabled()) return res.status(401).json({ error: "auth_required" });
  const viewer = auth.sessionEmail(req);
  if (!viewer) return res.status(401).json({ error: "auth_required" });
  if (!CREATORS.includes(auth.norm(viewer))) return res.status(403).json({ error: "forbidden" });
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!process.env.ZOHO_WRITE_REFRESH_TOKEN) return res.status(503).json({ error: "writes_not_configured" });

  const input = await auth.readJson(req);
  for (const k of REQUIRED) {
    if (input[k] == null || String(input[k]).trim() === "") {
      return res.status(400).json({ error: "bad_request", detail: `missing ${k}` });
    }
  }
  if (!Number.isFinite(Number(input.targetQty)) || Number(input.targetQty) <= 0) {
    return res.status(400).json({ error: "bad_request", detail: "targetQty must be a positive number" });
  }

  const record = buildItemRecord(input);
  try {
    const { id } = await zw.createRecord("Procurement_Items", record);
    await dbm.audit("item_created", viewer, { itemId: String(id), name: record.Name });
    return res.status(201).json({ ok: true, id });
  } catch (err) {
    const msg = String(err.message || err);
    const code = msg === "writes_not_configured" ? 503 : 502;
    return res.status(code).json({ error: msg });
  }
};

module.exports = handler;
module.exports.buildItemRecord = buildItemRecord;
```

Note: replace the existing `module.exports.buildItemRecord = buildItemRecord;` line from Task 2 with the two export lines above (handler as default, buildItemRecord as named).

- [ ] **Step 3: Syntax-check + re-run unit tests**

Run: `node --check api/items.js && node --test api/items.test.js`
Expected: syntax OK; 3 tests still PASS.

- [ ] **Step 4: Commit**

```bash
git add api/items.js
git commit -m "feat(api): POST /api/items — session+role-gated create-item handler"
```

---

### Task 4: Frontend role helper

**Files:**
- Create: `portal/src/roles.js`
- Create: `portal/src/roles.test.js`

**Interfaces:**
- Produces: `canCreateItems(viewer: string): boolean`.

- [ ] **Step 1: Write the failing test**

```js
// portal/src/roles.test.js
import { describe, it, expect } from "vitest";
import { canCreateItems } from "./roles.js";

describe("canCreateItems", () => {
  it("allows Rob and admin", () => {
    expect(canCreateItems("rb@rise8companies.com")).toBe(true);
    expect(canCreateItems("ADMIN@rentstayable.com")).toBe(true);
  });
  it("denies Jefferson and unknown", () => {
    expect(canCreateItems("jefferson@rentstayable.com")).toBe(false);
    expect(canCreateItems("")).toBe(false);
    expect(canCreateItems(null)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npx vitest run src/roles.test.js`
Expected: FAIL — cannot resolve `./roles.js`.

- [ ] **Step 3: Write implementation**

```js
// portal/src/roles.js — client-side role gating (mirror of the server allowlist in api/items.js).
// UI convenience only; the server is the real gate.
const CREATORS = ["rb@rise8companies.com", "admin@rentstayable.com"];
export function canCreateItems(viewer) {
  return CREATORS.includes(String(viewer || "").trim().toLowerCase());
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd portal && npx vitest run src/roles.test.js`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add portal/src/roles.js portal/src/roles.test.js
git commit -m "feat(portal): canCreateItems role helper"
```

---

### Task 5: API client `createItem`

**Files:**
- Modify: `portal/src/api.js`

**Interfaces:**
- Produces: `createItem(payload): Promise<{ok, id}>` (POST /api/items).

- [ ] **Step 1: Add the function** (after `postAward`)

```js
export async function createItem(payload) { return (await http.post("/api/items", payload)).data; }
```

- [ ] **Step 2: Commit**

```bash
git add portal/src/api.js
git commit -m "feat(portal): api.createItem client"
```

---

### Task 6: `NewItemModal` form

**Files:**
- Create: `portal/src/components/NewItemModal.jsx`
- Create: `portal/src/components/NewItemModal.test.jsx`

**Interfaces:**
- Consumes: `createItem` (Task 5).
- Produces: `<NewItemModal onClose onCreated />` — modal form; calls `onCreated()` after a successful create.

- [ ] **Step 1: Write the failing test**

```jsx
// portal/src/components/NewItemModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewItemModal from "./NewItemModal.jsx";
import * as api from "../api.js";

describe("NewItemModal", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("disables submit until required fields are filled", () => {
    render(<NewItemModal onClose={() => {}} onCreated={() => {}} />);
    expect(screen.getByRole("button", { name: /create item/i })).toBeDisabled();
  });

  it("submits mapped payload and calls onCreated", async () => {
    const spy = vi.spyOn(api, "createItem").mockResolvedValue({ ok: true, id: "123" });
    const onCreated = vi.fn();
    render(<NewItemModal onClose={() => {}} onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/item name/i), { target: { value: "Queen Mattress" } });
    fireEvent.change(screen.getByLabelText(/category/i), { target: { value: "FF&E" } });
    fireEvent.change(screen.getByLabelText(/property/i), { target: { value: "Lakeland (4645)" } });
    fireEvent.change(screen.getByLabelText(/target quantity/i), { target: { value: "120" } });
    fireEvent.change(screen.getByLabelText(/specs/i), { target: { value: "contract grade" } });
    fireEvent.click(screen.getByRole("button", { name: /create item/i }));
    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({
      name: "Queen Mattress", category: "FF&E", property: "Lakeland (4645)", targetQty: "120", description: "contract grade",
    }));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npx vitest run src/components/NewItemModal.test.jsx`
Expected: FAIL — cannot resolve `./NewItemModal.jsx`.

- [ ] **Step 3: Write the component**

```jsx
// portal/src/components/NewItemModal.jsx — Rob's create-item form (Stage=Spec on save).
import { useState } from "react";
import { createItem } from "../api.js";

const CATEGORIES = ["Appliances","Building Materials","Electrical","Electronics","FF&E","Flooring & Wall Covering","Furniture","Hardware","Hardware & Tools","Kitchen & Bath","Lighting","Linens","OS&E","Outdoor / Garden","Paint & Supplies","Plumbing","Soft Goods","Other"];
const PROPERTIES = ["Portfolio-wide (all 8 properties)","Lakeland (4645)","Kissimmee East (2295)","Jacksonville West (6802)","Jacksonville North (812)","Kissimmee West (5399)","St. Augustine (2535)","Davenport (44199)","Orlando OBT (8700)","Gainesville (2900)"];

export default function NewItemModal({ onClose, onCreated }) {
  const [f, setF] = useState({ name: "", category: "", property: "", targetQty: "", neededBy: "", description: "", baselineUnitCost: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ready = f.name.trim() && f.category && f.property && String(f.targetQty).trim() && f.description.trim();

  async function submit() {
    setBusy(true); setErr("");
    try {
      await createItem(f);
      onCreated();
    } catch (e) {
      setErr(e?.response?.data?.detail || e?.response?.data?.error || "Create failed.");
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={() => !busy && onClose()}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">New procurement item</div>
        <div className="modal-body">
          <label className="req" htmlFor="ni-name">Item name <span className="req-star">*</span></label>
          <input id="ni-name" className="modal-input" value={f.name} onChange={set("name")} />

          <label className="req" htmlFor="ni-cat">Category <span className="req-star">*</span></label>
          <select id="ni-cat" className="modal-input" value={f.category} onChange={set("category")}>
            <option value="">Select…</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label className="req" htmlFor="ni-prop">Property scope <span className="req-star">*</span></label>
          <select id="ni-prop" className="modal-input" value={f.property} onChange={set("property")}>
            <option value="">Select…</option>
            {PROPERTIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <label className="req" htmlFor="ni-qty">Target quantity <span className="req-star">*</span></label>
          <input id="ni-qty" className="modal-input" type="number" min="1" value={f.targetQty} onChange={set("targetQty")} />

          <label htmlFor="ni-needed">Needed-by / target decision date</label>
          <input id="ni-needed" className="modal-input" type="date" value={f.neededBy} onChange={set("neededBy")} />

          <label className="req" htmlFor="ni-desc">Specs / description <span className="req-star">*</span></label>
          <textarea id="ni-desc" className="modal-textarea" rows={4} value={f.description} onChange={set("description")} placeholder="What Jefferson needs to source…" />

          <label htmlFor="ni-base">US baseline cost / unit</label>
          <input id="ni-base" className="modal-input" type="number" min="0" step="0.01" value={f.baselineUnitCost} onChange={set("baselineUnitCost")} />

          {err && <p className="err">{err}</p>}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn-primary" onClick={submit} disabled={busy || !ready}>
            {busy ? "Creating…" : "Create item"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd portal && npx vitest run src/components/NewItemModal.test.jsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add portal/src/components/NewItemModal.jsx portal/src/components/NewItemModal.test.jsx
git commit -m "feat(portal): NewItemModal create-item form"
```

---

### Task 7: Wire the gated "+ New item" button into ItemsView

**Files:**
- Modify: `portal/src/views/ItemsView.jsx`

**Interfaces:**
- Consumes: `NewItemModal` (Task 6), `canCreateItems` (Task 4), `reload` + `data.viewer` (already passed to the view).

- [ ] **Step 1: Read the current ItemsView to find its header + props**

Run: `sed -n '1,40p' portal/src/views/ItemsView.jsx`
(Confirm it receives `{ data, reload }` and where the view title renders.)

- [ ] **Step 2: Add imports + state + button + modal**

At the top of the file add:

```jsx
import { useState } from "react";
import NewItemModal from "../components/NewItemModal.jsx";
import { canCreateItems } from "../roles.js";
```

Inside the component (destructure `data`, `reload`), add near the top of the body:

```jsx
const [showNew, setShowNew] = useState(false);
const canCreate = canCreateItems(data?.viewer);
```

In the view's header area, add the button (gated):

```jsx
{canCreate && (
  <button className="btn-primary" onClick={() => setShowNew(true)}>+ New item</button>
)}
```

Before the component's closing tag, add the modal:

```jsx
{showNew && (
  <NewItemModal
    onClose={() => setShowNew(false)}
    onCreated={() => { setShowNew(false); reload(); }}
  />
)}
```

- [ ] **Step 3: Full portal test run**

Run: `cd portal && npx vitest run`
Expected: all portal tests PASS (existing + the new roles + NewItemModal specs).

- [ ] **Step 4: Build the SPA**

Run: `npm run build:portal`
Expected: Vite build succeeds; `review/` updated.

- [ ] **Step 5: Commit (source + built output)**

```bash
git add portal/src/views/ItemsView.jsx review/
git commit -m "feat(portal): gated + New item button + modal in Items view; rebuild review/"
```

---

## Manual verification (after deploy)

1. `git push origin main` (auto-deploys to `procurement.rentstayable.com`).
2. Log in as `rb@` → Items view shows **+ New item**; log in as `jefferson@` → button absent.
3. As `rb@`, create a test item (name prefix `TEST_DELETE_070226`) → 201, item appears in the list at Stage=Spec; confirm in Zoho via COQL.
4. `curl -X POST https://procurement.rentstayable.com/api/items` unauthenticated → 401.
5. Delete the test item in Zoho when done.

## Self-review notes

- Spec coverage: implements §6 (Create Item form + fields) and the create half of §5 (`POST /api/items`) and §10 (Stage=Spec). Notification on create (`item_created` → Jefferson) is **Phase 2** — deliberately out of this plan (no Neon notifications table yet); the endpoint already writes a `dbm.audit("item_created", …)` row so Phase 2 can also hook here.
- No placeholders; all code shown.
- Type consistency: `buildItemRecord` field names match the verified Zoho API names; `canCreateItems` allowlist matches the server `CREATORS` constant.
- DRY note: `api/award.js` still has its own inline `getWriteToken`; refactoring it onto `api/_zohoWrite.js` is a safe follow-up but is intentionally deferred to avoid touching the live approve path in this phase.
