import React, { useEffect, useMemo, useState } from "react";
import { api, rootApi } from "../api/axios";

const LOW_STOCK_THRESHOLD = 3;

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const [health, setHealth] = useState({ loading: true, data: null, error: "" });
  const [stats, setStats] = useState({
    loading: true,
    positions: 0,
    workers: 0,
    students: 0,
    books: 0,
    lowStockBooks: [],
    error: "",
  });

  useEffect(() => {
    // Health (/health)
    (async () => {
      try {
        const { data } = await rootApi.get("/health");
        setHealth({ loading: false, data, error: "" });
      } catch (e) {
        setHealth({
          loading: false,
          data: null,
          error: e?.response?.data?.message || e.message || "Error",
        });
      }
    })();

    // KPIs (/api/*)
    (async () => {
      try {
        setStats((s) => ({ ...s, loading: true, error: "" }));

        const results = await Promise.allSettled([
          api.get("/positions"),
          api.get("/workers"),
          api.get("/students"),
          api.get("/books"),
        ]);

        const pickArray = (res) => {
          if (res.status !== "fulfilled") return null;
          const data = res.value?.data;
          if (Array.isArray(data)) return data;
          // por si el backend responde { items: [...] } o { data: [...] }
          return data?.items || data?.data || null;
        };

        const positionsArr = pickArray(results[0]) || [];
        const workersArr = pickArray(results[1]) || [];
        const studentsArr = pickArray(results[2]) || [];
        const booksArr = pickArray(results[3]) || [];

        const lowStock = booksArr
          .filter((b) => Number(b?.stock ?? 0) <= LOW_STOCK_THRESHOLD)
          .sort((a, b) => Number(a?.stock ?? 0) - Number(b?.stock ?? 0))
          .slice(0, 6);

        setStats({
          loading: false,
          positions: positionsArr.length,
          workers: workersArr.length,
          students: studentsArr.length,
          books: booksArr.length,
          lowStockBooks: lowStock,
          error: "",
        });
      } catch (e) {
        setStats((s) => ({
          ...s,
          loading: false,
          error: e?.response?.data?.message || e.message || "Error",
        }));
      }
    })();
  }, []);

  const healthLabel = useMemo(() => {
    if (!health.data) return "";
    return health.data?.status || (health.data?.ok ? "UP" : "DOWN");
  }, [health.data]);

  const Card = ({ title, children }) => (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14,
        padding: 16,
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );

  const BigNumber = ({ value }) => (
    <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 0.2 }}>{value}</div>
  );

  return (
    <div style={{ maxWidth: 1100 }}>
      <h2 style={{ margin: "0 0 10px 0" }}>Dashboard</h2>
      <div style={{ opacity: 0.8, marginBottom: 14 }}>
        Bienvenido{user?.name ? `, ${user.name}` : ""} • Rol: {user?.role || "—"}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
        }}
      >
        <Card title="Estado del servidor">
          {health.loading && <div>Comprobando...</div>}
          {health.error && <div style={{ color: "tomato" }}>{health.error}</div>}
          {health.data && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: health.data?.ok ? "limegreen" : "tomato",
                  display: "inline-block",
                }}
              />
              <div style={{ fontWeight: 800 }}>{healthLabel}</div>
            </div>
          )}
        </Card>

        <Card title="Cargos">
          {stats.loading ? <div>Cargando...</div> : <BigNumber value={stats.positions} />}
          <div style={{ opacity: 0.75 }}>Total registrados</div>
        </Card>

        <Card title="Trabajadores">
          {stats.loading ? <div>Cargando...</div> : <BigNumber value={stats.workers} />}
          <div style={{ opacity: 0.75 }}>Total registrados</div>
        </Card>

        <Card title="Alumnos">
          {stats.loading ? <div>Cargando...</div> : <BigNumber value={stats.students} />}
          <div style={{ opacity: 0.75 }}>Total registrados</div>
        </Card>

        <Card title="Libros">
          {stats.loading ? <div>Cargando...</div> : <BigNumber value={stats.books} />}
          <div style={{ opacity: 0.75 }}>Total en catálogo</div>
        </Card>

        <Card title={`Stock bajo (≤ ${LOW_STOCK_THRESHOLD})`}>
          {stats.loading && <div>Cargando...</div>}
          {stats.error && <div style={{ color: "tomato" }}>{stats.error}</div>}
          {!stats.loading && !stats.error && stats.lowStockBooks.length === 0 && (
            <div style={{ opacity: 0.8 }}>Todo bien por ahora ✅</div>
          )}
          {stats.lowStockBooks.length > 0 && (
            <div style={{ display: "grid", gap: 8 }}>
              {stats.lowStockBooks.map((b) => (
                <div
                  key={b?._id || b?.id || b?.code}
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,.08)",
                    background: "rgba(255,255,255,.02)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{b?.title || b?.code || "Libro"}</div>
                  <div style={{ opacity: 0.8 }}>
                    Stock: <strong>{b?.stock ?? 0}</strong> • {b?.author || b?.category || ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
