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
