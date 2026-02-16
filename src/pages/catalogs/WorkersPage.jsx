import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function WorkersPage() {
  const [workers, setWorkers] = useState([]);
  const [positions, setPositions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employeeNumber: "",
    fullName: "",
    positionId: "",
    email: "",
    phone: "",
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const closeModal = () => {
    setModal({ open: false, mode: "create", item: null });
    setForm({ employeeNumber: "", fullName: "", positionId: "", email: "", phone: "" });
    setError("");
  };

  const openCreate = () => {
    setModal({ open: true, mode: "create", item: null });
    setForm({ employeeNumber: "", fullName: "", positionId: "", email: "", phone: "" });
    setError("");
  };

  const getPositionIdFromWorker = (w) => {
    // Si viene populado: positionId = { _id, name, ... }
    if (typeof w?.positionId === "object" && w?.positionId?._id) return w.positionId._id;
    return w?.positionId || "";
  };

  const openEdit = (w) => {
    setModal({ open: true, mode: "edit", item: w });
    setForm({
      employeeNumber: w?.employeeNumber || "",
      fullName: w?.fullName || "",
      positionId: getPositionIdFromWorker(w),
      email: w?.email || "",
      phone: w?.phone || "",
    });
    setError("");
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError("");

      const [posRes, workersRes] = await Promise.all([
        api.get("/positions"),
        api.get("/workers"),
      ]);

      const posArr = Array.isArray(posRes.data) ? posRes.data : posRes.data?.items || posRes.data?.data || [];
      const workerArr = Array.isArray(workersRes.data) ? workersRes.data : workersRes.data?.items || workersRes.data?.data || [];

      setPositions(posArr);
      setWorkers(workerArr);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const canSubmit = useMemo(() => {
    // Requeridos para crear
    if (modal.mode === "create") {
      return (
        form.employeeNumber.trim() &&
        form.fullName.trim() &&
        form.positionId &&
        form.email.trim() &&
        form.phone.trim()
      );
    }
    // Edit: permitimos guardar si hay algo mínimo
    return form.fullName.trim() && form.positionId;
  }, [form, modal.mode]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (modal.mode === "create") {
        await api.post("/workers", {
          employeeNumber: form.employeeNumber.trim(),
          fullName: form.fullName.trim(),
          positionId: form.positionId,
          email: form.email.trim(),
          phone: form.phone.trim(),
        });
        showToast("Trabajador creado ✅");
      } else {
        const id = modal.item?._id || modal.item?.id;
        if (!id) throw new Error("ID no encontrado");

        await api.put(`/workers/${id}`, {
          employeeNumber: form.employeeNumber.trim(),
          fullName: form.fullName.trim(),
          positionId: form.positionId,
          email: form.email.trim(),
          phone: form.phone.trim(),
        });
        showToast("Trabajador actualizado ✅");
      }

      closeModal();
      await fetchAll();
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

  const onDelete = async (w) => {
    const id = w?._id || w?.id;
    if (!id) return;

    const ok = confirm(`¿Eliminar a "${w?.fullName}"?`);
    if (!ok) return;

    try {
      await api.delete(`/workers/${id}`);
      showToast("Trabajador eliminado ✅");
      await fetchAll();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    }
  };

  const positionLabel = (w) => {
    if (typeof w?.positionId === "object") return w.positionId?.name || "—";
    const found = positions.find((p) => (p?._id || p?.id) === w?.positionId);
    return found?.name || "—";
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h2 style={{ margin: 0 }}>Trabajadores</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            CRUD de trabajadores con cargo (position) relacionado.
          </div>
        </div>

        <button onClick={openCreate}>+ Nuevo trabajador</button>
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
        ) : workers.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.8 }}>No hay trabajadores aún.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Empleado</th>
                <th style={{ padding: 12 }}>Nombre</th>
                <th style={{ padding: 12 }}>Cargo</th>
                <th style={{ padding: 12 }}>Contacto</th>
                <th style={{ padding: 12, width: 190 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => (
                <tr key={w?._id || w?.id} style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <td style={{ padding: 12, fontWeight: 800 }}>{w?.employeeNumber || "—"}</td>
                  <td style={{ padding: 12 }}>{w?.fullName || "—"}</td>
                  <td style={{ padding: 12, opacity: 0.9 }}>{positionLabel(w)}</td>
                  <td style={{ padding: 12, opacity: 0.85 }}>
                    <div>{w?.email || "—"}</div>
                    <div style={{ opacity: 0.75 }}>{w?.phone || "—"}</div>
                  </td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(w)}>Editar</button>
                      <button onClick={() => onDelete(w)}>Eliminar</button>
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
              width: "min(560px, 100%)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.10)",
              background: "#0b1220",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>{modal.mode === "create" ? "Nuevo trabajador" : "Editar trabajador"}</strong>
              <button onClick={closeModal}>X</button>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Employee Number</span>
                  <input
                    value={form.employeeNumber}
                    onChange={(e) => setForm((f) => ({ ...f, employeeNumber: e.target.value }))}
                    placeholder="EMP-0001"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Cargo</span>
                  <select
                    value={form.positionId}
                    onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}
                  >
                    <option value="">Selecciona...</option>
                    {positions.map((p) => (
                      <option key={p?._id || p?.id} value={p?._id || p?.id}>
                        {p?.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label style={{ display: "grid", gap: 6 }}>
                <span style={{ fontSize: 12, opacity: 0.8 }}>Nombre completo</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Juan Pérez"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Email</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="juan@erp.com"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Teléfono</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="4770000000"
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
