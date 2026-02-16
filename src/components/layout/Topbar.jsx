import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import "./Topbar.scss";

const routeLabels = {
  "/dashboard": "Dashboard",
  "/health": "Health",
  "/catalogs/positions": "Cargos",
  "/catalogs/workers": "Trabajadores",
  "/library/books": "Libros",
  "/library/students": "Alumnos",
  "/sales": "Nueva venta",
  "/attendance/logs": "Entradas / Salidas",
  "/admin/users": "Usuarios",
};

export default function Topbar({ onToggleMenu }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = user?.role?.name || user?.role || user?.roleName || "";
  const displayName =
    user?.name ||
    user?.fullName ||
    user?.email ||
    "Usuario";

  const currentLabel = useMemo(() => {
    return routeLabels[location.pathname] || "ERP Universidad";
  }, [location.pathname]);

  const handleLogout = () => {
    const ok = confirm("¿Seguro que quieres cerrar sesión?");
    if (!ok) return;
    logout();
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className="topbar__burger"
          onClick={onToggleMenu}
          aria-label="Abrir menú"
        >
          ☰
        </button>

        <div className="topbar__title">
          {currentLabel}
        </div>
      </div>

      <div className="topbar__right">
        <div className="topbar__user">
          <div className="topbar__name">
            {displayName}
          </div>
          <div className="topbar__role">
            {role}
          </div>
        </div>

        <button
          className="topbar__logout"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
