import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { RoleLanguageProvider } from "../contexts/RoleScopedLanguageContext";
import "./ManagerLayout.css";

const Icon = ({ d, ...p }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...p}
  >
    <path d={d} />
  </svg>
);

const Icons = {
  alertCircle: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 8v4 M12 16h.01",
  x: "M18 6L6 18 M6 6l12 12",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
};

/* ── Logout confirmation modal ────────────────────────────────────── */
function LogoutModal({ open, onConfirm, onCancel }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement;
    modalRef.current?.focus();
    return () => prev?.focus?.();
  }, [open]);

  if (!open) return null;

  return (
    <div className="el-logout-overlay" onClick={onCancel} role="presentation">
      <div
        className="el-logout-modal"
        ref={modalRef}
        tabIndex={-1}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="el-logout-title"
        aria-describedby="el-logout-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="el-logout-modal__close"
          onClick={onCancel}
          aria-label="Close"
        >
          <Icon d={Icons.x} />
        </button>

        <div className="el-logout-modal__icon">
          <Icon d={Icons.alertCircle} />
        </div>

        <h3 id="el-logout-title" className="el-logout-modal__title">
          Are you sure you want to leave?
        </h3>

        <p id="el-logout-desc" className="el-logout-modal__desc">
          You will be signed out of the Manager Portal. Any unsaved changes may be lost.
        </p>

        <div className="el-logout-modal__actions">
          <button
            type="button"
            className="el-logout-modal__btn el-logout-modal__btn--ghost"
            onClick={onCancel}
          >
            Stay Logged In
          </button>
          <button
            type="button"
            className="el-logout-modal__btn el-logout-modal__btn--danger"
            onClick={onConfirm}
          >
            <Icon d={Icons.logout} />
            Yes, Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

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
  return (
    <RoleLanguageProvider role="manager">
      <ManagerLayoutInner />
    </RoleLanguageProvider>
  );
}

function ManagerLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ── Logout modal state ── */
  const [logoutOpen, setLogoutOpen] = useState(false);

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
    localStorage.removeItem("language");
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    navigate("/", { replace: true });
  };

  const handleLogoutRequest = () => {
    setLogoutOpen(true);
  };

  const handleLogoutConfirm = () => {
    setLogoutOpen(false);
    handleLogout();
  };

  const handleLogoutCancel = () => {
    setLogoutOpen(false);
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
            <button className="el__logout-btn" onClick={handleLogoutRequest} title="Logout">
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

      {/* ── Logout confirmation modal ── */}
      <LogoutModal
        open={logoutOpen}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  );
}