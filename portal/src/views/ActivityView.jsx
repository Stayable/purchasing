import { useEffect, useState } from "react";
import { getActivity } from "../api.js";
import { actionLabel, actionIcon, actorName } from "../activity.js";
import { relativeTime } from "../days.js";

const ACTIONS = ["", "item_created", "quotes_ready", "awarded", "approved", "declined", "vendor_added", "quote_added"];

// Global firm-wide activity feed with simple filters.
export default function ActivityView() {
  const [rows, setRows] = useState([]);
  const [action, setAction] = useState("");
  const [actor, setActor] = useState("");
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let ok = true;
    setStatus("loading");
    const params = {};
    if (action) params.action = action;
    if (actor.trim()) params.actor = actor.trim().toLowerCase();
    getActivity(params)
      .then((d) => { if (ok) { setRows(d.items || []); setStatus("ready"); } })
      .catch(() => { if (ok) { setRows([]); setStatus("error"); } });
    return () => { ok = false; };
  }, [action, actor]);

  return (
    <section className="view-pane">
      <div className="pane-header">
        <h2 className="view-title">Activity</h2>
        <span className="pane-count">{rows.length}</span>
        <div className="activity-filters">
          <select className="modal-input activity-filter" value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTIONS.map((a) => <option key={a} value={a}>{a ? actionLabel(a) : "All actions"}</option>)}
          </select>
          <input className="modal-input activity-filter" placeholder="Filter by user email…" value={actor} onChange={(e) => setActor(e.target.value)} />
        </div>
      </div>

      {status === "loading" ? (
        <p className="muted" style={{ padding: 20 }}>Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted" style={{ padding: 20 }}>No activity{action || actor ? " for this filter" : " yet"}.</p>
      ) : (
        <ul className="timeline timeline--feed">
          {rows.map((r) => (
            <li key={r.id} className="timeline-row">
              <span className="timeline-icon">{actionIcon(r.action)}</span>
              <span className="timeline-text">
                <strong>{actorName(r.actor)}</strong> {actionLabel(r.action)}
                {r.detail && r.detail.itemName ? <span className="timeline-item"> · {r.detail.itemName}</span> : null}
              </span>
              <span className="timeline-time">{relativeTime(r.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
