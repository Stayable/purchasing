import { useState } from "react";
import StageBadge from "./StageBadge.jsx";
import QuoteTable from "./QuoteTable.jsx";
import DecisionModal from "./DecisionModal.jsx";
import { formatUSD } from "../money.js";
import { daysSince } from "../days.js";
import { useCommunications } from "../useCommunications.js";
import { attentionLabel } from "./CommsPanel.jsx";

const TERMINAL_STAGES = new Set(["Approved", "Approved-with-Conditions", "Declined"]);

function lowestLandedId(quotes) {
  if (!quotes || quotes.length === 0) return null;
  return quotes.reduce((best, q) =>
    q.totalLanded < best.totalLanded ? q : best
  ).id;
}

export default function ItemDetail({ item, quotes, reload }) {
  const isSubmitted = (item?.stage || "").toLowerCase() === "submitted";
  const isTerminal = TERMINAL_STAGES.has(item?.stage);

  const daysAwaiting = isSubmitted ? daysSince(item?.modifiedAt) : null;
  const approvalAgeLine = (() => {
    if (!isSubmitted || daysAwaiting == null || !item?.modifiedAt) return null;
    const since = new Date(item.modifiedAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `For Approval ~since ${since} · ${daysAwaiting}d (approx.)`;
  })();

  const defaultQuoteId = lowestLandedId(quotes);
  const [selectedQuoteId, setSelectedQuoteId] = useState(defaultQuoteId);
  const [modal, setModal] = useState(null); // { action, quote } or null

  const { data: comms } = useCommunications(item?.id);
  const vendorByQuote = {};
  for (const v of comms?.vendors || []) vendorByQuote[v.quoteId] = v;

  if (!item) {
    return (
      <div className="item-detail item-detail--empty">
        <p className="muted">Select an item to view details.</p>
      </div>
    );
  }

  function onAction(action) {
    const quote =
      action !== "decline"
        ? (quotes || []).find((q) => q.id === selectedQuoteId) || null
        : null;
    setModal({ action, quote });
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
          {comms?.configured && comms.itemAttention && comms.itemAttention !== "none" && (
            <span className={"meta-chip meta-chip--attn meta-chip--" + comms.itemAttention}>
              {attentionLabel(comms.itemAttention, null)}
            </span>
          )}
        </div>
        {approvalAgeLine && (
          <div className={"approval-age-line" + (daysAwaiting >= 7 ? " approval-age-line--stale" : "")}>
            {daysAwaiting >= 7 && <span className="approval-age-stale-icon">⚠</span>}
            {approvalAgeLine}
          </div>
        )}
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
              vendorByQuote={vendorByQuote}
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

      {modal && (
        <DecisionModal
          item={item}
          action={modal.action}
          quote={modal.quote}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); reload(); }}
        />
      )}
    </div>
  );
}
