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

// Vendor emails live directly on the Vendors-module record (Vendor.Email),
// read up through the Vendor_Quotes lookup. (Vendor is a lookup to Vendors,
// not Accounts, so the prior Contacts/Account_Name join never matched.)
function vendorsFromRows(quoteRows) {
  return (quoteRows || []).map((q) => {
    const email = normAddr(q["Vendor.Email"]);
    return {
      quoteId: q.id,
      quoteName: q.Name || null,
      vendorName: q["Vendor.Vendor_Name"] || null,
      vendorAccountId: q["Vendor.id"] || null,
      itemId: q["Procurement_Item.id"] || null,
      addresses: email ? [email] : [],
    };
  });
}

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

module.exports = { STALE_DAYS, normAddr, msgAddresses, matchMessageToVendor, classifyDirection, deriveAttention, rollupItemAttention, vendorsFromRows, buildItemPayload, buildAttentionSweep };
