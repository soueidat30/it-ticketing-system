import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./ManagerLayout.css";

const NAV_ITEMS = [
  {
    group: "Management",
    items: [
      { to: "/manager/dashboard",    icon: "ti-layout-dashboard", label: "Dashboard"   },
      { to: "/manager/team-tickets", icon: "ti-ticket",           label: "Team Tickets"},
      { to: "/manager/report",       icon: "ti-chart-bar",        label: "Reports"     },
      { to: "/manager/analytics",    icon: "ti-chart-pie",        label: "Analytics"   },
    ]
  },
  {
    group: "Communication",
    items: [
      
      { to: "/manager/notifications", icon: "ti-bell",         label: "Notifications" },
    ]
  },
  {
    group: "Account",
    items: [
      { to: "/manager/profile",  icon: "ti-user",     label: "Profile"  },

    ]
  }
];

export default function ManagerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ── dark mode ────────────────────────────────────────────────────────────────
  const [dark, setDark] = useState(() => localStorage.getItem("mgr-theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-mgr-theme", dark ? "dark" : "light");
    localStorage.setItem("mgr-theme", dark ? "dark" : "light");
  }, [dark]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const currentItem = NAV_ITEMS.flatMap(g => g.items)
    .find(i => location.pathname.startsWith(i.to));
  const pageTitle = currentItem?.label ?? "Manager";

  return (
    <div className={`el ${sidebarOpen ? "el--open" : "el--collapsed"} ${dark ? "el--dark" : ""}`}>

      {/* ── Sidebar ── */}
      <aside className="el__sidebar">

        <div className="el__logo">
          <div className="el__logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#d4f265"/>
              <path d="M4 11l4 4 8-8" stroke="#03363d" strokeWidth="2"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div className="el__logo-text">
              <span className="el__logo-name">TICKORA</span>
              <span className="el__logo-sub">Manager Portal</span>
            </div>
          )}
        </div>

        <nav className="el__nav">
          {NAV_ITEMS.map(group => (
            <div key={group.group} className="el__nav-group">
              {sidebarOpen && <span className="el__nav-group-label">{group.group}</span>}
              {group.items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `el__nav-link ${isActive ? "el__nav-link--active" : ""}`
                  }
                >
                  <i className={`ti ${item.icon}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="el__user-card">
          <div className="el__user-avatar">
            {(user.full_name?.[0] ?? "M").toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="el__user-info">
              <span className="el__user-name">{user.full_name ?? "Manager"}</span>
              <span className="el__user-role">Manager</span>
            </div>
          )}
          {sidebarOpen && (
            <button className="el__logout-btn" onClick={handleLogout} title="Logout">
              <i className="ti ti-logout" />
            </button>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="el__main">

        <header className="el__topbar">
          <button
            className="el__toggle-btn"
            onClick={() => setSidebarOpen(v => !v)}
            title="Toggle sidebar"
          >
            <i className={`ti ${sidebarOpen ? "ti-layout-sidebar-left-collapse" : "ti-layout-sidebar-left-expand"}`} />
          </button>

          <div className="el__breadcrumb">
            <span>Manager</span>
            <i className="ti ti-chevron-right" />
            <span>{pageTitle}</span>
          </div>

          {/* ── Dark mode toggle ── */}
          <button
            className="el__dm-btn"
            onClick={() => setDark(v => !v)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="el__dm-track">
              <span className="el__dm-thumb">
                <i className={`ti ${dark ? "ti-moon" : "ti-sun"}`} />
              </span>
            </span>
            {sidebarOpen && (
              <span className="el__dm-label">{dark ? "Dark" : "Light"}</span>
            )}
          </button>
        </header>

        <main className="el__content">
          <Outlet />
        </main>

      </div>
    </div>
  );
}