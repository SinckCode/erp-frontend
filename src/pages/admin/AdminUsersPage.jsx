import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function AdminUsersPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "ADMIN",
    active: true,
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const normUser = (u) => ({
    ...u,
    id: u?.id || u?._id, // 👈 normaliza
    role: u?.role?.name || u?.role,
    active: Boolean(u?.active ?? true),
  });

  const fetchUsers = async () => {
    try {
      setError("");
      setLoading(true);
      const { data } = await api.get("/admin/users");

      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(arr.map(normUser));
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreate = () => {
    setModal({ open: true, mode: "create", item: null });
    setForm({ name: "", email: "", password: "", role: "ADMIN", active: true });
    setError("");
  };

  const openEdit = (u) => {
    const user = normUser(u);
    setModal({ open: true, mode: "edit", item: user });
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "ADMIN",
      active: Boolean(user?.active),
    });
    setError("");
  };

  const closeModal = () => {
    setModal({ open: false, mode: "create", item: null });
    setError("");
  };

  const canSubmit = useMemo(() => {
    // create: requiere password
    if (modal.mode === "create") return form.name && form.email && form.password;
    // edit: password opcional
    return form.name && form.email;
  }, [form, modal.mode]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        active: Boolean(form.active),
      };

      if (modal.mode === "create") {
        payload.password = form.password;
        await api.post("/admin/users", payload);
        showToast("Usuario creado ✅");
      } else {
        const id = modal.item?.id;
        if (!id) throw new Error("ID no encontrado");

        if (form.password) payload.password = form.password;

        await api.put(`/admin/users/${id}`, payload);
        showToast("Usuario actualizado ✅");
      }

      closeModal();
      fetchUsers();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 409 ? "Email ya existe." : "") ||
        e.message ||
        "Error";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (u) => {
    const user = normUser(u);
    const id = user?.id;
    if (!id) return;

    const ok = confirm(`¿Eliminar usuario "${user?.email}"?`);
    if (!ok) return;

    try {
      await api.delete(`/admin/users/${id}`);
      showToast("Usuario eliminado ✅");
      fetchUsers();
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end" }}>
        <div>
          <h2 style={{ margin: 0 }}>Usuarios</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            Gestión de usuarios del sistema.
          </div>
        </div>

        <button onClick={openCreate}>+ Nuevo usuario</button>
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
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Nombre</th>
                <th style={{ padding: 12 }}>Email</th>
                <th style={{ padding: 12 }}>Rol</th>
                <th style={{ padding: 12 }}>Activo</th>
                <th style={{ padding: 12 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr
                  key={u?.id}
                  style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}
                >
                  <td style={{ padding: 12 }}>{u?.name}</td>
                  <td style={{ padding: 12 }}>{u?.email}</td>
                  <td style={{ padding: 12 }}>{u?.role}</td>
                  <td style={{ padding: 12 }}>{u?.active ? "Sí" : "No"}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(u)}>Editar</button>
                      <button onClick={() => onDelete(u)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td style={{ padding: 12, opacity: 0.75 }} colSpan={5}>
                    No hay usuarios.
                  </td>
                </tr>
              )}
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
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(520px, 96vw)",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,.10)",
              background: "#0b1220",
              padding: 16,
            }}
          >
            <strong>{modal.mode === "create" ? "Nuevo usuario" : "Editar usuario"}</strong>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <input
                placeholder="Nombre"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />

              <input
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <input
                placeholder={modal.mode === "edit" ? "Password (opcional)" : "Password"}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="RH">RH</option>
                <option value="VENTAS">VENTAS</option>
                <option value="GUARDIA">GUARDIA</option>
              </select>

              <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                />
                <span>Activo</span>
              </label>

              {error && <div style={{ color: "tomato" }}>{error}</div>}

              <div style={{ display: "flex", justifyContent: "end", gap: 10 }}>
                <button type="button" onClick={closeModal}>
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
