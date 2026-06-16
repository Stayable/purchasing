import { formatUSD } from "../money.js";

function KpiCard({ label, value, accent }) {
  return (
    <div className={"kpi-card" + (accent ? " kpi-card--accent" : "")}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
    </div>
  );
}

export default function KpiRow({ spend, counts }) {
  const pendingCount = counts?.["Submitted"] ?? 0;
  const overHundredK = spend?.overHundredK ?? 0;

  return (
    <div className="kpi-row">
      <KpiCard
        label="Pending (Submitted)"
        value={formatUSD(spend?.pendingSubmitted)}
      />
      <KpiCard
        label="Approved Total"
        value={formatUSD(spend?.approvedTotal)}
        accent
      />
      <KpiCard
        label="Items Over $100K"
        value={overHundredK}
      />
      <KpiCard
        label="Awaiting Decision"
        value={pendingCount}
      />
    </div>
  );
}
