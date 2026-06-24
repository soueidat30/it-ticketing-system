import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeamTicket.css";
import {
  getAllTickets,
  getStatuses,
  assignTicket,
  updateTicketStatus,
} from "../../../services/ticketService";

export default function TeamTickets() {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getAllTickets(token);
        const statusData = await getStatuses(token);

        if (!ignore) {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
              ? data.data
              : [];
          setTickets(list);
          setStatuses(Array.isArray(statusData) ? statusData : []);


        }
      } catch (err) {
        console.error(err);
        if (!ignore) {
          setTickets([]);
          setStatuses([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchData();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAssign = async (ticketId, agentId) => {
    try {
      await assignTicket(token, ticketId, agentId);
      const data = await getAllTickets(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Assign failed", err);
    }
  };

  const handleStatusChange = async (ticketId, statusId) => {
    try {
      await updateTicketStatus(token, ticketId, statusId, "Updated by manager");
      const data = await getAllTickets(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      (t.title || "").toLowerCase().includes(q) ||
      (t.ticket_number || "").toLowerCase().includes(q) ||
      (t.user?.full_name || "").toLowerCase().includes(q);

    const matchFilter =
      filter === "All" || t.status?.status_name === filter;

    return matchSearch && matchFilter;
  });

  return (
    <div className="team">
      {/* HEADER */}
      <div className="team__header">
        <div>
          <h1 className="team__title">Team Tickets</h1>
          <p className="team__subtitle">Monitor and track all employee support requests</p>
        </div>

        <div className="team__controls">
          <div className="team__search">
            <i className="ti ti-search" />
            <input
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="team__filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.status_name}>
                {s.status_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="team__loading">
          <span className="team__spinner" />
          Loading tickets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="team__empty">
          <i className="ti ti-ticket" />
          <p>No tickets found</p>
        </div>
      ) : (
        <div className="team__table-wrap">
          <table className="team__table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Title</th>
                <th>Employee</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="team__row"
                  onClick={() => navigate(`/manager/team-tickets/${t.id}`)}
                >
                  <td><span className="team__ticket-id">{t.ticket_number || `#${t.id}`}</span></td>
                  <td><span className="team__ticket-title">{t.title || "—"}</span></td>
                  <td><span className="team__employee">{t.user?.full_name || "Unknown"}</span></td>
                  <td><span className="team__category">{t.category?.category_name || "—"}</span></td>
                  <td>
                    <span className={`priority-badge priority-badge--${(t.priority?.priority_name || "").toLowerCase()}`}>
                      {t.priority?.priority_name || "—"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${(t.status?.status_name || "open").toLowerCase().replace(/ /g, "-")}`}>
                      {t.status?.status_name || "Open"}
                    </span>
                  </td>
                  <td><span className="team__time">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
