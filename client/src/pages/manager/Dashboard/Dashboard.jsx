import "./Dashboard.css";
import { useEffect, useState } from "react";
import { getAllTickets } from "../../../services/ticketService";

export default function ManagerDashboard() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const stats = [
    { label: "Open Team Tickets", value: 14, color: "blue" },
    { label: "In Progress", value: 9, color: "orange" },
    { label: "Resolved", value: 32, color: "green" },
    { label: "Critical", value: 3, color: "red" },
  ];

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        if (!token) {
          console.error("No token found");
          setTickets([]);
          return;
        }

        const data = await getAllTickets(token);

        // ensure array format
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

  return (
    <div className="mgr-dashboard">

      {/* HEADER */}
      <div className="mgr-dashboard__header">
        <div>
          <h1 className="mgr-dashboard__title">Manager Dashboard 📊</h1>
          <p className="mgr-dashboard__subtitle">
            Monitor team tickets, performance, and workload
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="mgr-stats-grid">
        {stats.map((s) => (
          <div key={s.label} className={`mgr-stat-card mgr-stat-card--${s.color}`}>
            <div className="mgr-stat-icon">
              <i className="ti ti-chart-bar" />
            </div>
            <div className="mgr-stat-info">
              <span className="mgr-stat-value">{s.value}</span>
              <span className="mgr-stat-label">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="mgr-card">
        <div className="mgr-card__header">
          <h2 className="mgr-card__title">Team Tickets</h2>
        </div>

        <div className="mgr-table-wrapper">

          {loading ? (
            <p style={{ padding: 16 }}>Loading tickets...</p>
          ) : (
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>

              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="4">No tickets found</td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id}>
                      <td>{t.id}</td>
                      <td>{t.subject}</td>

                      {/* FIX IS HERE ↓↓↓ */}
                      <td>{t.status?.status_name || "—"}</td>

                      <td>{t.priority?.priority_name || t.priority || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </div>
  );
}