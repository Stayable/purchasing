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
