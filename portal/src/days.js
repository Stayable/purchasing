/**
 * daysSince(iso, now)
 * Returns the whole number of days between the ISO date string `iso` and `now`
 * (default: current time). Returns null for falsy or unparseable input.
 */
export function daysSince(iso, now = new Date()) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

/**
 * relativeTime(iso, now)
 * Short human-friendly "time ago" label ("just now", "5m ago", "3h ago", "2d ago",
 * or a locale date for anything older than ~7 days). Returns "" for bad input.
 */
export function relativeTime(iso, now = new Date()) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const secs = Math.floor((now - d) / 1000);
  if (secs < 60) return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
