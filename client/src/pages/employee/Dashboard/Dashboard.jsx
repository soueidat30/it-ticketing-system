
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const resources = [
  { icon: "ti-lock", text: "How to reset your password" },
  { icon: "ti-mail", text: "Fix email not receiving issues" },
  { icon: "ti-wifi", text: "VPN connection guide" },
  { icon: "ti-books", text: "All help articles" },
];

const RECENT_TICKETS = [
  { id: "TKT-1024", subject: "Email not working",             category: "Email",   priority: "High",   status: "Open",        updated: "1h ago" },
  { id: "TKT-1023", subject: "Password reset request",        category: "Account", priority: "Medium", status: "Pending",     updated: "3h ago" },
  { id: "TKT-1022", subject: "VPN connection issue",          category: "Network", priority: "High",   status: "Open",        updated: "5h ago" },
  { id: "TKT-1021", subject: "Cannot access shared drive",    category: "Access",  priority: "Low",    status: "Resolved",    updated: "1d ago" },
  { id: "TKT-1020", subject: "Software installation request", category: "Software",priority: "Medium", status: "Closed",      updated: "2d ago" },
];

const tabs = ["All", "Open", "Pending", "Resolved", "Closed"];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const filtered = activeTab === "All"
    ? RECENT_TICKETS
    : RECENT_TICKETS.filter(t => t.status === activeTab);

  return (
    <div className="emp-dashboard">

      {/* Welcome Header */}
      <div className="emp-dashboard__header">
        <div>
          <h1 className="emp-dashboard__title">
            Welcome back, {user.full_name?.split(" ")[0] ?? "there"}! 👋
          </h1>
          <p className="emp-dashboard__subtitle">Create and monitor your support requests.</p>
        </div>
        <button
          className="emp-dashboard__new-btn"
          onClick={() => navigate("/employee/create-ticket")}
        >
          <i className="ti ti-plus" /> New Ticket
        </button>
      </div>

      {/* Stat Cards */}
      <div className="emp-stats-grid">
        {[
          { label: "Open Tickets",     value: 3,  icon: "ti-ticket",        color: "blue"   },
          { label: "Resolved Tickets", value: 12, icon: "ti-circle-check",  color: "green"  },
          { label: "Pending Tickets",  value: 2,  icon: "ti-clock",         color: "orange" },
          { label: "Total Tickets",    value: 17, icon: "ti-chart-bar",     color: "purple" },
        ].map(s => (
          <div key={s.label} className={`emp-stat-card emp-stat-card--${s.color}`}>
            <div className="emp-stat-icon">
              <i className={`ti ${s.icon}`} />
            </div>
            <div className="emp-stat-info">
              <span className="emp-stat-value">{s.value}</span>
              <span className="emp-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="emp-dashboard__grid">

        {/* Ticket Table */}
        <div className="emp-card emp-tickets-card">
          <div className="emp-card__header">
            <h2 className="emp-card__title">My Tickets</h2>
            <button
              className="emp-card__link"
              onClick={() => navigate("/employee/my-tickets")}
            >
              View all <i className="ti ti-arrow-right" />
            </button>
          </div>

          {/* Tabs */}
          <div className="emp-tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                className={`emp-tab ${activeTab === tab ? "emp-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="emp-table-wrapper">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="emp-table__row">
                    <td><span className="emp-ticket-id">{t.id}</span></td>
                    <td><span className="emp-ticket-subject">{t.subject}</span></td>
                    <td><span className="emp-ticket-category">{t.category}</span></td>
                    <td><span className={`priority-badge priority-badge--${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`status-badge status-badge--${t.status.toLowerCase().replace(" ", "-")}`}>{t.status}</span></td>
                    <td><span className="emp-time">{t.updated}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="emp-right-col">

          {/* Create Ticket CTA */}
          <div className="emp-cta-card" onClick={() => navigate("/employee/create-ticket")}>
            <div className="emp-cta-icon">
              <i className="ti ti-plus" />
            </div>
            <div className="emp-cta-text">
              <span className="emp-cta-title">Create New Ticket</span>
              <span className="emp-cta-sub">Need help? Submit a new request</span>
            </div>
            <i className="ti ti-arrow-right emp-cta-arrow" />
          </div>

          {/* Status Overview */}
          <div className="emp-card">
            <div className="emp-card__header">
              <h2 className="emp-card__title">Ticket Status Overview</h2>
            </div>
            <div className="emp-status-overview">
              {[
                { label: "Open",     count: 3,  pct: 18, color: "#3b82f6" },
                { label: "Pending",  count: 2,  pct: 12, color: "#f97316" },
                { label: "Resolved", count: 12, pct: 70, color: "#22c55e" },
              ].map(s => (
                <div key={s.label} className="emp-status-item">
                  <div className="emp-status-bar-wrap">
                    <span className="emp-status-label">{s.label}</span>
                    <span className="emp-status-count">{s.count}</span>
                  </div>
                  <div className="emp-status-bar">
                    <div
                      className="emp-status-bar__fill"
                      style={{ width: `${s.pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Helpful Resources */}
          <div className="emp-card">
            <div className="emp-card__header">
              <h2 className="emp-card__title">Helpful Resources</h2>
            </div>
            <div className="emp-resources">
              {resources.map(r => (
                <button key={r.text} className="emp-resource-item">
                  <i className={`ti ${r.icon}`} />
                  <span>{r.text}</span>
                  <i className="ti ti-chevron-right emp-resource-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement */}
      {showAnnouncement && (
        <div className="emp-announcement">
          <div className="emp-announcement__icon">
            <i className="ti ti-speakerphone" />
          </div>
          <div className="emp-announcement__content">
            <span className="emp-announcement__title">System Maintenance</span>
            <span className="emp-announcement__text">
              System maintenance will be on May 25, 2025 from 12:00 AM to 2:00 AM.
            </span>
          </div>
          <button className="emp-announcement__view">View Details</button>
          <button
            className="emp-announcement__close"
            onClick={() => setShowAnnouncement(false)}
          >
            <i className="ti ti-x" />
          </button>
        </div>
      )}
    </div>
  );
}