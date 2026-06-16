import { useState } from "react";
import { postAward } from "../api.js";
import { formatUSD } from "../money.js";

const LABEL = {
  approve: "Approve & Award",
  approve_conditions: "Approve w/ Conditions",
  decline: "Decline",
};

const NOTE_LABEL = {
  approve: "Why this vendor won",
  approve_conditions: "Conditions of approval",
  decline: "Reason for decline",
};

export default function DecisionModal({ item, action, quote, onClose, onDone }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function confirm() {
    setBusy(true);
    setErr("");
    try {
      await postAward({ itemId: item.id, action, quoteId: quote?.id, note });
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.error || "Write failed.");
      setBusy(false);
    }
  }

  function handleBackdropClick() {
    if (!busy) onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">{LABEL[action]}</div>

        <div className="modal-body">
          {action !== "decline" && quote && (
            <div className="award-summary">
              <div className="award-summary-label">Awarding to</div>
              <div className="award-summary-vendor">{quote.vendorName}</div>
              <div className="award-summary-details">
                {formatUSD(quote.landedUnit)} / unit
                {" · "}
                <strong>{formatUSD(quote.totalLanded)}</strong> landed
                {" · "}
                {quote.leadDays}d lead
                {quote.specMatch && <span>{" · "}{quote.specMatch}</span>}
              </div>
            </div>
          )}

          <label className="req" htmlFor="decision-note">
            {NOTE_LABEL[action]} <span className="req-star">*</span>
          </label>
          <textarea
            id="decision-note"
            className="modal-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Writes to Zoho Decision_Notes…"
            rows={4}
          />

          {err && <p className="err">{err}</p>}
        </div>

        <div className="modal-foot">
          <button
            className="btn-ghost"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
          <button
            className={action === "decline" ? "btn-danger btn-danger--solid" : "btn-primary"}
            disabled={busy || !note.trim()}
            onClick={confirm}
          >
            {busy
              ? "Saving…"
              : action === "decline"
              ? "Confirm Decline"
              : "Confirm & Award"}
          </button>
        </div>
      </div>
    </div>
  );
}
