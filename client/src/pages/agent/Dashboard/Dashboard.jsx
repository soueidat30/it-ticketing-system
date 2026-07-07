import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
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

const BASE_URL = "http://127.0.0.1:8000/api";

const normalizeStatus   = s => s?.toLowerCase().replace(/\s+/g, "-") ?? "open";
const normalizePriority = p => p?.toLowerCase() ?? "low";

// ── Localized time-ago ──
const buildTimeAgo = (t) => (dateStr) => {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return t("agent.dashboard.timeAgo.seconds", "{{n}}s ago", { n: diff });
  if (diff < 3600) return t("agent.dashboard.timeAgo.minutes", "{{n}}m ago", { n: Math.floor(diff / 60) });
  if (diff < 86400)return t("agent.dashboard.timeAgo.hours",   "{{n}}h ago", { n: Math.floor(diff / 3600) });
  return t("agent.dashboard.timeAgo.days", "{{n}}d ago", { n: Math.floor(diff / 86400) });
};

// ── Status chart config (translated) ──
const buildStatusConfig = (t) => ({
  "open":         { color: "#3b82f6", label: t("agent.status.open",        "Open")        },
  "in-progress":  { color: "#8b5cf6", label: t("agent.status.in-progress", "In Progress") },
  "pending":      { color: "#f59e0b", label: t("agent.status.pending",     "Pending")     },
  "resolved":     { color: "#22c55e", label: t("agent.status.resolved",    "Resolved")    },
  "closed":       { color: "#64748b", label: t("agent.status.closed",      "Closed")      },
});

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
        {total === 1
          ? <DonutTicketLabel t={data.length} />
          : <DonutTicketsLabel t={data.length} />}
      </text>
    </svg>
  );
};

// Inline helpers so the labels inside the SVG (text) can use t()
const DonutTicketLabel = () => {
  const { t } = useLanguage();
  return <>{t("agent.dashboard.statusBreakdown.ticket", "Ticket")}</>;
};
const DonutTicketsLabel = () => {
  const { t } = useLanguage();
  return <>{t("agent.dashboard.statusBreakdown.tickets", "Tickets")}</>;
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
  const { t } = useLanguage();
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const name  = user.full_name?.split(" ")[0] || t("common.unknown", "Agent");

  // Localized helpers
  const timeAgo = buildTimeAgo(t);
  const STATUS_CFG = useMemo(() => buildStatusConfig(t), [t]);

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [counts,    setCounts]    = useState([0, 0, 0, 0]);

  // ── KPI cards (label + stat key) — fully translated ──
  const STAT_CONFIG = useMemo(() => [
    { label: t("agent.dashboard.stats.assigned",      "Assigned to Me"), iconKey: "ticket",  iconClass: "blue",   statKey: "assigned"       },
    { label: t("agent.dashboard.stats.inProgress",    "In Progress"),    iconKey: "clock",   iconClass: "purple", statKey: "in_progress"    },
    { label: t("agent.dashboard.stats.resolvedToday", "Resolved Today"), iconKey: "check",   iconClass: "green",  statKey: "resolved_today" },
    { label: t("agent.dashboard.stats.overdue",       "Overdue"),        iconKey: "warning", iconClass: "orange", statKey: "pending_review" },
  ], [t]);

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
        if (!res.ok) throw new Error(t("agent.dashboard.couldNotLoad", "Failed to load dashboard"));

        const data = await res.json();
        setDashboard({
          stats: {
            assigned:        data.assigned        ?? 0,
            in_progress:     data.in_progress     ?? 0,
            resolved_today:  data.resolved_today  ?? data.resolved ?? 0,
            pending_review:  data.pending_review  ?? data.pending  ?? 0,
          },
          recent_tickets:     data.recent_tickets     ?? [],
          priority_breakdown: data.priority_breakdown ?? {},
        });
      } catch (err) {
        console.error(err);
        setError(t("agent.dashboard.couldNotLoad", "Could not load dashboard data."));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, navigate, t]);

  // Counter animation
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
  }, [dashboard, STAT_CONFIG]);

  const [recentTickets, setRecentTickets] = useState([]);
  const [allTickets,    setAllTickets]    = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadRecent = async () => {
      try {
        if (!token) return;
        const res = await fetch(`${BASE_URL}/agent/tickets`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
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
          number: t.ticket_number ?? t.id,
          title: t.title,
          requester: t.user?.full_name ?? t.user?.username ?? t("common.unknown", "Unknown"),
          priority: t.priority?.priority_name ?? t("agent.priority.low", "Low"),
          status: t.status?.status_name ?? t("agent.status.open", "Open"),
          age: timeAgo(t.created_at),
        }));

        setRecentTickets(shaped);
      } catch {}
    };
    loadRecent();
    return () => { cancelled = true; };
  }, [token, t, timeAgo]);

  const breakdown = dashboard?.priority_breakdown ?? {};
  const maxBreakdown = Math.max(...Object.values(breakdown).map(Number), 1);

  const statusChartData = useMemo(() => {
    const counts = { open: 0, "in-progress": 0, pending: 0, resolved: 0, closed: 0 };
    allTickets.forEach((tk) => {
      const key = normalizeStatus(tk.status?.status_name);
      if (counts[key] !== undefined) counts[key] += 1;
    });
    return Object.keys(counts).map((key) => ({
      key,
      value: counts[key],
      label: STATUS_CFG[key]?.label ?? key,
      color: STATUS_CFG[key]?.color ?? "#64748b",
    }));
  }, [allTickets, STATUS_CFG]);

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
      const count = allTickets.filter((tk) => {
        if (!tk.created_at) return false;
        const c = new Date(tk.created_at);
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
          <h1 className="agent-page-title">
            {t("agent.dashboard.greeting", "Good morning, {{name}}", { name })}
          </h1>
          <p className="agent-page-subtitle">
            {t("agent.dashboard.subtitle", "Here's your ticket queue for today.")}
          </p>
        </div>
        <button className="agent-btn agent-btn--primary"
          onClick={() => navigate("/agent/assigned-tickets")}>
          <Icon d={ICONS.ticket} />
          {t("agent.dashboard.viewAllTickets", "View All Tickets")}
        </button>
      </div>

      {error && (
        <div className="agent-dashboard-error">
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

        {/* Active tickets */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">
              {t("agent.dashboard.activeTickets.title", "My Active Tickets")}
            </span>
            <button className="agent-btn agent-btn--ghost agent-btn--sm"
              onClick={() => navigate("/agent/assigned-tickets")}>
              {t("common.viewAll", "View All")}
            </button>
          </div>
          <table className="agent-tickets-table">
            <thead>
              <tr>
                <th>{t("agent.dashboard.activeTickets.colId",        "ID")}</th>
                <th>{t("agent.dashboard.activeTickets.colSubject",  "Subject")}</th>
                <th>{t("agent.dashboard.activeTickets.colRequester","Requester")}</th>
                <th>{t("agent.dashboard.activeTickets.colPriority", "Priority")}</th>
                <th>{t("agent.dashboard.activeTickets.colStatus",   "Status")}</th>
                <th>{t("agent.dashboard.activeTickets.colAge",      "Age")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="agent-tickets-empty">
                    {t("agent.dashboard.activeTickets.loading", "Loading…")}
                  </td>
                </tr>
              ) : recentTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="agent-tickets-empty">
                    {t("agent.dashboard.activeTickets.empty", "No active tickets.")}
                  </td>
                </tr>
              ) : (
                recentTickets.map(tk => (
                  <tr key={tk.dbId}
                    className="agent-tickets-row"
                    onClick={() => navigate("/agent/ticket-details", { state: { ticketId: tk.dbId } })}>
                    <td><span className="agent-ticket-id">{tk.number}</span></td>
                    <td><span className="agent-ticket-subject">{tk.title}</span></td>
                    <td><span className="agent-ticket-requester">{tk.requester}</span></td>
                    <td>
                      <span className={`agent-badge agent-badge--${normalizePriority(tk.priority)}`}>
                        {t(`agent.priority.${normalizePriority(tk.priority)}`, tk.priority)}
                      </span>
                    </td>
                    <td>
                      <span className={`agent-badge agent-badge--${normalizeStatus(tk.status)}`}>
                        {t(`agent.status.${normalizeStatus(tk.status)}`, tk.status.replace("-", " "))}
                      </span>
                    </td>
                    <td><span className="agent-ticket-requester">{tk.age}</span></td>
                    <td>
                      <button className="agent-btn agent-btn--ghost agent-btn--sm"
                        title={t("common.view", "View")}
                        onClick={e => { e.stopPropagation(); navigate("/agent/ticket-details", { state: { ticketId: tk.dbId } }); }}>
                        <Icon d={ICONS.eye} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Priority breakdown + SLA */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">
              {t("agent.dashboard.priorityBreakdown.title", "Priority Breakdown")}
            </span>
          </div>
          <div className="agent-card-body">
            <div className="agent-priority-list">
              {["critical", "high", "medium", "low"].map(key => {
                const count = Number(breakdown[key] ?? 0);
                return (
                  <div className="agent-priority-row" key={key}>
                    <div className="agent-priority-row-top">
                      <span className="agent-priority-row-label">
                        {t(`agent.priority.${key}`, key)}
                      </span>
                      <span className="agent-priority-row-count">
                        {loading ? "—" : count} {t("agent.dashboard.priorityBreakdown.tickets", "tickets")}
                      </span>
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
            <span className="agent-card-title">
              {t("agent.dashboard.sla.title", "SLA Compliance")}
            </span>
            <span className="agent-sla-sample">
              {t("agent.dashboard.sla.sampleData", "Sample data")}
            </span>
          </div>
          <div className="agent-card-body">
            <div className="agent-sla-grid">
              {[
                { pct: "91%", descKey: "firstResponse",  cls: "good"    },
                { pct: "78%", descKey: "resolution",    cls: "warning" },
                { pct: "95%", descKey: "satisfaction",  cls: "good"    },
                { pct: "62%", descKey: "escalation",    cls: "danger"  },
              ].map(s => (
                <div className="agent-sla-item" key={s.descKey}>
                  <div className={`agent-sla-pct agent-sla-pct--${s.cls}`}>{s.pct}</div>
                  <div className="agent-sla-desc">
                    {t(`agent.dashboard.sla.${s.descKey}`, s.descKey)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="agent-dashboard-bottom">

        {/* Status donut */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">
              {t("agent.dashboard.statusBreakdown.title", "Ticket Status Breakdown")}
            </span>
          </div>
          <div className="agent-card-body agent-chart-card-body">
            {loading ? (
              <div className="agent-chart-loading">
                {t("agent.dashboard.statusBreakdown.loading", "Loading chart…")}
              </div>
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

        {/* Weekly bar chart */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">
              {t("agent.dashboard.weeklyTrend.title", "Tickets Created — Last 7 Days")}
            </span>
          </div>
          <div className="agent-card-body">
            {loading ? (
              <div className="agent-chart-loading">
                {t("agent.dashboard.weeklyTrend.loading", "Loading chart…")}
              </div>
            ) : (
              <WeeklyBarChart data={weeklyTrend} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}