import StageBadge from "./StageBadge.jsx";
import { formatUSD } from "../money.js";

const STALE_THRESHOLD = 7;

function approvalAgeLabel(item) {
  if (!item.modifiedAt || item.daysAwaiting == null) return null;
  // Only meaningful for Submitted items
  if ((item.stage || "").toLowerCase() !== "submitted") return null;
  const since = new Date(item.modifiedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `~since ${since} · ${item.daysAwaiting}d (approx.)`;
}

export default function ItemList({ items, selectedId, onSelect, quotes = [] }) {
  if (!items || items.length === 0) {
    return <div className="item-list-empty">No items.</div>;
  }

  return (
    <div className="item-list">
      {items.map((item) => {
        const quoteCount = quotes.filter((q) => q.itemId === item.id).length;
        const isSelected = item.id === selectedId;
        const isStale =
          item.daysAwaiting != null &&
          item.daysAwaiting >= STALE_THRESHOLD &&
          (item.stage || "").toLowerCase() === "submitted";
        const ageLabel = approvalAgeLabel(item);

        return (
          <div
            key={item.id}
            className={
              "item-row" +
              (isSelected ? " item-row--selected" : "") +
              (isStale ? " item-row--stale" : "")
            }
            onClick={() => onSelect(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(item.id)}
          >
            <div className="item-row-top">
              <span className="item-row-name">{item.name}</span>
              <div className="item-row-badges">
                {isStale && (
                  <span className="stale-badge" title="Awaiting approval for 7+ days (approx.)">
                    ⚠ {item.daysAwaiting}d
                  </span>
                )}
                <StageBadge stage={item.stage} />
              </div>
            </div>
            <div className="item-row-meta">
              <span className="item-row-property">{item.property}</span>
              <span className="item-row-spend">{formatUSD(item.spend)}</span>
              {quoteCount > 0 && (
                <span className="item-row-quotes">{quoteCount} quote{quoteCount !== 1 ? "s" : ""}</span>
              )}
              {item.awardedVendorName && (
                <span className="item-row-awarded">Awarded: {item.awardedVendorName}</span>
              )}
            </div>
            {ageLabel && (
              <div className="item-row-approval-age">
                For Approval {ageLabel}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
