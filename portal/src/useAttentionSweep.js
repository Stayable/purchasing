import { useEffect, useState } from "react";
import { getCommunications } from "./api.js";
export function useAttentionSweep() {
  const [byItem, setByItem] = useState({});
  useEffect(() => {
    let alive = true;
    getCommunications().then((d) => {
      if (!alive || !d || d.configured === false) return;
      const m = {}; for (const it of d.items || []) m[it.itemId] = it.itemAttention;
      setByItem(m);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return { byItem };
}
