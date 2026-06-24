import StageBadge from "../components/StageBadge.jsx";
import { formatUSD } from "../money.js";

const STAGE_ORDER = [
  "Spec", "Bid", "Level", "FL-Validate", "Recommend",
  "Submitted", "Approved", "Approved-with-Conditions", "Declined", "Need-More-Info",
];

function groupByStage(items) {
  const map = {};
  for (const item of items) (map[item.stage] = map[item.stage] || []).push(item);
  const known = STAGE_ORDER.filter((s) => (map[s]?.length ?? 0) > 0).map((s) => ({ stage: s, items: map[s] }));
  const extra = Object.keys(map).filter((s) => !STAGE_ORDER.includes(s)).map((s) => ({ stage: s, items: map[s] }));
  return [...known, ...extra];
}

export default function TrackerView({ data }) {
  const items = data?.items ?? [];
  const grouped = groupByStage(items);

  return (
    <section className="view-pane">
      <div className="board-header">
        <h2 className="view-title">Tracker</h2>
        <span className="pane-count">{items.length} item{items.length !== 1 ? "s" : ""} · {grouped.length} active stage{grouped.length !== 1 ? "s" : ""}</span>
      </div>

      {grouped.length === 0 ? (
        <p className="muted">No items in the pipeline yet.</p>
      ) : (
        <div className="tracker-stages">
          {grouped.map(({ stage, items: stageItems }) => (
            <div key={stage} className="tracker-stage">
              <div className="tracker-stage-head">
                <StageBadge stage={stage} />
                <span className="tracker-stage-count">{stageItems.length}</span>
              </div>
              <table className="tracker-table">
                <tbody>
                  {stageItems.map((item) => (
                    <tr key={item.id} className="tracker-row">
                      <td className="tracker-name">{item.name}</td>
                      <td className="tracker-prop">{item.property || "—"}</td>
                      <td className="tracker-spend">{item.spend != null ? formatUSD(item.spend) : "—"}</td>
                      <td className="tracker-await">{item.awardedVendorName ? `Awarded: ${item.awardedVendorName}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
