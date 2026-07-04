import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { RoleLanguageProvider } from "../contexts/RoleScopedLanguageContext";
import "./AdminLayout.css";
import { useTheme } from "../context/ThemeContext";
import "../context/theme.css";


const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { to: "/admin/dashboard", icon: "ti-layout-dashboard", label: "Dashboard" },
      { to: "/admin/tickets", icon: "ti-ticket", label: "All Tickets" },
      { to: "/admin/reports", icon: "ti-chart-bar", label: "Reports" },
      {
        to: "/admin/activity-logs",
        icon: "ti-history",
        label: "Activity Logs",
      },
    ],
  },
  {
    group: "User Admin",
    items: [
      { to: "/admin/users", icon: "ti-users", label: "User Management" },
      { to: "/admin/departments", icon: "ti-building", label: "Departments" },
    ],
  },
  {
    group: "Ticket Config",
    items: [
      { to: "/admin/categories", icon: "ti-tag", label: "Categories" },
      {
        to: "/admin/priorities",
        icon: "ti-alert-triangle",
        label: "Priorities",
      },
      { to: "/admin/statuses", icon: "ti-circle-check", label: "Statuses" },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/admin/notifications", icon: "ti-bell", label: "Notifications" },
    ],
  },
];

export default function AdminLayout() {
  return (
    <RoleLanguageProvider role="admin">
      <AdminLayoutInner />
    </RoleLanguageProvider>
  );
}

const AdminLayoutInner = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifCount] = useState(3);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("language");
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    navigate("/");
  };

  const currentItem = NAV_ITEMS.flatMap((g) => g.items).find((i) =>
    location.pathname.startsWith(i.to)
  );
  const pageTitle = currentItem?.label ?? "Admin";

  return (
    <div className={`al ${sidebarOpen ? "al--open" : "al--collapsed"}`}>
      {/* ── Sidebar ── */}
      <aside className="al__sidebar">
        <div className="al__logo">
          <div className="al__logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#d4f265" />
              <path
                d="M4 11l4 4 8-8"
                stroke="#03363d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="al__logo-text">
              <span className="al__logo-name">Tickora</span>
              <span className="al__logo-sub">Admin Panel</span>
            </div>
          )}
        </div>

        <nav className="al__nav">
          {NAV_ITEMS.map((group) => (
            <div key={group.group} className="al__nav-group">
              {sidebarOpen && (
                <span className="al__nav-group-label">{group.group}</span>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `al__nav-link ${isActive ? "al__nav-link--active" : ""}`
                  }
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" />
                  {sidebarOpen && <span>{item.label}</span>}
                  {item.to === "/admin/notifications" && notifCount > 0 && (
                    <span className="al__badge">{notifCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="al__user-card">
          <div className="al__user-avatar">
            {(user.full_name?.[0] ?? "A").toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="al__user-info">
              <span className="al__user-name">{user.full_name ?? "Admin"}</span>
              <span className="al__user-role">Administrator</span>
            </div>
          )}
          {sidebarOpen && (
            <button
              className="al__logout-btn"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
            >
              <i className="ti ti-logout" aria-hidden="true" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="al__main">
        <header className="al__topbar">
          <div className="al__topbar-left">
            <button
              className="al__toggle-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle sidebar"
            >
              <i
                className={`ti ${
                  sidebarOpen
                    ? "ti-layout-sidebar-left-collapse"
                    : "ti-layout-sidebar-left-expand"
                }`}
                aria-hidden="true"
              />
            </button>

            <div className="al__breadcrumb">
              <span className="al__breadcrumb-root">Admin</span>
              <i className="ti ti-chevron-right" aria-hidden="true" />
              <span className="al__breadcrumb-current">{pageTitle}</span>
            </div>
          </div>

          <div className="al__topbar-right">
            <div className="al__search">
              <i className="ti ti-search" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search..."
                className="al__search-input"
                aria-label="Search"
              />
            </div>

            <button
              className="al__theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              title="Toggle theme"
              type="button"
            >
              {theme === "dark" ? "🌙" : "☀️"}


            </button>

            <NavLink
              to="/admin/notifications"
              className="al__topbar-icon"
              aria-label="Notifications"
            >
              <i className="ti ti-bell" aria-hidden="true" />
              {notifCount > 0 && (
                <span className="al__topbar-badge">{notifCount}</span>
              )}
            </NavLink>

            <div className="al__topbar-profile">
              <div className="al__topbar-avatar">
                {(user.full_name?.[0] ?? "A").toUpperCase()}
              </div>
              <div className="al__topbar-user">
                <span className="al__topbar-name">{user.full_name ?? "Admin"}</span>
                <span className="al__topbar-dept">{user.department ?? "IT"}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="al__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

