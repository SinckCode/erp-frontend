import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function BooksPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    code: "",
    title: "",
    author: "",
    category: "",
    price: "",
    stock: "",
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const closeModal = () => {
    setModal({ open: false, mode: "create", item: null });
    setForm({ code: "", title: "", author: "", category: "", price: "", stock: "" });
    setError("");
  };

  const openCreate = () => {
    setModal({ open: true, mode: "create", item: null });
    setForm({ code: "", title: "", author: "", category: "", price: "", stock: "" });
    setError("");
  };

  const openEdit = (b) => {
    setModal({ open: true, mode: "edit", item: b });
    setForm({
      code: b?.code || "",
      title: b?.title || "",
      author: b?.author || "",
      category: b?.category || "",
      price: String(b?.price ?? ""),
      stock: String(b?.stock ?? ""),
    });
    setError("");
  };

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/books");
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(arr);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((b) => {
      const hay = [
        b?.code,
        b?.title,
        b?.author,
        b?.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const canSubmit = useMemo(() => {
    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    if (modal.mode === "create") {
      return (
        form.code.trim() &&
        form.title.trim() &&
        form.author.trim() &&
        form.category.trim() &&
        Number.isFinite(priceNum) &&
        priceNum >= 0 &&
        Number.isFinite(stockNum) &&
        stockNum >= 0
      );
    }
    // edit: mismas reglas
    return (
      form.code.trim() &&
      form.title.trim() &&
      form.author.trim() &&
      form.category.trim() &&
      Number.isFinite(priceNum) &&
      priceNum >= 0 &&
      Number.isFinite(stockNum) &&
      stockNum >= 0
    );
  }, [form, modal.mode]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        code: form.code.trim(),
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (modal.mode === "create") {
        await api.post("/books", payload);
        showToast("Libro creado ✅");
      } else {
        const id = modal.item?._id || modal.item?.id;
        if (!id) throw new Error("ID no encontrado");
        await api.put(`/books/${id}`, payload); // si tu backend no tiene PUT, dará 404
        showToast("Libro actualizado ✅");
      }

      closeModal();
      await fetchBooks();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 409 ? "Conflicto: verifica datos." : "") ||
        e.message ||
        "Error";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (b) => {
    const id = b?._id || b?.id;
    if (!id) return;

    const ok = confirm(`¿Eliminar "${b?.title}"?`);
    if (!ok) return;

    try {
      await api.delete(`/books/${id}`); // si tu backend no tiene DELETE, dará 404
      showToast("Libro eliminado ✅");
      await fetchBooks();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 409 ? "No se puede eliminar: está en uso." : "") ||
        (status === 404 ? "Tu backend aún no tiene DELETE /books/:id." : "") ||
        e.message ||
        "Error";
      setError(msg);
    }
  };

  const money = (n) => {
    const num = Number(n);
    if (!Number.isFinite(num)) return "—";
    return num.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
  };

  const StockBadge = ({ stock }) => {
    const s = Number(stock ?? 0);
    const bg =
      s <= 0 ? "rgba(255,0,0,.14)" :
      s <= 3 ? "rgba(255,170,0,.16)" :
      "rgba(0,255,100,.12)";
    const br =
      s <= 0 ? "rgba(255,0,0,.25)" :
      s <= 3 ? "rgba(255,170,0,.28)" :
      "rgba(0,255,100,.22)";

    return (
      <span style={{
        padding: "4px 10px",
        borderRadius: 999,
        border: `1px solid ${br}`,
        background: bg,
        fontSize: 12,
        fontWeight: 800
      }}>
        Stock: {s}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Libros</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Catálogo de libros (precio, categoría y stock).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, autor, código..."
            style={{ width: 320, maxWidth: "55vw" }}
          />
          <button onClick={openCreate}>+ Nuevo libro</button>
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
        border: "1px solid rgba(255,255,255,.08)",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(255,255,255,.03)"
      }}>
        {loading ? (
          <div style={{ padding: 16 }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.8 }}>
            {items.length === 0 ? "No hay libros aún." : "Sin resultados."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Código</th>
                <th style={{ padding: 12 }}>Título</th>
                <th style={{ padding: 12 }}>Autor</th>
                <th style={{ padding: 12 }}>Categoría</th>
                <th style={{ padding: 12 }}>Precio</th>
                <th style={{ padding: 12 }}>Stock</th>
                <th style={{ padding: 12, width: 190 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b?._id || b?.id || b?.code} style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{b?.code || "—"}</td>
                  <td style={{ padding: 12 }}>{b?.title || "—"}</td>
                  <td style={{ padding: 12, opacity: 0.9 }}>{b?.author || "—"}</td>
                  <td style={{ padding: 12, opacity: 0.85 }}>{b?.category || "—"}</td>
                  <td style={{ padding: 12 }}>{money(b?.price)}</td>
                  <td style={{ padding: 12 }}>
                    <StockBadge stock={b?.stock} />
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(b)}>Editar</button>
                      <button onClick={() => onDelete(b)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(620px, 100%)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.10)",
              background: "#0b1220",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{modal.mode === "create" ? "Nuevo libro" : "Editar libro"}</strong>
              <button onClick={closeModal}>X</button>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Código</span>
                  <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="ISBN-001" />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Título</span>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Clean Code" />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Autor</span>
                  <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="Robert C. Martin" />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Categoría</span>
                  <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Software" />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Precio</span>
                  <input
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    placeholder="450"
                    inputMode="decimal"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Stock</span>
                  <input
                    value={form.stock}
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    placeholder="10"
                    inputMode="numeric"
                  />
                </label>
              </div>

              {error && <div style={{ color: "tomato", fontSize: 13 }}>{error}</div>}

              <div style={{ display: "flex", gap: 10, justifyContent: "end", marginTop: 6 }}>
                <button type="button" onClick={closeModal} disabled={saving}>
                  Cancelar
                </button>
                <button type="submit" disabled={!canSubmit || saving}>
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
