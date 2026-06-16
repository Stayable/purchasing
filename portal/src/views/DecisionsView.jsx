import { useState } from "react";
import StageBadge from "../components/StageBadge.jsx";
import { postAward } from "../api.js";

const DECIDED_STAGES = new Set(["Approved", "Approved-with-Conditions", "Declined"]);

function NoteEditor({ item, onSave, onCancel }) {
  const [note, setNote] = useState(item.decisionNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await postAward({ itemId: item.id, action: "note", note });
      onSave();
    } catch (err) {
      setError(err?.response?.data?.error ?? err?.message ?? "Save failed.");
      setSaving(false);
    }
  }

  return (
    <div className="note-editor">
      <textarea
        className="note-editor-textarea"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={3}
        disabled={saving}
      />
      {error && <div className="note-editor-error">{error}</div>}
      <div className="note-editor-actions">
        <button className="btn-primary btn-primary--sm" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button className="btn-ghost btn-ghost--sm" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DecisionsView({ data, reload }) {
  const [editing, setEditing] = useState(null); // item.id being edited

  const decided = (data?.items ?? [])
    .filter((item) => DECIDED_STAGES.has(item.stage))
    .sort((a, b) => {
      // Sort by actual decided date (approvedAt), falling back to decisionDate; nulls last
      const aDate = a.approvedAt ?? a.decisionDate;
      const bDate = b.approvedAt ?? b.decisionDate;
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return new Date(bDate) - new Date(aDate);
    });

  if (decided.length === 0) {
    return (
      <section className="view-pane view-pane--empty">
        <h2 className="view-title">Decisions</h2>
        <p className="muted">No decisions recorded yet.</p>
      </section>
    );
  }

  function handleSaved() {
    setEditing(null);
    reload();
  }

  return (
    <section className="view-pane">
      <div className="pane-header">
        <h2 className="view-title">Decisions</h2>
        <span className="pane-count">
          {decided.length} decision{decided.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="decisions-log">
        {decided.map((item) => (
          <div key={item.id} className="decision-entry">
            <div className="decision-entry-header">
              <div className="decision-entry-left">
                <span className="decision-entry-name">{item.name}</span>
                <StageBadge stage={item.stage} />
              </div>
              <div className="decision-entry-right">
                {item.approver && (
                  <span className="decision-entry-approver">{item.approver}</span>
                )}
                {item.approvedAt ? (
                  <span className="decision-entry-date">Decided {item.approvedAt}</span>
                ) : item.decisionDate ? (
                  <span className="decision-entry-date">Target {item.decisionDate}</span>
                ) : null}
              </div>
            </div>

            {item.awardedVendorName && (
              <div className="decision-entry-vendor">
                Awarded: <strong>{item.awardedVendorName}</strong>
              </div>
            )}

            {editing === item.id ? (
              <NoteEditor
                item={item}
                onSave={handleSaved}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <div className="decision-entry-note-row">
                {item.decisionNotes && (
                  <div className="decision-entry-note">{item.decisionNotes}</div>
                )}
                <button
                  className="btn-ghost btn-ghost--sm note-edit-btn"
                  onClick={() => setEditing(item.id)}
                >
                  Edit note
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
