import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

export default function AppLayout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>ERP Universidad</strong>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "right", fontSize: 12, opacity: 0.85 }}>
              <div>{user?.name || "Admin"}</div>
              <div style={{ opacity: 0.7 }}>{user?.rol || "ADMIN"}</div>
            </div>
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>

        <nav style={{ marginTop: 12, display: "flex", gap: 12 }}>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/admin/users">Usuarios</NavLink>
          <NavLink to="/catalogs/positions">Puestos</NavLink>
          <NavLink to="/attendance/logs">Asistencia</NavLink>
          <NavLink to="/health">Health</NavLink>
        </nav>
      </header>

      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
