import { Fragment } from "react";
import { formatUSD } from "../money.js";
import CommsPanel from "./CommsPanel.jsx";

function lowestLandedId(quotes) {
  if (!quotes || quotes.length === 0) return null;
  return quotes.reduce((best, q) =>
    q.totalLanded < best.totalLanded ? q : best
  ).id;
}

export default function QuoteTable({ quotes, selectedQuoteId, onSelect, vendorByQuote }) {
  if (!quotes || quotes.length === 0) {
    return <p className="muted">No quotes on file for this item.</p>;
  }

  const recommendedId = lowestLandedId(quotes);

  return (
    <div className="quote-table-wrap">
      <table className="data-table quote-table">
        <thead>
          <tr>
            <th style={{ width: 28 }}></th>
            <th>Vendor</th>
            <th>Landed / Unit</th>
            <th>Total Landed</th>
            <th>Lead time</th>
            <th>Spec Match</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const isRecommended = q.id === recommendedId;
            const isSelected = q.id === selectedQuoteId;
            const vendor = vendorByQuote && vendorByQuote[q.id];
            return (
              <Fragment key={q.id}>
              <tr
                className={
                  "quote-row" +
                  (isSelected ? " quote-row--selected" : "") +
                  (isRecommended ? " quote-row--recommended" : "")
                }
                onClick={() => onSelect(q.id)}
              >
                <td>
                  <input
                    type="radio"
                    name="quote-select"
                    checked={isSelected}
                    onChange={() => onSelect(q.id)}
                    aria-label={`Select ${q.vendorName}`}
                  />
                </td>
                <td>
                  <div className="quote-vendor">
                    {q.vendorName}
                    {isRecommended && (
                      <span className="quote-recommended-tag">Recommended</span>
                    )}
                  </div>
                  {q.incoterm && (
                    <div className="quote-incoterm">{q.incoterm} · {q.currency || "USD"}</div>
                  )}
                </td>
                <td className="mono">{formatUSD(q.landedUnit)}</td>
                <td className="mono bold">{formatUSD(q.totalLanded)}</td>
                <td className="mono">{q.leadDays != null ? `${q.leadDays} days` : "—"}</td>
                <td>
                  <span
                    className={
                      "spec-match spec-match--" +
                      (q.specMatch === "Yes" ? "yes" : q.specMatch === "No" ? "no" : "partial")
                    }
                  >
                    {q.specMatch || "—"}
                  </span>
                </td>
              </tr>
              {isSelected && vendor && (
                <tr className="comms-row">
                  <td colSpan={6}><CommsPanel vendor={vendor} /></td>
                </tr>
              )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
