import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeamTicket.css";
import {
  getAllTickets,
  assignTicket,
  updateTicketStatus,
  getComments,
  addComment,
  getStatuses,
} from "../../../services/ticketService";

export default function TeamTickets() {
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [agents, setAgents] = useState([]); // will fetch from backend later
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Load tickets + statuses
  useEffect(() => {
    let ignore = false;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const data = await getAllTickets(token);
        const statusData = await getStatuses(token);

        if (!ignore) {
          setTickets(Array.isArray(data) ? data : []);
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

  // Assign ticket
  const handleAssign = async (ticketId, agentId) => {
    try {
      await assignTicket(token, ticketId, agentId);
      const data = await getAllTickets(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Assign failed", err);
    }
  };

  // Update status
  const handleStatusChange = async (ticketId, statusId) => {
    try {
      await updateTicketStatus(token, ticketId, statusId, "Updated by manager");
      const data = await getAllTickets(token);
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Status update failed", err);
    }
  };

  // Filtering
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
        <h1>Team Tickets</h1>

        <div className="team__controls">
          <input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">All</option>
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
        <p>Loading...</p>
      ) : (
        <table className="team__table">
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Title</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Assign</th>
              <th>Change Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>{t.ticket_number || `#${t.id}`}</td>
                <td
                  onClick={() => navigate(`/manager/team-tickets/${t.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {t.title || "—"}
                </td>
                <td>{t.user?.full_name || "Unassigned"}</td>

                {/* STATUS */}
                <td>
                  <span
                    className={`badge status-${(t.status?.status_name || "")
                      .toLowerCase()
                      .replace(/ /g, "-")}`}
                  >
                    {t.status?.status_name || "Open"}
                  </span>
                </td>

                {/* ASSIGN */}
                <td>
                  <select
                    onChange={(e) => handleAssign(t.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Assign
                    </option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* STATUS UPDATE */}
                <td>
                  <select
                    value={t.status?.id || ""}
                    onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  >
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.status_name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
