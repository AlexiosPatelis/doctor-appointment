import { useEffect, useState } from "react";
import api from "../api/axios";

export default function DebugPing() {
  const [out, setOut] = useState("pinging...");
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/healthz");
        setOut(`OK ${r.status} base=${(api.defaults && api.defaults.baseURL) || "?"}`);
      } catch (e) {
        setOut(`FAIL ${e?.message} base=${(api.defaults && api.defaults.baseURL) || "?"}`);
      }
    })();
  }, []);
  return <pre style={{ padding: 16 }}>{out}</pre>;
}
