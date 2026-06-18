import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  history: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  view: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
};

const RESOLVED_STATUSES = ["resolved", "closed"];

const PriorityBadge = ({ p = "low" }) => (
  <span className={`agent-badge agent-badge--${String(p).toLowerCase()}`}>{p}</span>
);

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BASE_URL = "http://127.0.0.1:8000/api";

export default function History() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Unauthorized.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/agent/tickets`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Failed to load history.");
          return;
        }
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setError("Unable to load history.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const resolved = useMemo(() => {
    const filtered = tickets.filter((t) =>
      RESOLVED_STATUSES.includes(String(t?.status?.status_name ?? "").toLowerCase())
    );

    const term = search.trim().toLowerCase();
    const searched = term
      ? filtered.filter(
          (t) =>
            String(t.ticket_number ?? t.id ?? "").toLowerCase().includes(term) ||
            String(t.title ?? "").toLowerCase().includes(term)
        )
      : filtered;

    return [...searched].sort(
      (a, b) => new Date(b.resolved_at ?? b.updated_at) - new Date(a.resolved_at ?? a.updated_at)
    );
  }, [tickets, search]);

  return (
    <div className="agent-history">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">History</h1>
          <p className="agent-page-subtitle">Tickets you've resolved or closed</p>
        </div>
      </div>

      <div className="agent-card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ position: "relative", maxWidth: 320 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--agent-muted)" }}>
            <Icon d={IC.search} size={15} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ticket # or title…"
            style={{
              width: "100%",
              padding: "8px 12px 8px 34px",
              border: "1.5px solid var(--agent-border)",
              borderRadius: "var(--radius-sm)",
              fontSize: 13,
              outline: "none",
            }}
          />
        </div>
      </div>

      <div className="agent-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--agent-muted)" }}>Loading history…</div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--agent-danger)" }}>{error}</div>
        ) : resolved.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--agent-muted)" }}>
            <Icon d={IC.history} size={28} />
            <div style={{ marginTop: 8, fontWeight: 600 }}>No resolved tickets yet</div>
            <p style={{ fontSize: 13 }}>Tickets you resolve or close will show up here.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--agent-border)" }}>
                <th style={{ padding: "12px 16px", color: "var(--agent-muted)", fontWeight: 600 }}>Ticket #</th>
                <th style={{ padding: "12px 16px", color: "var(--agent-muted)", fontWeight: 600 }}>Title</th>
                <th style={{ padding: "12px 16px", color: "var(--agent-muted)", fontWeight: 600 }}>Priority</th>
                <th style={{ padding: "12px 16px", color: "var(--agent-muted)", fontWeight: 600 }}>Resolved On</th>
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {resolved.map((t) => (
                <tr key={t.id} style={{ borderBottom: "1px solid var(--agent-border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600 }}>#{t.ticket_number ?? t.id}</td>
                  <td style={{ padding: "12px 16px" }}>{t.title}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <PriorityBadge p={t.priority?.priority_name ?? "low"} />
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--agent-muted)" }}>
                    {formatDate(t.resolved_at ?? t.updated_at)}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <button
                      className="agent-btn agent-btn--ghost agent-btn--sm"
                      onClick={() => navigate("/agent/ticket-details", { state: { ticketId: t.id } })}
                    >
                      <Icon d={IC.view} size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}