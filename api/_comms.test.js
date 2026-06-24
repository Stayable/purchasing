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

test("vendorsFromRows builds addresses from the vendor's Email field", () => {
  const quotes = [
    { id: "q1", Name: "QT-0007", "Vendor.Vendor_Name": "Walrus", "Vendor.id": "v1", "Vendor.Email": "Sales@Walrus.com", "Procurement_Item.id": "i1" },
    { id: "q2", Name: "QT-0008", "Vendor.Vendor_Name": "Mesa", "Vendor.id": "v2", "Vendor.Email": "info@mesa.com", "Procurement_Item.id": "i1" },
  ];
  const v = c.vendorsFromRows(quotes);
  assert.equal(v.length, 2);
  assert.deepEqual(v[0], {
    quoteId: "q1", quoteName: "QT-0007", vendorName: "Walrus", vendorAccountId: "v1",
    itemId: "i1", addresses: ["sales@walrus.com"],
  });
  assert.deepEqual(v[1].addresses, ["info@mesa.com"]);
});

test("vendorsFromRows: vendor with no email -> empty addresses", () => {
  const v = c.vendorsFromRows([{ id: "q1", Name: "QT", "Vendor.id": "v9", "Procurement_Item.id": "i1" }]);
  assert.deepEqual(v[0].addresses, []);
});

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
