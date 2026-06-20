import { useState } from "react";
import ItemList from "../components/ItemList.jsx";
import ItemDetail from "../components/ItemDetail.jsx";
import { daysSince } from "../days.js";
import { useAttentionSweep } from "../useAttentionSweep.js";

const STALE_THRESHOLD = 7;

export default function QueueView({ data, reload }) {
  const queue = data?.queue ?? [];
  const quotes = data?.quotes ?? [];

  const { byItem } = useAttentionSweep();
  const [showStaleOnly, setShowStaleOnly] = useState(false);

  // Enrich each queue item with daysAwaiting
  const enriched = queue.map((item) => ({
    ...item,
    daysAwaiting: daysSince(item.modifiedAt),
  }));

  const staleCount = enriched.filter(
    (i) => i.daysAwaiting != null && i.daysAwaiting >= STALE_THRESHOLD
  ).length;

  // Apply filter + sort
  const displayed = showStaleOnly
    ? enriched
        .filter((i) => i.daysAwaiting != null && i.daysAwaiting >= STALE_THRESHOLD)
        .sort((a, b) => b.daysAwaiting - a.daysAwaiting)
    : enriched;

  const [selectedId, setSelectedId] = useState(() => queue[0]?.id ?? null);

  const selectedItem = displayed.find((i) => i.id === selectedId) ?? null;
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
          <div className="pane-header pane-header--queue">
            <h2 className="view-title">Queue</h2>
            <span className="pane-count">
              {displayed.length} item{displayed.length !== 1 ? "s" : ""}
            </span>
            <div className="queue-filter-group">
              <button
                className={"queue-stale-toggle" + (showStaleOnly ? " queue-stale-toggle--active" : "")}
                onClick={() => setShowStaleOnly((v) => !v)}
                title={showStaleOnly ? "Show all items" : "Show only items awaiting ≥7 days"}
              >
                {showStaleOnly ? "Show all" : "Awaiting ≥7d"}
              </button>
              {staleCount > 0 && (
                <span className="stale-count-badge">
                  {staleCount} awaiting ≥7d
                </span>
              )}
            </div>
          </div>
          <ItemList
            items={displayed}
            selectedId={selectedId}
            onSelect={setSelectedId}
            quotes={quotes}
            byItem={byItem}
          />
        </div>
        <div className="two-pane-detail">
          <ItemDetail item={selectedItem} quotes={itemQuotes} reload={reload} />
        </div>
      </div>
    </section>
  );
}
