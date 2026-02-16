import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function AttendanceLogsPage() {
  const [workers, setWorkers] = useState([]);
  const [workerId, setWorkerId] = useState("");

  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [note, setNote] = useState("");
  const [logs, setLogs] = useState([]);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const fetchWorkers = async () => {
    try {
      setLoadingWorkers(true);
      const { data } = await api.get("/workers");
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      setWorkers(arr);

      // Selecciona el primero automático si no hay seleccionado
      if (!workerId && arr.length > 0) {
        setWorkerId(arr[0]?._id || arr[0]?.id || "");
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchLogs = async (id) => {
    if (!id) return;
    try {
      setLoadingLogs(true);
      setError("");
      const { data } = await api.get(`/attendance?workerId=${encodeURIComponent(id)}`);
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      // ordena por fecha si viene createdAt
      const sorted = [...arr].sort((a, b) => {
        const da = new Date(a?.createdAt || a?.timestamp || 0).getTime();
        const db = new Date(b?.createdAt || b?.timestamp || 0).getTime();
        return db - da;
      });
      setLogs(sorted);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (workerId) fetchLogs(workerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId]);

  const selectedWorker = useMemo(() => {
    return workers.find((w) => (w?._id || w?.id) === workerId) || null;
  }, [workers, workerId]);

  const fmtDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const statusLabel = (x) => {
    // Por si tu backend usa type/action/kind
    return x?.type || x?.action || x?.kind || x?.status || "—";
  };

  const makeAction = async (kind) => {
    if (!workerId) {
      setError("Selecciona un trabajador.");
      return;
    }
    setError("");
    try {
      if (kind === "IN") {
        await api.post("/attendance/in", { workerId, note: note.trim() || "Entrada" });
        showToast("Entrada registrada ✅");
      } else {
        await api.post("/attendance/out", { workerId, note: note.trim() || "Salida" });
        showToast("Salida registrada ✅");
      }
      setNote("");
      await fetchLogs(workerId);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 409 && kind === "IN" ? "Ya tiene una entrada sin salida." : "") ||
        (status === 409 && kind === "OUT" ? "No hay entrada abierta para cerrar." : "") ||
        e.message ||
        "Error";
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h2 style={{ margin: 0 }}>Asistencia</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Registrar entrada/salida y consultar logs por trabajador.
          </div>
        </div>
      </div>

      {toast && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 12,
          background: "rgba(0,255,100,.12)", border: "1px solid rgba(0,255,100,.25)"
        }}>
          {toast}
        </div>
      )}

      {error && (
        <div style={{
          marginTop: 12, padding: 10, borderRadius: 12,
          background: "rgba(255,0,0,.10)", border: "1px solid rgba(255,0,0,.22)", color: "tomato"
        }}>
          {error}
        </div>
      )}

      <div style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "1fr 1.6fr",
        gap: 14,
        alignItems: "start",
      }}>
        {/* Panel izquierdo */}
        <div style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 16,
          background: "rgba(255,255,255,.03)"
        }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Registro</div>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Trabajador</span>
            {loadingWorkers ? (
              <div>Cargando...</div>
            ) : (
              <select value={workerId} onChange={(e) => setWorkerId(e.target.value)}>
                {workers.map((w) => (
                  <option key={w?._id || w?.id} value={w?._id || w?.id}>
                    {w?.employeeNumber ? `${w.employeeNumber} — ` : ""}{w?.fullName || "Sin nombre"}
                  </option>
                ))}
              </select>
            )}
          </label>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.85 }}>
            <div><strong>Nombre:</strong> {selectedWorker?.fullName || "—"}</div>
            <div><strong>Empleado:</strong> {selectedWorker?.employeeNumber || "—"}</div>
          </div>

          <label style={{ display: "grid", gap: 6, marginTop: 10 }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Nota</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Entrada normal" />
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button onClick={() => makeAction("IN")} style={{ flex: 1 }}>
              Entrada (IN)
            </button>
            <button onClick={() => makeAction("OUT")} style={{ flex: 1 }}>
              Salida (OUT)
            </button>
          </div>

          <button onClick={() => fetchLogs(workerId)} style={{ width: "100%", marginTop: 10 }}>
            Refrescar logs
          </button>
        </div>

        {/* Panel derecho */}
        <div style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 16,
          background: "rgba(255,255,255,.03)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 900 }}>Logs</div>
            {loadingLogs && <div style={{ opacity: 0.7 }}>Cargando...</div>}
          </div>

          {!loadingLogs && logs.length === 0 && (
            <div style={{ marginTop: 10, opacity: 0.8 }}>No hay logs para este trabajador.</div>
          )}

          {logs.length > 0 && (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {logs.slice(0, 50).map((x, idx) => (
                <div
                  key={x?._id || x?.id || idx}
                  style={{
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.02)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 900 }}>{statusLabel(x)}</div>
                    <div style={{ opacity: 0.8 }}>{fmtDate(x?.createdAt || x?.timestamp)}</div>
                  </div>
                  <div style={{ marginTop: 6, opacity: 0.85 }}>
                    {x?.note || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
