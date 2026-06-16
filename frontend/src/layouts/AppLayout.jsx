import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import { Sidebar, MobileDrawer, GridIcon, BuildingIcon, QrIcon, ChartIcon } from "./Sidebar";
import Footer from "../components/Footer";
import { useLocation, NavLink } from "react-router-dom";

function HamburgerIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

const MOBILE_NAV = [
  { to: "/admin", label: "Dashboard", Icon: GridIcon, end: true },
  { to: "/admin/buildings", label: "Buildings", Icon: BuildingIcon },
  { to: "/admin/blocks", label: "Blocks", Icon: QrIcon },
  { to: "/admin/reports", label: "Reports", Icon: ChartIcon },
];



export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="app-main flex flex-col min-h-screen">
        <Header />
        <main className="app-content pb-20 lg:pb-6 fade-in flex-1">
          <Outlet />
        </main>
      </div>

      <nav className="app-mobile-nav">
        {MOBILE_NAV.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? "mobile-nav-item--active" : "mobile-nav-item--inactive"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-5 h-5" style={{ color: isActive ? "#2563EB" : "#94A3B8" }} />
                <span className="mobile-nav-label">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
