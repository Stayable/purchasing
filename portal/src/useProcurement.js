import { useCallback, useEffect, useState } from "react";
import { getProcurement } from "./api.js";

export function useProcurement() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | unauth | error

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      setData(await getProcurement());
      setStatus("ready");
    } catch (e) {
      setStatus(e?.response?.status === 401 ? "unauth" : "error");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { data, status, reload: load };
}
