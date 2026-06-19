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

module.exports = { STALE_DAYS, normAddr, msgAddresses, matchMessageToVendor, classifyDirection, deriveAttention, rollupItemAttention };
