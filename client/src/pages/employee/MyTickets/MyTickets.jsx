import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./MyTickets.css";
import { getMyTickets, deleteTicket } from "../../../services/ticketService";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";

const ITEMS_PER_PAGE = 8;

const buildTabs = (t) => [
  t("myTickets.tabs.all",        "All"),
  t("myTickets.tabs.open",       "Open"),
  t("myTickets.tabs.inProgress", "In Progress"),
  t("myTickets.tabs.pending",    "Pending"),
  t("myTickets.tabs.resolved",   "Resolved"),
  t("myTickets.tabs.closed",     "Closed"),
];

export default function MyTickets() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const token = localStorage.getItem("token");

  // Localized tabs (rebuild when language changes)
  const tabs = useMemo(() => buildTabs(t), [t, language]);

  const [tickets, setTickets]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [activeTab, setActiveTab]     = useState("All");
  const [search, setSearch]           = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId]       = useState(null);
  const [deleting, setDeleting]       = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyTickets(token);
      setTickets(data);
    } catch {
      setError(t("myTickets.loadError", "Failed to load tickets. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  const filtered = useMemo(() => tickets.filter(tk => {
    const statusName = tk.status?.status_name || "";
    const matchTab   = activeTab === "All" || statusName === activeTab;
    const matchSearch = !search ||
      (tk.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (tk.ticket_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (tk.category?.category_name || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  }), [tickets, activeTab, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated  = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteTicket(token, id);
      setTickets(prev => prev.filter(tk => tk.id !== id));
      setDeleteId(null);
    } catch {
      setError(t("myTickets.deleteError", "Failed to delete ticket."));
    } finally {
      setDeleting(false);
    }
  };

  // Localized time formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d    = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
    const diff = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60) return t("agent.dashboard.timeAgo.minutes", "{{n}}m ago", { n: mins  });
    if (hours < 24) return t("agent.dashboard.timeAgo.hours",   "{{n}}h ago", { n: hours });
    if (days  <  7) return t("agent.dashboard.timeAgo.days",    "{{n}}d ago", { n: days  });
    return d.toLocaleDateString(language === "ar" ? "ar-EG" : undefined);
  };

  return (
    <div className="mt-page">

      {/* Header */}
      <div className="mt-page__header">
        <div>
          <h1 className="mt-page__title">{t("myTickets.title", "My Tickets")}</h1>
          <p className="mt-page__subtitle">
            {t("myTickets.subtitle", "View and manage your support requests")}
          </p>
        </div>
        <div className="mt-page__actions">
          <div className="mt-search">
            <i className="ti ti-search" />
            <input
              type="text"
              className="mt-search__input"
              placeholder={t("myTickets.searchPh", "Search tickets...")}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="mt-refresh-btn"
            onClick={fetchTickets}
            title={t("common.refresh", "Refresh")}
          >
            <i className="ti ti-refresh" />
          </button>
          <button
            className="mt-new-btn"
            onClick={() => navigate("/employee/create-ticket")}
          >
            <i className="ti ti-plus" /> {t("myTickets.newTicket", "New Ticket")}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-error">
          <i className="ti ti-alert-circle" />{error}
        </div>
      )}

      {/* Table Card */}
      <div className="mt-card">

        {/* Tabs */}
        <div className="mt-tabs">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`mt-tab ${activeTab === tab ? "mt-tab--active" : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
              {tab === t("myTickets.tabs.all", "All") && (
                <span className="mt-tab__count">{tickets.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="mt-loading">
            <span className="mt-spinner" />
            {t("myTickets.loading", "Loading tickets...")}
          </div>
        ) : paginated.length === 0 ? (
          <div className="mt-empty">
            <i className="ti ti-ticket mt-empty__icon" />
            <p className="mt-empty__title">
              {t("myTickets.empty.title", "No tickets found")}
            </p>
            <p className="mt-empty__sub">
              {search
                ? t("myTickets.empty.searchHint", "Try a different search term")
                : t("myTickets.empty.ctaHint", "Create a new ticket to get started")}
            </p>
            <button
              className="mt-new-btn"
              onClick={() => navigate("/employee/create-ticket")}
            >
              <i className="ti ti-plus" /> {t("myTickets.createTicket", "Create Ticket")}
            </button>
          </div>
        ) : (
          <div className="mt-table-wrapper">
            <table className="mt-table">
              <thead>
                <tr>
                  <th>{t("myTickets.table.colTicketId", "Ticket ID")}</th>
                  <th>{t("myTickets.table.colTitle",    "Title")}</th>
                  <th>{t("myTickets.table.colCategory", "Category")}</th>
                  <th>{t("myTickets.table.colPriority", "Priority")}</th>
                  <th>{t("myTickets.table.colStatus",   "Status")}</th>
                  <th>{t("myTickets.table.colCreated",  "Created")}</th>
                  <th>{t("myTickets.table.colActions",  "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(tk => {
                  const statusName = tk.status?.status_name || "Open";
                  const priorityName = tk.priority?.priority_name || "Low";
                  return (
                    <tr
                      key={tk.id}
                      className="mt-row"
                      onClick={() => navigate(`/employee/ticket/${tk.id}`)}
                    >
                      <td>
                        <span className="mt-ticket-id">{tk.ticket_number}</span>
                      </td>
                      <td>
                        <span className="mt-ticket-title">
                          {tk.title}
                        </span>
                      </td>
                      <td>
                        <span className="mt-ticket-cat">
                          {tk.category?.category_name || t("common.na", "N/A")}
                        </span>
                      </td>
                      <td>
                        <span className={`mt-priority-badge mt-priority-badge--${priorityName.toLowerCase()}`}>
                          {t(`agent.priority.${priorityName.toLowerCase()}`, priorityName)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`mt-status-badge mt-status-badge--${statusName.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                          {t(`agent.status.${statusName.toLowerCase().replace(/\s+/g, "-")}`, statusName)}
                        </span>
                      </td>
                      <td>
                        <span className="mt-time">{formatDate(tk.created_at)}</span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="mt-row-actions">
                          {statusName === "Open" && (
                            <button
                              className="mt-action-btn mt-action-btn--delete"
                              onClick={() => setDeleteId(tk.id)}
                              title={t("myTickets.actions.cancelTicket", "Cancel ticket")}
                            >
                              <i className="ti ti-trash" />
                            </button>
                          )}
                          <button
                            className="mt-action-btn"
                            title={t("myTickets.actions.moreOptions", "More options")}
                          >
                            <i className="ti ti-dots" />
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

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="mt-pagination">
            <span className="mt-pagination__info">
              {t("myTickets.pagination.showing",
                "Showing {{from}}–{{to}} of {{count}} tickets",
                {
                  from: (currentPage - 1) * ITEMS_PER_PAGE + 1,
                  to:   Math.min(currentPage * ITEMS_PER_PAGE, filtered.length),
                  count: filtered.length
                }
              )}
            </span>
            <div className="mt-pagination__btns">
              <button
                className="mt-page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                title={t("common.back", "Previous")}
              >
                <i className="ti ti-chevron-left" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                <button
                  key={n}
                  className={`mt-page-btn ${n === currentPage ? "mt-page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                className="mt-page-btn"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                title={t("common.more", "Next")}
              >
                <i className="ti ti-chevron-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="mt-modal-overlay">
          <div className="mt-modal">
            <div className="mt-modal__icon">
              <i className="ti ti-alert-triangle" />
            </div>
            <h3 className="mt-modal__title">
              {t("myTickets.modal.title", "Cancel Ticket?")}
            </h3>
            <p className="mt-modal__text">
              {t("myTickets.modal.message", "Are you sure you want to cancel this ticket? This action cannot be undone.")}
            </p>
            <div className="mt-modal__actions">
              <button
                className="mt-modal__btn mt-modal__btn--cancel"
                onClick={() => setDeleteId(null)}
              >
                {t("myTickets.modal.keepTicket", "Keep Ticket")}
              </button>
              <button
                className="mt-modal__btn mt-modal__btn--confirm"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting
                  ? t("myTickets.modal.cancelling", "Cancelling...")
                  : t("myTickets.modal.yesCancel", "Yes, Cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}