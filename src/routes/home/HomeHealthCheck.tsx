import React from "react";
import { request } from "../../utils/http";

export const HomeHealthCheck: React.FC = () => {
  const [status, setStatus] = React.useState<string>("checking…");
  React.useEffect(() => {
    (async () => {
      try {
        const data = await request<{ ok: boolean }>("/api/health", { timeoutMs: 5000, retries: 0 });
        setStatus(data.ok ? "ok" : "degraded");
      } catch (e: any) {
        setStatus(e?.message || "error");
      }
    })();
  }, []);

  return (
    <div className="fixed bottom-3 right-3 rounded-xl border bg-white/80 backdrop-blur px-3 py-2 text-xs">
      Home health: <strong>{status}</strong>
    </div>
  );
};
