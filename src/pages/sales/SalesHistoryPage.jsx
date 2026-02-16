import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function SalesHistoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState(""); // busca por folio, matrícula, etc
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/sales");
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      // orden por fecha desc
      const sorted = [...arr].sort((a, b) => {
        const da = new Date(a?.createdAt || a?.date || 0).getTime();
        const db = new Date(b?.createdAt || b?.date || 0).getTime();
        return db - da;
      });
      setItems(sorted);
      showToast("Ventas actualizadas ✅");
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const money = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  const fmtDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const getFolio = (s) => s?.folio || s?.ticket || s?.code || s?._id || "—";
  const getBuyer = (s) => s?.buyerRefId || s?.buyer?.matricula || s?.buyer?.refId || "—";
  const getBuyerType = (s) => s?.buyerType || s?.type || "—";

  const countItems = (s) => {
    const arr = s?.items || s?.details || [];
    return Array.isArray(arr) ? arr.reduce((acc, x) => acc + Number(x?.qty || x?.quantity || 0), 0) : 0;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      const hay = [
        getFolio(s),
        getBuyer(s),
        getBuyerType(s),
        String(s?.total ?? ""),
        fmtDate(s?.createdAt || s?.date),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Ventas</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>Historial de ventas registradas.</div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por folio, matrícula, total..."
            style={{ width: 340, maxWidth: "55vw" }}
          />
          <button onClick={fetchSales}>Refrescar</button>
        </div>
      </div>

      {toast && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 12,
            background: "rgba(0,255,100,.12)",
            border: "1px solid rgba(0,255,100,.25)",
          }}
        >
          {toast}
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 12,
            background: "rgba(255,0,0,.10)",
            border: "1px solid rgba(255,0,0,.22)",
            color: "tomato",
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          marginTop: 14,
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          overflow: "hidden",
          background: "rgba(255,255,255,.03)",
        }}
      >
        {loading ? (
          <div style={{ padding: 16 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.8 }}>
            {items.length === 0 ? "No hay ventas aún." : "Sin resultados."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Folio</th>
                <th style={{ padding: 12 }}>Fecha</th>
                <th style={{ padding: 12 }}>Comprador</th>
                <th style={{ padding: 12 }}>Tipo</th>
                <th style={{ padding: 12 }}>Items</th>
                <th style={{ padding: 12 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s?._id || s?.id || getFolio(s)}
                  style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
                >
                  <td style={{ padding: 12, fontWeight: 900 }}>{getFolio(s)}</td>
                  <td style={{ padding: 12, opacity: 0.9 }}>{fmtDate(s?.createdAt || s?.date)}</td>
                  <td style={{ padding: 12 }}>{getBuyer(s)}</td>
                  <td style={{ padding: 12, opacity: 0.85 }}>{getBuyerType(s)}</td>
                  <td style={{ padding: 12, opacity: 0.85 }}>{countItems(s)}</td>
                  <td style={{ padding: 12, fontWeight: 900 }}>{money(s?.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
        Tip: Si quieres, hacemos click en una venta para abrir un modal con el detalle de libros y cantidades.
      </div>
    </div>
  );
}
