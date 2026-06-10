import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TeamTicket.css";
import {
  getAllTickets,
  assignTicket as assignTicketAPI,
  updateTicketStatus,
  addTicketComment,
  getTicketComments
} from "../../../services/ticketService";

const statusOptions = ["Open", "In Progress", "Pending", "Resolved", "Closed"];

// helpers
const title = (t) => t.title || "—";
const number = (t) => t.ticket_number || `#${t.id}`;
const status = (t) => t.status?.status_name || "Open";
const employee = (t) => t.user?.full_name || "Unassigned";

// mock agents (replace later with API)
const agents = [
  { id: 1, name: "Agent A" },
  { id: 2, name: "Agent B" },
  { id: 3, name: "Agent C" },
];

export default function TeamTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      const data = await getAllTickets(token);

      if (!ignore) setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      if (!ignore) setTickets([]);
    } finally {
      if (!ignore) setLoading(false);
    }
  };

  fetchTickets();
  return () => { ignore = true; };
}, []);
const assignTicket = async (ticketId, agentId) => {
  try {
    const token = localStorage.getItem("token");

    const updated = await assignTicketAPI(token, ticketId, agentId);

    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId ? updated : t
      )
    );
  } catch (err) {
    console.error("Assign failed", err);
  }
};

  // update status (FRONTEND ONLY for now)
 const updateStatus = async (ticketId, newStatus) => {
  try {
    const token = localStorage.getItem("token");

    const updated = await updateTicketStatus(token, ticketId, newStatus);

    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId ? updated : t
      )
    );
  } catch (err) {
    console.error(err);
  }
};

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      title(t).toLowerCase().includes(q) ||
      number(t).toLowerCase().includes(q) ||
      employee(t).toLowerCase().includes(q);

    const matchFilter =
      filter === "All" || status(t) === filter;

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
            {statusOptions.map(s => (
              <option key={s}>{s}</option>
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
            {filtered.map(t => (
              <tr key={t.id}>
                <td>{number(t)}</td>
              <td
  onClick={() => navigate(`/manager/team-tickets/${t.id}`)}
  style={{ cursor: "pointer" }}
>
  {title(t)}
</td>
                <td>{employee(t)}</td>

                {/* STATUS */}
                <td>
                  <span className={`badge status-${status(t).toLowerCase().replace(/ /g,"-")}`}>
                    {status(t)}
                  </span>
                </td>

                {/* ASSIGN */}
                <td>
                  <select
                    onChange={(e) => assignTicket(t.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Assign</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </td>

                {/* STATUS UPDATE */}
                <td>
                  <select
                    value={status(t)}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                  >
                    {statusOptions.map(s => (
                      <option key={s}>{s}</option>
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