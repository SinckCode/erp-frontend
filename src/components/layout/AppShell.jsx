import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "./AppShell.scss";

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="app__main">
        <Topbar onToggleMenu={() => setMobileOpen(true)} />

        <main className="app__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

