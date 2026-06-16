import { useState, useMemo } from "react";
import ItemList from "../components/ItemList.jsx";
import ItemDetail from "../components/ItemDetail.jsx";

const STAGE_ORDER = [
  "Spec", "Bid", "Level", "FL-Validate", "Recommend",
  "Submitted", "Approved", "Approved-with-Conditions", "Declined", "Need-More-Info",
];

function stageIndex(stage) {
  const i = STAGE_ORDER.indexOf(stage);
  return i === -1 ? 99 : i;
}

export default function ItemsView({ data, reload }) {
  const items = data?.items ?? [];
  const quotes = data?.quotes ?? [];

  const sorted = useMemo(() =>
    [...items].sort((a, b) => {
      const si = stageIndex(a.stage) - stageIndex(b.stage);
      if (si !== 0) return si;
      return (b.spend ?? 0) - (a.spend ?? 0);
    }),
    [items]
  );

  const [selectedId, setSelectedId] = useState(() => sorted[0]?.id ?? null);

  const selectedItem = items.find((i) => i.id === selectedId) ?? null;
  const itemQuotes = quotes.filter((q) => q.itemId === selectedId);

  return (
    <section className="view-pane">
      <div className="two-pane">
        <div className="two-pane-list">
          <div className="pane-header">
            <h2 className="view-title">Items</h2>
            <span className="pane-count">{sorted.length} item{sorted.length !== 1 ? "s" : ""}</span>
          </div>
          <ItemList
            items={sorted}
            selectedId={selectedId}
            onSelect={setSelectedId}
            quotes={quotes}
          />
        </div>
        <div className="two-pane-detail">
          <ItemDetail item={selectedItem} quotes={itemQuotes} reload={reload} />
        </div>
      </div>
    </section>
  );
}
