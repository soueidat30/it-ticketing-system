import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./Comments.css";

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
  comment: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  ticket:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
};

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BASE_URL = "http://127.0.0.1:8000/api";

export default function Comments() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!token) {
      setError(t("agent.comments.unauthorized", "Unauthorized."));
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
          setError(data.message || t("agent.comments.loadError", "Failed to load comments."));
          return;
        }
        setTickets(Array.isArray(data) ? data : []);
      } catch {
        setError(t("agent.comments.loadErrorGeneric", "Unable to load comments."));
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, t]);

  // Agent requirement: remove "Internal" completely.
  // 1) never show internal badge/tab
  // 2) never include internal comments in the feed
  const visible = useMemo(() => {
    const allComments = tickets.flatMap((tk) =>
      (tk.comments ?? []).map((c) => ({
        id: c.id,
        ticketId: tk.id,
        ticketNumber: tk.ticket_number ?? tk.id,
        ticketTitle: tk.title ?? "Untitled ticket",
        author: c.user?.full_name ?? c.user?.username ?? t("common.unknown", "Unknown"),
        role: c.user?.role?.name ?? "employee",
        text: c.content,
        internal: !!c.internal,
        createdAt: c.created_at,
      }))
    );

    return allComments
      .filter((c) => !c.internal)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((c) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
          c.text?.toLowerCase().includes(term) ||
          String(c.ticketNumber).toLowerCase().includes(term) ||
          c.ticketTitle?.toLowerCase().includes(term)
        );
      });
  }, [tickets, search, t]);

  const publicCount = useMemo(
    () =>
      tickets
        .flatMap((tk) => tk.comments ?? [])
        .filter((c) => !c.internal).length,
    [tickets]
  );

  return (
    <div className="cm-page">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.comments.title", "Comments")}</h1>
          <p className="agent-page-subtitle">
            {t("agent.comments.subtitle", "All replies and notes across your tickets")}
          </p>
        </div>
      </div>

      <div className="agent-card cm-toolbar-card">
        <div className="cm-tabs">
          <button className="cm-tab active" onClick={() => {}}>
            {t("agent.comments.tabAll", "All")} <span className="cm-tab-count">{publicCount}</span>
          </button>
        </div>

        <div className="cm-search-wrap">
          <span className="cm-search-icon">
            <Icon d={IC.search} size={15} />
          </span>
          <input
            type="text"
            className="cm-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("agent.comments.searchPlaceholder", "Search comments or tickets…")}
          />
        </div>
      </div>

      <div className="agent-card cm-feed-card">
        {loading ? (
          <div className="cm-state">{t("agent.comments.loading", "Loading comments…")}</div>
        ) : error ? (
          <div className="cm-state cm-state--error">{error}</div>
        ) : visible.length === 0 ? (
          <div className="cm-empty">
            <Icon d={IC.comment} size={28} />
            <div className="cm-empty-title">{t("agent.comments.emptyTitle", "No comments to show")}</div>
            <p>{t("agent.comments.emptyDesc", "Replies and notes from your tickets will appear here.")}</p>
          </div>
        ) : (
          <div className="cm-feed">
            {visible.map((c) => (
              <div
                key={c.id}
                className="cm-item"
                onClick={() => navigate("/agent/ticket-details", { state: { ticketId: c.ticketId } })}
              >
                <div className={`cm-avatar${c.role === "agent" ? " agent" : ""}`}>{initials(c.author)}</div>
                <div className="cm-body">
                  <div className="cm-top">
                    <span className="cm-author">{c.author}</span>
                    <span className="cm-time">{formatDate(c.createdAt)}</span>
                  </div>
                  <div className="cm-text">{c.text}</div>
                  <div className="cm-ticket-link">
                    <Icon d={IC.ticket} size={11} /> #{c.ticketNumber} — {c.ticketTitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

