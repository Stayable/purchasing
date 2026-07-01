// portal/src/activity.js — presentation helpers for the workflow activity log.

const LABELS = {
  item_created: "created the item",
  quotes_ready: "marked quotes ready",
  approved: "approved",
  awarded: "approved & awarded",
  declined: "declined",
  vendor_added: "added a vendor",
  quote_added: "added a quote",
};
const ICONS = {
  item_created: "✎",
  quotes_ready: "▲",
  approved: "✓",
  awarded: "✓",
  declined: "✕",
  vendor_added: "＋",
  quote_added: "＋",
};

export function actionLabel(action) { return LABELS[action] || action || "updated"; }
export function actionIcon(action) { return ICONS[action] || "•"; }

// Strip the "(via zoho)" suffix for a cleaner display name, keep the address.
export function actorName(actor) {
  if (!actor) return "—";
  return String(actor).replace(/\s*\(via zoho\)\s*/i, " (via Zoho)");
}
