import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatUSD } from "../money.js";

const BAR_COLORS = {
  "Pending approval": "#64748b", // slate-500
  Approved: "#2563eb",           // blue-600
};

function SpendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="spend-tooltip">
      <span className="spend-tooltip-label">{payload[0].payload.name}</span>
      <span className="spend-tooltip-value">{formatUSD(payload[0].value)}</span>
    </div>
  );
}

export default function SpendView({ data }) {
  const spend = data?.spend ?? {};
  const items = data?.items ?? [];

  const overHundredKItems = items.filter((i) => (i.spend ?? 0) >= 100000);

  const chartData = [
    { name: "Pending approval", usd: spend.pendingSubmitted ?? 0 },
    { name: "Approved", usd: spend.approvedTotal ?? 0 },
  ];

  return (
    <section className="view-pane">
      <div className="pane-header">
        <h2 className="view-title">Spend</h2>
      </div>

      <div className="spend-cards">
        <div className="spend-card">
          <div className="spend-card-label">Pending (Submitted)</div>
          <div className="spend-card-value">{formatUSD(spend.pendingSubmitted)}</div>
        </div>
        <div className="spend-card spend-card--approved">
          <div className="spend-card-label">Approved Total</div>
          <div className="spend-card-value">{formatUSD(spend.approvedTotal)}</div>
        </div>
        <div className="spend-card">
          <div className="spend-card-label">Items Over $100K</div>
          <div className="spend-card-value">{spend.overHundredK ?? 0}</div>
        </div>
      </div>

      <div className="spend-chart">
        <h3 className="section-label">Pending vs. Approved</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 16, bottom: 4 }}>
            <XAxis dataKey="name" tick={{ fontSize: 13 }} />
            <YAxis tickFormatter={(v) => formatUSD(v)} tick={{ fontSize: 12 }} width={88} />
            <Tooltip content={<SpendTooltip />} />
            <Bar dataKey="usd" radius={[4, 4, 0, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={BAR_COLORS[entry.name]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {overHundredKItems.length > 0 && (
        <div className="spend-over-100k">
          <h3 className="section-label">Items &gt; $100K</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Property</th>
                <th>Stage</th>
                <th>Est. Spend</th>
              </tr>
            </thead>
            <tbody>
              {overHundredKItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.property ?? "—"}</td>
                  <td>{item.stage}</td>
                  <td className="mono bold">{formatUSD(item.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
