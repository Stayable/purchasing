export function formatUSD(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });
}
