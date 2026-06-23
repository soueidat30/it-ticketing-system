import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Tickets.css";

const Icon = ({ d, size = 16 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

const IC = {
  ticket: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  assign:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
  chevL: "M15 18l-6-6 6-6",
  chevR: "M9 18l6-6-6-6",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  x: "M18 6L6 18 M6 6l12 12",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
};

const BASE_URL = "http://127.0.0.1:8000/api";

const ns = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, "-");

const PriorityBadge = ({ p = "low" }) => (
  <span className={`at-badge at-badge--priority-${ns(p)}`}>{p}</span>
);

const StatusBadge = ({ s = "open" }) => (
  <span className={`at-badge at-badge--status-${ns(s)}`}>{String(s).replace(/-/g, " ")}</span>
);

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

const timeAgo = (v) => {
  if (!v) return "—";
  const diff = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const SLAChip = ({ slaPercent, breached }) => {
  const pct = typeof slaPercent === "number" ? slaPercent : 0;
  const isBreached = !!breached;
  const label = isBreached ? "Breached" : `${pct}%`;

  const cls = isBreached
    ? "at-badge at-badge--status-closed"
    : pct >= 80
      ? "at-badge at-badge--priority-critical"
      : pct >= 50
        ? "at-badge at-badge--status-in-progress"
        : "at-badge at-badge--status-pending";

  return <span className={cls}>{label}</span>;
};

export default function Tickets() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pageSize: 10, totalPages: 1 });

  const [agents, setAgents] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}`, Accept: "application/json" }), [token]);

  const resetPage = useCallback(() => setPage(1), []);

  // Assignment modal
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignAgent, setAssignAgent] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Ticket enterprise modal (history/notifications/activity)
  const [enterpriseModal, setEnterpriseModal] = useState({
    open: false,
    ticket: null,
    loading: false,
    error: null,
    assignmentHistory: [],
    notifications: [],
    activityLogs: [],
  });

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);

    const url = `${BASE_URL}/tickets?${params.toString()}`;
    const res = await fetch(url, { headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || "Failed to load tickets.");
      setTickets([]);
      setMeta({ total: 0, page: 1, pageSize: 10, totalPages: 1 });
      setLoading(false);
      return;
    }

    const list = Array.isArray(data?.data) ? data.data : [];
    setTickets(list);
    setMeta(data?.meta || { total: 0, page: page, pageSize, totalPages: 1 });
    setLoading(false);
  }, [headers, page, pageSize, search, status, priority, category, sort]);

  useEffect(() => {
    // Load reference data once
    const loadRefs = async () => {
      try {
        const [statRes, priRes, catRes, userRes] = await Promise.all([
          fetch(`${BASE_URL}/statuses`, { headers }),
          fetch(`${BASE_URL}/priorities`, { headers }),
          fetch(`${BASE_URL}/categories`, { headers }),
          fetch(`${BASE_URL}/users?role=agent`, { headers }),
        ]);

        const [s, p, c, u] = await Promise.all([statRes.json(), priRes.json(), catRes.json(), userRes.json()]);
        setStatuses(Array.isArray(s) ? s : []);
        setPriorities(Array.isArray(p) ? p : []);
        setCategories(Array.isArray(c) ? c : []);
        setAgents(Array.isArray(u) ? u : (u?.data ?? []));
      } catch {
        // keep page usable; tickets fetch will show its own error
      }
    };

    if (token) loadRefs();
  }, [headers, token]);

  useEffect(() => {
    if (!token) return;
    fetchTickets();
  }, [token, fetchTickets]);


  const handleAssign = async () => {
    if (!assignAgent || !assignTarget) return;

    setAssigning(true);
    setAssignError(null);

    try {
      const res = await fetch(`${BASE_URL}/tickets/${assignTarget.id}/assign`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: Number(assignAgent) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAssignError(data?.message || "Assignment failed.");
        return;
      }

      setAssignSuccess(true);
      // Refresh list for consistency
      await fetchTickets();
      setTimeout(() => {
        setAssignTarget(null);
        setAssignSuccess(false);
        setAssignAgent("");
      }, 900);
    } catch {
      setAssignError("Network error — could not assign ticket.");
    } finally {
      setAssigning(false);
    }
  };

  const openEnterpriseModal = async (ticket) => {
    setEnterpriseModal({
      open: true,
      ticket,
      loading: true,
      error: null,
      assignmentHistory: [],
      notifications: [],
      activityLogs: [],
    });

    try {
      const [ah, n, al] = await Promise.all([
        fetch(`${BASE_URL}/tickets/${ticket.id}/assignment-history`, { headers }),
        fetch(`${BASE_URL}/tickets/${ticket.id}/notifications`, { headers }),
        fetch(`${BASE_URL}/tickets/${ticket.id}/activity-logs`, { headers }),
      ]);

      const [ahJson, nJson, alJson] = await Promise.all([ah.json(), n.json(), al.json()]);

      setEnterpriseModal((prev) => ({
        ...prev,
        loading: false,
        assignmentHistory: Array.isArray(ahJson?.data) ? ahJson.data : [],
        notifications: Array.isArray(nJson?.data) ? nJson.data : [],
        activityLogs: Array.isArray(alJson?.data) ? alJson.data : [],
      }));
    } catch {
      setEnterpriseModal((prev) => ({ ...prev, loading: false, error: "Failed to load ticket enterprise data." }));
    }
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="at-page">
      <div className="at-page-header">
        <div>
          <h1 className="at-title">All Tickets</h1>
          <p className="at-subtitle">Every ticket across all departments and agents</p>
        </div>
      </div>

      <div className="at-toolbar">
        <div className="at-search-wrap">
          <Icon d={IC.search} size={14} />
          <input
            className="at-search"
            placeholder="Search by ticket #, title, or requester…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
          />
        </div>

        <div className="at-filters">
          <select className="at-select" value={status} onChange={(e) => {
            setStatus(e.target.value);
            resetPage();
          }}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={ns(s.status_name)}>{s.status_name}</option>
            ))}
          </select>

          <select className="at-select" value={priority} onChange={(e) => {
            setPriority(e.target.value);
            resetPage();
          }}>
            <option value="">All priorities</option>
            {priorities.map((p) => (
              <option key={p.id} value={ns(p.priority_name)}>{p.priority_name}</option>
            ))}
          </select>

          <select className="at-select" value={category} onChange={(e) => {
            setCategory(e.target.value);
            resetPage();
          }}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>{c.category_name}</option>
            ))}
          </select>

          <select className="at-select" value={sort} onChange={(e) => {
            setSort(e.target.value);
            resetPage();
          }}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="priority">Priority ↑</option>
          </select>

          {(search || status || priority || category) && (
            <button
              className="at-clear-btn"
              onClick={() => {
                setSearch("");
                setStatus("");
                setPriority("");
                setCategory("");
                resetPage();
              }}
            >
              <Icon d={IC.x} size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="at-result-count">
        {loading ? "Loading…" : `${meta?.total ?? 0} ticket${(meta?.total ?? 0) !== 1 ? "s" : ""}`}
      </div>

      {error && (
        <div className="at-error">
          <Icon d={IC.warning} size={14} /> {error}
        </div>
      )}

      <div className="at-card">
        {loading ? (
          <div className="at-loading">Loading tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="at-empty">
            <Icon d={IC.ticket} size={28} />
            <div className="at-empty-title">No tickets match your filters</div>
            <p>Try adjusting the search or clearing the filters.</p>
          </div>
        ) : (
          <div className="at-table-wrap">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Ticket #</th>
                  <th>Subject</th>
                  <th>Requester</th>
                  <th>Assignee</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>SLA</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((t) => {
                  const requester = t.user?.full_name ?? t.user?.username ?? "—";
                  const assignee = t.assignee?.full_name ?? t.assignee?.username ?? null;

                  return (
                    <tr key={t.id} className="at-row">
                      <td>
                        <span className="at-ticket-num">{t.ticket_number ?? `#${t.id}`}</span>
                      </td>
                      <td>
                        <span className="at-ticket-title">{t.title ?? "Untitled"}</span>
                      </td>
                      <td className="at-cell-muted">{requester}</td>
                      <td>
                        {assignee ? (
                          <span className="at-assignee-chip">{assignee}</span>
                        ) : (
                          <span className="at-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td className="at-cell-muted">{t.category?.category_name ?? "—"}</td>
                      <td>
                        <PriorityBadge p={t.priority?.priority_name ?? "Low"} />
                      </td>
                      <td>
                        <StatusBadge s={t.status?.status_name ?? "Open"} />
                      </td>
                      <td className="at-cell-muted at-cell-date">
                        <span title={formatDate(t.created_at)}>{timeAgo(t.created_at)}</span>
                      </td>
                      <td>
                        <SLAChip slaPercent={t.sla_percent} breached={t.sla_breached} />
                      </td>
                      <td>
                        <div className="at-row-actions">
                          <button
                            className="at-action-btn"
                            title="Assign agent"
                            onClick={() => {
                              setAssignTarget(t);
                              setAssignAgent(String(t.assigned_to ?? ""));
                              setAssignError(null);
                              setAssignSuccess(false);
                            }}
                          >
                            <Icon d={IC.assign} size={13} />
                          </button>

                          <button
                            className="at-action-btn"
                            title="Ticket activity & assignment history"
                            onClick={() => openEnterpriseModal(t)}
                          >
                            <Icon d={IC.eye} size={13} />
                          </button>

                          <button
                            className="at-action-btn"
                            title="View ticket"
                            onClick={() => navigate("/agent/ticket-details", { state: { ticketId: t.id } })}
                          >
                            <Icon d={IC.eye} size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="at-pagination">
          <button className="at-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <Icon d={IC.chevL} size={14} />
          </button>

          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let p;
            if (totalPages <= 7) p = i + 1;
            else if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;

            return (
              <button
                key={p}
                className={`at-page-btn${p === page ? " active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            );
          })}

          <button className="at-page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <Icon d={IC.chevR} size={14} />
          </button>

          <span className="at-page-label">Page {page} of {totalPages}</span>
        </div>
      )}

      {/* Assign Ticket modal */}
      {assignTarget && (
        <div
          className="at-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setAssignTarget(null)}
        >
          <div className="at-modal">
            <div className="at-modal-header">
              <div>
                <div className="at-modal-title">Assign Ticket</div>
                <div className="at-modal-sub">
                  {assignTarget.ticket_number} — {assignTarget.title}
                </div>
              </div>
              <button className="at-modal-close" onClick={() => setAssignTarget(null)}>
                <Icon d={IC.x} size={16} />
              </button>
            </div>

            {assignSuccess ? (
              <div className="at-modal-success">
                <Icon d={IC.check} size={18} />
                Ticket assigned successfully!
              </div>
            ) : (
              <>
                <div className="at-modal-body">
                  <label className="at-modal-label">Select Agent</label>
                  <select
                    className="at-select at-select--full"
                    value={assignAgent}
                    onChange={(e) => setAssignAgent(e.target.value)}
                  >
                    <option value="">— Choose an agent —</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name ?? a.username}
                        {a.department ? ` · ${a.department}` : ""}
                      </option>
                    ))}
                  </select>

                  {assignError && (
                    <div className="at-modal-error">
                      <Icon d={IC.warning} size={13} /> {assignError}
                    </div>
                  )}
                </div>

                <div className="at-modal-footer">
                  <button className="at-btn at-btn--ghost" onClick={() => setAssignTarget(null)}>
                    Cancel
                  </button>
                  <button
                    className="at-btn at-btn--primary"
                    disabled={!assignAgent || assigning}
                    onClick={handleAssign}
                  >
                    {assigning ? "Assigning…" : "Assign Ticket"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Enterprise Modal */}
      {enterpriseModal.open && enterpriseModal.ticket && (
        <div
          className="at-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setEnterpriseModal((p) => ({ ...p, open: false }))}
        >
          <div className="at-modal" style={{ width: "min(900px, 100%)" }}>
            <div className="at-modal-header">
              <div>
                <div className="at-modal-title">Ticket Enterprise View</div>
                <div className="at-modal-sub">
                  {enterpriseModal.ticket.ticket_number} — {enterpriseModal.ticket.title}
                </div>
              </div>
              <button className="at-modal-close" onClick={() => setEnterpriseModal((p) => ({ ...p, open: false }))}>
                <Icon d={IC.x} size={16} />
              </button>
            </div>

            {enterpriseModal.loading ? (
              <div className="at-loading" style={{ padding: 26 }}>Loading enterprise data…</div>
            ) : enterpriseModal.error ? (
              <div className="at-error" style={{ margin: 16 }}>
                <Icon d={IC.warning} size={14} /> {enterpriseModal.error}
              </div>
            ) : (
              <div className="at-modal-body" style={{ padding: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <div className="at-modal-title" style={{ fontSize: 14, marginBottom: 8 }}>Assignment history</div>
                    <table className="at-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>To</th>
                          <th>By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enterpriseModal.assignmentHistory.length === 0 ? (
                          <tr><td colSpan={3} className="at-cell-muted">—</td></tr>
                        ) : (
                          enterpriseModal.assignmentHistory.slice(0, 8).map((r) => (
                            <tr key={r.id}>
                              <td className="at-cell-muted">{timeAgo(r.assigned_at)}</td>
                              <td>{r.assigned_to_name ?? "—"}</td>
                              <td className="at-cell-muted">{r.assigned_by_name ?? "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <div className="at-modal-title" style={{ fontSize: 14, marginBottom: 8 }}>Notifications after assignment</div>
                    <table className="at-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enterpriseModal.notifications.length === 0 ? (
                          <tr><td colSpan={2} className="at-cell-muted">—</td></tr>
                        ) : (
                          enterpriseModal.notifications.slice(0, 8).map((n) => (
                            <tr key={n.id}>
                              <td className="at-cell-muted">{timeAgo(n.created_at)}</td>
                              <td>
                                <div style={{ fontWeight: 700 }}>{n.title ?? "Notification"}</div>
                                <div className="at-cell-muted" style={{ fontSize: 12, lineHeight: 1.3 }}>{n.type}</div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <div className="at-modal-title" style={{ fontSize: 14, marginBottom: 8 }}>Activity log after assignment</div>
                    <table className="at-table" style={{ minWidth: 0 }}>
                      <thead>
                        <tr>
                          <th>When</th>
                          <th>Severity</th>
                          <th>Action</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enterpriseModal.activityLogs.length === 0 ? (
                          <tr><td colSpan={4} className="at-cell-muted">—</td></tr>
                        ) : (
                          enterpriseModal.activityLogs.slice(0, 10).map((l) => (
                            <tr key={l.id}>
                              <td className="at-cell-muted">{timeAgo(l.created_at)}</td>
                              <td className="at-cell-muted">{l.severity ?? "info"}</td>
                              <td style={{ fontWeight: 700 }}>{l.action ?? "—"}</td>
                              <td className="at-cell-muted">{l.description ?? "—"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

