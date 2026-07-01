import { useCallback, useEffect, useRef, useState } from "react";
import { getNotifications, markNotificationsRead } from "./api.js";

// Polls the notification center. Inert-safe: on any error it just holds the last state.
export function useNotifications({ intervalMs = 60000 } = {}) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const timer = useRef(null);

  const reload = useCallback(async () => {
    try {
      const d = await getNotifications();
      setItems(d.items || []);
      setUnread(d.unread || 0);
    } catch { /* keep prior state */ }
  }, []);

  const markRead = useCallback(async (body) => {
    try { await markNotificationsRead(body); } catch { /* ignore */ }
    reload();
  }, [reload]);

  useEffect(() => {
    reload();
    timer.current = setInterval(reload, intervalMs);
    return () => clearInterval(timer.current);
  }, [reload, intervalMs]);

  return { items, unread, reload, markRead };
}
