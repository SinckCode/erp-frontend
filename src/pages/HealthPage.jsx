import React, { useEffect, useState } from "react";
import { rootApi } from "../api/axios";

export default function HealthPage() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await rootApi.get("/health");
        setState({ loading: false, data, error: "" });
      } catch (e) {
        setState({
          loading: false,
          data: null,
          error: e?.response?.data?.message || e.message || "Error",
        });
      }
    })();
  }, []);

  return (
    <div>
      <h2>Health Check</h2>
      {state.loading && <p>Cargando...</p>}
      {state.error && <p style={{ color: "tomato" }}>{state.error}</p>}
      {state.data && <pre>{JSON.stringify(state.data, null, 2)}</pre>}
    </div>
  );
}
