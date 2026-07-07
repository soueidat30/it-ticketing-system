import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./History.css";

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
  search:  "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  view:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
};

const RESOLVED_STATUSES = ["resolved", "closed"];

const BASE_URL = "http://127.0.0.1:8000/api";

export default function History() {
  const navigate = useNavigate();
  const { t, locale } = useLanguage();
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [search,  setSearch]  = useState("");

  // Locale-aware date formatter
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";

    const isAr = locale === "ar";
    return d.toLocaleString(
      isAr ? "ar-EG" : undefined,
      {
        month:  isAr ? "long" : "short",
        day:    "numeric",
        year:   "numeric",
        hour:   "2-digit",
        minute: "2-digit",
      }
    );
  };

  useEffect(() => {
    if (!token) {
      setError(t("agent.history.unauthorized", "Unauthorized."));
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
          setError(data.message || t("agent.history.loadError", "Failed to load history."));
          return;
        }
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setError(t("agent.history.loadErrorGeneric", "Unable to load history."));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resolved = useMemo(() => {
    const filtered = tickets.filter((tk) =>
      RESOLVED_STATUSES.includes(String(tk?.status?.status_name ?? "").toLowerCase())
    );

    const term = search.trim().toLowerCase();
    const searched = term
      ? filtered.filter(
          (tk) =>
            String(tk.ticket_number ?? tk.id ?? "").toLowerCase().includes(term) ||
            String(tk.title ?? "").toLowerCase().includes(term)
        )
      : filtered;

    return [...searched].sort(
      (a, b) => new Date(b.resolved_at ?? b.updated_at) - new Date(a.resolved_at ?? a.updated_at)
    );
  }, [tickets, search]);

  const PriorityBadge = ({ p = "low" }) => {
    const key = String(p).toLowerCase();
    return (
      <span className={`agent-badge agent-badge--${key}`}>
        {t(`agent.priority.${key}`, p)}
      </span>
    );
  };

  return (
    <div className="agent-history">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">
            {t("agent.history.title", "History")}
          </h1>
          <p className="agent-page-subtitle">
            {t("agent.history.subtitle", "Tickets you've resolved or closed")}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="agent-card ah-search-card">
        <div className="ah-search-wrap">
          <span className="ah-search-icon">
            <Icon d={IC.search} size={15} />
          </span>
          <input
            type="text"
            className="ah-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("agent.history.searchPlaceholder", "Search by ticket # or title…")}
          />
          {search && (
            <button
              className="ah-search-clear"
              onClick={() => setSearch("")}
              title={t("common.cancel", "Clear")}
              type="button"
            >
              <Icon d={IC.warning} size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results card */}
      <div className="agent-card ah-results-card">
        {loading ? (
          <div className="ah-state">
            <div className="ah-spinner" />
            <p>{t("agent.history.loading", "Loading history…")}</p>
          </div>
        ) : error ? (
          <div className="ah-state ah-state--error">
            <Icon d={IC.warning} size={20} />
            <p>{error}</p>
          </div>
        ) : resolved.length === 0 ? (
          <div className="ah-empty">
            <div className="ah-empty-icon">
              <Icon d={IC.history} size={32} />
            </div>
            <h3 className="ah-empty-title">
              {t("agent.history.emptyTitle", "No resolved tickets yet")}
            </h3>
            <p className="ah-empty-desc">
              {t("agent.history.emptyDesc", "Tickets you resolve or close will show up here.")}
            </p>
          </div>
        ) : (
          <div className="ah-table-wrap">
            <table className="ah-table">
              <thead>
                <tr>
                  <th>{t("agent.history.colTicket",     "Ticket #")}</th>
                  <th>{t("agent.history.colTitle",      "Title")}</th>
                  <th>{t("agent.history.colPriority",   "Priority")}</th>
                  <th>{t("agent.history.colResolvedOn", "Resolved On")}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resolved.map((tk) => (
                  <tr key={tk.id}>
                    <td className="ah-ticket-id">#{tk.ticket_number ?? tk.id}</td>
                    <td className="ah-ticket-title">{tk.title}</td>
                    <td><PriorityBadge p={tk.priority?.priority_name ?? "low"} /></td>
                    <td className="ah-ticket-date">
                      {formatDate(tk.resolved_at ?? tk.updated_at)}
                    </td>
                    <td className="ah-ticket-action">
                      <button
                        className="agent-btn agent-btn--ghost agent-btn--sm"
                        onClick={() =>
                          navigate("/agent/ticket-details", { state: { ticketId: tk.id } })
                        }
                      >
                        <Icon d={IC.view} size={13} />
                        {t("agent.history.viewBtn", "View")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}