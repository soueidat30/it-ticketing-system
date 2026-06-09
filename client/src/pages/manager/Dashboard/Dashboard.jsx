import "./Dashboard.css";
import { useEffect, useState } from "react";
import { getAllTickets } from "../../../services/ticketService";

// ─── helpers — matched to your exact API shape ───────────────────────────────
// field is "title" not "subject"
const ticketTitle  = (t) => t.title || "—";
const statusName   = (t) => t.status?.status_name    || "Unknown";
const priorityName = (t) => t.priority?.priority_name || "Unknown";
const categoryName = (t) => t.category?.category_name || "Other";
const employeeName = (t) => t.user?.full_name          || "—";
const ticketNumber = (t) => t.ticket_number            || `#${t.id}`;

const STATUS_COLORS = {
  open:          "blue",
  "in progress": "orange",
  pending:       "purple",
  resolved:      "green",
  closed:        "gray",
};

const PRIORITY_COLORS = {
  low:      "green",
  medium:   "orange",
  high:     "red",
  critical: "red",
};

const statusColor   = (s = "") => STATUS_COLORS[s.toLowerCase()]   || "gray";
const priorityColor = (p = "") => PRIORITY_COLORS[p.toLowerCase()] || "gray";

// ─── sub-components ──────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className={`mgr-stat-card mgr-stat-card--${color}`}>
      <div className="mgr-stat-icon">
        <i className={`ti ${icon}`} />
      </div>
      <div className="mgr-stat-info">
        <span className="mgr-stat-value">{value}</span>
        <span className="mgr-stat-label">{label}</span>
        {sub && <span className="mgr-stat-sub">{sub}</span>}
      </div>
    </div>
  );
}

function Badge({ text, colorKey }) {
  return (
    <span className={`mgr-badge mgr-badge--${colorKey}`}>{text}</span>
  );
}

function MiniBar({ label, count, max, color }) {
  const pct = max ? Math.round((count / max) * 100) : 0;
  return (
    <div className="mgr-minibar">
      <span className="mgr-minibar__label">{label}</span>
      <div className="mgr-minibar__track">
        <div
          className={`mgr-minibar__fill mgr-minibar__fill--${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="mgr-minibar__count">{count}</span>
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const [tickets,      setTickets]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!token) { setTickets([]); return; }
        const data = await getAllTickets(token);
        // your API returns a plain array
        setTickets(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        console.error("Error loading tickets:", err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [token]);

  // ── derived stats (all live from real data) ───────────────────────────────
  const total         = tickets.length;
  const openCount     = tickets.filter(t => statusName(t).toLowerCase() === "open").length;
  const inProgCount   = tickets.filter(t => statusName(t).toLowerCase() === "in progress").length;
  const resolvedCount = tickets.filter(t => ["resolved", "closed"].includes(statusName(t).toLowerCase())).length;
  const criticalCount = tickets.filter(t => priorityName(t).toLowerCase() === "critical").length;
  const highCount     = tickets.filter(t => ["high", "critical"].includes(priorityName(t).toLowerCase())).length;

  // category breakdown for bar chart
  const categoryMap = tickets.reduce((acc, t) => {
    const cat = categoryName(t);
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const catMax = Math.max(...Object.values(categoryMap), 1);
  const CAT_COLORS = ["blue", "orange", "green", "purple", "red", "gray"];

  // recent 8 tickets sorted by newest first
  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8);

  // search (title, ticket_number, employee name) + status filter
  const statusOptions = ["All", "Open", "In Progress", "Pending", "Resolved", "Closed"];

  const filteredTickets = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      ticketTitle(t).toLowerCase().includes(q) ||
      ticketNumber(t).toLowerCase().includes(q) ||
      employeeName(t).toLowerCase().includes(q) ||
      categoryName(t).toLowerCase().includes(q);

    const matchStatus =
      filterStatus === "All" ||
      statusName(t).toLowerCase() === filterStatus.toLowerCase();

    return matchSearch && matchStatus;
  });

  // greeting based on time of day
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = user.full_name?.split(" ")[0] ?? "Manager";

  return (
    <div className="mgr-dashboard">

      {/* ── HEADER ── */}
      <div className="mgr-dashboard__header">
        <div>
          <h1 className="mgr-dashboard__title">
            {greeting}, {firstName} 👋
          </h1>
          <p className="mgr-dashboard__subtitle">
            Here's what your team is working on today —{" "}
            <strong>{total}</strong> ticket{total !== 1 ? "s" : ""} total
          </p>
        </div>
        <div className="mgr-dashboard__meta">
          <span className="mgr-live-badge">
            <span className="mgr-live-dot" />
            Live
          </span>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="mgr-stats-grid">
        <StatCard
          label="Open Tickets"
          value={openCount}
          icon="ti-folder-open"
          color="blue"
          sub={`${total ? Math.round((openCount / total) * 100) : 0}% of total`}
        />
        <StatCard
          label="In Progress"
          value={inProgCount}
          icon="ti-loader"
          color="orange"
          sub="Being worked on"
        />
        <StatCard
          label="Resolved"
          value={resolvedCount}
          icon="ti-circle-check"
          color="green"
          sub="Closed & resolved"
        />
        <StatCard
          label="High / Critical"
          value={highCount}
          icon="ti-alert-triangle"
          color="red"
          sub={highCount > 0 ? "Needs attention" : "All clear"}
        />
      </div>

      {/* ── BODY: table + sidebar ── */}
      <div className="mgr-body-grid">

        {/* LEFT – ticket table */}
        <div className="mgr-card mgr-card--table">
          <div className="mgr-card__header">
            <h2 className="mgr-card__title">All Team Tickets</h2>

            <div className="mgr-controls">
              <div className="mgr-search">
                <i className="ti ti-search mgr-search__icon" />
                <input
                  className="mgr-search__input"
                  placeholder="Search by title, ticket no. or employee…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <select
                className="mgr-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                {statusOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mgr-table-wrapper">
            {loading ? (
              <div className="mgr-loading">
                <i className="ti ti-loader mgr-loading__icon" />
                <span>Loading tickets…</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="mgr-empty">
                <i className="ti ti-ticket-off" />
                <p>No tickets match your filters.</p>
              </div>
            ) : (
              <table className="mgr-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Title</th>
                    <th>Employee</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((t) => {
                    const sName = statusName(t);
                    const pName = priorityName(t);
                    const date  = t.created_at
                      ? new Date(t.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit", month: "short",
                        })
                      : "—";

                    return (
                      <tr key={t.id} className="mgr-table__row">
                        <td className="mgr-table__id">{ticketNumber(t)}</td>
                        <td className="mgr-table__subject">{ticketTitle(t)}</td>
                        <td>{employeeName(t)}</td>
                        <td>{categoryName(t)}</td>
                        <td>
                          <Badge text={pName} colorKey={priorityColor(pName)} />
                        </td>
                        <td>
                          <Badge text={sName} colorKey={statusColor(sName)} />
                        </td>
                        <td className="mgr-table__date">{date}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filteredTickets.length > 0 && (
            <div className="mgr-card__footer">
              Showing {filteredTickets.length} of {total} ticket{total !== 1 ? "s" : ""}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <div className="mgr-sidebar-col">

          {/* Category breakdown */}
          <div className="mgr-card">
            <div className="mgr-card__header">
              <h2 className="mgr-card__title">Tickets by Category</h2>
            </div>
            <div className="mgr-card__body">
              {Object.keys(categoryMap).length === 0 ? (
                <p className="mgr-empty-text">No data yet</p>
              ) : (
                Object.entries(categoryMap)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count], i) => (
                    <MiniBar
                      key={cat}
                      label={cat}
                      count={count}
                      max={catMax}
                      color={CAT_COLORS[i % CAT_COLORS.length]}
                    />
                  ))
              )}
            </div>
          </div>

          {/* Recent activity feed */}
          <div className="mgr-card">
            <div className="mgr-card__header">
              <h2 className="mgr-card__title">Recent Activity</h2>
            </div>
            <div className="mgr-card__body mgr-activity">
              {loading ? (
                <p className="mgr-empty-text">Loading…</p>
              ) : recentTickets.length === 0 ? (
                <p className="mgr-empty-text">No tickets yet.</p>
              ) : (
                recentTickets.map(t => {
                  const sName = statusName(t);
                  return (
                    <div key={t.id} className="mgr-activity__item">
                      <span className={`mgr-activity__dot mgr-activity__dot--${statusColor(sName)}`} />
                      <div className="mgr-activity__text">
                        <span className="mgr-activity__subject">
                          {ticketTitle(t)}
                        </span>
                        <span className="mgr-activity__meta">
                          {employeeName(t)} · <Badge text={sName} colorKey={statusColor(sName)} />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}