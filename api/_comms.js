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
