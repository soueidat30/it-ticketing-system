import "./Dashboard.css";

export default function ManagerDashboard() {

  const stats = [
    { label: "Open Team Tickets", value: 14, color: "blue" },
    { label: "In Progress", value: 9, color: "orange" },
    { label: "Resolved", value: 32, color: "green" },
    { label: "Critical", value: 3, color: "red" },
  ];

  const tickets = [
    {
      id: "TKT-2001",
      employee: "John Doe",
      subject: "VPN issue",
      priority: "High",
      status: "Open",
      agent: "Sarah",
      updated: "1h ago"
    },
    {
      id: "TKT-2002",
      employee: "Emma Smith",
      subject: "Email not working",
      priority: "Medium",
      status: "Pending",
      agent: "Mike",
      updated: "3h ago"
    },
    {
      id: "TKT-2003",
      employee: "Ali Hassan",
      subject: "Software install",
      priority: "Low",
      status: "Resolved",
      agent: "John",
      updated: "1d ago"
    },
  ];

  return (
    <div className="mgr-dashboard">

      {/* HEADER */}
      <div className="mgr-dashboard__header">
        <div>
          <h1 className="mgr-dashboard__title">
            Manager Dashboard 📊
          </h1>
          <p className="mgr-dashboard__subtitle">
            Monitor team tickets, performance, and workload
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="mgr-stats-grid">
        {stats.map(s => (
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

      {/* GRID */}
      <div className="mgr-dashboard__grid">

        {/* TABLE */}
        <div className="mgr-card">
          <div className="mgr-card__header">
            <h2 className="mgr-card__title">Team Tickets</h2>
          </div>

          <div className="mgr-table-wrapper">
            <table className="mgr-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map(t => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.employee}</td>
                    <td>{t.subject}</td>
                    <td>
                      <span className={`priority-badge priority-badge--${t.priority.toLowerCase()}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge status-badge--${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{t.agent}</td>
                    <td>{t.updated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="mgr-right-col">

          <div className="mgr-card">
            <div className="mgr-card__header">
              <h2 className="mgr-card__title">Team Overview</h2>
            </div>

            <div className="mgr-info">
              <div>Average Resolution Time: <b>2.3h</b></div>
              <div>Active Agents: <b>4</b></div>
              <div>Tickets This Week: <b>48</b></div>
            </div>
          </div>

          <div className="mgr-card">
            <div className="mgr-card__header">
              <h2 className="mgr-card__title">Recent Activity</h2>
            </div>

            <div className="mgr-activity">
              <div>John closed VPN ticket</div>
              <div>Sarah assigned ticket TKT-2002</div>
              <div>Mike updated status to Pending</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}