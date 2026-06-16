import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_SECTIONS = [
  {
    label: "Overview",
    links: [
      { to: "/admin", label: "Dashboard", icon: GridIcon, end: true },
    ],
  },
  {
    label: "Management",
    links: [
      { to: "/admin/buildings", label: "Buildings", icon: BuildingIcon },
      { to: "/admin/blocks", label: "Blocks & QR", icon: QrIcon },
      { to: "/admin/reports", label: "Reports", icon: ChartIcon },
    ],
  },
  {
    label: "System",
    links: [
      { to: "/admin/users", label: "Users", icon: UsersIcon },
      { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function BuildingIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" />
      <path d="M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4" />
      <path d="M9 7h1m4 0h1M9 11h1m4 0h1" />
    </svg>
  );
}
function QrIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <path d="M13 13h2v2h-2zm4 0h2v2h-2zm-4 4h2v2h-2zm4 0h2v2h-2z" />
    </svg>
  );
}
function ChartIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 5-5" />
    </svg>
  );
}
function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function SettingsIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function SidebarContent({ onNavClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
        </div>
        <div>
          <p className="sidebar-brand-name">ParkSys</p>
          <p className="sidebar-brand-sub">Management System</p>
        </div>
      </div>

      <div className="flex-1 py-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="sidebar-section">
            <p className="sidebar-section-label">{section.label}</p>
            {section.links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={onNavClick}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link--active" : "sidebar-link--inactive"}`
                }
              >
                <link.icon className="sidebar-link-icon" />
                {link.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user mb-1">
          <div className="sidebar-avatar">{initials}</div>
          <div className="min-w-0">
            <p className="sidebar-user-name">{user?.name || "Admin"}</p>
            <p className="sidebar-user-role capitalize">{user?.role || "administrator"}</p>
          </div>
        </div>
        <button
          id="sidebar-logout-btn"
          className="sidebar-link sidebar-link--inactive w-full"
          onClick={handleLogout}
        >
          <LogoutIcon className="sidebar-link-icon" />
          Sign Out
        </button>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <SidebarContent />
    </aside>
  );
}

export function MobileDrawer({ open, onClose }) {
  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} aria-hidden="true" />}
      <div className={`drawer ${open ? "drawer--open" : "drawer--closed"}`} aria-modal={open} role="dialog">
        <div className="app-sidebar--mobile">
          <SidebarContent onNavClick={onClose} />
        </div>
      </div>
    </>
  );
}

export { GridIcon, BuildingIcon, QrIcon, ChartIcon, UsersIcon, SettingsIcon };
