import { useEffect, useState } from "react";
import "./Analytics.css";
import { getAllTickets } from "../../../services/ticketService";

// ── Donut Chart (same style as agent page) ────────────────────────────────────
const DonutChart = ({ data, size = 180, strokeWidth = 24 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="an-donut-svg">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? (
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
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
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" className="an-donut-num">{total}</text>
      <text x="50%" y="62%" textAnchor="middle" className="an-donut-label">
        {total === 1 ? "Ticket" : "Tickets"}
      </text>
    </svg>
  );
};

// ── Bar Chart (same style as agent page) ─────────────────────────────────────
const BarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="an-bar-chart">
      {data.map((d, i) => (
        <div className="an-bar-col" key={i}>
          <div className="an-bar-value">{d.count > 0 ? d.count : ""}</div>
          <div className="an-bar-track">
            <div
              className="an-bar-fill"
              style={{
                height: `${Math.max((d.count / max) * 100, d.count > 0 ? 6 : 0)}%`,
                background: d.color || "var(--an-green)",
              }}
            />
          </div>
          <div className="an-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusName   = (t) => t.status?.status_name     || "Unknown";
const priorityName = (t) => t.priority?.priority_name  || "Unknown";
const categoryName = (t) => t.category?.category_name  || "Other";

const STATUS_COLORS = {
  "open":        "#3b82f6",
  "in progress": "#f97316",
  "pending":     "#8b5cf6",
  "resolved":    "#22c55e",
  "closed":      "#6b7280",
};

const CATEGORY_COLORS = [
  "#03363d", "#1f5c5c", "#d4f265", "#f97316",
  "#3b82f6", "#8b5cf6", "#22c55e", "#ef4444",
];

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className={`an-stat-card an-stat-card--${color}`}>
      <div className="an-stat-icon"><i className={`ti ${icon}`} /></div>
      <div className="an-stat-info">
        <span className="an-stat-value">{value}</span>
        <span className="an-stat-label">{label}</span>
        {sub && <span className="an-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAllTickets(token);
        setTickets(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error(err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [token]);

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusMap = tickets.reduce((acc, t) => {
    const s = statusName(t).toLowerCase();
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusMap).map(([key, value]) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value,
    color: STATUS_COLORS[key] || "#6b7280",
  }));

  // ── Category breakdown ────────────────────────────────────────────────────
  const categoryMap = tickets.reduce((acc, t) => {
    const c = categoryName(t);
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});

  const categoryData = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count], i) => ({
      label: label.length > 10 ? label.slice(0, 9) + "…" : label,
      fullLabel: label,
      count,
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }));

  // ── Priority breakdown ────────────────────────────────────────────────────
  const priorityMap = tickets.reduce((acc, t) => {
    const p = priorityName(t).toLowerCase();
    acc[p] = (acc[p] || 0) + 1;
    return acc;
  }, {});

  // ── KPI stats ─────────────────────────────────────────────────────────────
  const total         = tickets.length;
  const openCount     = statusMap["open"] || 0;
  const resolvedCount = (statusMap["resolved"] || 0) + (statusMap["closed"] || 0);
  const criticalCount = priorityMap["critical"] || 0;
  const inProgCount   = statusMap["in progress"] || 0;

  const resolutionRate = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  if (loading) {
    return (
      <div className="an-loading">
        <span className="an-spinner" />
        Loading analytics…
      </div>
    );
  }

  return (
    <div className="an-page">

      {/* Header */}
      <div className="an-header">
        <div>
          <h1 className="an-title">Analytics</h1>
          <p className="an-subtitle">Overview of all ticket activity and trends</p>
        </div>
        <span className="an-live-badge">
          <span className="an-live-dot" />
          Live Data
        </span>
      </div>

      {/* KPI Cards */}
      <div className="an-stats-grid">
        <StatCard label="Total Tickets"   value={total}          icon="ti-ticket"          color="teal"   sub="All time" />
        <StatCard label="Open"            value={openCount}      icon="ti-folder-open"     color="blue"   sub={`${total ? Math.round((openCount/total)*100) : 0}% of total`} />
        <StatCard label="Resolved"        value={resolvedCount}  icon="ti-circle-check"    color="green"  sub={`${resolutionRate}% resolution rate`} />
        <StatCard label="Critical"        value={criticalCount}  icon="ti-alert-triangle"  color="red"    sub={criticalCount > 0 ? "Needs attention" : "All clear"} />
      </div>

      {/* Charts Row */}
      <div className="an-charts-grid">

        {/* Donut — Status Breakdown */}
        <div className="an-card">
          <div className="an-card__header">
            <h2 className="an-card__title">Ticket Status Breakdown</h2>
            <span className="an-card__sub">{total} total</span>
          </div>
          <div className="an-card__body an-donut-section">
            {total === 0 ? (
              <div className="an-empty">
                <i className="ti ti-chart-donut" />
                <p>No ticket data yet</p>
              </div>
            ) : (
              <>
                <DonutChart data={statusData} />
                <div className="an-legend">
                  {statusData.map(d => (
                    <div key={d.key} className="an-legend-item">
                      <span className="an-legend-dot" style={{ background: d.color }} />
                      <span className="an-legend-label">{d.label}</span>
                      <span className="an-legend-count">{d.value}</span>
                      <span className="an-legend-pct">
                        {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bar Chart — Category Breakdown */}
        <div className="an-card">
          <div className="an-card__header">
            <h2 className="an-card__title">Tickets by Category</h2>
            <span className="an-card__sub">{Object.keys(categoryMap).length} categories</span>
          </div>
          <div className="an-card__body">
            {categoryData.length === 0 ? (
              <div className="an-empty">
                <i className="ti ti-chart-bar" />
                <p>No category data yet</p>
              </div>
            ) : (
              <>
                <BarChart data={categoryData} />
                <div className="an-cat-legend">
                  {categoryData.map((d, i) => (
                    <div key={i} className="an-cat-legend-item">
                      <span className="an-legend-dot" style={{ background: d.color }} />
                      <span className="an-legend-label">{d.fullLabel}</span>
                      <span className="an-legend-count">{d.count}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Priority breakdown row */}
      <div className="an-card">
        <div className="an-card__header">
          <h2 className="an-card__title">Priority Distribution</h2>
          <span className="an-card__sub">{total} tickets</span>
        </div>
        <div className="an-card__body an-priority-row">
          {[
            { label: "Critical", key: "critical", color: "#ef4444" },
            { label: "High",     key: "high",     color: "#f97316" },
            { label: "Medium",   key: "medium",   color: "#eab308" },
            { label: "Low",      key: "low",      color: "#22c55e" },
          ].map(p => {
            const count = priorityMap[p.key] || 0;
            const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={p.key} className="an-priority-item">
                <div className="an-priority-top">
                  <span className="an-priority-label">{p.label}</span>
                  <span className="an-priority-count">{count}</span>
                </div>
                <div className="an-priority-bar">
                  <div
                    className="an-priority-fill"
                    style={{ width: `${pct}%`, background: p.color }}
                  />
                </div>
                <span className="an-priority-pct">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}