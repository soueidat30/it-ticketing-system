import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AssignedTickets.css";

const IC = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  table:    "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18",
  grid:     "M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
  update:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  resolve:  "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  ticket:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  sortAsc:  "M3 6h18 M7 12h10 M10 18h4",
  chevL:    "M15 18l-6-6 6-6",
  chevR:    "M9 18l6-6-6-6",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
};

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER   = { open: 0, "in-progress": 1, pending: 2, resolved: 3, closed: 4 };

const SUMMARY_CHIPS = [
  { label: "Total",       color: "#03363d", filter: "all"         },
  { label: "Open",        color: "#1d4ed8", filter: "open"        },
  { label: "In Progress", color: "#6d28d9", filter: "in-progress" },
  { label: "Pending",     color: "#d97706", filter: "pending"     },
  { label: "Overdue",     color: "#dc2626", filter: "overdue"     },
];

const initials = (name) =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const PriorityBadge = ({ p }) => (
  <span className={`agent-badge agent-badge--${p}`}>{p}</span>
);
const StatusBadge = ({ s }) => (
  <span className={`agent-badge agent-badge--${s}`}>{s.replace("-", " ")}</span>
);

const formatCreatedAt = (rawDate) => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSlaThresholdHours = (priority) => {
  const thresholds = {
    critical: 4,
    high: 8,
    medium: 12,
    low: 24,
  };
  return thresholds[priority] ?? 24;
};

const isTicketOverdue = (status, priority, hoursAgo) => {
  if (hoursAgo === null) return false;
  if (["resolved", "closed"].includes(status)) return false;
  return hoursAgo >= getSlaThresholdHours(priority);
};

const normalizeTicketStatus = (statusName) =>
  statusName?.toLowerCase().replace(" ", "-") ?? "open";

export default function AssignedTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search,    setSearch]    = useState("");
  const [priority,  setPriority]  = useState("all");
  const [status,    setStatus]    = useState("all");
  const [category,  setCategory]  = useState("all");
  const [sortKey,   setSortKey]   = useState("priority");
  const [view,      setView]      = useState("table"); // "table" | "cards"
  const [page,      setPage]      = useState(1);
  const [chipFilter, setChipFilter] = useState("all");

  useEffect(() => {
    const loadTickets = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Unauthorized access. Please log in.");
        setTickets([]);
        setLoading(false);
        navigate("/", { replace: true });
        return;
      }

      try {
        const res = await fetch("http://127.0.0.1:8000/api/agent/tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        const data = await res.json();
        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setError(data.message || "Unauthorized. Please log in again.");
          setTickets([]);
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) {
          setError(data.message || "Failed to load tickets.");
          setTickets([]);
          return;
        }

        const ticketsList = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
            ? data.data
            : [];

        setTickets(ticketsList);
        setError(null);
      } catch (fetchError) {
        console.error("Error fetching tickets:", fetchError);
        setError("Unable to load tickets. Please try again.");
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, [navigate]);

  const ticketsArray = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );
  const [now] = useState(() => Date.now());
  const categories = [...new Set(
    ticketsArray
      .map(t => t.category?.category_name)
      .filter(Boolean)
  )];
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    let list = ticketsArray.map(t => {
      const createdDate = new Date(t.created_at);
      const hoursAgo = Number.isNaN(createdDate.getTime())
        ? null
        : Math.floor((now - createdDate.getTime()) / (1000 * 60 * 60));
      const priority = t.priority?.priority_name?.toLowerCase() ?? "low";
      const status = normalizeTicketStatus(t.status?.status_name);

      return {
        id: t.ticket_number,
        subject: t.title,
        desc: t.description,
        requester: t.creator?.full_name ?? t.user?.full_name ?? "Unknown",
        dept: t.creator?.department ?? t.user?.department ?? "N/A",
        priority,
        status,
        category: t.category?.category_name ?? "General",
        createdAt: t.created_at,
        createdAtLabel: formatCreatedAt(t.created_at),
        age: hoursAgo !== null ? `${hoursAgo}h` : "—",
        overdue: isTicketOverdue(status, priority, hoursAgo),
      };
    });

    if (chipFilter === "overdue")     list = list.filter(t => t.overdue);
    else if (chipFilter !== "all")    list = list.filter(t => t.status === chipFilter);

    if (search)    list = list.filter(t =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.requester.toLowerCase().includes(search.toLowerCase()) ||
      String(t.id).toLowerCase().includes(search.toLowerCase())
    );
    if (priority !== "all") list = list.filter(t => t.priority === priority);
    if (status   !== "all") list = list.filter(t => t.status   === status);
    if (category !== "all") list = list.filter(t => t.category === category);

    list.sort((a, b) => {
      if (sortKey === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortKey === "status")   return STATUS_ORDER[a.status]     - STATUS_ORDER[b.status];
      if (sortKey === "age") {
        const dateA = new Date(a.createdAt).getTime() || 0;
        const dateB = new Date(b.createdAt).getTime() || 0;
        return dateB - dateA;
      }
      return 0;
    });

    return list;
  }, [ticketsArray, now, search, priority, status, category, sortKey, chipFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const go = (path, id) => navigate(path, { state: { ticketId: id } });

  const chipCounts = {
    all:           filtered.length,
    open:          filtered.filter(t => t.status === "open").length,
    "in-progress":filtered.filter(t => t.status === "in-progress").length,
    pending:       filtered.filter(t => t.status === "pending").length,
    overdue:       filtered.filter(t => t.overdue).length,
  };


  if (loading) {
    return (
      <div className="assigned-tickets">
        <div className="agent-page-header">
          <div>
            <h1 className="agent-page-title">Assigned Tickets</h1>
            <p className="agent-page-subtitle">Loading tickets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-tickets">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Assigned Tickets</h1>
          <p className="agent-page-subtitle">
            {filtered.length} ticket{filtered.length !== 1 ? "s" : ""} in your queue
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: 20,
          padding: "14px 18px",
          borderRadius: "var(--radius)",
          border: "1px solid #fca5a5",
          background: "#fee2e2",
          color: "#b91c1c",
          fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      <div className="at-summary">
        {SUMMARY_CHIPS.map(chip => (
          <button
            key={chip.filter}
            className="at-summary-chip"
            style={chipFilter === chip.filter
              ? { borderColor: chip.color, background: chip.color + "10" }
              : {}}
            onClick={() => { setChipFilter(chip.filter); setPage(1); }}
          >
            <span className="at-summary-chip-dot" style={{ background: chip.color }} />
            <span className="at-summary-chip-val">{chipCounts[chip.filter]}</span>
            {chip.label}
          </button>
        ))}
      </div>

      <div className="at-toolbar">
        <div className="at-search">
          <svg className="at-search-icon" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={IC.search} />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tickets, requesters…"
          />
        </div>

        <select className="at-filter-select" value={priority}
          onChange={e => { setPriority(e.target.value); setPage(1); }}>
          <option value="all">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select className="at-filter-select" value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="pending">Pending</option>
        </select>

        <select className="at-filter-select" value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select className="at-filter-select" value={sortKey}
          onChange={e => setSortKey(e.target.value)}>
          <option value="priority">Sort: Priority</option>
          <option value="status">Sort: Status</option>
          <option value="age">Sort: Newest</option>
        </select>

        <div className="at-toolbar-right">
          <div className="at-view-toggle">
            <button className={`at-view-btn${view === "table" ? " active" : ""}`}
              onClick={() => setView("table")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d={IC.table} />
              </svg>
              Table
            </button>
            <button className={`at-view-btn${view === "cards" ? " active" : ""}`}
              onClick={() => setView("cards")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d={IC.grid} />
              </svg>
              Cards
            </button>
          </div>
        </div>
      </div>

      {view === "table" && (
        <div className="at-table-wrap">
          {paginated.length === 0 ? (
            <div className="at-empty">
              <div className="at-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d={IC.ticket} />
                </svg>
              </div>
              <div className="at-empty-title">No tickets found</div>
              <div className="at-empty-desc">Try adjusting your filters or search query.</div>
            </div>
          ) : (
            <table className="at-table">
              <thead>
                <tr>
                  <th onClick={() => setSortKey("age")}>ID</th>
                  <th>Subject</th>
                  <th>Requester</th>
                  <th onClick={() => setSortKey("priority")}>Priority</th>
                  <th onClick={() => setSortKey("status")}>Status</th>
                  <th>Category</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.id} onClick={() => go("/agent/ticket-details", t.id)}>
                    <td>
                      <span className="at-ticket-id">#{t.id}</span>
                      {t.overdue && (
                        <div style={{ fontSize: 10, color: "var(--agent-danger)", fontWeight: 700, marginTop: 2 }}>
                          OVERDUE
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="at-ticket-subject">{t.subject}</div>
                      <div className="at-ticket-desc">{t.desc}</div>
                    </td>
                    <td>
                      <div className="at-user-cell">
                        <div className="at-user-avatar">{initials(t.requester)}</div>
                        <div>
                          <div className="at-user-name">{t.requester}</div>
                          <div className="at-user-dept">{t.dept}</div>
                        </div>
                      </div>
                    </td>
                    <td><PriorityBadge p={t.priority} /></td>
                    <td><StatusBadge s={t.status} /></td>
                    <td><span className="agent-badge" style={{ background: "#f1f5f9", color: "#475569" }}>{t.category}</span></td>
                    <td>
                      <span className={`at-age${t.overdue ? " at-age--overdue" : ""}`}>
                        {t.createdAtLabel}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="at-actions-cell">
                        <button className="agent-btn agent-btn--ghost agent-btn--sm"
                          title="View Details"
                          onClick={() => go("/agent/ticket-details", t.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ width: 13, height: 13 }}>
                            <path d={IC.eye} />
                          </svg>
                        </button>
                        <button className="agent-btn agent-btn--ghost agent-btn--sm"
                          title="Update Status"
                          onClick={() => go("/agent/update-status", t.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ width: 13, height: 13 }}>
                            <path d={IC.update} />
                          </svg>
                        </button>
                        <button className="agent-btn agent-btn--accent agent-btn--sm"
                          title="Resolve"
                          onClick={() => go("/agent/resolve-ticket", t.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ width: 13, height: 13 }}>
                            <path d={IC.resolve} />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {paginated.length > 0 && (
            <div className="at-pagination">
              <span>
                Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–
                {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="at-pagination-pages">
                <button className="at-page-btn" disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: 12, height: 12 }}>
                    <path d={IC.chevL} />
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`at-page-btn${page === p ? " active" : ""}`}
                    onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button className="at-page-btn" disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: 12, height: 12 }}>
                    <path d={IC.chevR} />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {view === "cards" && (
        <>
          {paginated.length === 0 ? (
            <div className="at-empty" style={{ background: "var(--agent-surface)", borderRadius: "var(--radius)", border: "1px solid var(--agent-border)" }}>
              <div className="at-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d={IC.ticket} />
                </svg>
              </div>
              <div className="at-empty-title">No tickets found</div>
              <div className="at-empty-desc">Try adjusting your filters.</div>
            </div>
          ) : (
            <div className="at-cards-grid">
              {paginated.map(t => (
                <div className="at-card" key={t.id}
                  onClick={() => go("/agent/ticket-details", t.id)}>
                  <div className="at-card-top">
                    <span className="at-card-id">#{t.id}</span>
                    <div className="at-card-badges">
                      {t.overdue && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--agent-danger)",
                          background: "#fee2e2", padding: "2px 7px", borderRadius: 10 }}>
                          OVERDUE
                        </span>
                      )}
                      <PriorityBadge p={t.priority} />
                      <StatusBadge s={t.status} />
                    </div>
                  </div>

                  <div className="at-card-subject">{t.subject}</div>
                  <div className="at-card-desc">{t.desc}</div>

                  <div className="at-card-meta">
                    <div className="at-card-meta-user">
                      <div className="at-user-avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                        {initials(t.requester)}
                      </div>
                      {t.requester}
                    </div>
                    <span style={{ fontSize: 11.5 }}>{t.category} · {t.createdAtLabel}</span>
                  </div>

                  <div className="at-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="agent-btn agent-btn--ghost agent-btn--sm"
                      onClick={() => go("/agent/update-status", t.id)}>
                      Update Status
                    </button>
                    <button className="agent-btn agent-btn--accent agent-btn--sm"
                      onClick={() => go("/agent/resolve-ticket", t.id)}>
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
              <button className="at-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                  <path d={IC.chevL} />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`at-page-btn${page === p ? " active" : ""}`}
                  onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="at-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" style={{ width: 12, height: 12 }}>
                  <path d={IC.chevR} />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}