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
