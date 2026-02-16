import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";

export default function StudentsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    matricula: "",
    fullName: "",
    career: "",
    email: "",
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const closeModal = () => {
    setModal({ open: false, mode: "create", item: null });
    setForm({ matricula: "", fullName: "", career: "", email: "" });
    setError("");
  };

  const openCreate = () => {
    setModal({ open: true, mode: "create", item: null });
    setForm({ matricula: "", fullName: "", career: "", email: "" });
    setError("");
  };

  const openEdit = (s) => {
    setModal({ open: true, mode: "edit", item: s });
    setForm({
      matricula: s?.matricula || "",
      fullName: s?.fullName || "",
      career: s?.career || "",
      email: s?.email || "",
    });
    setError("");
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await api.get("/students");
      const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
      setItems(arr);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      const hay = [s?.matricula, s?.fullName, s?.career, s?.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const canSubmit = useMemo(() => {
    return (
      form.matricula.trim() &&
      form.fullName.trim() &&
      form.career.trim() &&
      form.email.trim()
    );
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        matricula: form.matricula.trim(),
        fullName: form.fullName.trim(),
        career: form.career.trim(),
        email: form.email.trim(),
      };

      if (modal.mode === "create") {
        await api.post("/students", payload);
        showToast("Alumno creado ✅");
      } else {
        const id = modal.item?._id || modal.item?.id;
        if (!id) throw new Error("ID no encontrado");
        await api.put(`/students/${id}`, payload); // si no existe PUT, dará 404
        showToast("Alumno actualizado ✅");
      }

      closeModal();
      await fetchStudents();
    } catch (e) {
      const status = e?.response?.status;
      // si tu backend manda 500 por unique, aquí lo “traducimos” bonito
      const rawMsg = e?.response?.data?.message || "";
      const looksLikeDuplicate =
        status === 409 ||
        (status === 500 && /duplicate|E11000|unique|matricula/i.test(rawMsg));

      const msg =
        (looksLikeDuplicate ? "Matrícula ya existe." : "") ||
        e?.response?.data?.message ||
        e.message ||
        "Error";

      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (s) => {
    const id = s?._id || s?.id;
    if (!id) return;

    const ok = confirm(`¿Eliminar al alumno "${s?.fullName}" (${s?.matricula})?`);
    if (!ok) return;

    try {
      await api.delete(`/students/${id}`); // si no existe DELETE, dará 404
      showToast("Alumno eliminado ✅");
      await fetchStudents();
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        (status === 404 ? "Tu backend aún no tiene DELETE /students/:id." : "") ||
        e.message ||
        "Error";
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0 }}>Alumnos</h2>
          <div style={{ opacity: 0.75, marginTop: 6 }}>
            CRUD de alumnos (matrícula única).
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por matrícula, nombre, carrera..."
            style={{ width: 340, maxWidth: "55vw" }}
          />
          <button onClick={openCreate}>+ Nuevo alumno</button>
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
            {items.length === 0 ? "No hay alumnos aún." : "Sin resultados."}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", opacity: 0.8 }}>
                <th style={{ padding: 12 }}>Matrícula</th>
                <th style={{ padding: 12 }}>Nombre</th>
                <th style={{ padding: 12 }}>Carrera</th>
                <th style={{ padding: 12 }}>Email</th>
                <th style={{ padding: 12, width: 190 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s?._id || s?.id || s?.matricula} style={{ borderTop: "1px solid rgba(255,255,255,.06)" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{s?.matricula || "—"}</td>
                  <td style={{ padding: 12 }}>{s?.fullName || "—"}</td>
                  <td style={{ padding: 12, opacity: 0.9 }}>{s?.career || "—"}</td>
                  <td style={{ padding: 12, opacity: 0.85 }}>{s?.email || "—"}</td>
                  <td style={{ padding: 12 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(s)}>Editar</button>
                      <button onClick={() => onDelete(s)}>Eliminar</button>
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
              <strong>{modal.mode === "create" ? "Nuevo alumno" : "Editar alumno"}</strong>
              <button onClick={closeModal}>X</button>
            </div>

            <form onSubmit={onSubmit} style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Matrícula</span>
                  <input
                    value={form.matricula}
                    onChange={(e) => setForm((f) => ({ ...f, matricula: e.target.value }))}
                    placeholder="80065"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Nombre completo</span>
                  <input
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Ángel Onesto"
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Carrera</span>
                  <input
                    value={form.career}
                    onChange={(e) => setForm((f) => ({ ...f, career: e.target.value }))}
                    placeholder="Ingeniería de Software"
                  />
                </label>

                <label style={{ display: "grid", gap: 6 }}>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>Email</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="angel@uni.mx"
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
