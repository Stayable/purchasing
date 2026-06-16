import { useState } from "react";
import StageBadge from "../components/StageBadge.jsx";
import ItemDetail from "../components/ItemDetail.jsx";
import { formatUSD } from "../money.js";

const STAGE_ORDER = [
  "Spec", "Bid", "Level", "FL-Validate", "Recommend",
  "Submitted", "Approved", "Approved-with-Conditions", "Declined", "Need-More-Info",
];

function groupByStage(items) {
  const map = {};
  for (const stage of STAGE_ORDER) map[stage] = [];
  for (const item of items) {
    if (map[item.stage]) map[item.stage].push(item);
    else {
      map[item.stage] = map[item.stage] ?? [];
      map[item.stage].push(item);
    }
  }
  // Return only stages that have items, in canonical order
  return STAGE_ORDER
    .filter((s) => (map[s]?.length ?? 0) > 0)
    .map((s) => ({ stage: s, items: map[s] }));
}

export default function BoardView({ data, reload }) {
  const items = data?.items ?? [];
  const quotes = data?.quotes ?? [];
  const grouped = groupByStage(items);

  const [selectedId, setSelectedId] = useState(null);
  const selectedItem = items.find((i) => i.id === selectedId) ?? null;
  const itemQuotes = quotes.filter((q) => q.itemId === selectedId);

  return (
    <section className="view-pane">
      <div className="board-layout">
        <div className="board-columns">
          <div className="board-header">
            <h2 className="view-title">Board</h2>
            <span className="pane-count">{items.length} item{items.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="board-stage-list">
            {grouped.map(({ stage, items: stageItems }) => (
              <div key={stage} className="board-stage">
                <div className="board-stage-header">
                  <StageBadge stage={stage} />
                  <span className="board-stage-count">{stageItems.length}</span>
                </div>
                <div className="board-cards">
                  {stageItems.map((item) => (
                    <div
                      key={item.id}
                      className={"board-card" + (item.id === selectedId ? " board-card--selected" : "")}
                      onClick={() => setSelectedId(item.id === selectedId ? null : item.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedId(item.id)}
                    >
                      <div className="board-card-name">{item.name}</div>
                      <div className="board-card-meta">
                        {item.property && <span>{item.property}</span>}
                        {item.spend != null && <span>{formatUSD(item.spend)}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedItem && (
          <div className="board-detail">
            <ItemDetail item={selectedItem} quotes={itemQuotes} reload={reload} />
          </div>
        )}
      </div>
    </section>
  );
}
