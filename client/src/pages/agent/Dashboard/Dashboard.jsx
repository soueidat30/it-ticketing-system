import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  ticket:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  clock:     "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  check:     "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  warning:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  trend:     "M23 6l-9.5 9.5-5-5L1 18",
  resolved:  "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  pending:   "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  eye:       "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
};

const STATS = [
  { label: "Assigned to Me",   value: 12, trend: "+2 today",   trendDir: "up",      iconKey: "ticket",   iconClass: "blue"   },
  { label: "In Progress",      value:  5, trend: "Active",     trendDir: "neutral",  iconKey: "clock",    iconClass: "purple" },
  { label: "Resolved Today",   value:  8, trend: "+3 vs avg",  trendDir: "up",      iconKey: "check",    iconClass: "green"  },
  { label: "Pending Review",   value:  3, trend: "Needs action", trendDir: "down",  iconKey: "warning",  iconClass: "orange" },
  { label: "Overdue",          value:  2, trend: "Critical",   trendDir: "down",    iconKey: "trend",    iconClass: "red"    },
  
];

const RECENT_TICKETS = [
  { id: "#TK-1042", subject: "Outlook not syncing emails", requester: "Sara Khalil",  priority: "high",     status: "in-progress", age: "2h ago" },
  { id: "#TK-1038", subject: "Cannot access VPN from home", requester: "Omar Fares",  priority: "critical", status: "open",        age: "4h ago" },
  { id: "#TK-1035", subject: "Printer offline on 3rd floor", requester: "Lina Saad", priority: "medium",   status: "pending",     age: "6h ago" },
  { id: "#TK-1031", subject: "New laptop setup required",    requester: "Jad Nassar", priority: "low",      status: "open",        age: "1d ago" },
  { id: "#TK-1029", subject: "Software license expired",     requester: "Rima Azar",  priority: "high",     status: "in-progress", age: "1d ago" },
];

const PRIORITY_BREAKDOWN = [
  { label: "Critical", count: 2,  max: 12, cls: "critical" },
  { label: "High",     count: 4,  max: 12, cls: "high"     },
  { label: "Medium",   count: 4,  max: 12, cls: "medium"   },
  { label: "Low",      count: 2,  max: 12, cls: "low"      },
];

const ACTIVITY = [
  { text: "Resolved ticket #TK-1025 — Password reset completed",         time: "15 min ago", type: "resolved" },
  { text: "Ticket #TK-1038 assigned to you by Manager Ali",              time: "1h ago",     type: "assigned" },
  { text: "Updated status of #TK-1035 to Pending",                       time: "2h ago",     type: "updated"  },
  { text: "Added internal comment on ticket #TK-1031",                   time: "3h ago",     type: "comment"  },
  { text: "Resolved ticket #TK-1018 — Network switch replaced",          time: "5h ago",     type: "resolved" },
];

const SLA = [
  { pct: "91%",  desc: "First Response SLA",   cls: "good"    },
  { pct: "78%",  desc: "Resolution SLA",       cls: "warning" },
  { pct: "95%",  desc: "Satisfaction Score",   cls: "good"    },
  { pct: "62%",  desc: "Escalation Rate",      cls: "danger"  },
];

const PriorityBadge = ({ p }) => (
  <span className={`agent-badge agent-badge--${p}`}>{p}</span>
);
const StatusBadge = ({ s }) => (
  <span className={`agent-badge agent-badge--${s}`}>{s.replace("-", " ")}</span>
);

export default function AgentDashboard() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const name     = user.full_name?.split(" ")[0] || "Agent";

  const [counts, setCounts] = useState(STATS.map(() => 0));
  useEffect(() => {
    const targets = STATS.map(s => (typeof s.value === "number" ? s.value : 0));
    const intervals = targets.map((target, i) => {
      if (!target) return null;
      let cur = 0;
      return setInterval(() => {
        cur = Math.min(cur + Math.ceil(target / 20), target);
        setCounts(prev => { const n = [...prev]; n[i] = cur; return n; });
        if (cur >= target) clearInterval(intervals[i]);
      }, 50);
    });
    return () => intervals.forEach(iv => iv && clearInterval(iv));
  }, []);

  return (
    <div className="agent-dashboard">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Good morning, {name} 👋</h1>
          <p className="agent-page-subtitle">Here's your ticket queue for today — stay on top of it!</p>
        </div>
        <button className="agent-btn agent-btn--primary"
          onClick={() => navigate("/agent/assigned-tickets")}>
          <Icon d={ICONS.ticket} /> View All Tickets
        </button>
      </div>

      <div className="agent-stats-grid">
        {STATS.map((s, i) => (
          <div className="agent-stat-card" key={s.label}>
            <div className={`agent-stat-icon agent-stat-icon--${s.iconClass}`}>
              <Icon d={ICONS[s.iconKey]} />
            </div>
            <div className="agent-stat-body">
              <div className="agent-stat-value">
                {typeof s.value === "number" ? counts[i] : s.value}
              </div>
              <div className="agent-stat-label">{s.label}</div>
              <div className={`agent-stat-trend agent-stat-trend--${s.trendDir}`}>
                {s.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="agent-dashboard-cols">
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">My Active Tickets</span>
            <button className="agent-btn agent-btn--ghost agent-btn--sm"
              onClick={() => navigate("/agent/assigned-tickets")}>
              View All
            </button>
          </div>
          <table className="agent-tickets-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subject</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Age</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TICKETS.map(t => (
                <tr key={t.id}>
                  <td><span className="agent-ticket-id">{t.id}</span></td>
                  <td><span className="agent-ticket-subject">{t.subject}</span></td>
                  <td><span className="agent-ticket-requester">{t.requester}</span></td>
                  <td><PriorityBadge p={t.priority} /></td>
                  <td><StatusBadge s={t.status} /></td>
                  <td><span className="agent-ticket-requester">{t.age}</span></td>
                  <td>
                    <button className="agent-btn agent-btn--ghost agent-btn--sm"
                      onClick={() => navigate("/agent/ticket-details")}>
                      <Icon d={ICONS.eye} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Priority Breakdown</span>
          </div>
          <div className="agent-card-body">
            <div className="agent-priority-list">
              {PRIORITY_BREAKDOWN.map(p => (
                <div className="agent-priority-row" key={p.label}>
                  <div className="agent-priority-row-top">
                    <span className="agent-priority-row-label">{p.label}</span>
                    <span className="agent-priority-row-count">{p.count} tickets</span>
                  </div>
                  <div className="agent-priority-bar-track">
                    <div
                      className={`agent-priority-bar-fill agent-priority-bar-fill--${p.cls}`}
                      style={{ width: `${(p.count / p.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="agent-card-header" style={{ marginTop: 8 }}>
            <span className="agent-card-title">SLA Compliance</span>
          </div>
          <div className="agent-card-body">
            <div className="agent-sla-grid">
              {SLA.map(s => (
                <div className="agent-sla-item" key={s.desc}>
                  <div className={`agent-sla-pct agent-sla-pct--${s.cls}`}>{s.pct}</div>
                  <div className="agent-sla-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="agent-dashboard-bottom">
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Recent Activity</span>
          </div>
          <div className="agent-card-body" style={{ padding: "8px 20px" }}>
            <div className="agent-activity-list">
              {ACTIVITY.map((a, i) => (
                <div className="agent-activity-item" key={i}>
                  <div className={`agent-activity-dot agent-activity-dot--${a.type}`} />
                  <div>
                    <div className="agent-activity-text">{a.text}</div>
                    <div className="agent-activity-time">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Quick Actions</span>
          </div>
          <div className="agent-card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "View Assigned Tickets", path: "/agent/assigned-tickets", cls: "primary" },
              { label: "Update a Ticket Status", path: "/agent/update-status",    cls: "ghost"   },
              { label: "Resolve a Ticket",       path: "/agent/resolve-ticket",   cls: "accent"  },
            ].map(a => (
              <button key={a.label}
                className={`agent-btn agent-btn--${a.cls}`}
                style={{ justifyContent: "center" }}
                onClick={() => navigate(a.path)}>
                {a.label}
              </button>
            ))}

            <div style={{ padding: "12px 0 4px", borderTop: "1px solid var(--agent-border)", marginTop: 4 }}>
              <div style={{ fontSize: 12, color: "var(--agent-muted)", marginBottom: 8, fontWeight: 600 }}>
                MY PERFORMANCE TODAY
              </div>
              {[
                { label: "Tickets Resolved", val: "8" },
                { label: "Avg Handle Time",  val: "18 min" },
                { label: "Customer Rating",  val: "4.8 ★" },
              ].map(m => (
                <div key={m.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                  <span style={{ color: "var(--agent-muted)" }}>{m.label}</span>
                  <span style={{ fontWeight: 700, color: "var(--agent-text)" }}>{m.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}