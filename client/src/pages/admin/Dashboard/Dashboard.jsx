import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";
import { getAdminDashboardStats } from "../../../services/adminDashboardService";


export default function Dashboard() {
  const [range, setRange] = useState("7d");
  const [stats, setStats] = useState([
    { label: "Open Tickets", value: 0, delta: "+12", up: true, icon: "ti-ticket", color: "blue" },
    { label: "Resolved Today", value: 0, delta: "+5", up: true, icon: "ti-circle-check", color: "green" },
    { label: "Avg. Response", value: "0h 0m", delta: "-18m", up: true, icon: "ti-clock", color: "lime" },
  ]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getAdminDashboardStats(token)
      .then((data) => {
        setStats([
          {
            label: "Total Tickets",
            value: data.totalTickets ?? 0,
            delta: "+12",
            up: true,
            icon: "ti-ticket",
            color: "blue",
          },
          {
            label: "Open Tickets",
            value: data.openTickets ?? 0,
            delta: "+12",
            up: true,
            icon: "ti-ticket",
            color: "blue",
          },
          {
            label: "Resolved Today",
            value: data.resolvedToday ?? 0,
            delta: "+5",
            up: true,
            icon: "ti-circle-check",
            color: "green",
          },
          {
            label: "SLA Breaches",
            value: data.slaBreaches ?? 0,
            delta: "+0",
            up: true,
            icon: "ti-alert-triangle",
            color: "red",
          },
          {
            label: "Avg. Response",
            value: data.avgResponse ?? "0h 0m",
            delta: "-18m",
            up: true,
            icon: "ti-clock",
            color: "lime",
          },
        ]);
      })
      .catch(() => {
        // keep defaults on error
      });

  }, []);

  const [recentTickets, setRecentTickets] = useState([]);
  const [priorityBreakdown, setPriorityBreakdown] = useState([]);
  const [topAgents, setTopAgents] = useState([]);
  const [activityFeed, setActivityFeed] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    getAdminDashboardStats(token)
      .then((data) => {
        setRecentTickets(data.recentTickets ?? []);
        setPriorityBreakdown(data.priorityBreakdown ?? []);
        setTopAgents(data.topAgents ?? []);
        setActivityFeed(data.activityFeed ?? []);
      })
      .catch(() => {
        // keep empty sections on error
      });
  }, []);

  return (
    <div className="dashboard-container">


      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back — here's what's happening today.</p>
        </div>
        
      </div>

      <div className="stats-grid">
        {stats.map(s => (
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
                {recentTickets.map(t => (
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
              <span className="card-subtitle">{priorityBreakdown.reduce((sum, p) => sum + (p.count ?? 0), 0)} total</span>
            </div>
            <div className="priority-section">
              <div className="priority-bars">
                {priorityBreakdown.map(p => (
                  <div
                    key={p.label}
                    className="priority-segment"
                    style={{ width: `${p.pct}%`, background: p.color }}
                    title={`${p.label}: ${p.count}`}
                  />
                ))}
              </div>
              <div className="priority-legend">
                {priorityBreakdown.map(p => (
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
              {topAgents.map((a, i) => (
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
              {activityFeed.map((a, i) => (
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