import StageBadge from "../components/StageBadge.jsx";

export default function DecisionsView({ data, reload }) {
  const decisions = data?.decisions ?? [];

  if (decisions.length === 0) {
    return (
      <section className="view-pane view-pane--empty">
        <h2 className="view-title">Decisions</h2>
        <p className="muted">No decisions recorded yet.</p>
      </section>
    );
  }

  return (
    <section className="view-pane">
      <div className="pane-header">
        <h2 className="view-title">Decisions</h2>
        <span className="pane-count">{decisions.length} decision{decisions.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="decisions-log">
        {decisions.map((d, i) => (
          <div key={i} className="decision-entry">
            <div className="decision-entry-header">
              <div className="decision-entry-left">
                <span className="decision-entry-name">{d.name}</span>
                <StageBadge stage={d.stage} />
              </div>
              <div className="decision-entry-right">
                {d.approver && <span className="decision-entry-approver">{d.approver}</span>}
                {d.date && <span className="decision-entry-date">{d.date}</span>}
              </div>
            </div>
            {d.note && (
              <div className="decision-entry-note">{d.note}</div>
            )}
            {/* After-the-fact note edit: Task 9 */}
          </div>
        ))}
      </div>
    </section>
  );
}
