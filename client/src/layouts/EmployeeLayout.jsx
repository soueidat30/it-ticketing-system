import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { RoleLanguageProvider, useLanguage, SUPPORTED_LANGUAGES } from "../contexts/RoleScopedLanguageContext";
import AIChatbot from "../components/common/AIChatbot/AIChatbot";
import "./EmployeeLayout.css";

export default function EmployeeLayout() {
  return (
    <RoleLanguageProvider role="employee">
      <EmployeeLayoutInner />
    </RoleLanguageProvider>
  );
}

function EmployeeLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language: lang, setLanguage: setLang } = useLanguage();
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifCount]  = useState(2);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef(null);

  const NAV_ITEMS = [
    {
      group: t("employee.nav.groupWorkspace", "Workspace"),
      items: [
        { to: "/employee/dashboard",     icon: "ti-layout-dashboard", label: t("employee.nav.dashboard", "Dashboard")     },
        { to: "/employee/my-tickets",    icon: "ti-ticket",           label: t("employee.nav.myTickets", "My Tickets")    },
        { to: "/employee/create-ticket", icon: "ti-plus",             label: t("employee.nav.createTicket", "Create Ticket") },
        { to: "/employee/my-assets",     icon: "ti-archive",          label: t("employee.nav.myAssets", "My Assets") },
      ]
    },
    {
      group: t("employee.nav.groupResources", "Resources"),
      items: [
        { to: "/employee/knowledge-base", icon: "ti-book", label: t("employee.nav.knowledgeBase", "Knowledge Base") },
      ]
    },
    {
      group: t("employee.nav.groupAccount", "Account"),
      items: [
        { to: "/employee/profile",      icon: "ti-user", label: t("employee.nav.profile", "Profile")      },
        { to: "/employee/notification", icon: "ti-bell", label: t("employee.nav.notification", "Notifications") },
      ]
    }
  ];

  // ── Dark mode ─────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("emp-dark") === "true"
  );

  useEffect(() => {
    localStorage.setItem("emp-dark", darkMode);
  }, [darkMode]);

  const toggleDark = () => setDarkMode(v => !v);

  useEffect(() => {
    const close = (e) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("language");
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    navigate("/" );
  };

  const currentItem = NAV_ITEMS.flatMap(g => g.items)
    .find(i => location.pathname.startsWith(i.to));
  const pageTitle = currentItem?.label ?? t("employee.role", "Employee");

  return (
    <div className={`el ${sidebarOpen ? "el--open" : "el--collapsed"} ${darkMode ? "el--dark" : ""}`}>

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
              <span className="el__logo-sub">{t("employee.portalName", "Employee Portal")}</span>
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
                  {item.to === "/employee/notification" && notifCount > 0 && (
                    <span className="el__badge">{notifCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── AI Chatbot (replaces old static help box) ── */}
        {sidebarOpen && <AIChatbot />}

        {/* User card */}
        <div className="el__user-card">
          <div className="el__user-avatar">
            {(user.full_name?.[0] ?? "E").toUpperCase()}
          </div>
          {sidebarOpen && (
            <div className="el__user-info">
              <span className="el__user-name">{user.full_name ?? t("employee.role", "Employee")}</span>
              <span className="el__user-role">{t("employee.role", "Employee")}</span>
            </div>
          )}
          {sidebarOpen && (
            <button className="el__logout-btn" onClick={handleLogout} title={t("employee.logout", "Logout")}>
              <i className="ti ti-logout" />
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
              <i className={`ti ${sidebarOpen
                ? "ti-layout-sidebar-left-collapse"
                : "ti-layout-sidebar-left-expand"}`}
              />
            </button>
            <div className="el__breadcrumb">
              <span className="el__breadcrumb-root">{t("employee.breadcrumbRoot", "Employee")}</span>
              <i className="ti ti-chevron-right" />
              <span className="el__breadcrumb-current">{pageTitle}</span>
            </div>
          </div>

          <div className="el__topbar-right">
            <div className="el__search">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder={t("employee.searchPlaceholder", "Search tickets...")}
                className="el__search-input"
                aria-label="Search"
              />
            </div>

            {/* ── Language switcher ── */}
            <div className="el__lang-menu" ref={langMenuRef}>
              <button
                className="el__lang-toggle"
                onClick={() => setLangMenuOpen(v => !v)}
                title={t("employee.language", "Language")}
                aria-label={t("employee.language", "Language")}
              >
                <span className="el__lang-flag">{currentLang.flag}</span>
                <span className="el__lang-code">{currentLang.name ?? currentLang.label}</span>
              </button>
              {langMenuOpen && (
                <div className="el__lang-dropdown">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      className={`el__lang-option ${l.code === lang ? "el__lang-option--active" : ""}`}
                      onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                    >
                      <span className="el__lang-flag">{l.flag}</span>
                      <span>{l.name}</span>
                      {l.code === lang && <i className="ti ti-check" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              className="el__dark-toggle"
              onClick={toggleDark}
              title={darkMode ? t("employee.lightMode", "Switch to light mode") : t("employee.darkMode", "Switch to dark mode")}
              aria-label="Toggle dark mode"
            >
              <i className={`ti ${darkMode ? "ti-sun" : "ti-moon"}`} />
            </button>

            <NavLink
              to="/employee/notification"
              className="el__topbar-icon"
              aria-label="Notifications"
            >
              <i className="ti ti-bell" />
              {notifCount > 0 && (
                <span className="el__topbar-badge">{notifCount}</span>
              )}
            </NavLink>

            <div className="el__topbar-profile">
              <div className="el__topbar-avatar">
                {(user.full_name?.[0] ?? "E").toUpperCase()}
              </div>
              <div className="el__topbar-user">
                <span className="el__topbar-name">{user.full_name ?? t("employee.role", "Employee")}</span>
                <span className="el__topbar-dept">{user.department ?? t("employee.staff", "Staff")}</span>
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
}