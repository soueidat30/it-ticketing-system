import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import NotificationPanel from "../pages/agent/NotifcationPanel/Notificationpanel";
import "./AgentLayout.css";



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
  dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  ticket:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 12h6 M9 16h4",
  assigned: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  update:
    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  resolve: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  chevronL: "M15 18l-6-6 6-6",
  chevronR: "M9 18l6-6-6-6",
  support: "M3 18v-6a9 9 0 0118 0v6 M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z",
  profile: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
};

const API_URL = "http://127.0.0.1:8000/api";

export default function AgentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen] = useState(false);

  const [assignedCount, setAssignedCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const initials = (user.full_name || user.username || "AG")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const displayName = user.full_name || user.username || "Agent";

  const crumb = location.pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" / ");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };




  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/agent/dashboard/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        setAssignedCount(Number(data?.assigned) || 0);
      } catch {
        // ignore - keep badge at 0
      }
    };

    load();
  }, []);

  return (
    <div className={`agent-shell${collapsed ? " collapsed" : ""}`}>
      <aside
        className={`agent-sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
      >
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
          <div className="agent-sidebar__nav-group">
            <div className="agent-sidebar__nav-label">Overview</div>
            <NavLink
              to="/agent/dashboard"
              className={({ isActive }) =>
                `agent-sidebar__nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="agent-nav-icon">
                <Icon d={Icons.dashboard} />
              </span>
              <span className="agent-nav-label">Dashboard</span>
            </NavLink>
          </div>

          <div className="agent-sidebar__nav-group">
            <div className="agent-sidebar__nav-label">Tickets</div>

            <NavLink
              to="/agent/assigned-tickets"
              className={({ isActive }) =>
                `agent-sidebar__nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="agent-nav-icon">
                <Icon d={Icons.assigned} />
              </span>
              <span className="agent-nav-label">Assigned Tickets</span>
              <span className="agent-nav-badge">{assignedCount}</span>
            </NavLink>

            <NavLink
              to="/agent/ticket-details"
              className={({ isActive }) =>
                `agent-sidebar__nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="agent-nav-icon">
                <Icon d={Icons.ticket} />
              </span>
              <span className="agent-nav-label">Ticket Details</span>
            </NavLink>

            <NavLink
              to="/agent/update-status"
              className={({ isActive }) =>
                `agent-sidebar__nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="agent-nav-icon">
                <Icon d={Icons.update} />
              </span>
              <span className="agent-nav-label">Update Status</span>
            </NavLink>

            <NavLink
              to="/agent/resolve-ticket"
              className={({ isActive }) =>
                `agent-sidebar__nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="agent-nav-icon">
                <Icon d={Icons.resolve} />
              </span>
              <span className="agent-nav-label">Resolve Ticket</span>
            </NavLink>
          </div>

          <div className="agent-sidebar__nav-group">
            <div className="agent-sidebar__nav-label">Account</div>
            <NavLink
              to="/agent/profile"
              className={({ isActive }) =>
                `agent-sidebar__nav-item${isActive ? " active" : ""}`
              }
            >
              <span className="agent-nav-icon">
                <Icon d={Icons.profile} />
              </span>
              <span className="agent-nav-label">Profile</span>
            </NavLink>
          </div>
        </nav>

        <div className="agent-sidebar__footer">
          <button className="agent-sidebar__logout" onClick={handleLogout}>
            <span className="agent-nav-icon">
              <Icon d={Icons.logout} />
            </span>
            <span className="agent-nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <button
        className="agent-sidebar__toggle"
        onClick={() => setCollapsed((c) => !c)}
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
          <svg
            className="agent-topbar__search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={Icons.search} />
          </svg>
          <input type="text" placeholder="Search tickets…" />
        </div>

        <div className="agent-topbar__actions">
          <NotificationPanel />
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

