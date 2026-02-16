import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios"; // ojo: estás en /pages/catalogs/

export default function PositionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [form, setForm] = useState({ name: "", description: "" });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const closeModal = () => {
    setModal({ open: false, mode: "create", item: null });
    setForm({ name: "", description: "" });
    setError("");
  };

  const openCreate = () => {
    setModal({ open: true, mode: "create", item: null });
    setForm({ name: "", description: "" });
    setError("");
  };

  const openEdit = (item) => {
    setModal({ open: true, mode: "edit", item });
    setForm({
      name: item?.name || "",
      description: item?.description || "",
    });
    setError("");
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/positions");
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(arr);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const canSubmit = useMemo(() => {
    if (modal.mode === "create") return form.name.trim().length > 0;
    // edit: en tu backend el PUT es parcial (ejemplo solo description), pero dejamos ambos
    return form.name.trim().length > 0 || form.description.trim().length > 0;
  }, [form, modal.mode]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      if (modal.mode === "create") {
        await api.post("/positions", {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        showToast("Cargo creado ✅");
      } else {
        const id = modal.item?._id || modal.item?.id;
        if (!id) throw new Error("ID no encontrado");

        // Tu ejemplo de PUT actualiza description, pero mandamos ambos por compatibilidad
        await api.put(`/positions/${id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
        });

        showToast("Cargo actualizado ✅");
      }

      closeModal();
      await fetchPositions();
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

  const onDelete = async (item) => {
    const id = item?._id || item?.id;
    if (!id) return;

    const ok = confirm(`¿Eliminar el cargo "${item?.name}"?`);
    if (!ok) return;

    try {
      await api.delete(`/positions/${id}`);
      showToast("Cargo eliminado ✅");
      await fetchPositions();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 409 ? "No se puede eliminar: está en uso." : "") ||
        e.message ||
        "Error";
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h2 style={{ margin: 0 }}>Cargos</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Administra los cargos (positions) del ERP.
          </div>
        </div>

        <button onClick={openCreate}>+ Nuevo cargo</button>
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
        ) : items.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.8 }}>No hay cargos aún.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Nombre</th>
                <th style={{ padding: 12 }}>Descripción</th>
                <th style={{ padding: 12, width: 180 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x?._id || x?.id} style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <td style={{ padding: 12, fontWeight: 800 }}>{x?.name}</td>
                  <td style={{ padding: 12, opacity: 0.85 }}>{x?.description || "—"}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(x)}>Editar</button>
                      <button onClick={() => onDelete(x)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal simple */}
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
              width: "min(520px, 100%)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.10)",
              background: "#0b1220",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{modal.mode === "create" ? "Nuevo cargo" : "Editar cargo"}</strong>
              <button onClick={closeModal}>X</button>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Nombre</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ej. Bibliotecario"
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Descripción</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ej. Encargado de la librería"
                />
              </label>

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
