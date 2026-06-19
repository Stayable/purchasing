import { useCallback, useEffect, useState } from "react";
import { getCommunications } from "./api.js";

export function useCommunications(itemId) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const load = useCallback(async () => {
    setStatus("loading");
    try { setData(await getCommunications(itemId)); setStatus("ready"); }
    catch (e) { setStatus(e?.response?.status === 401 ? "unauth" : "error"); }
  }, [itemId]);
  useEffect(() => { load(); }, [load]);
  return { data, status, reload: load };
}
