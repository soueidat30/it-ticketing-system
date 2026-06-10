import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import "./AgentLayout.css";

const Icon = ({ d, ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d={d} />
  </svg>
);

const Icons = {
  dashboard:  "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  ticket:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 12h6 M9 16h4",
  assigned:   "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  update:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  resolve:    "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  bell:       "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  search:     "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  logout:     "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  chevronL:   "M15 18l-6-6 6-6",
  chevronR:   "M9 18l6-6-6-6",
  support:    "M3 18v-6a9 9 0 0118 0v6 M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z",
  profile:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  settings:   "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
};

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard",        to: "/agent/dashboard",        icon: "dashboard" },
    ],
  },
  {
    label: "Tickets",
    items: [
      { label: "Assigned Tickets", to: "/agent/assigned-tickets", icon: "assigned", badge: "12" },
      { label: "Ticket Details",   to: "/agent/ticket-details",   icon: "ticket" },
      { label: "Update Status",    to: "/agent/update-status",    icon: "update" },
      { label: "Resolve Ticket",   to: "/agent/resolve-ticket",   icon: "resolve" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Profile",          to: "/agent/profile",          icon: "profile" },
    ],
  },
];

export default function AgentLayout() {
  const [collapsed, setCollapsed]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();

  const crumb = location.pathname
    .split("/")
    .filter(Boolean)
    .map(s => s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
    .join(" / ");

  const user      = JSON.parse(localStorage.getItem("user") || "{}");
  const initials  = (user.full_name || user.username || "AG")
    .split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const displayName = user.full_name || user.username || "Agent";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  useEffect(() => { setMobileOpen(false); }, [location]);

  return (
    <div className={`agent-shell${collapsed ? " collapsed" : ""}`}>

      <aside className={`agent-sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}>

        <a href="#" className="agent-sidebar__brand">
          <div className="agent-sidebar__brand-icon">
            <Icon d={Icons.support} />
          </div>
          <div className="agent-sidebar__brand-text">
            <span className="agent-sidebar__brand-name">IDS HelpDesk</span>
            <span className="agent-sidebar__brand-role">Agent Portal</span>
          </div>
        </a>

        

        <nav className="agent-sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="agent-sidebar__nav-group">
              <div className="agent-sidebar__nav-label">{group.label}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `agent-sidebar__nav-item${isActive ? " active" : ""}`
                  }
                >
                  <span className="agent-nav-icon">
                    <Icon d={Icons[item.icon]} />
                  </span>
                  <span className="agent-nav-label">{item.label}</span>
                  {item.badge && (
                    <span className="agent-nav-badge">{item.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="agent-sidebar__footer">
          <button className="agent-sidebar__logout" onClick={handleLogout}>
            <span className="agent-nav-icon"><Icon d={Icons.logout} /></span>
            <span className="agent-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <button
        className="agent-sidebar__toggle"
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        style={{ left: collapsed ? "calc(68px - 13px)" : "calc(260px - 13px)" }}
      >
        <Icon d={collapsed ? Icons.chevronR : Icons.chevronL} />
      </button>

      <header className="agent-topbar">
        <div className="agent-topbar__breadcrumb">
          <span>Agent</span>
          <span className="agent-topbar__breadcrumb-sep">›</span>
          <span className="agent-topbar__breadcrumb-current">{crumb}</span>
        </div>

        <div className="agent-topbar__search">
          <svg className="agent-topbar__search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={Icons.search} />
          </svg>
          <input type="text" placeholder="Search tickets…" />
        </div>

        <div className="agent-topbar__actions">
          <button className="agent-topbar__action-btn" title="Notifications">
            <Icon d={Icons.bell} />
            <span className="agent-topbar__notif-badge">5</span>
          </button>
          <div className="agent-topbar__user">
            <div className="agent-topbar__user-avatar">{initials}</div>
            <span className="agent-topbar__user-name">{displayName}</span>
          </div>
        </div>
      </header>

      <main className="agent-main">
        <Outlet />
      </main>
    </div>
  );
}