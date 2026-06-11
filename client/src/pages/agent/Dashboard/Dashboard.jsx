import { useEffect, useState } from "react";

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

// Card visual config — values injected from API
const STAT_CONFIG = [
  { label: "Assigned to Me",  iconKey: "ticket",  iconClass: "blue",   statKey: "assigned"       },
  { label: "In Progress",     iconKey: "clock",   iconClass: "purple", statKey: "in_progress"    },
  { label: "Resolved Today",  iconKey: "check",   iconClass: "green",  statKey: "resolved_today" },
  { label: "Pending Review",  iconKey: "warning", iconClass: "orange", statKey: "pending_review" },
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

// Compute "X ago" from a date string
const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function AgentDashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const name     = user.full_name?.split(" ")[0] || "Agent";

  const [dashboard, setDashboard] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Animated counters
  const [counts, setCounts] = useState([0, 0, 0, 0]);

  // ── Fetch dashboard data ────────────────────────────────────
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

        // API currently returns only counts. Keep shape compatible with existing UI.
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


  // ── Animate counters when dashboard loads ───────────────────
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

  // ── Recent tickets from API ─────────────────────────────────
  const [recentTickets, setRecentTickets] = useState([]);

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

        // Show the latest few assigned tickets in the dashboard table.
        const ticketsList = Array.isArray(data) ? data : [];
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


  // ── Priority breakdown ──────────────────────────────────────
  const breakdown = dashboard?.priority_breakdown ?? {};
  const maxBreakdown = Math.max(...Object.values(breakdown).map(Number), 1);

  return (
    <div className="agent-dashboard">

      {/* Header */}
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

      {/* Stat cards — real animated counts */}
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

        {/* Recent tickets table — real data, navigate passes ticketId */}
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

        {/* Priority breakdown — real data */}
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

          {/* SLA — still static, noted below */}
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

      {/* Bottom row */}
      <div className="agent-dashboard-bottom">

        {/* Recent activity — built from recent_tickets, not hardcoded */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Recent Activity</span>
          </div>
          <div className="agent-card-body" style={{ padding: "8px 20px" }}>
            <div className="agent-activity-list">
              {loading ? (
                <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>Loading activity…</div>
              ) : recentTickets.length === 0 ? (
                <div style={{ fontSize: 13, color: "#9ca3af", padding: "12px 0" }}>No recent activity.</div>
              ) : (
                recentTickets.map(t => (
                  <div className="agent-activity-item" key={t.dbId}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate("/agent/ticket-details", { state: { ticketId: t.dbId } })}>
                    <div className={`agent-activity-dot agent-activity-dot--${normalizeStatus(t.status)}`} />
                    <div>
                      <div className="agent-activity-text">
                        Ticket <strong>{t.number}</strong> — {t.title}
                      </div>
                      <div className="agent-activity-time">{t.age} · {t.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="agent-card">
          <div className="agent-card-header">
            <span className="agent-card-title">Quick Actions</span>
          </div>
          <div className="agent-card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "View Assigned Tickets",  path: "/agent/assigned-tickets", cls: "primary" },
              { label: "Update a Ticket Status", path: "/agent/assigned-tickets", cls: "ghost"   },
              { label: "Resolve a Ticket",       path: "/agent/assigned-tickets", cls: "accent"  },
            ].map(a => (
              <button key={a.label}
                className={`agent-btn agent-btn--${a.cls}`}
                style={{ justifyContent: "center" }}
                onClick={() => navigate(a.path)}>
                {a.label}
              </button>
            ))}

            {/* Real performance stats from API */}
            <div style={{ padding: "12px 0 4px", borderTop: "1px solid var(--agent-border)", marginTop: 4 }}>
              <div style={{ fontSize: 12, color: "var(--agent-muted)", marginBottom: 8, fontWeight: 600 }}>
                MY QUEUE TODAY
              </div>
              {[
                { label: "Total Assigned", val: loading ? "—" : (dashboard?.stats?.assigned ?? 0) },
                { label: "In Progress",    val: loading ? "—" : (dashboard?.stats?.in_progress ?? 0) },
                { label: "Resolved Today", val: loading ? "—" : (dashboard?.stats?.resolved_today ?? 0) },
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