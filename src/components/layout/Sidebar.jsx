import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import "./Sidebar.scss";

function Item({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        isActive ? "nav__item nav__item--active" : "nav__item"
      }
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth();

  // soporta: "ADMIN" | {name:"ADMIN"} | roleName
  const role = user?.role?.name || user?.role || user?.roleName || "";

  const can = (roles) => roles.includes(role);

  return (
    <>
      {/* overlay mobile */}
      <div
        className={
          mobileOpen ? "sidebarOverlay sidebarOverlay--open" : "sidebarOverlay"
        }
        onClick={onClose}
      />

      <aside className={mobileOpen ? "sidebar sidebar--open" : "sidebar"}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <div className="sidebar__logo">ERP</div>
            <div>
              <div className="sidebar__title">Universidad</div>
              <div className="sidebar__subtitle">{role || "—"}</div>
            </div>
          </div>

          <button
            className="sidebar__close"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        <nav className="nav">
          {/* GENERAL */}
          <div className="nav__section">
            <div className="nav__label">General</div>
            <Item to="/dashboard" label="Dashboard" onClick={onClose} />
            <Item to="/health" label="Health" onClick={onClose} />
          </div>

          {/* CATÁLOGOS */}
          {can(["ADMIN", "RH"]) && (
            <div className="nav__section">
              <div className="nav__label">Catálogos</div>
              <Item
                to="/catalogs/positions"
                label="Cargos"
                onClick={onClose}
              />
              <Item
                to="/catalogs/workers"
                label="Trabajadores"
                onClick={onClose}
              />
            </div>
          )}

          {/* LIBRERÍA */}
          {can(["ADMIN", "RH", "VENTAS"]) && (
            <div className="nav__section">
              <div className="nav__label">Librería</div>
              <Item
                to="/library/students"
                label="Alumnos"
                onClick={onClose}
              />
              <Item to="/library/books" label="Libros" onClick={onClose} />
            </div>
          )}

          {/* ASISTENCIA */}
          {can(["ADMIN", "GUARDIA"]) && (
            <div className="nav__section">
              <div className="nav__label">Asistencia</div>
              <Item
                to="/attendance/logs"
                label="Entradas / Salidas"
                onClick={onClose}
              />
            </div>
          )}

          {/* VENTAS */}
          {can(["ADMIN", "VENTAS"]) && (
            <div className="nav__section">
              <div className="nav__label">Ventas</div>
              <Item to="/sales" label="Nueva venta" onClick={onClose} />
              <Item
                to="/sales/history"
                label="Historial"
                onClick={onClose}
              />
            </div>
          )}

          {/* ADMIN */}
          {can(["ADMIN"]) && (
            <div className="nav__section">
              <div className="nav__label">Admin</div>
              <Item to="/admin/users" label="Usuarios" onClick={onClose} />
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
