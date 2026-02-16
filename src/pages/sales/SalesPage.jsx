import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function SalesPage() {
  const [students, setStudents] = useState([]);
  const [books, setBooks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Form
  const [buyerType, setBuyerType] = useState("STUDENT");
  const [buyerRefId, setBuyerRefId] = useState(""); // matrícula
  const [items, setItems] = useState([{ bookId: "", qty: 1 }]);

  const [result, setResult] = useState(null); // respuesta de venta

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const fetchBase = async () => {
    try {
      setLoading(true);
      setError("");

      const [stuRes, bookRes] = await Promise.all([
        api.get("/students"),
        api.get("/books"),
      ]);

      const stuArr = Array.isArray(stuRes.data) ? stuRes.data : stuRes.data?.items || stuRes.data?.data || [];
      const bookArr = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.items || bookRes.data?.data || [];

      setStudents(stuArr);
      setBooks(bookArr);

      if (!buyerRefId && stuArr.length > 0) setBuyerRefId(stuArr[0]?.matricula || "");
      if (items.length === 1 && !items[0].bookId && bookArr.length > 0) {
        setItems([{ bookId: (bookArr[0]?._id || bookArr[0]?.id), qty: 1 }]);
      }
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bookById = useMemo(() => {
    const map = new Map();
    books.forEach((b) => map.set(String(b?._id || b?.id), b));
    return map;
  }, [books]);

  const addItem = () => setItems((prev) => [...prev, { bookId: "", qty: 1 }]);

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const total = useMemo(() => {
    let sum = 0;
    for (const it of items) {
      const b = bookById.get(String(it.bookId));
      const price = Number(b?.price ?? 0);
      const qty = Number(it.qty ?? 0);
      if (Number.isFinite(price) && Number.isFinite(qty)) sum += price * qty;
    }
    return sum;
  }, [items, bookById]);

  const canSubmit = useMemo(() => {
    if (buyerType !== "STUDENT") return false; // por ahora solo student
    if (!buyerRefId.trim()) return false;
    if (items.length === 0) return false;

    return items.every((it) => {
      const qty = Number(it.qty);
      return it.bookId && Number.isFinite(qty) && qty > 0;
    });
  }, [buyerType, buyerRefId, items]);

  const money = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  const validateClientSideStock = () => {
    // Esto NO reemplaza al backend, solo previene errores obvios
    for (const it of items) {
      const b = bookById.get(String(it.bookId));
      const qty = Number(it.qty);
      const stock = Number(b?.stock ?? 0);
      if (qty > stock) {
        return `Stock insuficiente (frontend): "${b?.title}" tiene ${stock} y estás pidiendo ${qty}.`;
      }
    }
    return "";
  };

  const onSubmit = async () => {
    setError("");
    setToast("");
    setResult(null);

    const stockMsg = validateClientSideStock();
    if (stockMsg) {
      setError(stockMsg);
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        buyerType,
        buyerRefId: buyerRefId.trim(),
        items: items.map((it) => ({ bookId: it.bookId, qty: Number(it.qty) })),
      };

      const { data } = await api.post("/sales", payload);
      setResult(data);
      showToast("Venta creada ✅");

      // refresca libros para ver stock bajado
      const bookRes = await api.get("/books");
      const bookArr = Array.isArray(bookRes.data) ? bookRes.data : bookRes.data?.items || bookRes.data?.data || [];
      setBooks(bookArr);
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 409 ? "Stock insuficiente o conflicto de venta." : "") ||
        e.message ||
        "Error";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Ventas</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Crear venta y descontar stock automáticamente.
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
        gridTemplateColumns: "1.2fr .8fr",
        gap: 14,
        alignItems: "start",
      }}>
        {/* Form */}
        <div style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 16,
          background: "rgba(255,255,255,.03)"
        }}>
          {loading ? (
            <div>Cargando...</div>
          ) : (
            <>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>Datos de compra</div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Buyer Type</span>
                  <select value={buyerType} onChange={(e) => setBuyerType(e.target.value)}>
                    <option value="STUDENT">STUDENT</option>
                  </select>
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Alumno (Matrícula)</span>
                  <select value={buyerRefId} onChange={(e) => setBuyerRefId(e.target.value)}>
                    {students.map((s) => (
                      <option key={s?._id || s?.id || s?.matricula} value={s?.matricula}>
                        {s?.matricula} — {s?.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ marginTop: 14, fontWeight: 900 }}>Items</div>

              <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                {items.map((it, idx) => {
                  const b = bookById.get(String(it.bookId));
                  const stock = Number(b?.stock ?? 0);

                  return (
                    <div key={idx} style={{
                      border: "1px solid rgba(255,255,255,.08)",
                      borderRadius: 14,
                      padding: 12,
                      background: "rgba(255,255,255,.02)",
                      display: "grid",
                      gridTemplateColumns: "1.6fr .6fr .3fr",
                      gap: 10,
                      alignItems: "end",
                    }}>
                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 12, opacity: 0.8 }}>Libro</span>
                        <select
                          value={it.bookId}
                          onChange={(e) => updateItem(idx, { bookId: e.target.value })}
                        >
                          <option value="">Selecciona...</option>
                          {books.map((bk) => (
                            <option key={bk?._id || bk?.id} value={bk?._id || bk?.id}>
                              {bk?.code} — {bk?.title} (stock {bk?.stock})
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ display: "grid", gap: 6 }}>
                        <span style={{ fontSize: 12, opacity: 0.8 }}>Cantidad</span>
                        <input
                          value={it.qty}
                          onChange={(e) => updateItem(idx, { qty: e.target.value })}
                          inputMode="numeric"
                          placeholder="1"
                        />
                        {it.bookId && (
                          <span style={{ fontSize: 12, opacity: 0.75 }}>
                            Stock disponible: <strong>{stock}</strong>
                          </span>
                        )}
                      </label>

                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        title={items.length === 1 ? "Debe haber al menos 1 item" : "Eliminar item"}
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}
              </div>

              <button type="button" onClick={addItem} style={{ marginTop: 10 }}>
                + Agregar item
              </button>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
                <div style={{ opacity: 0.8 }}>Total estimado</div>
                <div style={{ fontWeight: 900 }}>{money(total)}</div>
              </div>

              <div style={{ display: "flex", justifyContent: "end", marginTop: 14 }}>
                <button onClick={onSubmit} disabled={!canSubmit || submitting}>
                  {submitting ? "Creando..." : "Crear venta"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Resultado */}
        <div style={{
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 14,
          padding: 16,
          background: "rgba(255,255,255,.03)"
        }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Resultado</div>

          {!result ? (
            <div style={{ opacity: 0.8 }}>
              Crea una venta para ver folio, total y respuesta del backend.
            </div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap" }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

          <button onClick={fetchBase} style={{ width: "100%", marginTop: 10 }}>
            Refrescar datos
          </button>
        </div>
      </div>
    </div>
  );
}
