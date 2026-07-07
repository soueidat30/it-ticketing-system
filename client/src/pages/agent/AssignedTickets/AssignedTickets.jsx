import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
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
  { key: "total",       color: "#03363d", filter: "all"         },
  { key: "open",        color: "#1d4ed8", filter: "open"        },
  { key: "inProgress",  color: "#6d28d9", filter: "in-progress" },
  { key: "pending",     color: "#d97706", filter: "pending"     },
];

const initials = (name) =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const formatCreatedAt = (rawDate) => {
  if (!rawDate) return "—";
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) return "—";
  // guard against Unix epoch / invalid null → Date(0) → 1970 bug
  if (date.getFullYear() < 2000) return "—";

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
  const { t } = useLanguage();

  const PriorityBadge = ({ p }) => (
    <span className={`agent-badge agent-badge--${p}`}>{t(`agent.priority.${p}`, p)}</span>
  );
  const StatusBadge = ({ s }) => (
    <span className={`agent-badge agent-badge--${s}`}>{t(`agent.status.${s}`, s.replace("-", " "))}</span>
  );

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
        setError(t("agent.assignedTickets.unauthorized", "Unauthorized access. Please log in."));
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
          setError(data.message || t("agent.assignedTickets.unauthorizedReload", "Unauthorized. Please log in again."));
          setTickets([]);
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) {
          setError(data.message || t("agent.assignedTickets.loadError", "Failed to load tickets."));
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
        setError(t("agent.assignedTickets.loadErrorGeneric", "Unable to load tickets. Please try again."));
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const ticketsArray = useMemo(
    () => (Array.isArray(tickets) ? tickets : []),
    [tickets]
  );
  const [now] = useState(() => Date.now());
  const categories = [...new Set(
    ticketsArray
      .map(t2 => t2.category?.category_name)
      .filter(Boolean)
  )];
  const PER_PAGE = 8;

  const filtered = useMemo(() => {
    let list = ticketsArray.map(tk => {
      const createdDate = tk.created_at ? new Date(tk.created_at) : null;
      const hoursAgo = (!createdDate || Number.isNaN(createdDate.getTime()) || createdDate.getFullYear() < 2000)
        ? null
        : Math.floor((now - createdDate.getTime()) / (1000 * 60 * 60));
      const priorityKey = tk.priority?.priority_name?.toLowerCase() ?? "low";
      const statusKey = normalizeTicketStatus(tk.status?.status_name);

      return {
        id: tk.ticket_number,
        subject: tk.title,
        desc: tk.description,
        requester: tk.user?.full_name ?? tk.user?.username ?? t("common.unknown", "Unknown"),
        dept: tk.user?.department || t("common.notSpecified", "No department"),
        priority: priorityKey,
        status: statusKey,
        category: tk.category?.category_name ?? "General",
        createdAt: tk.created_at,
        createdAtLabel: formatCreatedAt(tk.created_at),
        age: hoursAgo !== null ? `${hoursAgo}h` : "—",
        overdue: isTicketOverdue(statusKey, priorityKey, hoursAgo),
      };
    });

    if (chipFilter === "overdue")     list = list.filter(tk => tk.overdue);
    else if (chipFilter !== "all")    list = list.filter(tk => tk.status === chipFilter);

    if (search)    list = list.filter(tk =>
      tk.subject.toLowerCase().includes(search.toLowerCase()) ||
      tk.requester.toLowerCase().includes(search.toLowerCase()) ||
      String(tk.id).toLowerCase().includes(search.toLowerCase())
    );
    if (priority !== "all") list = list.filter(tk => tk.priority === priority);
    if (status   !== "all") list = list.filter(tk => tk.status   === status);
    if (category !== "all") list = list.filter(tk => tk.category === category);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketsArray, now, search, priority, status, category, sortKey, chipFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const go = (path, id) => navigate(path, { state: { ticketId: id } });

  const chipCounts = {
    all:           filtered.length,
    open:          filtered.filter(tk => tk.status === "open").length,
    "in-progress":filtered.filter(tk => tk.status === "in-progress").length,
    pending:       filtered.filter(tk => tk.status === "pending").length,
    overdue:       filtered.filter(tk => tk.overdue).length,
  };


  if (loading) {
    return (
      <div className="assigned-tickets">
        <div className="agent-page-header">
          <div>
            <h1 className="agent-page-title">{t("agent.assignedTickets.title", "Assigned Tickets")}</h1>
            <p className="agent-page-subtitle">{t("agent.assignedTickets.loading", "Loading tickets...")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assigned-tickets">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.assignedTickets.title", "Assigned Tickets")}</h1>
          <p className="agent-page-subtitle">
            {filtered.length === 1
              ? t("agent.assignedTickets.subtitle_one", "1 ticket in your queue")
              : t("agent.assignedTickets.subtitle_other", "{{count}} tickets in your queue", { count: filtered.length })}
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
            {t(`agent.assignedTickets.chips.${chip.key}`, chip.key)}
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
            placeholder={t("agent.assignedTickets.searchPlaceholder", "Search tickets, requesters…")}
          />
        </div>

        <select className="at-filter-select" value={priority}
          onChange={e => { setPriority(e.target.value); setPage(1); }}>
          <option value="all">{t("agent.assignedTickets.filters.allPriorities", "All Priorities")}</option>
          <option value="critical">{t("agent.priority.critical", "Critical")}</option>
          <option value="high">{t("agent.priority.high", "High")}</option>
          <option value="medium">{t("agent.priority.medium", "Medium")}</option>
          <option value="low">{t("agent.priority.low", "Low")}</option>
        </select>

        <select className="at-filter-select" value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">{t("agent.assignedTickets.filters.allStatuses", "All Statuses")}</option>
          <option value="open">{t("agent.status.open", "Open")}</option>
          <option value="in-progress">{t("agent.status.in-progress", "In Progress")}</option>
          <option value="pending">{t("agent.status.pending", "Pending")}</option>
        </select>

        <select className="at-filter-select" value={category}
          onChange={e => { setCategory(e.target.value); setPage(1); }}>
          <option value="all">{t("agent.assignedTickets.filters.allCategories", "All Categories")}</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select className="at-filter-select" value={sortKey}
          onChange={e => setSortKey(e.target.value)}>
          <option value="priority">{t("agent.assignedTickets.filters.sortPriority", "Sort: Priority")}</option>
          <option value="status">{t("agent.assignedTickets.filters.sortStatus", "Sort: Status")}</option>
          <option value="age">{t("agent.assignedTickets.filters.sortNewest", "Sort: Newest")}</option>
        </select>

        <div className="at-toolbar-right">
          <div className="at-view-toggle">
            <button className={`at-view-btn${view === "table" ? " active" : ""}`}
              onClick={() => setView("table")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d={IC.table} />
              </svg>
              {t("agent.assignedTickets.view.table", "Table")}
            </button>
            <button className={`at-view-btn${view === "cards" ? " active" : ""}`}
              onClick={() => setView("cards")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}>
                <path d={IC.grid} />
              </svg>
              {t("agent.assignedTickets.view.cards", "Cards")}
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
              <div className="at-empty-title">{t("agent.assignedTickets.empty.title", "No tickets found")}</div>
              <div className="at-empty-desc">{t("agent.assignedTickets.empty.desc", "Try adjusting your filters or search query.")}</div>
            </div>
          ) : (
            <table className="at-table">
              <thead>
                <tr>
                  <th onClick={() => setSortKey("age")}>{t("agent.assignedTickets.table.colId", "ID")}</th>
                  <th>{t("agent.assignedTickets.table.colSubject", "Subject")}</th>
                  <th>{t("agent.assignedTickets.table.colRequester", "Requester")}</th>
                  <th onClick={() => setSortKey("priority")}>{t("agent.assignedTickets.table.colPriority", "Priority")}</th>
                  <th onClick={() => setSortKey("status")}>{t("agent.assignedTickets.table.colStatus", "Status")}</th>
                  <th>{t("agent.assignedTickets.table.colCategory", "Category")}</th>
                  <th>{t("agent.assignedTickets.table.colCreated", "Created At")}</th>
                  <th>{t("agent.assignedTickets.table.colActions", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(tk => (
                  <tr key={tk.id} onClick={() => go("/agent/ticket-details", tk.id)}>
                    <td>
                      <span className="at-ticket-id">#{tk.id}</span>

                    </td>
                    <td>
                      <div className="at-ticket-subject">{tk.subject}</div>
                      <div className="at-ticket-desc">{tk.desc}</div>
                    </td>
                    <td>
                      <div className="at-user-cell">
                        <div className="at-user-avatar">{initials(tk.requester)}</div>
                        <div>
                          <div className="at-user-name">{tk.requester}</div>
                        </div>
                      </div>
                    </td>
                    <td><PriorityBadge p={tk.priority} /></td>
                    <td><StatusBadge s={tk.status} /></td>
                    <td><span className="agent-badge" style={{ background: "#f1f5f9", color: "#475569" }}>{tk.category}</span></td>
                    <td>
                      <span>
                        {tk.createdAtLabel}
                      </span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="at-actions-cell">
                        <button className="agent-btn agent-btn--ghost agent-btn--sm"
                          title={t("agent.assignedTickets.actions.view", "View Details")}
                          onClick={() => go("/agent/ticket-details", tk.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ width: 13, height: 13 }}>
                            <path d={IC.eye} />
                          </svg>
                        </button>
                        <button className="agent-btn agent-btn--ghost agent-btn--sm"
                          title={t("agent.assignedTickets.actions.updateStatus", "Update Status")}
                          onClick={() => go("/agent/update-status", tk.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                            style={{ width: 13, height: 13 }}>
                            <path d={IC.update} />
                          </svg>
                        </button>
                        <button className="agent-btn agent-btn--accent agent-btn--sm"
                          title={t("agent.assignedTickets.actions.resolve", "Resolve")}
                          onClick={() => go("/agent/resolve-ticket", tk.id)}>
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
                {t("agent.assignedTickets.pagination.showing", "Showing {{from}}–{{to}} of {{total}}", {
                  from: Math.min((page - 1) * PER_PAGE + 1, filtered.length),
                  to: Math.min(page * PER_PAGE, filtered.length),
                  total: filtered.length,
                })}
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
              <div className="at-empty-title">{t("agent.assignedTickets.empty.title", "No tickets found")}</div>
              <div className="at-empty-desc">{t("agent.assignedTickets.empty.desc", "Try adjusting your filters.")}</div>
            </div>
          ) : (
            <div className="at-cards-grid">
              {paginated.map(tk => (
                <div className="at-card" key={tk.id}
                  onClick={() => go("/agent/ticket-details", tk.id)}>
                  <div className="at-card-top">
                    <span className="at-card-id">#{tk.id}</span>
                    <div className="at-card-badges">
                      {tk.overdue && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--agent-danger)",
                          background: "#fee2e2", padding: "2px 7px", borderRadius: 10 }}>
                          {t("agent.assignedTickets.overdue", "OVERDUE")}
                        </span>
                      )}
                      <PriorityBadge p={tk.priority} />
                      <StatusBadge s={tk.status} />
                    </div>
                  </div>

                  <div className="at-card-subject">{tk.subject}</div>
                  <div className="at-card-desc">{tk.desc}</div>

                  <div className="at-card-meta">
                    <div className="at-card-meta-user">
                      <div className="at-user-avatar" style={{ width: 24, height: 24, fontSize: 9 }}>
                        {initials(tk.requester)}
                      </div>
                      {tk.requester}
                    </div>
                    <span style={{ fontSize: 11.5 }}>{tk.category} · {tk.createdAtLabel}</span>
                  </div>

                  <div className="at-card-actions" onClick={e => e.stopPropagation()}>
                    <button className="agent-btn agent-btn--ghost agent-btn--sm"
                      onClick={() => go("/agent/update-status", tk.id)}>
                      {t("agent.assignedTickets.actions.updateStatus", "Update Status")}
                    </button>
                    <button className="agent-btn agent-btn--accent agent-btn--sm"
                      onClick={() => go("/agent/resolve-ticket", tk.id)}>
                      {t("agent.assignedTickets.actions.resolve", "Resolve")}
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