import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./Dashboard.css";
import { getMyTickets } from "../../../services/ticketService";

// ── FIX: Added "In progress" tab ─────────────────────────────────────────────
const TAB_DEFS = [
  { value: "All",         labelKey: "dashboard.tabs.all",        fallback: "All"         },
  { value: "Open",        labelKey: "dashboard.tabs.open",       fallback: "Open"        },
  { value: "In progress", labelKey: "dashboard.tabs.inProgress", fallback: "In Progress" },
  { value: "Pending",     labelKey: "dashboard.tabs.pending",    fallback: "Pending"     },
  { value: "Resolved",    labelKey: "dashboard.tabs.resolved",   fallback: "Resolved"    },
  { value: "Closed",      labelKey: "dashboard.tabs.closed",     fallback: "Closed"      },
];

// ── Donut Chart ───────────────────────────────────────────────────────────────
const DonutChart = ({ data, size = 150, strokeWidth = 20, centerLabel }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="emp-donut-svg">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {total === 0 ? (
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        ) : data.map((d) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const gap = circumference - dash;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={d.key}
              cx={size/2} cy={size/2} r={radius}
              fill="none" stroke={d.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
        })}
      </g>
      <text x="50%" y="46%" textAnchor="middle" className="emp-donut-num">{total}</text>
      <text x="50%" y="62%" textAnchor="middle" className="emp-donut-label">{centerLabel}</text>
    </svg>
  );
};

// ── Line Chart ────────────────────────────────────────────────────────────────
const LineChart = ({ tickets, labels }) => {
  const [tooltip, setTooltip] = useState(null);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d,
      label: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      shortLabel: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
      created: 0,
      resolved: 0,
    };
  });

  tickets.forEach(t => {
    if (t.created_at) {
      const created = new Date(t.created_at).toDateString();
      const idx = days.findIndex(d => d.date.toDateString() === created);
      if (idx !== -1) days[idx].created++;
    }
    if (t.resolved_at) {
      const resolved = new Date(t.resolved_at).toDateString();
      const idx = days.findIndex(d => d.date.toDateString() === resolved);
      if (idx !== -1) days[idx].resolved++;
    }
  });

  const W = 520, H = 160, padL = 32, padR = 16, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const maxVal = Math.max(...days.map(d => Math.max(d.created, d.resolved)), 1);

  const xOf = (i) => padL + (i / (days.length - 1)) * chartW;
  const yOf = (v) => padT + chartH - (v / maxVal) * chartH;

  const smooth = (pts) => {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp1x = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cp1x} ${pts[i - 1].y} ${cp1x} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  };

  const createdPts  = days.map((d, i) => ({ x: xOf(i), y: yOf(d.created)  }));
  const resolvedPts = days.map((d, i) => ({ x: xOf(i), y: yOf(d.resolved) }));

  const areaPath = (pts, bottom) => {
    if (pts.length === 0) return "";
    const line = smooth(pts);
    return `${line} L ${pts[pts.length-1].x} ${bottom} L ${pts[0].x} ${bottom} Z`;
  };

  const bottomY = padT + chartH;
  const yTicks = [...new Set([0, Math.round(maxVal / 2), maxVal])];
  const showLabels = days.filter((_, i) => i % 3 === 0 || i === days.length - 1);

  return (
    <div className="emp-linechart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="emp-linechart-svg"
        onMouseLeave={() => setTooltip(null)}
      >
        {yTicks.map(v => (
          <g key={v}>
            <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 3" />
            <text x={padL - 4} y={yOf(v) + 4} textAnchor="end" className="emp-linechart-ytick">{v}</text>
          </g>
        ))}

        <defs>
          <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath(createdPts, bottomY)}  fill="url(#gradCreated)"  />
        <path d={areaPath(resolvedPts, bottomY)} fill="url(#gradResolved)" />
        <path d={smooth(createdPts)}  fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d={smooth(resolvedPts)} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />

        {days.map((d, i) => (
          <g key={i}>
            <rect
              x={xOf(i) - 16} y={padT} width={32} height={chartH + padB}
              fill="transparent"
              onMouseEnter={() => setTooltip({ i, d, x: xOf(i), y: Math.min(yOf(d.created), yOf(d.resolved)) })}
            />
            {d.created > 0 && <circle cx={xOf(i)} cy={yOf(d.created)} r="4" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />}
            {d.resolved > 0 && <circle cx={xOf(i)} cy={yOf(d.resolved)} r="4" fill="#22c55e" stroke="#fff" strokeWidth="1.5" />}
          </g>
        ))}

        {showLabels.map((d, i) => {
          const origIdx = days.indexOf(d);
          return (
            <text key={i} x={xOf(origIdx)} y={H - 4} textAnchor="middle" className="emp-linechart-xtick">
              {d.shortLabel}
            </text>
          );
        })}

        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={bottomY} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3 2" />
            <rect x={tooltip.x > W/2 ? tooltip.x - 110 : tooltip.x + 10} y={tooltip.y - 10} width={100} height={56} rx="6" fill="#1f2937" opacity="0.92" />
            <text x={tooltip.x > W/2 ? tooltip.x - 60 : tooltip.x + 60} y={tooltip.y + 10} textAnchor="middle" className="emp-tooltip-date">{tooltip.d.label}</text>
            <text x={tooltip.x > W/2 ? tooltip.x - 60 : tooltip.x + 60} y={tooltip.y + 26} textAnchor="middle" className="emp-tooltip-created">{labels.created}: {tooltip.d.created}</text>
            <text x={tooltip.x > W/2 ? tooltip.x - 60 : tooltip.x + 60} y={tooltip.y + 42} textAnchor="middle" className="emp-tooltip-resolved">{labels.resolved}: {tooltip.d.resolved}</text>
          </g>
        )}
      </svg>

      <div className="emp-linechart-legend">
        <span className="emp-linechart-legend-item">
          <span className="emp-linechart-legend-dot" style={{ background: "#3b82f6" }} />
          {labels.created}
        </span>
        <span className="emp-linechart-legend-item">
          <span className="emp-linechart-legend-dot" style={{ background: "#22c55e" }} />
          {labels.resolved}
        </span>
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("All");
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const user  = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");

  const resources = [
    { icon: "ti-lock",  textKey: "dashboard.resources.resetPassword", fallback: "How to reset your password" },
    { icon: "ti-mail",  textKey: "dashboard.resources.emailIssues",   fallback: "Fix email delivery issues"   },
    { icon: "ti-wifi",  textKey: "dashboard.resources.vpnGuide",      fallback: "VPN connection guide"        },
    { icon: "ti-books", textKey: "dashboard.resources.allArticles",   fallback: "All help articles"           },
  ];

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await getMyTickets(token);
        if (!cancelled) setTickets(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setTickets([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []); // ← empty: fetch once on mount, no infinite loop

  // ── Derived stats ─────────────────────────────────────────────────────────
  const statusOf = (t) => t.status?.status_name || "";

  const openCount       = tickets.filter(t => statusOf(t).toLowerCase() === "open").length;
  const inProgressCount = tickets.filter(t => statusOf(t).toLowerCase() === "in progress").length;
  const pendingCount    = tickets.filter(t => statusOf(t).toLowerCase() === "pending").length;
  const resolvedCount   = tickets.filter(t => ["resolved","closed"].includes(statusOf(t).toLowerCase())).length;
  const total           = tickets.length;

  // Open Tickets card shows Open + In Progress (all "active" tickets)
  const activeCount = openCount + inProgressCount;

  // ── Donut data — all statuses shown separately ────────────────────────────
  const donutData = [
    { key: "open",        label: t("dashboard.tabs.open", "Open"),         value: openCount,       color: "#3b82f6" },
    { key: "in-progress", label: t("dashboard.tabs.inProgress", "In Progress"), value: inProgressCount, color: "#f97316" },
    { key: "pending",     label: t("dashboard.tabs.pending", "Pending"),   value: pendingCount,    color: "#eab308" },
    { key: "resolved",    label: t("dashboard.tabs.resolved", "Resolved"), value: resolvedCount,   color: "#22c55e" },
    { key: "closed",
      label: t("dashboard.tabs.closed", "Closed"),
      value: tickets.filter(t => statusOf(t).toLowerCase() === "closed").length,
      color: "#8b5cf6",
    },
  ].filter(d => d.value > 0);

  // ── Category donut ────────────────────────────────────────────────────────
  const catMap = tickets.reduce((acc, t) => {
    const c = t.category?.category_name || "Other";
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const CAT_COLORS = ["#03363d","#3b82f6","#f97316","#22c55e","#8b5cf6","#ef4444"];
  const catDonutData = Object.entries(catMap).map(([k, v], i) => ({
    key: k, label: k, value: v, color: CAT_COLORS[i % CAT_COLORS.length],
  }));

  // ── Tab filtering — match backend's exact status_name ────────────────────
  const filtered = activeTab === "All"
    ? tickets
    : tickets.filter(t => statusOf(t).toLowerCase() === activeTab.toLowerCase());

  return (
    <div className="emp-dashboard">

      {/* Welcome Header */}
      <div className="emp-dashboard__header">
        <div>
          <h1 className="emp-dashboard__title">
            {t("dashboard.greetingPrefix", "Welcome back,")} {user.full_name?.split(" ")[0] ?? t("dashboard.greetingFallback", "there")}! 👋
          </h1>
          <p className="emp-dashboard__subtitle">{t("dashboard.subtitle", "Create and track your support requests.")}</p>
        </div>
        <button className="emp-dashboard__new-btn" onClick={() => navigate("/employee/create-ticket")}>
          <i className="ti ti-plus" /> {t("dashboard.newTicket", "New Ticket")}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="emp-stats-grid">
        {[
          {
            label: t("dashboard.stats.open", "Open Tickets"),
            value: loading ? "…" : activeCount,
            icon: "ti-ticket",
            color: "blue",
            // show breakdown below the main number
            sub: !loading && inProgressCount > 0
              ? `${openCount} open · ${inProgressCount} in progress`
              : null,
          },
          {
            label: t("dashboard.stats.resolved", "Resolved Tickets"),
            value: loading ? "…" : resolvedCount,
            icon: "ti-circle-check",
            color: "green",
            sub: null,
          },
          {
            label: t("dashboard.stats.pending", "Pending Tickets"),
            value: loading ? "…" : pendingCount,
            icon: "ti-clock",
            color: "orange",
            sub: null,
          },
          {
            label: t("dashboard.stats.total", "Total Tickets"),
            value: loading ? "…" : total,
            icon: "ti-chart-bar",
            color: "purple",
            sub: null,
          },
        ].map(s => (
          <div key={s.label} className={`emp-stat-card emp-stat-card--${s.color}`}>
            <div className="emp-stat-icon"><i className={`ti ${s.icon}`} /></div>
            <div className="emp-stat-info">
              <span className="emp-stat-value">{s.value}</span>
              <span className="emp-stat-label">{s.label}</span>
              {s.sub && <span className="emp-stat-sub">{s.sub}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="emp-charts-row">

        <div className="emp-card emp-chart-card">
          <div className="emp-card__header">
            <h2 className="emp-card__title">{t("dashboard.charts.statusBreakdown", "Status Breakdown")}</h2>
          </div>
          <div className="emp-donut-section">
            <DonutChart data={donutData} centerLabel={t("dashboard.charts.ticketsUnit", "Tickets")} />
            <div className="emp-donut-legend">
              {donutData.length === 0 ? (
                <p className="emp-empty-text">{t("dashboard.charts.noTicketsYet", "No tickets yet")}</p>
              ) : donutData.map(d => (
                <div key={d.key} className="emp-donut-legend-item">
                  <span className="emp-donut-legend-dot" style={{ background: d.color }} />
                  <span className="emp-donut-legend-label">{d.label}</span>
                  <span className="emp-donut-legend-count">{d.value}</span>
                  <span className="emp-donut-legend-pct">
                    {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="emp-card emp-chart-card">
          <div className="emp-card__header">
            <h2 className="emp-card__title">{t("dashboard.charts.byCategory", "By Category")}</h2>
          </div>
          <div className="emp-donut-section">
            <DonutChart data={catDonutData} centerLabel={t("dashboard.charts.ticketsUnit", "Tickets")} />
            <div className="emp-donut-legend">
              {catDonutData.length === 0 ? (
                <p className="emp-empty-text">{t("dashboard.charts.noTicketsYet", "No tickets yet")}</p>
              ) : catDonutData.map(d => (
                <div key={d.key} className="emp-donut-legend-item">
                  <span className="emp-donut-legend-dot" style={{ background: d.color }} />
                  <span className="emp-donut-legend-label">{d.label}</span>
                  <span className="emp-donut-legend-count">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="emp-card emp-chart-card emp-chart-card--wide">
          <div className="emp-card__header">
            <h2 className="emp-card__title">{t("dashboard.charts.ticketsOverTime", "Tickets Over Time (14 Days)")}</h2>
          </div>
          <div className="emp-card__body-chart">
            <LineChart
              tickets={tickets}
              labels={{
                created:  t("dashboard.charts.created", "Created"),
                resolved: t("dashboard.charts.resolved", "Resolved"),
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="emp-dashboard__grid">

        <div className="emp-card emp-tickets-card">
          <div className="emp-card__header">
            <h2 className="emp-card__title">{t("dashboard.table.title", "My Tickets")}</h2>
            <button className="emp-card__link" onClick={() => navigate("/employee/my-tickets")}>
              {t("dashboard.table.viewAll", "View All")} <i className="ti ti-arrow-right" />
            </button>
          </div>

          <div className="emp-tabs">
            {TAB_DEFS.map(tab => (
              <button
                key={tab.value}
                className={`emp-tab ${activeTab === tab.value ? "emp-tab--active" : ""}`}
                onClick={() => setActiveTab(tab.value)}
              >
                {/* show count badge next to In Progress tab */}
                {t(tab.labelKey, tab.fallback)}
                {tab.value === "In progress" && inProgressCount > 0 && (
                  <span className="emp-tab-badge">{inProgressCount}</span>
                )}
              </button>
            ))}
          </div>

          <div className="emp-table-wrapper">
            {loading ? (
              <div className="emp-table-loading"><span className="emp-spinner" /> {t("dashboard.table.loading", "Loading tickets…")}</div>
            ) : filtered.length === 0 ? (
              <div className="emp-table-empty">
                <i className="ti ti-ticket" />
                <p>{t("dashboard.table.empty", "No tickets found")}</p>
              </div>
            ) : (
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>{t("dashboard.table.ticketId", "Ticket ID")}</th>
                    <th>{t("dashboard.table.subject", "Subject")}</th>
                    <th>{t("dashboard.table.category", "Category")}</th>
                    <th>{t("dashboard.table.priority", "Priority")}</th>
                    <th>{t("dashboard.table.status", "Status")}</th>
                    <th>{t("dashboard.table.updated", "Updated")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t2 => (
                    <tr key={t2.id} className="emp-table__row">
                      <td><span className="emp-ticket-id">{t2.ticket_number}</span></td>
                      <td><span className="emp-ticket-subject">{t2.title}</span></td>
                      <td><span className="emp-ticket-category">{t2.category?.category_name || "—"}</span></td>
                      <td><span className={`emp-priority-badge emp-priority-badge--${(t2.priority?.priority_name || "").toLowerCase()}`}>{t2.priority?.priority_name || "—"}</span></td>
                      <td><span className={`emp-status-badge emp-status-badge--${statusOf(t2).toLowerCase().replace(/\s+/g, "-")}`}>{statusOf(t2)}</span></td>
                      <td><span className="emp-time">{t2.created_at ? new Date(t2.created_at).toLocaleDateString() : "—"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="emp-right-col">
          <div className="emp-cta-card" onClick={() => navigate("/employee/create-ticket")}>
            <div className="emp-cta-icon"><i className="ti ti-plus" /></div>
            <div className="emp-cta-text">
              <span className="emp-cta-title">{t("dashboard.cta.title", "Create New Ticket")}</span>
              <span className="emp-cta-sub">{t("dashboard.cta.subtitle", "Need help? Submit a new request")}</span>
            </div>
            <i className="ti ti-arrow-right emp-cta-arrow" />
          </div>

          <div className="emp-card">
            <div className="emp-card__header">
              <h2 className="emp-card__title">{t("dashboard.resources.title", "Helpful Resources")}</h2>
            </div>
            <div className="emp-resources">
              {resources.map(r => (
                <button key={r.textKey} className="emp-resource-item">
                  <i className={`ti ${r.icon}`} />
                  <span>{t(r.textKey, r.fallback)}</span>
                  <i className="ti ti-chevron-right emp-resource-arrow" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showAnnouncement && (
        <div className="emp-announcement">
          <div className="emp-announcement__icon"><i className="ti ti-speakerphone" /></div>
          <div className="emp-announcement__content">
            <span className="emp-announcement__title">{t("dashboard.announcement.title", "System Maintenance")}</span>
            <span className="emp-announcement__text">{t("dashboard.announcement.text", "System maintenance will occur on May 25, 2025 from 12:00 AM to 2:00 AM.")}</span>
          </div>
          <button className="emp-announcement__view">{t("dashboard.announcement.viewDetails", "View Details")}</button>
          <button className="emp-announcement__close" onClick={() => setShowAnnouncement(false)}>
            <i className="ti ti-x" />
          </button>
        </div>
      )}
    </div>
  );
}