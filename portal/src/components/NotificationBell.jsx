import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../useNotifications.js";
import { relativeTime } from "../days.js";

export default function NotificationBell() {
  const { items, unread, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function onOpen() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markRead({ all: true });
  }

  function onClick(n) {
    setOpen(false);
    if (n.item_id) navigate("/items");
  }

  return (
    <div className="notif">
      <button className="notif-bell" onClick={onOpen} aria-label="Notifications">
        <span className="notif-bell-icon">🔔</span>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <>
          <div className="notif-backdrop" onClick={() => setOpen(false)} />
          <div className="notif-panel">
            <div className="notif-panel-head">Notifications</div>
            {items.length === 0 ? (
              <div className="notif-empty">No notifications yet.</div>
            ) : (
              <ul className="notif-list">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={"notif-item" + (n.read_at ? "" : " notif-item--unread")}
                    onClick={() => onClick(n)}
                  >
                    <div className="notif-item-title">{n.title}</div>
                    {n.body && <div className="notif-item-body">{n.body}</div>}
                    <div className="notif-item-time">{relativeTime(n.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
