import StageBadge from "./StageBadge.jsx";
import { formatUSD } from "../money.js";

export default function ItemList({ items, selectedId, onSelect, quotes = [] }) {
  if (!items || items.length === 0) {
    return <div className="item-list-empty">No items.</div>;
  }

  return (
    <div className="item-list">
      {items.map((item) => {
        const quoteCount = quotes.filter((q) => q.itemId === item.id).length;
        const isSelected = item.id === selectedId;

        return (
          <div
            key={item.id}
            className={"item-row" + (isSelected ? " item-row--selected" : "")}
            onClick={() => onSelect(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(item.id)}
          >
            <div className="item-row-top">
              <span className="item-row-name">{item.name}</span>
              <StageBadge stage={item.stage} />
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
          </div>
        );
      })}
    </div>
  );
}
