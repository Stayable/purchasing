import { useState } from "react";
import ItemList from "../components/ItemList.jsx";
import ItemDetail from "../components/ItemDetail.jsx";

export default function QueueView({ data, reload }) {
  const queue = data?.queue ?? [];
  const quotes = data?.quotes ?? [];

  const [selectedId, setSelectedId] = useState(() => queue[0]?.id ?? null);

  const selectedItem = queue.find((i) => i.id === selectedId) ?? null;
  const itemQuotes = quotes.filter((q) => q.itemId === selectedId);

  if (queue.length === 0) {
    return (
      <section className="view-pane view-pane--empty">
        <p className="muted">No items awaiting decision.</p>
      </section>
    );
  }

  return (
    <section className="view-pane">
      <div className="two-pane">
        <div className="two-pane-list">
          <div className="pane-header">
            <h2 className="view-title">Queue</h2>
            <span className="pane-count">{queue.length} item{queue.length !== 1 ? "s" : ""}</span>
          </div>
          <ItemList
            items={queue}
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
