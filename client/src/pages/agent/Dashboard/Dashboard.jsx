import { useEffect, useState, useMemo } from "react";

import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const Icon = ({ d }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICONS = {
  ticket:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  clock:   "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  check:   "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
};

const STAT_CONFIG = [
  { label: "Assigned to Me",  iconKey: "ticket",  iconClass: "blue",   statKey: "assigned"       },
  { label: "In Progress",     iconKey: "clock",   iconClass: "purple", statKey: "in_progress"    },
  { label: "Resolved Today",  iconKey: "check",   iconClass: "green",  statKey: "resolved_today" },
  { label: "Overdue",  iconKey: "warning", iconClass: "orange", statKey: "pending_review" },
];

const BASE_URL = "http://127.0.0.1:8000/api";

const normalizeStatus   = s => s?.toLowerCase().replace(/\s+/g, "-") ?? "open";
const normalizePriority = p => p?.toLowerCase() ?? "low";

const PriorityBadge = ({ p }) => (
  <span className={`agent-badge agent-badge--${normalizePriority(p)}`}>{p}</span>
);
const StatusBadge = ({ s }) => (
  <span className={`agent-badge agent-badge--${normalizeStatus(s)}`}>
    {s?.replace("-", " ")}
  </span>
);

const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const STATUS_COLORS = {
  "open":         "#3b82f6",
  "in-progress":  "#8b5cf6",
  "pending":      "#f59e0b",
  "resolved":     "#22c55e",
  "closed":       "#64748b",
};

const STATUS_LABELS = {
  "open":        "Open",
  "in-progress": "In Progress",
  "pending":     "Pending",
  "resolved":    "Resolved",
  "closed":      "Closed",
};

const DonutChart = ({ data, size = 156, strokeWidth = 22 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="agent-donut-svg">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? (
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--agent-border)" strokeWidth={strokeWidth}
          />
        ) : data.map((d) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={d.key}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={d.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" className="agent-donut-total-num">{total}</text>
      <text x="50%" y="62%" textAnchor="middle" className="agent-donut-total-label">
        {total === 1 ? "Ticket" : "Tickets"}
      </text>
    </svg>
  );
};

const WeeklyBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="agent-bar-chart">
      {data.map((d, i) => (
        <div className="agent-bar-chart-col" key={i}>
          <div className="agent-bar-chart-value">{d.count > 0 ? d.count : ""}</div>
          <div className="agent-bar-chart-track">
            <div
              className="agent-bar-chart-fill"
              style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0)}%` }}
            />
          </div>
          <div className="agent-bar-chart-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

export default function AgentDashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const name     = user.full_name?.split(" ")[0] || "Agent";

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const [counts, setCounts] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/agent/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.status === 401) {
          navigate("/", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Failed to load dashboard");

        const data = await res.json();

        setDashboard({
          stats: {
            assigned: data.assigned ?? 0,
            in_progress: data.in_progress ?? 0,
            resolved_today: data.resolved_today ?? data.resolved ?? 0,
            pending_review: data.pending_review ?? data.pending ?? 0,
          },
          recent_tickets: data.recent_tickets ?? [],
          priority_breakdown: data.priority_breakdown ?? {},
        });
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, navigate]);


  useEffect(() => {
    if (!dashboard) return;
    const targets = STAT_CONFIG.map(c => Number(dashboard.stats?.[c.statKey] ?? 0));
    let frame;
    const current = [0, 0, 0, 0];

    const tick = () => {
      let done = true;
      const next = targets.map((t, i) => {
        if (current[i] >= t) return t;
        done = false;
        current[i] = Math.min(current[i] + Math.max(1, Math.ceil(t / 20)), t);
        return current[i];
      });
      setCounts([...next]);
      if (!done) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dashboard]);

  const [recentTickets, setRecentTickets] = useState([]);
  const [allTickets,    setAllTickets]    = useState([]);

  useEffect(() => {
    let cancelled = false;

    const loadRecent = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${BASE_URL}/agent/tickets`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const ticketsList = Array.isArray(data) ? data : [];
        setAllTickets(ticketsList);

        const sorted = [...ticketsList].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        const shaped = sorted.slice(0, 5).map(t => ({
          dbId: t.id,
          number: t.ticket_number ?? t.ticket_number,
          title: t.title,
          requester: t.user?.full_name ?? t.user?.username ?? "Unknown",
          priority: t.priority?.priority_name ?? "Low",
          status: t.status?.status_name ?? "Open",
          age: timeAgo(t.created_at),
        }));

        setRecentTickets(shaped);
      } catch {
        // ignore
      }
    };

    loadRecent();
    return () => {
      cancelled = true;
    };
  }, [token]);


  const breakdown = dashboard?.priority_breakdown ?? {};
  const maxBreakdown = Math.max(...Object.values(breakdown).map(Number), 1);

  const statusChartData = useMemo(() => {
    const counts = { open: 0, "in-progress": 0, pending: 0, resolved: 0, closed: 0 };
    allTickets.forEach((t) => {
      const key = normalizeStatus(t.status?.status_name);
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return Object.keys(counts).map((key) => ({
      key,
      value: counts[key],
      label: STATUS_LABELS[key],
      color: STATUS_COLORS[key],
    }));
  }, [allTickets]);

  const weeklyTrend = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    return days.map((day) => {
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const count = allTickets.filter((t) => {
        if (!t.created_at) return false;
        const c = new Date(t.created_at);
        return c >= day && c < next;
      }).length;
      return {
        label: day.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      };
    });
  }, [allTickets]);

  return (
    <div className="agent-dashboard">

      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Good morning, {name} </h1>
          <p className="agent-page-subtitle">Here's your ticket queue for today.</p>
        </div>
        <button className="agent-btn agent-btn--primary"
          onClick={() => navigate("/agent/assigned-tickets")}>
          <Icon d={ICONS.ticket} /> View All Tickets
        </button>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fee2e2", border: "1px solid #fca5a5",
          borderRadius: 8, color: "#b91c1c", fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="agent-stats-grid">
        {STAT_CONFIG.map((s, i) => (
          <div className="agent-stat-card" key={s.label}>
            <div className={`agent-stat-icon agent-stat-icon--${s.iconClass}`}>
              <Icon d={ICONS[s.iconKey]} />
            </div>
            <div className="agent-stat-body">
              <div className="agent-stat-value">{loading ? "—" : counts[i]}</div>
              <div className="agent-stat-label">{s.label}</div>
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
                <th>ID</th><th>Subject</th><th>Requester</th>
                <th>Priority</th><th>Status</th><th>Age</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>Loading…</td></tr>
              ) : recentTickets.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>No active tickets.</td></tr>
              ) : (
                recentTickets.map(t => (
                  <tr key={t.dbId}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/agent/ticket-details", { state: { ticketId: t.dbId } })}>
                    <td><span className="agent-ticket-id">{t.number}</span></td>
                    <td><span className="agent-ticket-subject">{t.title}</span></td>
                    <td><span className="agent-ticket-requester">{t.requester}</span></td>
                    <td><PriorityBadge p={t.priority} /></td>
                    <td><StatusBadge   s={t.status}   /></td>
                    <td><span className="agent-ticket-requester">{t.age}</span></td>
                    <td>
                      <button className="agent-btn agent-btn--ghost agent-btn--sm"
                        onClick={e => { e.stopPropagation(); navigate("/agent/ticket-details", { state: { ticketId: t.dbId } }); }}>
                        <Icon d={ICONS.eye} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Priority Breakdown</span>
          </div>
          <div className="agent-card-body">
            <div className="agent-priority-list">
              {["critical", "high", "medium", "low"].map(key => {
                const count = Number(breakdown[key] ?? 0);
                return (
                  <div className="agent-priority-row" key={key}>
                    <div className="agent-priority-row-top">
                      <span className="agent-priority-row-label" style={{ textTransform: "capitalize" }}>{key}</span>
                      <span className="agent-priority-row-count">{loading ? "—" : count} tickets</span>
                    </div>
                    <div className="agent-priority-bar-track">
                      <div
                        className={`agent-priority-bar-fill agent-priority-bar-fill--${key}`}
                        style={{ width: loading ? "0%" : `${(count / maxBreakdown) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="agent-card-header" style={{ marginTop: 8 }}>
            <span className="agent-card-title">SLA Compliance</span>
            <span style={{ fontSize: 11, color: "#9ca3af" }}>Sample data</span>
          </div>
          <div className="agent-card-body">
            <div className="agent-sla-grid">
              {[
                { pct: "91%", desc: "First Response SLA",  cls: "good"    },
                { pct: "78%", desc: "Resolution SLA",      cls: "warning" },
                { pct: "95%", desc: "Satisfaction Score",  cls: "good"    },
                { pct: "62%", desc: "Escalation Rate",     cls: "danger"  },
              ].map(s => (
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
            <span className="agent-card-title">Ticket Status Breakdown</span>
          </div>
          <div className="agent-card-body agent-chart-card-body">
            {loading ? (
              <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>Loading chart…</div>
            ) : (
              <>
                <DonutChart data={statusChartData} />
                <div className="agent-donut-legend">
                  {statusChartData.map(d => (
                    <div className="agent-donut-legend-item" key={d.key}>
                      <span className="agent-donut-dot" style={{ background: d.color }} />
                      <span className="agent-donut-label">{d.label}</span>
                      <span className="agent-donut-value">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tickets created trend — bar chart, last 7 days */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Tickets Created — Last 7 Days</span>
          </div>
          <div className="agent-card-body">
            {loading ? (
              <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>Loading chart…</div>
            ) : (
              <WeeklyBarChart data={weeklyTrend} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}