import { useEffect, useState } from "react";
import { getActivity } from "../api.js";
import { actionLabel, actionIcon, actorName } from "../activity.js";
import { relativeTime } from "../days.js";

// Per-item activity timeline. Fetches the log for one item; renders nothing if empty.
export default function ActivityTimeline({ itemId }) {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ok = true;
    if (!itemId) { setRows([]); setLoaded(true); return; }
    setLoaded(false);
    getActivity({ itemId })
      .then((d) => { if (ok) { setRows(d.items || []); setLoaded(true); } })
      .catch(() => { if (ok) { setRows([]); setLoaded(true); } });
    return () => { ok = false; };
  }, [itemId]);

  if (!loaded || rows.length === 0) return null;

  return (
    <div className="item-detail-activity">
      <h3 className="section-label">Activity</h3>
      <ul className="timeline">
        {rows.map((r) => (
          <li key={r.id} className="timeline-row">
            <span className="timeline-icon">{actionIcon(r.action)}</span>
            <span className="timeline-text">
              <strong>{actorName(r.actor)}</strong> {actionLabel(r.action)}
            </span>
            <span className="timeline-time">{relativeTime(r.created_at)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
