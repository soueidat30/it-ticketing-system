import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyTickets.css";
import { getMyTickets, deleteTicket } from "../../../services/ticketService";

const tabs = ["All", "Open", "In Progress", "Pending", "Resolved", "Closed"];
const ITEMS_PER_PAGE = 8;

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch]       = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId]   = useState(null);
  const [deleting, setDeleting]   = useState(false);
  const token = localStorage.getItem("token");

  const fetchTickets = async () => {
    setLoading(true); setError("");
    try {
      const data = await getMyTickets(token);
      setTickets(data);
    } catch {
      setError("Failed to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchTickets();
}, [activeTab, currentPage]);

  const filtered = tickets.filter(t => {
    const statusName = t.status?.status_name || "";
    const matchTab   = activeTab === "All" || statusName === activeTab;
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.category?.category_name || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTabChange = (tab) => { setActiveTab(tab); setCurrentPage(1); };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteTicket(token, id);
      setTickets(prev => prev.filter(t => t.id !== id));
      setDeleteId(null);
    } catch {
      setError("Failed to delete ticket.");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d    = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days  <  7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="mt-page">

      {/* Header */}
      <div className="mt-page__header">
        <div>
          <h1 className="mt-page__title">My Tickets</h1>
          <p className="mt-page__subtitle">View and manage your support requests</p>
        </div>
        <div className="mt-page__actions">
          <div className="mt-search">
            <i className="ti ti-search" />
            <input
              type="text"
              className="mt-search__input"
              placeholder="Search tickets..."
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <button className="mt-refresh-btn" onClick={fetchTickets} title="Refresh">
            <i className="ti ti-refresh" />
          </button>
          <button
            className="mt-new-btn"
            onClick={() => navigate("/employee/create-ticket")}
          >
            <i className="ti ti-plus" /> New Ticket
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
              {tab === "All" && (
                <span className="mt-tab__count">{tickets.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="mt-loading">
            <span className="mt-spinner" />
            Loading tickets...
          </div>
        ) : paginated.length === 0 ? (
          <div className="mt-empty">
            <i className="ti ti-ticket mt-empty__icon" />
            <p className="mt-empty__title">No tickets found</p>
            <p className="mt-empty__sub">
              {search ? "Try a different search term" : "Create a new ticket to get started"}
            </p>
            <button
              className="mt-new-btn"
              onClick={() => navigate("/employee/create-ticket")}
            >
              <i className="ti ti-plus" /> Create Ticket
            </button>
          </div>
        ) : (
          <div className="mt-table-wrapper">
            <table className="mt-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => (
                  <tr key={t.id} className="mt-row">
                    <td><span className="mt-ticket-id">{t.ticket_number}</span></td>
                    <td>
  <span
    className="mt-ticket-title"
    style={{ cursor: "pointer" }}
    onClick={() => navigate(`/employee/ticket/${t.id}`)}
  >
    {t.title}
  </span>
</td>
                    <td><span className="mt-ticket-cat">{t.category?.category_name || "-"}</span></td>
                    <td>
                      <span className={`priority-badge priority-badge--${(t.priority?.priority_name || "").toLowerCase()}`}>
                        {t.priority?.priority_name || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${(t.status?.status_name || "").toLowerCase().replace(" ", "-")}`}>
                        {t.status?.status_name || "-"}
                      </span>
                    </td>
                    <td><span className="mt-time">{formatDate(t.created_at)}</span></td>
                    <td>
                      <div className="mt-row-actions">
                        {t.status?.status_name === "Open" && (
                          <button
                            className="mt-action-btn mt-action-btn--delete"
                            onClick={() => setDeleteId(t.id)}
                            title="Cancel ticket"
                          >
                            <i className="ti ti-trash" />
                          </button>
                        )}
                        <button className="mt-action-btn" title="More options">
                          <i className="ti ti-dots" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > ITEMS_PER_PAGE && (
          <div className="mt-pagination">
            <span className="mt-pagination__info">
              Showing {(currentPage-1)*ITEMS_PER_PAGE+1}–{Math.min(currentPage*ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tickets
            </span>
            <div className="mt-pagination__btns">
              <button
                className="mt-page-btn"
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                disabled={currentPage === 1}
              >
                <i className="ti ti-chevron-left" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                disabled={currentPage === totalPages}
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
            <h3 className="mt-modal__title">Cancel Ticket?</h3>
            <p className="mt-modal__text">
              Are you sure you want to cancel this ticket? This action cannot be undone.
            </p>
            <div className="mt-modal__actions">
              <button
                className="mt-modal__btn mt-modal__btn--cancel"
                onClick={() => setDeleteId(null)}
              >
                Keep Ticket
              </button>
              <button
                className="mt-modal__btn mt-modal__btn--confirm"
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
              >
                {deleting ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}