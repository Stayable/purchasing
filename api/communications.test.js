const test = require("node:test"); const assert = require("node:assert");
const mod = require("./communications.js");

test("buildQuoteQuery filters by item when given", () => {
  const q = mod.buildQuoteQuery("123");
  assert.match(q, /FROM Vendor_Quotes/);
  assert.match(q, /WHERE Procurement_Item = 123/);
  assert.match(q, /Vendor\.id/);
});
test("buildQuoteQuery selects the vendor email for matching", () => {
  const q = mod.buildQuoteQuery("123");
  assert.match(q, /Vendor\.Email/);
});
test("buildQuoteQuery without item selects all linked quotes", () => {
  const q = mod.buildQuoteQuery(null);
  assert.match(q, /WHERE Procurement_Item is not null/);
});
test("messageId branch rejects an out-of-scope mailbox before any Graph call", async () => {
  process.env.GRAPH_TENANT_ID = "t"; process.env.GRAPH_CLIENT_ID = "c"; process.env.GRAPH_CLIENT_SECRET = "s";
  delete process.env.SESSION_SECRET; delete process.env.GRAPH_MAILBOXES; // auth off, default scope
  let code = 0, payload = null;
  const res = { setHeader() {}, status(c) { code = c; return this; }, json(p) { payload = p; return this; } };
  await mod({ method: "GET", headers: {}, query: { messageId: "x", mailbox: "evil@elsewhere.com" } }, res);
  assert.equal(code, 400);
  assert.match(payload.error, /mailbox/);
  delete process.env.GRAPH_TENANT_ID; delete process.env.GRAPH_CLIENT_ID; delete process.env.GRAPH_CLIENT_SECRET;
});
test("handler returns configured:false when Graph unset", async () => {
  delete process.env.GRAPH_TENANT_ID; delete process.env.SESSION_SECRET; // auth disabled -> no 401
  let code = 0, payload = null;
  const res = { setHeader() {}, status(c) { code = c; return this; }, json(p) { payload = p; return this; } };
  await mod({ method: "GET", headers: {}, query: {} }, res);
  assert.equal(code, 200);
  assert.equal(payload.configured, false);
});
