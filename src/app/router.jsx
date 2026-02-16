import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import AppLayout from "../components/layout/AppShell";
import ProtectedRoute from "../auth/ProtectedRoute";

// Pages
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import HealthPage from "../pages/HealthPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import CatalogPositionsPage from "../pages/catalogs/CatalogPositionsPage";
import AttendanceLogsPage from "../pages/attendance/AttendanceLogsPage";
import NotFoundPage from "../pages/NotFoundPage";
import WorkersPage from "../pages/catalogs/WorkersPage";
import BooksPage from "../pages/library/BooksPage";
import StudentsPage from "../pages/library/StudentsPage";
import SalesPage from "../pages/sales/SalesPage";
import SalesHistoryPage from "../pages/sales/SalesHistoryPage";





export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },

  { path: "/login", element: <LoginPage /> },

  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/health", element: <HealthPage /> },

      { path: "/admin/users", element: <AdminUsersPage /> },
      { path: "/catalogs/positions", element: <CatalogPositionsPage /> },
      { path: "/catalogs/workers", element: <WorkersPage /> },
      { path: "/library/books", element: <BooksPage /> },
      { path: "/library/students", element: <StudentsPage /> },
      { path: "/sales", element: <SalesPage /> },
      { path: "/sales/history", element: <SalesHistoryPage /> },
      { path: "/attendance/logs", element: <AttendanceLogsPage /> },
    ],
  },

  { path: "*", element: <NotFoundPage /> },
]);
