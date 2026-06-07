
import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./EmployeeLayout.css";

const NAV_ITEMS = [
  {
    group: "My Workspace",
    items: [
      { to: "/employee/dashboard",     icon: "ti-layout-dashboard", label: "Dashboard"     },
      { to: "/employee/my-tickets",    icon: "ti-ticket",           label: "My Tickets"    },
      { to: "/employee/create-ticket", icon: "ti-plus",             label: "Create Ticket" },
    ]
  },
  {
    group: "Resources",
    items: [
      { to: "/employee/knowledge-base", icon: "ti-book",       label: "Knowledge Base" },
      { to: "/employee/announcements",  icon: "ti-speakerphone", label: "Announcements" },
    ]
  },
  {
    group: "Account",
    items: [
      { to: "/employee/profile",       icon: "ti-user",        label: "Profile"       },
      { to: "/employee/notifications", icon: "ti-bell",        label: "Notifications" },
      { to: "/employee/settings",      icon: "ti-settings",    label: "Settings"      },
    ]
  }
];

const EmployeeLayout = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifCount] = useState(2);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const currentItem = NAV_ITEMS.flatMap(g => g.items)
    .find(i => location.pathname.startsWith(i.to));
  const pageTitle = currentItem?.label ?? "Employee";

  return (
    <div className={`el ${sidebarOpen ? "el--open" : "el--collapsed"}`}>

      {/* ── Sidebar ── */}
      <aside className="el__sidebar">

        {/* Logo */}
        <div className="el__logo">
          <div className="el__logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect width="22" height="22" rx="6" fill="#d4f265"/>
              <path d="M4 11l4 4 8-8" stroke="#03363d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          {sidebarOpen && (
            <div className="el__logo-text">
              <span className="el__logo-name">TICKORA</span>
              <span className="el__logo-sub">Employee Portal</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="el__nav">
          {NAV_ITEMS.map((group) => (
            <div key={group.group} className="el__nav-group">
              {sidebarOpen && (
                <span className="el__nav-group-label">{group.group}</span>
              )}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `el__nav-link ${isActive ? "el__nav-link--active" : ""}`
                  }
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <i className={`ti ${item.icon}`} aria-hidden="true" />
                  {sidebarOpen && <span>{item.label}</span>}
                  {item.to === "/employee/notifications" && notifCount > 0 && (
                    <span className="el__badge">{notifCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Help box */}
        {sidebarOpen && (
          <div className="el__help-box">
            <i className="ti ti-headset el__help-icon" />
            <div className="el__help-text">
              <span className="el__help-title">Need immediate help?</span>
              <span className="el__help-sub">Contact IT Support</span>
            </div>
            <button className="el__help-btn">Live Chat</button>
          </div>
        )}

        {/* User card */}
        <div className="el__user-card">
          <div className="el__user-avatar">
            {(user.full_name?.[0] ?? "E").toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="el__user-info">
              <span className="el__user-name">{user.full_name ?? "Employee"}</span>
              <span className="el__user-role">Employee</span>
            </div>
          )}
          {sidebarOpen && (
            <button
              className="el__logout-btn"
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
      <div className="el__main">

        {/* Topbar */}
        <header className="el__topbar">
          <div className="el__topbar-left">
            <button
              className="el__toggle-btn"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Toggle sidebar"
            >
              <i className={`ti ${sidebarOpen ? "ti-layout-sidebar-left-collapse" : "ti-layout-sidebar-left-expand"}`} />
            </button>
            <div className="el__breadcrumb">
              <span className="el__breadcrumb-root">Employee</span>
              <i className="ti ti-chevron-right" />
              <span className="el__breadcrumb-current">{pageTitle}</span>
            </div>
          </div>

          <div className="el__topbar-right">
            <div className="el__search">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="el__search-input"
                aria-label="Search"
              />
            </div>

            <NavLink to="/employee/notifications" className="el__topbar-icon" aria-label="Notifications">
              <i className="ti ti-bell" />
              {notifCount > 0 && <span className="el__topbar-badge">{notifCount}</span>}
            </NavLink>

            <div className="el__topbar-profile">
              <div className="el__topbar-avatar">
                {(user.full_name?.[0] ?? "E").toUpperCase()}
              </div>
              <div className="el__topbar-user">
                <span className="el__topbar-name">{user.full_name ?? "Employee"}</span>
                <span className="el__topbar-dept">{user.department ?? "Staff"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="el__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default EmployeeLayout;