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
