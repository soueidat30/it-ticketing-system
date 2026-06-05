import { useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const STATS = [
  { label: "Open Tickets",     value: 142, delta: "+12", up: true,  icon: "ti-ticket",        color: "blue"   },
  { label: "Resolved Today",   value:  38, delta: "+5",  up: true,  icon: "ti-circle-check",  color: "green"  },
  { label: "Avg. Response",    value: "2h 14m", delta: "-18m", up: true, icon: "ti-clock", color: "lime" },
  { label: "Overdue",          value:   9, delta: "+3",  up: false, icon: "ti-alert-triangle", color: "red"   },
];

const RECENT_TICKETS = [
  { id: "#4821", subject: "Cannot access VPN after password reset", user: "Sara El-Khoury",   dept: "Finance",   priority: "High",   status: "Open",        time: "4m ago"  },
  { id: "#4820", subject: "Laptop screen flickering on startup",   user: "Karim Mansour",    dept: "Marketing", priority: "Medium", status: "In Progress", time: "22m ago" },
  { id: "#4819", subject: "New employee onboarding — account setup", user: "Lara Haddad",   dept: "HR",        priority: "Low",    status: "Open",        time: "1h ago"  },
  { id: "#4818", subject: "Outlook not syncing on mobile device",  user: "Nour Khalil",      dept: "Sales",     priority: "High",   status: "Pending",     time: "2h ago"  },
  { id: "#4817", subject: "Printer offline in 3rd floor office",   user: "Ziad Nassar",      dept: "Legal",     priority: "Medium", status: "Resolved",    time: "3h ago"  },
  { id: "#4816", subject: "Software license request — Adobe CC",   user: "Maya Salameh",     dept: "Design",    priority: "Low",    status: "Resolved",    time: "5h ago"  },
];

const AGENTS = [
  { name: "Ali Hassan",    tickets: 14, resolved: 9,  avatar: "A", rating: 4.9 },
  { name: "Dina Farhat",   tickets: 11, resolved: 8,  avatar: "D", rating: 4.8 },
  { name: "Omar Saab",     tickets: 10, resolved: 6,  avatar: "O", rating: 4.7 },
  { name: "Rana Moussa",   tickets:  8, resolved: 7,  avatar: "R", rating: 4.9 },
];

const ACTIVITY = [
  { icon: "ti-ticket",       text: "Ticket #4821 assigned to Ali Hassan",     time: "Just now",  color: "blue"  },
  { icon: "ti-circle-check", text: "Ticket #4815 marked resolved by Dina",    time: "12m ago",   color: "green" },
  { icon: "ti-user-plus",    text: "New user Lara Haddad added to HR dept",   time: "34m ago",   color: "lime"  },
  { icon: "ti-alert-triangle",text: "SLA breached on ticket #4810",           time: "1h ago",    color: "red"   },
  { icon: "ti-settings",     text: "System settings updated by Admin",         time: "2h ago",    color: "muted" },
];

const PRIORITY_BAR = [
  { label: "Critical", count: 4,  pct: 8,  color: "#ef4444" },
  { label: "High",     count: 28, pct: 32, color: "#f97316" },
  { label: "Medium",   count: 63, pct: 44, color: "#eab308" },
  { label: "Low",      count: 47, pct: 16, color: "#22c55e" },
];

export default function Dashboard() {
  const [range, setRange] = useState("7d");

  return (
    <div className="dashboard-container">

      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back — here's what's happening today.</p>
        </div>
        <div className="dashboard-header-actions">
          <div className="date-range-tabs">
            {["24h","7d","30d"].map(r => (
              <button
                key={r}
                className={`date-range-tab ${range === r ? "date-range-tab--active" : ""}`}
                onClick={() => setRange(r)}
              >{r}</button>
            ))}
          </div>
          <button className="new-ticket-button">
            <i className="ti ti-plus" /> New Ticket
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {STATS.map(s => (
          <div key={s.label} className={`stat-card stat-card--${s.color}`}>
            <div className="stat-icon">
              <i className={`ti ${s.icon}`} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
            <div className={`stat-delta ${s.up ? "stat-delta--up" : "stat-delta--down"}`}>
              <i className={`ti ${s.up ? "ti-trending-up" : "ti-trending-down"}`} />
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">

        <div className="card recent-tickets-card">
          <div className="card-header">
            <h2 className="card-title">Recent Tickets</h2>
            <Link to="/admin/tickets" className="card-link">View all <i className="ti ti-arrow-right" /></Link>
          </div>
          <div className="table-wrapper">
            <table className="tickets-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>User</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {RECENT_TICKETS.map(t => (
                  <tr key={t.id} className="ticket-row">
                    <td><span className="ticket-id">{t.id}</span></td>
                    <td>
                      <span className="ticket-subject">{t.subject}</span>
                      <span className="ticket-department">{t.dept}</span>
                    </td>
                    <td>
                      <div className="user-cell">
                        <div className="mini-avatar">{t.user[0]}</div>
                        <span>{t.user}</span>
                      </div>
                    </td>
                    <td><span className={`priority-badge priority-badge--${t.priority.toLowerCase()}`}>{t.priority}</span></td>
                    <td><span className={`status-badge status-badge--${t.status.toLowerCase().replace(" ","-")}`}>{t.status}</span></td>
                    <td><span className="time-text">{t.time}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="right-sidebar">

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Priority Breakdown</h2>
              <span className="card-subtitle">142 total</span>
            </div>
            <div className="priority-section">
              <div className="priority-bars">
                {PRIORITY_BAR.map(p => (
                  <div
                    key={p.label}
                    className="priority-segment"
                    style={{ width: `${p.pct}%`, background: p.color }}
                    title={`${p.label}: ${p.count}`}
                  />
                ))}
              </div>
              <div className="priority-legend">
                {PRIORITY_BAR.map(p => (
                  <div key={p.label} className="priority-item">
                    <span className="priority-dot" style={{ background: p.color }} />
                    <span className="priority-name">{p.label}</span>
                    <span className="priority-count">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Top Agents</h2>
              <Link to="/admin/users" className="card-link">View all <i className="ti ti-arrow-right" /></Link>
            </div>
            <div className="agents-list">
              {AGENTS.map((a, i) => (
                <div key={a.name} className="agent-item">
                  <span className="agent-rank">#{i+1}</span>
                  <div className="agent-avatar">{a.avatar}</div>
                  <div className="agent-details">
                    <span className="agent-name">{a.name}</span>
                    <span className="agent-stats">{a.tickets} open · {a.resolved} resolved</span>
                  </div>
                  <div className="agent-rating">
                    <i className="ti ti-star-filled" />
                    {a.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Activity Feed</h2>
              <Link to="/admin/activity-logs" className="card-link">All logs <i className="ti ti-arrow-right" /></Link>
            </div>
            <div className="activity-feed">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-icon activity-icon--${a.color}`}>
                    <i className={`ti ${a.icon}`} />
                  </div>
                  <div className="activity-content">
                    <span className="activity-text">{a.text}</span>
                    <span className="activity-time">{a.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}