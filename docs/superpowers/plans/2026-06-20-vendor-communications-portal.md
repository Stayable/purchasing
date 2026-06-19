# Vendor Communications Portal Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface vendor email threads (inbound + our replies) on each Procurement Item in the review portal, per quote, with a cross-item attention signal so Rob can monitor what's awaiting a reply or gone stale.

**Architecture:** A Vercel serverless endpoint (`api/communications.js`) authenticates to Microsoft Graph app-only, sweeps the scoped mailboxes once (cached), matches messages to each item's vendors by email address, derives an attention state, and returns JSON shaped for two scopes: a full per-quote thread view (`?itemId=`) and a lightweight cross-item attention sweep (no `itemId`). The portal SPA renders per-quote thread panels + item rollup on detail and attention badges on the queue. Pure logic lives in `api/_comms.js` (unit-tested with `node:test`); the impure Graph client lives in `api/_graph.js`. The feature is **inert until Graph env vars are set** — same pattern as the Zoho proxy and award write-path.

**Tech Stack:** Node (CommonJS) Vercel functions; Microsoft Graph REST (client-credentials / app-only); React 18 + Vite SPA (`portal/`), built to `review/`; `node:test` for API, Vitest for SPA.

## Global Constraints

- **Read-only.** This feature never writes to Graph or Zoho. No sending email.
- **Inert until configured.** Endpoint returns `{ configured: false }` unless `GRAPH_TENANT_ID`, `GRAPH_CLIENT_ID`, `GRAPH_CLIENT_SECRET` are all set. Portal degrades gracefully — never errors the page.
- **Auth-gated, never CDN-shared.** Reuse `api/_auth.js` session gate. Response headers MUST be `Cache-Control: private, no-store, max-age=0` + `Vary: Cookie` (the 06/16 data-leak lesson).
- **Attribution mode A** (vendor-scoped) for this plan. `attributionMode: "vendor"`. Token precision (B) is Phase 5, out of scope here.
- **Stale threshold = 7 days** (org value set 06/05/26). Use the constant `STALE_DAYS = 7`.
- **Scoped mailboxes** come from `GRAPH_MAILBOXES` (CSV); default `purchasing@rentstayable.com,jefferson@rentstayable.com`.
- **Coverage is email-only.** Every comms surface shows "Email only — Alibaba chat not shown". Empty/`none` state is never "resolved".
- **Secrets server-side only.** Never in repo or client bundle.
- **No COQL dotted-name traversal across the item lookup** — `Procurement_Item.Item_Name` is invalid. Filter `Vendor_Quotes WHERE Procurement_Item = <id>` and select `Vendor.id` / `Vendor.Vendor_Name` / `Procurement_Item.id`.
- **Commit message footer** (per project): end commits with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

# PHASE 1 — Backend logic + endpoint (Owner: Claude; no credentials needed)

Produces a working, tested endpoint that returns `configured:false` until Phase 3. All pure logic is unit-tested.

### Task 1: Address matching + direction (`api/_comms.js`)

**Files:**
- Create: `api/_comms.js`
- Test: `api/_comms.test.js`

**Interfaces:**
- Produces: `normAddr(a) -> string`; `matchMessageToVendor(message, vendors) -> vendor|null`; `classifyDirection(message, ourAddresses) -> "inbound"|"outbound"`
- Message shape: `{ id, conversationId, from, to:[], cc:[], subject, preview, receivedAt, hasAttachments, webLink }`
- Vendor shape: `{ quoteId, quoteName, vendorName, vendorAccountId, addresses:[string] }`

- [ ] **Step 1: Write the failing test**

```js
// api/_comms.test.js
const test = require("node:test"); const assert = require("node:assert");
const c = require("./_comms.js");

test("normAddr lowercases and trims", () => {
  assert.equal(c.normAddr("  Sales@Walrus.COM "), "sales@walrus.com");
  assert.equal(c.normAddr(null), "");
});

test("matchMessageToVendor matches inbound by from", () => {
  const vendors = [{ quoteId: "q1", vendorName: "Walrus", addresses: ["sales@walrus.com"] }];
  const msg = { from: "Sales@Walrus.com", to: ["purchasing@rentstayable.com"], cc: [] };
  assert.equal(c.matchMessageToVendor(msg, vendors).quoteId, "q1");
});

test("matchMessageToVendor matches outbound by to/cc", () => {
  const vendors = [{ quoteId: "q1", vendorName: "Walrus", addresses: ["sales@walrus.com"] }];
  const msg = { from: "purchasing@rentstayable.com", to: ["x@y.com"], cc: ["sales@walrus.com"] };
  assert.equal(c.matchMessageToVendor(msg, vendors).quoteId, "q1");
});

test("matchMessageToVendor returns null when no address matches", () => {
  const vendors = [{ quoteId: "q1", addresses: ["sales@walrus.com"] }];
  assert.equal(c.matchMessageToVendor({ from: "a@b.com", to: [], cc: [] }, vendors), null);
});

test("classifyDirection: from one of our mailboxes is outbound", () => {
  const ours = new Set(["purchasing@rentstayable.com"]);
  assert.equal(c.classifyDirection({ from: "purchasing@rentstayable.com" }, ours), "outbound");
  assert.equal(c.classifyDirection({ from: "sales@walrus.com" }, ours), "inbound");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/_comms.test.js`
Expected: FAIL — `Cannot find module './_comms.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// api/_comms.js — PURE logic for the vendor-communications feature. No I/O, no deps.
const STALE_DAYS = 7;

function normAddr(a) { return String(a == null ? "" : a).trim().toLowerCase(); }

function msgAddresses(message, fields) {
  const out = [];
  for (const f of fields) {
    const v = message[f];
    if (Array.isArray(v)) for (const x of v) out.push(normAddr(x));
    else if (v) out.push(normAddr(v));
  }
  return out;
}

function matchMessageToVendor(message, vendors) {
  const addrs = new Set(msgAddresses(message, ["from", "to", "cc"]));
  for (const v of vendors || []) {
    for (const a of v.addresses || []) if (addrs.has(normAddr(a))) return v;
  }
  return null;
}

function classifyDirection(message, ourAddresses) {
  return ourAddresses.has(normAddr(message.from)) ? "outbound" : "inbound";
}

module.exports = { STALE_DAYS, normAddr, msgAddresses, matchMessageToVendor, classifyDirection };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test api/_comms.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add api/_comms.js api/_comms.test.js
git commit -m "feat(comms): address matching + direction classification" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Attention-state derivation (`api/_comms.js`)

**Files:**
- Modify: `api/_comms.js`
- Modify: `api/_comms.test.js`

**Interfaces:**
- Produces: `deriveAttention(messages, nowMs, staleDays?) -> { attentionState, daysSinceLastMessage, lastDirection, lastMessageAt }` where `attentionState ∈ {"awaiting-our-reply","stale","ok","none"}`. `messages` are direction-tagged: `{ ...message, direction }`.
- Produces: `rollupItemAttention(states) -> string` (most urgent of a list of attentionState strings).

- [ ] **Step 1: Write the failing test**

```js
// append to api/_comms.test.js
const DAY = 86400000;
const NOW = Date.UTC(2026, 5, 20); // 2026-06-20

test("deriveAttention: no messages -> none", () => {
  const r = c.deriveAttention([], NOW);
  assert.equal(r.attentionState, "none");
  assert.equal(r.daysSinceLastMessage, null);
});

test("deriveAttention: last message inbound -> awaiting-our-reply", () => {
  const msgs = [
    { direction: "outbound", receivedAt: new Date(NOW - 5 * DAY).toISOString() },
    { direction: "inbound", receivedAt: new Date(NOW - 1 * DAY).toISOString() },
  ];
  const r = c.deriveAttention(msgs, NOW);
  assert.equal(r.attentionState, "awaiting-our-reply");
  assert.equal(r.daysSinceLastMessage, 1);
});

test("deriveAttention: last outbound and >=7 days silent -> stale", () => {
  const msgs = [{ direction: "outbound", receivedAt: new Date(NOW - 9 * DAY).toISOString() }];
  assert.equal(c.deriveAttention(msgs, NOW).attentionState, "stale");
});

test("deriveAttention: last outbound and recent -> ok", () => {
  const msgs = [{ direction: "outbound", receivedAt: new Date(NOW - 2 * DAY).toISOString() }];
  assert.equal(c.deriveAttention(msgs, NOW).attentionState, "ok");
});

test("rollupItemAttention picks most urgent", () => {
  assert.equal(c.rollupItemAttention(["ok", "stale", "awaiting-our-reply"]), "awaiting-our-reply");
  assert.equal(c.rollupItemAttention(["ok", "stale", "none"]), "stale");
  assert.equal(c.rollupItemAttention(["none", "none"]), "none");
  assert.equal(c.rollupItemAttention([]), "none");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/_comms.test.js`
Expected: FAIL — `c.deriveAttention is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
// add to api/_comms.js (before module.exports), then extend the exports object
function deriveAttention(messages, nowMs, staleDays = STALE_DAYS) {
  if (!messages || messages.length === 0) {
    return { attentionState: "none", daysSinceLastMessage: null, lastDirection: null, lastMessageAt: null };
  }
  const sorted = [...messages].sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt));
  const last = sorted[sorted.length - 1];
  const lastMs = new Date(last.receivedAt).getTime();
  const days = Math.floor((nowMs - lastMs) / 86400000);
  let attentionState;
  if (last.direction === "inbound") attentionState = "awaiting-our-reply";
  else if (days >= staleDays) attentionState = "stale";
  else attentionState = "ok";
  return { attentionState, daysSinceLastMessage: days, lastDirection: last.direction, lastMessageAt: last.receivedAt };
}

const ATTENTION_RANK = { "awaiting-our-reply": 3, stale: 2, ok: 1, none: 0 };
function rollupItemAttention(states) {
  let best = "none";
  for (const s of states || []) if ((ATTENTION_RANK[s] || 0) > ATTENTION_RANK[best]) best = s;
  return best;
}
```

Add `deriveAttention, rollupItemAttention` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test api/_comms.test.js`
Expected: PASS (10 tests total)

- [ ] **Step 5: Commit**

```bash
git add api/_comms.js api/_comms.test.js
git commit -m "feat(comms): attention-state derivation + item rollup" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Resolve vendors from Zoho rows (`api/_comms.js`)

**Files:**
- Modify: `api/_comms.js`
- Modify: `api/_comms.test.js`

**Interfaces:**
- Produces: `vendorsFromRows(quoteRows, contactRows) -> vendor[]`.
  - `quoteRows`: `[{ id, Name, "Vendor.Vendor_Name", "Vendor.id", "Procurement_Item.id" }]`
  - `contactRows`: `[{ Email, "Account_Name.id" }]`
  - Returns `{ quoteId, quoteName, vendorName, vendorAccountId, itemId, addresses:[lowercased emails] }`, one per quote, addresses gathered from contacts of that quote's vendor account. Quotes whose vendor has no email get `addresses: []`.

- [ ] **Step 1: Write the failing test**

```js
// append to api/_comms.test.js
test("vendorsFromRows joins quote vendors to their contact emails", () => {
  const quotes = [
    { id: "q1", Name: "QT-0007", "Vendor.Vendor_Name": "Walrus", "Vendor.id": "v1", "Procurement_Item.id": "i1" },
    { id: "q2", Name: "QT-0008", "Vendor.Vendor_Name": "Mesa", "Vendor.id": "v2", "Procurement_Item.id": "i1" },
  ];
  const contacts = [
    { Email: "Sales@Walrus.com", "Account_Name.id": "v1" },
    { Email: "jess@walrus.com", "Account_Name.id": "v1" },
    { Email: "info@mesa.com", "Account_Name.id": "v2" },
  ];
  const v = c.vendorsFromRows(quotes, contacts);
  assert.equal(v.length, 2);
  assert.deepEqual(v[0], {
    quoteId: "q1", quoteName: "QT-0007", vendorName: "Walrus", vendorAccountId: "v1",
    itemId: "i1", addresses: ["sales@walrus.com", "jess@walrus.com"],
  });
  assert.deepEqual(v[1].addresses, ["info@mesa.com"]);
});

test("vendorsFromRows: vendor with no contacts -> empty addresses", () => {
  const v = c.vendorsFromRows([{ id: "q1", Name: "QT", "Vendor.id": "v9", "Procurement_Item.id": "i1" }], []);
  assert.deepEqual(v[0].addresses, []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/_comms.test.js`
Expected: FAIL — `c.vendorsFromRows is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
// add to api/_comms.js, then extend exports
function vendorsFromRows(quoteRows, contactRows) {
  const byAccount = {};
  for (const ct of contactRows || []) {
    const acc = ct["Account_Name.id"];
    const email = normAddr(ct.Email);
    if (!acc || !email) continue;
    (byAccount[acc] = byAccount[acc] || []).push(email);
  }
  return (quoteRows || []).map((q) => ({
    quoteId: q.id,
    quoteName: q.Name || null,
    vendorName: q["Vendor.Vendor_Name"] || null,
    vendorAccountId: q["Vendor.id"] || null,
    itemId: q["Procurement_Item.id"] || null,
    addresses: byAccount[q["Vendor.id"]] || [],
  }));
}
```

Add `vendorsFromRows` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test api/_comms.test.js`
Expected: PASS (12 tests total)

- [ ] **Step 5: Commit**

```bash
git add api/_comms.js api/_comms.test.js
git commit -m "feat(comms): resolve vendors+addresses from Zoho quote/contact rows" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Build payloads — full item view + attention sweep (`api/_comms.js`)

**Files:**
- Modify: `api/_comms.js`
- Modify: `api/_comms.test.js`

**Interfaces:**
- Produces: `buildItemPayload({ itemId, vendors, messages, ourAddresses, nowMs }) -> { itemId, configured:true, attributionMode:"vendor", coverage:"email-only", itemAttention, vendors:[{quoteId,quoteName,vendorName,matchedAddresses,messageCount,lastMessageAt,lastDirection,attentionState,daysSinceLastMessage,messages:[...]}] }` — matches §5 of the spec.
- Produces: `buildAttentionSweep({ itemsVendors, messages, ourAddresses, nowMs }) -> { configured:true, coverage:"email-only", items:[{ itemId, itemAttention, vendors:[{quoteId,attentionState,daysSinceLastMessage}] }] }` where `itemsVendors` is `vendor[]` spanning many items (grouped by `itemId`).
- Consumes: `matchMessageToVendor`, `classifyDirection`, `deriveAttention`, `rollupItemAttention` (Tasks 1-2).

- [ ] **Step 1: Write the failing test**

```js
// append to api/_comms.test.js
const OURS = ["purchasing@rentstayable.com"];
function mkMsg(o) {
  return Object.assign(
    { id: "m" + Math.round(new Date(o.receivedAt).getTime() / 1000), conversationId: "conv1",
      to: [], cc: [], subject: "Quote", preview: "...", hasAttachments: false, webLink: "https://o" }, o);
}

test("buildItemPayload threads + attention per vendor", () => {
  const vendors = [{ quoteId: "q1", quoteName: "QT-0007", vendorName: "Walrus", vendorAccountId: "v1", itemId: "i1", addresses: ["sales@walrus.com"] }];
  const messages = [
    mkMsg({ from: "purchasing@rentstayable.com", to: ["sales@walrus.com"], receivedAt: new Date(NOW - 4 * DAY).toISOString() }),
    mkMsg({ from: "sales@walrus.com", to: ["purchasing@rentstayable.com"], receivedAt: new Date(NOW - 1 * DAY).toISOString() }),
    mkMsg({ from: "noise@other.com", to: ["x@y.com"], receivedAt: new Date(NOW).toISOString() }),
  ];
  const p = c.buildItemPayload({ itemId: "i1", vendors, messages, ourAddresses: OURS, nowMs: NOW });
  assert.equal(p.configured, true);
  assert.equal(p.coverage, "email-only");
  assert.equal(p.vendors.length, 1);
  assert.equal(p.vendors[0].messageCount, 2);          // noise excluded
  assert.equal(p.vendors[0].attentionState, "awaiting-our-reply");
  assert.equal(p.vendors[0].messages[0].direction, "outbound"); // chronological
  assert.equal(p.itemAttention, "awaiting-our-reply");
});

test("buildAttentionSweep rolls up many items, no message bodies", () => {
  const itemsVendors = [
    { quoteId: "q1", itemId: "i1", addresses: ["sales@walrus.com"] },
    { quoteId: "q2", itemId: "i2", addresses: ["info@mesa.com"] },
  ];
  const messages = [mkMsg({ from: "purchasing@rentstayable.com", to: ["info@mesa.com"], receivedAt: new Date(NOW - 10 * DAY).toISOString() })];
  const s = c.buildAttentionSweep({ itemsVendors, messages, ourAddresses: OURS, nowMs: NOW });
  const i2 = s.items.find((x) => x.itemId === "i2");
  const i1 = s.items.find((x) => x.itemId === "i1");
  assert.equal(i2.itemAttention, "stale");
  assert.equal(i1.itemAttention, "none");
  assert.equal(s.items[0].vendors[0].messages, undefined); // sweep carries no bodies
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/_comms.test.js`
Expected: FAIL — `c.buildItemPayload is not a function`

- [ ] **Step 3: Write minimal implementation**

```js
// add to api/_comms.js, then extend exports
function tagAndGroup(vendors, messages, ourAddresses) {
  const ours = new Set((ourAddresses || []).map(normAddr));
  const byQuote = {};
  for (const v of vendors) byQuote[v.quoteId] = [];
  for (const m of messages || []) {
    const v = matchMessageToVendor(m, vendors);
    if (!v) continue;
    byQuote[v.quoteId].push({ ...m, direction: classifyDirection(m, ours) });
  }
  for (const k of Object.keys(byQuote)) {
    byQuote[k].sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt));
  }
  return byQuote;
}

function buildItemPayload({ itemId, vendors, messages, ourAddresses, nowMs }) {
  const byQuote = tagAndGroup(vendors, messages, ourAddresses);
  const outVendors = vendors.map((v) => {
    const msgs = byQuote[v.quoteId] || [];
    const att = deriveAttention(msgs, nowMs);
    return {
      quoteId: v.quoteId, quoteName: v.quoteName, vendorName: v.vendorName,
      matchedAddresses: v.addresses, messageCount: msgs.length,
      lastMessageAt: att.lastMessageAt, lastDirection: att.lastDirection,
      attentionState: att.attentionState, daysSinceLastMessage: att.daysSinceLastMessage,
      messages: msgs,
    };
  });
  return {
    itemId, configured: true, attributionMode: "vendor", coverage: "email-only",
    itemAttention: rollupItemAttention(outVendors.map((v) => v.attentionState)),
    vendors: outVendors,
  };
}

function buildAttentionSweep({ itemsVendors, messages, ourAddresses, nowMs }) {
  const byItem = {};
  for (const v of itemsVendors) (byItem[v.itemId] = byItem[v.itemId] || []).push(v);
  const items = Object.keys(byItem).map((itemId) => {
    const vendors = byItem[itemId];
    const byQuote = tagAndGroup(vendors, messages, ourAddresses);
    const vendorStates = vendors.map((v) => {
      const att = deriveAttention(byQuote[v.quoteId] || [], nowMs);
      return { quoteId: v.quoteId, attentionState: att.attentionState, daysSinceLastMessage: att.daysSinceLastMessage };
    });
    return { itemId, itemAttention: rollupItemAttention(vendorStates.map((s) => s.attentionState)), vendors: vendorStates };
  });
  return { configured: true, coverage: "email-only", items };
}
```

Add `buildItemPayload, buildAttentionSweep` to `module.exports`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test api/_comms.test.js`
Expected: PASS (14 tests total)

- [ ] **Step 5: Commit**

```bash
git add api/_comms.js api/_comms.test.js
git commit -m "feat(comms): build item-thread payload + cross-item attention sweep" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Microsoft Graph client (`api/_graph.js`)

**Files:**
- Create: `api/_graph.js`
- Test: `api/_graph.test.js`

**Interfaces:**
- Produces: `graphConfigured() -> bool` (true iff `GRAPH_TENANT_ID`+`GRAPH_CLIENT_ID`+`GRAPH_CLIENT_SECRET` all set).
- Produces: `scopedMailboxes() -> string[]` (from `GRAPH_MAILBOXES` CSV, default `purchasing@rentstayable.com,jefferson@rentstayable.com`).
- Produces: `normalizeGraphMessage(raw) -> { id, conversationId, from, to:[], cc:[], subject, preview, receivedAt, hasAttachments, webLink }` (PURE — unit-tested).
- Produces (impure, runtime-only): `async getGraphToken()`; `async fetchRecentMessages(mailbox, { sinceDays=120, top=50 })` returns normalized messages from Inbox + Sent Items. Not unit-tested (network); validated live in Phase 4.

- [ ] **Step 1: Write the failing test** (pure parts only)

```js
// api/_graph.test.js
const test = require("node:test"); const assert = require("node:assert");
const g = require("./_graph.js");

test("graphConfigured false when env missing", () => {
  delete process.env.GRAPH_TENANT_ID; delete process.env.GRAPH_CLIENT_ID; delete process.env.GRAPH_CLIENT_SECRET;
  assert.equal(g.graphConfigured(), false);
});

test("scopedMailboxes default + CSV override", () => {
  delete process.env.GRAPH_MAILBOXES;
  assert.deepEqual(g.scopedMailboxes(), ["purchasing@rentstayable.com", "jefferson@rentstayable.com"]);
  process.env.GRAPH_MAILBOXES = "a@x.com, b@y.com";
  assert.deepEqual(g.scopedMailboxes(), ["a@x.com", "b@y.com"]);
  delete process.env.GRAPH_MAILBOXES;
});

test("normalizeGraphMessage maps Graph fields", () => {
  const raw = {
    id: "AAMk", conversationId: "AAQk", subject: "Re: Quote", bodyPreview: "hi",
    receivedDateTime: "2026-06-17T09:12:00Z", hasAttachments: true, webLink: "https://o",
    from: { emailAddress: { address: "sales@walrus.com" } },
    toRecipients: [{ emailAddress: { address: "purchasing@rentstayable.com" } }],
    ccRecipients: [],
  };
  const m = g.normalizeGraphMessage(raw);
  assert.equal(m.from, "sales@walrus.com");
  assert.deepEqual(m.to, ["purchasing@rentstayable.com"]);
  assert.equal(m.conversationId, "AAQk");
  assert.equal(m.preview, "hi");
  assert.equal(m.hasAttachments, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/_graph.test.js`
Expected: FAIL — `Cannot find module './_graph.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// api/_graph.js — Microsoft Graph app-only client for vendor-communications.
// Reads scoped mailboxes (Inbox + Sent Items) READ-ONLY. Inert until env vars set.
//
// Env (Vercel, server-side only):
//   GRAPH_TENANT_ID, GRAPH_CLIENT_ID, GRAPH_CLIENT_SECRET  (required to enable)
//   GRAPH_MAILBOXES  (optional CSV; default purchasing@ + jefferson@)
const LOGIN = "https://login.microsoftonline.com";
const GRAPH = "https://graph.microsoft.com/v1.0";
const DEFAULT_MAILBOXES = ["purchasing@rentstayable.com", "jefferson@rentstayable.com"];

function graphConfigured() {
  return !!(process.env.GRAPH_TENANT_ID && process.env.GRAPH_CLIENT_ID && process.env.GRAPH_CLIENT_SECRET);
}
function scopedMailboxes() {
  const csv = process.env.GRAPH_MAILBOXES;
  return (csv ? csv.split(",") : DEFAULT_MAILBOXES).map((s) => s.trim()).filter(Boolean);
}
function addrList(arr) {
  return (arr || []).map((r) => (r.emailAddress && r.emailAddress.address) || "").filter(Boolean);
}
function normalizeGraphMessage(raw) {
  return {
    id: raw.id,
    conversationId: raw.conversationId || null,
    from: (raw.from && raw.from.emailAddress && raw.from.emailAddress.address) || "",
    to: addrList(raw.toRecipients),
    cc: addrList(raw.ccRecipients),
    subject: raw.subject || "",
    preview: raw.bodyPreview || "",
    receivedAt: raw.receivedDateTime || null,
    hasAttachments: !!raw.hasAttachments,
    webLink: raw.webLink || null,
  };
}

let _tok = null, _exp = 0;
async function getGraphToken() {
  const now = Date.now();
  if (_tok && now < _exp) return _tok;
  const body = new URLSearchParams({
    client_id: process.env.GRAPH_CLIENT_ID,
    client_secret: process.env.GRAPH_CLIENT_SECRET,
    scope: "https://graph.microsoft.com/.default",
    grant_type: "client_credentials",
  });
  const r = await fetch(`${LOGIN}/${process.env.GRAPH_TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("graph_token_failed:" + JSON.stringify(j));
  _tok = j.access_token; _exp = now + (Number(j.expires_in || 3600) - 300) * 1000;
  return _tok;
}

const SELECT = "id,conversationId,subject,bodyPreview,receivedDateTime,hasAttachments,webLink,from,toRecipients,ccRecipients";
async function fetchFolder(mailbox, folder, token, sinceIso, top) {
  const url = `${GRAPH}/users/${encodeURIComponent(mailbox)}/mailFolders/${folder}/messages`
    + `?$select=${SELECT}&$top=${top}&$orderby=receivedDateTime desc`
    + `&$filter=receivedDateTime ge ${sinceIso}`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`graph_fetch_failed:${mailbox}:${folder}:${r.status}`);
  const j = await r.json().catch(() => ({}));
  return (j.value || []).map(normalizeGraphMessage);
}
async function fetchRecentMessages(mailbox, opts = {}) {
  const sinceDays = opts.sinceDays || 120, top = opts.top || 50;
  const token = await getGraphToken();
  const sinceIso = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const [inbox, sent] = await Promise.all([
    fetchFolder(mailbox, "inbox", token, sinceIso, top),
    fetchFolder(mailbox, "sentitems", token, sinceIso, top),
  ]);
  return inbox.concat(sent);
}

module.exports = { graphConfigured, scopedMailboxes, normalizeGraphMessage, getGraphToken, fetchRecentMessages };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test api/_graph.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add api/_graph.js api/_graph.test.js
git commit -m "feat(comms): Graph app-only client (token + recent-messages sweep)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: The endpoint (`api/communications.js`)

**Files:**
- Create: `api/communications.js`
- Test: `api/communications.test.js`

**Interfaces:**
- Consumes: `api/_auth.js` (`authEnabled`, `sessionEmail`), `api/_graph.js`, `api/_comms.js`.
- Produces: `module.exports` = the Vercel handler. Also exports `buildQuoteQuery(itemId|null)` + `buildContactQuery(accountIds)` (PURE — unit-tested) so COQL strings are testable without network.
- HTTP: `GET /api/communications` → attention sweep (all active items); `GET /api/communications?itemId=<id>` → full item payload. 401 if auth enabled and no session. `{configured:false}` if Graph unconfigured.

- [ ] **Step 1: Write the failing test** (pure query builders + unconfigured path)

```js
// api/communications.test.js
const test = require("node:test"); const assert = require("node:assert");
const mod = require("./communications.js");

test("buildQuoteQuery filters by item when given", () => {
  const q = mod.buildQuoteQuery("123");
  assert.match(q, /FROM Vendor_Quotes/);
  assert.match(q, /WHERE Procurement_Item = 123/);
  assert.match(q, /Vendor\.id/);
});
test("buildQuoteQuery without item selects all linked quotes", () => {
  const q = mod.buildQuoteQuery(null);
  assert.match(q, /WHERE Procurement_Item is not null/);
});
test("buildContactQuery builds an IN list over account ids", () => {
  const q = mod.buildContactQuery(["v1", "v2"]);
  assert.match(q, /FROM Contacts/);
  assert.match(q, /Account_Name\.id in \(v1,v2\)/);
});
test("handler returns configured:false when Graph unset", async () => {
  delete process.env.GRAPH_TENANT_ID; delete process.env.SESSION_SECRET; // auth disabled -> no 401
  let code = 0, payload = null;
  const res = { setHeader() {}, status(c) { code = c; return this; }, json(p) { payload = p; return this; } };
  await mod({ method: "GET", headers: {}, query: {} }, res);
  assert.equal(code, 200);
  assert.equal(payload.configured, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test api/communications.test.js`
Expected: FAIL — `Cannot find module './communications.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// api/communications.js — READ-ONLY vendor-communications endpoint.
// Sweeps scoped M365 mailboxes via Graph, matches to each item's vendors, returns
// per-quote threads (?itemId=) or a cross-item attention sweep (no itemId).
// Inert until GRAPH_* env vars are set. Auth-gated; never CDN-shared.
const auth = require("./_auth.js");
const graph = require("./_graph.js");
const comms = require("./_comms.js");

const API = process.env.ZOHO_API_DOMAIN || "https://www.zohoapis.com";
const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || "https://accounts.zoho.com";

function buildQuoteQuery(itemId) {
  const where = itemId ? `Procurement_Item = ${itemId}` : "Procurement_Item is not null";
  return "SELECT Name, Vendor.Vendor_Name, Vendor.id, Procurement_Item.id, id "
    + `FROM Vendor_Quotes WHERE ${where} LIMIT 200`;
}
function buildContactQuery(accountIds) {
  const ids = accountIds.filter(Boolean).join(",");
  return `SELECT Email, Account_Name.id FROM Contacts WHERE Account_Name.id in (${ids}) LIMIT 200`;
}

// --- Zoho read (mirrors api/procurement.js token+coql pattern) ---
let zTok = null, zExp = 0;
async function zohoToken() {
  const now = Date.now();
  if (zTok && now < zExp) return zTok;
  const p = new URLSearchParams({
    grant_type: "refresh_token", client_id: process.env.ZOHO_CLIENT_ID,
    client_secret: process.env.ZOHO_CLIENT_SECRET, refresh_token: process.env.ZOHO_REFRESH_TOKEN,
  });
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${p}`, { method: "POST" });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) throw new Error("zoho_token_failed");
  zTok = j.access_token; zExp = now + (Number(j.expires_in || 3600) - 300) * 1000;
  return zTok;
}
async function coql(query) {
  const r = await fetch(`${API}/crm/v8/coql`, {
    method: "POST",
    headers: { Authorization: `Zoho-oauthtoken ${await zohoToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ select_query: query }),
  });
  if (r.status === 204) return [];
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("coql_failed:" + r.status);
  return j.data || [];
}

async function resolveVendors(itemId) {
  const quotes = await coql(buildQuoteQuery(itemId));
  const accIds = [...new Set(quotes.map((q) => q["Vendor.id"]).filter(Boolean))];
  const contacts = accIds.length ? await coql(buildContactQuery(accIds)) : [];
  return comms.vendorsFromRows(quotes, contacts);
}

// in-memory mailbox sweep cache (per warm instance, ~60s)
let sweepCache = null, sweepExp = 0;
async function recentMessages() {
  const now = Date.now();
  if (sweepCache && now < sweepExp) return sweepCache;
  const boxes = graph.scopedMailboxes();
  const all = [];
  for (const b of boxes) all.push(...(await graph.fetchRecentMessages(b)));
  sweepCache = all; sweepExp = now + 60000;
  return all;
}

async function handler(req, res) {
  if (auth.authEnabled()) {
    const viewer = auth.sessionEmail(req);
    if (!viewer) return res.status(401).json({ error: "auth_required" });
  }
  res.setHeader("Cache-Control", "private, no-store, max-age=0");
  res.setHeader("Vary", "Cookie");

  if (!graph.graphConfigured()) {
    return res.status(200).json({ configured: false, coverage: "email-only" });
  }
  try {
    const itemId = (req.query && req.query.itemId) || null;
    const ourAddresses = graph.scopedMailboxes();
    const nowMs = Date.now();
    const messages = await recentMessages();
    const vendors = await resolveVendors(itemId);
    if (itemId) {
      return res.status(200).json(comms.buildItemPayload({ itemId, vendors, messages, ourAddresses, nowMs }));
    }
    return res.status(200).json(comms.buildAttentionSweep({ itemsVendors: vendors, messages, ourAddresses, nowMs }));
  } catch (err) {
    return res.status(502).json({ error: "comms_read_failed", detail: String(err.message || err) });
  }
}

module.exports = handler;
module.exports.buildQuoteQuery = buildQuoteQuery;
module.exports.buildContactQuery = buildContactQuery;
```

- [ ] **Step 4: Run tests + syntax check**

Run: `node --test api/communications.test.js` → Expected: PASS (4 tests)
Run: `node --check api/communications.js` → Expected: no output (valid)

- [ ] **Step 5: Commit**

```bash
git add api/communications.js api/communications.test.js
git commit -m "feat(comms): /api/communications endpoint (item threads + attention sweep)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Phase 1 gate — full backend test run

- [ ] **Step 1: Run the whole API test suite**

Run: `node --test api/`
Expected: PASS — all `_comms`, `_graph`, `communications`, and existing `award.note` tests green.

- [ ] **Step 2: Confirm inert behavior reasoning**
With no `GRAPH_*` env, `/api/communications` returns `{configured:false}` and never calls Graph or Zoho. No new env vars are required to deploy Phase 1 safely.

---

# PHASE 2 — Portal UI (Owner: Claude; no credentials needed)

Renders the comms monitor. With `configured:false` it shows a quiet "not yet connected" state; it lights up when Phase 3 lands.

### Task 8: Client API + hook (`portal/src/api.js`, `portal/src/useCommunications.js`)

**Files:**
- Modify: `portal/src/api.js`
- Create: `portal/src/useCommunications.js`
- Modify: `portal/src/api.test.js`

**Interfaces:**
- Produces: `getCommunications(itemId?) -> Promise<payload>` (GET `/api/communications`, optional `?itemId=`).
- Produces: `useCommunications(itemId)` hook → `{ data, status }` (`status ∈ loading|ready|unauth|error`). Mirrors `useProcurement`.

- [ ] **Step 1: Write the failing test**

```js
// append to portal/src/api.test.js
import { describe, it, expect, vi } from "vitest";
import * as api from "./api.js";

describe("getCommunications", () => {
  it("calls /api/communications with itemId query", async () => {
    const spy = vi.spyOn(api.__http, "get").mockResolvedValue({ data: { configured: true } });
    await api.getCommunications("123");
    expect(spy).toHaveBeenCalledWith("/api/communications", { params: { itemId: "123" } });
    spy.mockRestore();
  });
  it("omits params when no itemId", async () => {
    const spy = vi.spyOn(api.__http, "get").mockResolvedValue({ data: {} });
    await api.getCommunications();
    expect(spy).toHaveBeenCalledWith("/api/communications", { params: {} });
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — `api.getCommunications is not a function` / `__http` undefined

- [ ] **Step 3: Write minimal implementation**

In `portal/src/api.js` export the axios instance and add the function:
```js
export const __http = http;   // exported for tests
export async function getCommunications(itemId) {
  const params = itemId ? { itemId } : {};
  return (await http.get("/api/communications", { params })).data;
}
```

Create `portal/src/useCommunications.js`:
```js
import { useCallback, useEffect, useState } from "react";
import { getCommunications } from "./api.js";

export function useCommunications(itemId) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const load = useCallback(async () => {
    setStatus("loading");
    try { setData(await getCommunications(itemId)); setStatus("ready"); }
    catch (e) { setStatus(e?.response?.status === 401 ? "unauth" : "error"); }
  }, [itemId]);
  useEffect(() => { load(); }, [load]);
  return { data, status, reload: load };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd portal && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add portal/src/api.js portal/src/useCommunications.js portal/src/api.test.js
git commit -m "feat(portal): communications client + hook" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Comms thread panel component (`portal/src/components/CommsPanel.jsx`)

**Files:**
- Create: `portal/src/components/CommsPanel.jsx`
- Create: `portal/src/components/CommsPanel.test.jsx`
- Modify: `portal/src/styles.css` (append comms styles)

**Interfaces:**
- Consumes: a vendor object from `buildItemPayload` (`{ vendorName, attentionState, daysSinceLastMessage, messageCount, messages:[{direction,from,subject,preview,receivedAt,webLink}] }`).
- Produces: `<CommsPanel vendor={...} />` — header badge (count + attention label) and a chronological list (outbound vs inbound styled), each row linking to `webLink`. Always renders the email-only note.
- Produces: `attentionLabel(state, days) -> string` (exported helper).

- [ ] **Step 1: Write the failing test**

```jsx
// portal/src/components/CommsPanel.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import CommsPanel, { attentionLabel } from "./CommsPanel.jsx";

describe("attentionLabel", () => {
  it("maps states to human text", () => {
    expect(attentionLabel("awaiting-our-reply", 3)).toMatch(/awaiting our reply/i);
    expect(attentionLabel("stale", 9)).toMatch(/silent 9/i);
    expect(attentionLabel("none", null)).toMatch(/no email/i);
  });
});

describe("CommsPanel", () => {
  const vendor = {
    vendorName: "Walrus", attentionState: "awaiting-our-reply", daysSinceLastMessage: 1, messageCount: 2,
    messages: [
      { direction: "outbound", from: "purchasing@rentstayable.com", subject: "Quote?", preview: "p", receivedAt: "2026-06-16T00:00:00Z", webLink: "https://o1" },
      { direction: "inbound", from: "sales@walrus.com", subject: "Re: Quote?", preview: "q", receivedAt: "2026-06-19T00:00:00Z", webLink: "https://o2" },
    ],
  };
  it("renders messages and the email-only coverage note", () => {
    render(<CommsPanel vendor={vendor} />);
    expect(screen.getByText(/Re: Quote\?/)).toBeInTheDocument();
    expect(screen.getByText(/Email only/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link").length).toBe(2);
  });
  it("renders empty state with Alibaba hint when no messages", () => {
    render(<CommsPanel vendor={{ vendorName: "Mesa", attentionState: "none", messageCount: 0, messages: [] }} />);
    expect(screen.getByText(/Alibaba chat/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — cannot resolve `./CommsPanel.jsx`

- [ ] **Step 3: Write minimal implementation**

```jsx
// portal/src/components/CommsPanel.jsx
export function attentionLabel(state, days) {
  if (state === "awaiting-our-reply") return "Awaiting our reply";
  if (state === "stale") return `Vendor silent ${days ?? "?"}d`;
  if (state === "ok") return "Up to date";
  return "No email found";
}
function fmt(d) { return d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""; }

export default function CommsPanel({ vendor }) {
  const msgs = vendor.messages || [];
  return (
    <div className="comms-panel">
      <div className={"comms-attn comms-attn--" + (vendor.attentionState || "none")}>
        {attentionLabel(vendor.attentionState, vendor.daysSinceLastMessage)} · {vendor.messageCount || 0} msg
      </div>
      {msgs.length === 0 ? (
        <p className="muted comms-empty">No email found for this vendor — they may be communicating via Alibaba chat.</p>
      ) : (
        <ul className="comms-thread">
          {msgs.map((m) => (
            <li key={m.id || m.webLink} className={"comms-msg comms-msg--" + m.direction}>
              <span className="comms-dir">{m.direction === "outbound" ? "→ us" : "← vendor"}</span>
              <a className="comms-subj" href={m.webLink} target="_blank" rel="noreferrer">{m.subject || "(no subject)"}</a>
              <span className="comms-date">{fmt(m.receivedAt)}</span>
              <span className="comms-preview">{m.preview}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="comms-coverage">Email only — Alibaba chat not shown.</p>
    </div>
  );
}
```

Append to `portal/src/styles.css`:
```css
.comms-panel{margin-top:.5rem;border-top:1px solid var(--border,#2a2a2a);padding-top:.5rem}
.comms-attn{font-size:.75rem;font-weight:600;display:inline-block;padding:.1rem .5rem;border-radius:999px}
.comms-attn--awaiting-our-reply{background:#5a3a00;color:#ffd27a}
.comms-attn--stale{background:#3a3a3a;color:#cfcfcf}
.comms-attn--ok{background:#103a1a;color:#7ad29a}
.comms-attn--none{background:#2a2a2a;color:#9a9a9a}
.comms-thread{list-style:none;margin:.5rem 0;padding:0;display:flex;flex-direction:column;gap:.35rem}
.comms-msg{display:grid;grid-template-columns:auto 1fr auto;gap:.5rem;align-items:baseline;font-size:.8rem}
.comms-msg--outbound .comms-dir{color:#7aa7ff}.comms-msg--inbound .comms-dir{color:#ffd27a}
.comms-preview{grid-column:2 / -1;color:#9a9a9a;font-size:.75rem}
.comms-coverage{font-size:.7rem;color:#8a8a8a;margin-top:.4rem}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd portal && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add portal/src/components/CommsPanel.jsx portal/src/components/CommsPanel.test.jsx portal/src/styles.css
git commit -m "feat(portal): comms thread panel + attention label + email-only note" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Wire comms into ItemDetail (per-quote + rollup)

**Files:**
- Modify: `portal/src/components/ItemDetail.jsx`
- Modify: `portal/src/components/QuoteTable.jsx`

**Interfaces:**
- Consumes: `useCommunications` (Task 8), `CommsPanel` (Task 9).
- ItemDetail calls `useCommunications(item.id)`; passes the matching vendor (by `quoteId`) into each expanded quote row, and renders a top-of-detail rollup chip from `data.itemAttention`.

- [ ] **Step 1: Write the failing test**

```jsx
// portal/src/components/ItemDetail.comms.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("../useCommunications.js", () => ({
  useCommunications: () => ({
    status: "ready",
    data: { configured: true, itemAttention: "awaiting-our-reply",
      vendors: [{ quoteId: "q1", vendorName: "Walrus", attentionState: "awaiting-our-reply", daysSinceLastMessage: 1, messageCount: 1, messages: [{ id: "m1", direction: "inbound", subject: "Re: Quote", preview: "x", receivedAt: "2026-06-19T00:00:00Z", webLink: "https://o" }] }] },
  }),
}));
import ItemDetail from "./ItemDetail.jsx";

describe("ItemDetail comms", () => {
  it("shows item-level attention rollup", () => {
    const item = { id: "i1", name: "Queen Mattress", stage: "Submitted" };
    const quotes = [{ id: "q1", vendorName: "Walrus", totalLanded: 100, landedUnit: 10 }];
    render(<ItemDetail item={item} quotes={quotes} reload={() => {}} />);
    expect(screen.getByText(/awaiting our reply/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — no "awaiting our reply" text (comms not wired)

- [ ] **Step 3: Write minimal implementation**

In `ItemDetail.jsx`: import `useCommunications` and `CommsPanel` + `attentionLabel`; inside the component add:
```jsx
import { useCommunications } from "../useCommunications.js";
import CommsPanel, { attentionLabel } from "./CommsPanel.jsx";
// ...inside ItemDetail, after the existing useState hooks:
const { data: comms } = useCommunications(item?.id);
const vendorByQuote = {};
for (const v of comms?.vendors || []) vendorByQuote[v.quoteId] = v;
```
Render a rollup chip in the header meta block (after the existing meta chips):
```jsx
{comms?.configured && comms.itemAttention && comms.itemAttention !== "none" && (
  <span className={"meta-chip meta-chip--attn meta-chip--" + comms.itemAttention}>
    {attentionLabel(comms.itemAttention, null)}
  </span>
)}
```
Pass `vendorByQuote` to `QuoteTable` (`<QuoteTable ... vendorByQuote={vendorByQuote} />`). In `QuoteTable.jsx`, when a row is selected, render `<CommsPanel>` under it:
```jsx
// QuoteTable signature -> add vendorByQuote prop; after each <tr>, when selected:
{isSelected && vendorByQuote && vendorByQuote[q.id] && (
  <tr className="comms-row"><td colSpan={6}><CommsPanel vendor={vendorByQuote[q.id]} /></td></tr>
)}
```
(Import `CommsPanel` at the top of `QuoteTable.jsx`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd portal && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add portal/src/components/ItemDetail.jsx portal/src/components/QuoteTable.jsx
git commit -m "feat(portal): per-quote comms panel + item attention rollup on detail" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 11: Queue/list attention badges (the monitor)

**Files:**
- Create: `portal/src/useAttentionSweep.js`
- Modify: `portal/src/views/QueueView.jsx`
- Modify: `portal/src/components/ItemList.jsx`
- Create: `portal/src/components/AttentionBadge.jsx`
- Create: `portal/src/components/AttentionBadge.test.jsx`

**Interfaces:**
- Produces: `useAttentionSweep()` → `{ byItem }` where `byItem[itemId] = "awaiting-our-reply"|"stale"|"ok"|"none"` (from `getCommunications()` with no itemId). Returns `{}` when `configured:false`.
- Produces: `<AttentionBadge state={...} />` → small chip or null when `state` is falsy/`none`/`ok`.

- [ ] **Step 1: Write the failing test**

```jsx
// portal/src/components/AttentionBadge.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AttentionBadge from "./AttentionBadge.jsx";

describe("AttentionBadge", () => {
  it("renders for awaiting-our-reply", () => {
    render(<AttentionBadge state="awaiting-our-reply" />);
    expect(screen.getByText(/awaiting reply/i)).toBeInTheDocument();
  });
  it("renders nothing for ok/none", () => {
    const { container } = render(<AttentionBadge state="ok" />);
    expect(container.firstChild).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd portal && npm test`
Expected: FAIL — cannot resolve `./AttentionBadge.jsx`

- [ ] **Step 3: Write minimal implementation**

```jsx
// portal/src/components/AttentionBadge.jsx
export default function AttentionBadge({ state }) {
  if (state === "awaiting-our-reply") return <span className="attn-badge attn-badge--reply" title="Vendor replied — awaiting our response">⚠ awaiting reply</span>;
  if (state === "stale") return <span className="attn-badge attn-badge--stale" title="Thread silent ≥7 days">⏳ silent</span>;
  return null;
}
```
```js
// portal/src/useAttentionSweep.js
import { useEffect, useState } from "react";
import { getCommunications } from "./api.js";
export function useAttentionSweep() {
  const [byItem, setByItem] = useState({});
  useEffect(() => {
    let alive = true;
    getCommunications().then((d) => {
      if (!alive || !d || d.configured === false) return;
      const m = {}; for (const it of d.items || []) m[it.itemId] = it.itemAttention;
      setByItem(m);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { byItem };
}
```
In `QueueView.jsx` / `ItemList.jsx`: call `useAttentionSweep()` and render `<AttentionBadge state={byItem[item.id]} />` next to each item row's title. Append CSS to `styles.css`:
```css
.attn-badge{font-size:.7rem;font-weight:600;padding:.05rem .4rem;border-radius:999px;margin-left:.4rem}
.attn-badge--reply{background:#5a3a00;color:#ffd27a}.attn-badge--stale{background:#3a3a3a;color:#cfcfcf}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd portal && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add portal/src/useAttentionSweep.js portal/src/views/QueueView.jsx portal/src/components/ItemList.jsx portal/src/components/AttentionBadge.jsx portal/src/components/AttentionBadge.test.jsx portal/src/styles.css
git commit -m "feat(portal): cross-item attention badges on queue + item list" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 12: Build the SPA + commit built `review/`

**Files:**
- Modify: built assets under `review/` (generated)

- [ ] **Step 1: Build**

Run: `npm run build:portal`
Expected: Vite build succeeds; `review/` updated. (Confirm the build output dir matches the existing deploy convention — `portal/vite.config.js` `build.outDir`. If it writes elsewhere, copy to `review/` as the prior portal flow did.)

- [ ] **Step 2: Full SPA test run**

Run: `cd portal && npm test`
Expected: all tests PASS (existing + new comms tests).

- [ ] **Step 3: Commit the built portal**

```bash
git add review portal
git commit -m "build(portal): comms monitor UI (inert until Graph env configured)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

After deploy: with no `GRAPH_*` env, `/api/communications` returns `{configured:false}`, badges don't render, item-detail comms shows nothing — zero regression to the live portal.

---

# PHASE 3 — Azure / Microsoft Graph setup (Owner: **Kyle** — requires Azure admin; ~1 hour)

**No code. This is the only phase that needs you, and the feature stays inert until it's done.** Do these in the Microsoft Entra admin center + Vercel.

- [ ] **Step 1: Register the app**
  Entra admin center → App registrations → New registration. Name: `Stayable Procurement Comms (read-only)`. Single tenant. No redirect URI needed (daemon/app-only). Record the **Application (client) ID** and **Directory (tenant) ID**.

- [ ] **Step 2: Add an application permission (not delegated)**
  API permissions → Add a permission → Microsoft Graph → **Application permissions** → `Mail.Read`. Then **Grant admin consent** for the tenant. (Confirm the status shows green "Granted".)

- [ ] **Step 3: Create a client secret**
  Certificates & secrets → New client secret → 12-month expiry (calendar a rotation reminder). Copy the **secret value** immediately (shown once).

- [ ] **Step 4: SCOPE the app to only the two mailboxes (mandatory — do not skip)**
  App-only `Mail.Read` otherwise grants read to *every* mailbox. In Exchange Online PowerShell:
  ```powershell
  # 1. mail-enabled security group holding only the procurement mailboxes
  New-DistributionGroup -Name "ProcurementCommsScope" -Type Security `
    -Members purchasing@rentstayable.com,jefferson@rentstayable.com
  # 2. restrict the app to that group
  New-ApplicationAccessPolicy -AppId <APPLICATION_CLIENT_ID> `
    -PolicyScopeGroupId ProcurementCommsScope@rentstayable.com `
    -AccessRight RestrictAccess `
    -Description "Procurement comms portal — read only purchasing+jefferson"
  # 3. verify
  Test-ApplicationAccessPolicy -Identity purchasing@rentstayable.com -AppId <APPLICATION_CLIENT_ID>  # AccessCheckResult: Granted
  Test-ApplicationAccessPolicy -Identity admin@rentstayable.com -AppId <APPLICATION_CLIENT_ID>       # AccessCheckResult: Denied
  ```

- [ ] **Step 5: Set Vercel env vars (Production) + redeploy**
  In the Vercel project settings → Environment Variables, add:
  - `GRAPH_TENANT_ID` = Directory (tenant) ID
  - `GRAPH_CLIENT_ID` = Application (client) ID
  - `GRAPH_CLIENT_SECRET` = the secret value
  - `GRAPH_MAILBOXES` = `purchasing@rentstayable.com,jefferson@rentstayable.com` (optional; matches default)
  Redeploy (env changes need a new deployment).

- [ ] **Step 6: Tell Claude it's done** so Phase 4 verification can run.

---

# PHASE 4 — Verification + go-live (Owner: Claude, after Phase 3)

- [ ] **Step 1: Confirm `configured:true`**
  Logged-in, on the live domain: `GET /api/communications` → `configured:true`, `items[]` present. Anonymous (no session) → `401` (when `SESSION_SECRET` set).

- [ ] **Step 2: Verify a known thread on the right item**
  Open a demo item with a real vendor that has email in `purchasing@`/`jefferson@`. Confirm the per-quote panel shows the thread chronologically with correct inbound/outbound tags and working Outlook deep-links.

- [ ] **Step 3: Verify the attention signal**
  Confirm an item where the last message is inbound shows `awaiting-our-reply` on the queue badge + detail rollup; an item silent ≥7 days shows `stale`.

- [ ] **Step 4: Verify scoping + cache**
  `Test-ApplicationAccessPolicy` denies an out-of-scope mailbox (Step 4 above). Confirm response headers are `Cache-Control: private, no-store` + `Vary: Cookie` (re-run the 06/16 anon-cache check: anonymous request must not receive a cached authenticated body).

- [ ] **Step 5: Update the Todo + decision log**
  Mark the comms feature live in `docs/ZohoCRM_Todo_052126.md`; add a decision-log entry in `ZohoCRM_Rollout_052126.md` (date, what shipped, that it supersedes the 06/17 "parked — vendor comms via M365" item). Update `Last Updated:` lines.

---

# PHASE 5 — Later enhancements (out of scope for the build above; spec'd, not planned)

Surface to the user as a follow-up; do not build without a go-ahead.

- **Attribution B (subject-token `[PI-<id>]`)** for exact item precision — flip `attributionMode` to `token`, filter messages by token, add an "other correspondence with this vendor" fallback bucket, and auto-inject the token into outbound replies.
- **Manual "it's in Alibaba chat" note** — needs a Zoho field or reuse of an existing note path; lets Jefferson flag off-email movement.
- **AI thread summarization** — optional Claude call to summarize each thread.
- **Portal information-architecture restructure** (separate spec #2): make `/review` the root, fold the landing + `/tracker` + one-pagers into the SPA, redesign.

---

## Self-Review (completed during authoring)

- **Spec coverage:** §3 architecture → Tasks 5/6; §4 matching+attribution(A) → Tasks 1-4; §5 API contract → Tasks 4/6; §6 attention logic → Task 2; §7 UI (queue badges, per-quote, rollup, coverage label, states) → Tasks 9-11; §8 caching/security/scoping → Task 6 (headers) + Phase 3 Step 4; §9 build sequence → Phases 1-4; §10 testing → Tasks 1-12; §11 open items → Phase 5. No uncovered section.
- **Placeholder scan:** no TBD/TODO; every code step shows complete code; commands have expected output.
- **Type consistency:** vendor/message shapes identical across Tasks 1→4→9→10; `attentionState` enum + `attentionLabel`/`AttentionBadge` consume the same four values; `getCommunications(itemId?)` signature matches the hook and sweep usages.
