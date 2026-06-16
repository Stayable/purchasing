import { formatUSD } from "../money.js";

export default function SpendView({ data }) {
  const spend = data?.spend ?? {};
  const items = data?.items ?? [];

  const overHundredKItems = items.filter((i) => (i.spend ?? 0) >= 100000);

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

      {/* Recharts bar chart: Task 10 */}
    </section>
  );
}
