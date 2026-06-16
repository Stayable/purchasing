import { useState } from "react";
import StageBadge from "./StageBadge.jsx";
import QuoteTable from "./QuoteTable.jsx";
import { formatUSD } from "../money.js";

const TERMINAL_STAGES = new Set(["Approved", "Approved-with-Conditions", "Declined"]);

function lowestLandedId(quotes) {
  if (!quotes || quotes.length === 0) return null;
  return quotes.reduce((best, q) =>
    q.totalLanded < best.totalLanded ? q : best
  ).id;
}

export default function ItemDetail({ item, quotes, reload }) {
  const isTerminal = TERMINAL_STAGES.has(item?.stage);

  const defaultQuoteId = lowestLandedId(quotes);
  const [selectedQuoteId, setSelectedQuoteId] = useState(defaultQuoteId);

  if (!item) {
    return (
      <div className="item-detail item-detail--empty">
        <p className="muted">Select an item to view details.</p>
      </div>
    );
  }

  // Stub action handler — modal wired in Task 7
  function onAction(action) {
    // TODO Task 7: open DecisionModal
    console.log("action stub:", action, "quoteId:", selectedQuoteId);
  }

  return (
    <div className="item-detail">
      {/* Header */}
      <div className="item-detail-header">
        <div className="item-detail-title-row">
          <h2 className="item-detail-name">{item.name}</h2>
          <StageBadge stage={item.stage} />
        </div>
        <div className="item-detail-meta">
          {item.property && (
            <span className="meta-chip">{item.property}</span>
          )}
          {item.targetQty != null && (
            <span className="meta-chip">Qty: {item.targetQty}</span>
          )}
          {item.spend != null && (
            <span className="meta-chip">{formatUSD(item.spend)}</span>
          )}
          {item.approver && (
            <span className="meta-chip">Approver: {item.approver}</span>
          )}
          {item.flStatus && (
            <span className={"meta-chip meta-chip--fl" + (item.flStatus === "Pass" ? " pass" : item.flStatus === "Fail" ? " fail" : "")}>
              FL: {item.flStatus}
            </span>
          )}
        </div>
      </div>

      {isTerminal ? (
        /* Terminal — read-only decision record */
        <div className="item-detail-decision">
          <h3 className="section-label">Decision</h3>
          <div className="decision-record">
            {item.awardedVendorName && (
              <div className="decision-row">
                <span className="decision-key">Awarded Vendor</span>
                <span className="decision-val">{item.awardedVendorName}</span>
              </div>
            )}
            {item.decisionNotes && (
              <div className="decision-row">
                <span className="decision-key">Notes</span>
                <span className="decision-val">{item.decisionNotes}</span>
              </div>
            )}
            {item.Portal_Approved_By && (
              <div className="decision-row">
                <span className="decision-key">Approved By</span>
                <span className="decision-val">{item.Portal_Approved_By}</span>
              </div>
            )}
            {item.decisionDate && (
              <div className="decision-row">
                <span className="decision-key">Date</span>
                <span className="decision-val">{item.decisionDate}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Non-terminal — quote comparison + action bar */
        <>
          <div className="item-detail-quotes">
            <h3 className="section-label">Quotes</h3>
            <QuoteTable
              quotes={quotes}
              selectedQuoteId={selectedQuoteId}
              onSelect={setSelectedQuoteId}
            />
          </div>

          <div className="item-detail-actions">
            <button
              className="btn-primary"
              disabled={!selectedQuoteId}
              onClick={() => onAction("approve")}
            >
              Approve &amp; Award
            </button>
            <button
              className="btn-ghost"
              onClick={() => onAction("approve_conditions")}
            >
              Approve w/ Conditions
            </button>
            <button
              className="btn-danger"
              onClick={() => onAction("decline")}
            >
              Decline
            </button>
          </div>
        </>
      )}
    </div>
  );
}
