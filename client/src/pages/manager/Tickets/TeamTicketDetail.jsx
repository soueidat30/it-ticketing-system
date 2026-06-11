import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TeamTicketDetail.css";

import {
  getTicketById,
  getComments,       
  addComment,
  getTicketHistory,
  updateTicketStatus,
  getStatuses,         
} from "../../../services/ticketService";


// ── helpers ───────────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  open:          "blue",
  "in progress": "orange",
  pending:       "purple",
  resolved:      "green",
  closed:        "gray",
};
const PRIORITY_COLORS = {
  low:      "green",
  medium:   "orange",
  high:     "red",
  critical: "red",
};
const statusColor   = (s = "") => STATUS_COLORS[s.toLowerCase()]   || "gray";
const priorityColor = (p = "") => PRIORITY_COLORS[p.toLowerCase()] || "gray";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Badge({ text, colorKey }) {
  return <span className={`ttd-badge ttd-badge--${colorKey}`}>{text}</span>;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function TeamTicketDetail() {
  const { id }   = useParams();
  const token    = localStorage.getItem("token");
  const me       = JSON.parse(localStorage.getItem("user") || "{}");

  const [ticket,   setTicket]   = useState(null);
  const [comments, setComments] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // comment form
  const [text,       setText]       = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending,    setSending]    = useState(false);

  // status update
  const [newStatusId,    setNewStatusId]    = useState("");
  const [statusNote,     setStatusNote]     = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess,  setStatusSuccess]  = useState("");

  // active tab: "comments" | "history"
  const [tab, setTab] = useState("comments");

  // ── fetch everything ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;

    const fetchAll = async () => {
      try {
       const [t, c, h, s] = await Promise.all([
  getTicketById(token, id),
  getComments(token, id),       
  getTicketHistory(token, id),
  getStatuses(token),
]);

        setTicket(t);
        setComments(Array.isArray(c) ? c : []);
        setHistory(Array.isArray(h) ? h : []);
        setStatuses(Array.isArray(s) ? s : s?.data || []);
      } catch (err) {
        console.error("Error loading ticket detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, id]);

  // ── add comment ─────────────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
     await addComment(token, id, text.trim(), isInternal);   
     const updated = await getComments(token, id); 
      setComments(Array.isArray(updated) ? updated : []);
      setText("");
      setIsInternal(false);
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSending(false);
    }
  };

  // ── update status ───────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!newStatusId) return;
    setUpdatingStatus(true);
    setStatusSuccess("");
    try {
      const updated = await updateTicketStatus(token, id, newStatusId, statusNote);
      setTicket(updated);
      // refresh history
      const h = await getTicketHistory(token, id);
      setHistory(Array.isArray(h) ? h : []);
      setStatusNote("");
      setNewStatusId("");
      setStatusSuccess("Status updated successfully!");
      setTimeout(() => setStatusSuccess(""), 3000);
    } catch (err) {
      console.error("Status update failed:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── render guards ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="ttd-loading">
        <i className="ti ti-loader ttd-spin" />
        <span>Loading ticket…</span>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="ttd-empty">
        <i className="ti ti-ticket-off" />
        <p>Ticket not found.</p>
      </div>
    );
  }

  const sName = ticket.status?.status_name || "Unknown";
  const pName = ticket.priority?.priority_name || "Unknown";
  const cName = ticket.category?.category_name || "—";

  return (
    <div className="ttd-page">

      {/* ── TOP HEADER ── */}
      <div className="ttd-header">
        <div className="ttd-header__left">
          <span className="ttd-ticket-number">{ticket.ticket_number}</span>
          <h1 className="ttd-title">{ticket.title}</h1>
        </div>
        <div className="ttd-header__badges">
          <Badge text={sName} colorKey={statusColor(sName)} />
          <Badge text={pName} colorKey={priorityColor(pName)} />
        </div>
      </div>

      {/* ── BODY: main + sidebar ── */}
      <div className="ttd-body">

        {/* ── LEFT: details + tabs ── */}
        <div className="ttd-main">

          {/* Description card */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Description</h3>
            <p className="ttd-description">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* Tabs: Comments | History */}
          <div className="ttd-card ttd-card--tabs">
            <div className="ttd-tabs">
              <button
                className={`ttd-tab ${tab === "comments" ? "ttd-tab--active" : ""}`}
                onClick={() => setTab("comments")}
              >
                <i className="ti ti-message-circle" />
                Comments
                {comments.length > 0 && (
                  <span className="ttd-tab__count">{comments.length}</span>
                )}
              </button>
              <button
                className={`ttd-tab ${tab === "history" ? "ttd-tab--active" : ""}`}
                onClick={() => setTab("history")}
              >
                <i className="ti ti-history" />
                Status History
                {history.length > 0 && (
                  <span className="ttd-tab__count">{history.length}</span>
                )}
              </button>
            </div>

            {/* ── COMMENTS TAB ── */}
            {tab === "comments" && (
              <div className="ttd-tab-content">
                {comments.length === 0 ? (
                  <div className="ttd-no-content">
                    <i className="ti ti-messages" />
                    <p>No comments yet. Be the first to reply.</p>
                  </div>
                ) : (
                  <div className="ttd-comments-list">
                    {comments.map((c) => {
                      const isMe = c.user?.id === me?.id;
                      return (
                        <div
                          key={c.id}
                          className={`ttd-comment ${c.is_internal ? "ttd-comment--internal" : ""} ${isMe ? "ttd-comment--mine" : ""}`}
                        >
                          <div className="ttd-comment__avatar">
                            {(c.user?.full_name?.[0] || "?").toUpperCase()}
                          </div>
                          <div className="ttd-comment__body">
                            <div className="ttd-comment__meta">
                              <span className="ttd-comment__author">
                                {c.user?.full_name || "Unknown"}
                              </span>
                              {c.is_internal && (
                                <span className="ttd-internal-badge">
                                  <i className="ti ti-lock" /> Internal note
                                </span>
                              )}
                              <span className="ttd-comment__time">
                                {timeAgo(c.created_at)}
                              </span>
                            </div>
                            {/* field is "body" from your DB — fallback to "comment" just in case */}
                            <p className="ttd-comment__text">
                              {c.body || c.comment || "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Comment Input ── */}
                <div className="ttd-comment-input">
                  <div className="ttd-comment-input__toolbar">
                    <label className="ttd-internal-toggle">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                      />
                      <i className="ti ti-lock" />
                      Internal note (hidden from employee)
                    </label>
                  </div>
                  <textarea
                    className={`ttd-textarea ${isInternal ? "ttd-textarea--internal" : ""}`}
                    placeholder={
                      isInternal
                        ? "Write an internal note (only visible to agents & managers)…"
                        : "Write a comment visible to the employee…"
                    }
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAddComment();
                    }}
                  />
                  <div className="ttd-comment-input__footer">
                    <span className="ttd-hint">Ctrl+Enter to send</span>
                    <button
                      className="ttd-btn ttd-btn--primary"
                      onClick={handleAddComment}
                      disabled={sending || !text.trim()}
                    >
                      {sending ? (
                        <><i className="ti ti-loader ttd-spin" /> Sending…</>
                      ) : (
                        <><i className="ti ti-send" /> Send</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── HISTORY TAB ── */}
            {tab === "history" && (
              <div className="ttd-tab-content">
                {history.length === 0 ? (
                  <div className="ttd-no-content">
                    <i className="ti ti-history" />
                    <p>No status changes recorded yet.</p>
                  </div>
                ) : (
                  <div className="ttd-timeline">
                    {history.map((h, i) => (
                      <div key={h.id || i} className="ttd-timeline__item">
                        <div className="ttd-timeline__line" />
                        <div className={`ttd-timeline__dot ttd-timeline__dot--${statusColor(h.new_status)}`} />
                        <div className="ttd-timeline__content">
                          <div className="ttd-timeline__row">
                            <span className="ttd-timeline__from">
                              <Badge
                                text={h.old_status || "—"}
                                colorKey={statusColor(h.old_status)}
                              />
                            </span>
                            <i className="ti ti-arrow-right ttd-timeline__arrow" />
                            <span className="ttd-timeline__to">
                              <Badge
                                text={h.new_status}
                                colorKey={statusColor(h.new_status)}
                              />
                            </span>
                          </div>
                          <div className="ttd-timeline__meta">
                            <span>
                              <i className="ti ti-user" />
                              {h.changed_by_name || "System"}
                            </span>
                            <span>
                              <i className="ti ti-clock" />
                              {timeAgo(h.created_at)}
                            </span>
                          </div>
                          {h.note && (
                            <p className="ttd-timeline__note">"{h.note}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="ttd-sidebar">

          {/* Ticket Info */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Ticket Info</h3>
            <dl className="ttd-info-list">
              <div className="ttd-info-row">
                <dt>Employee</dt>
                <dd>{ticket.user?.full_name || "—"}</dd>
              </div>
              <div className="ttd-info-row">
                <dt>Department</dt>
                <dd>{ticket.user?.department || "—"}</dd>
              </div>
              <div className="ttd-info-row">
                <dt>Category</dt>
                <dd>{cName}</dd>
              </div>
              <div className="ttd-info-row">
                <dt>Priority</dt>
                <dd>
                  <Badge text={pName} colorKey={priorityColor(pName)} />
                </dd>
              </div>
              <div className="ttd-info-row">
                <dt>Status</dt>
                <dd>
                  <Badge text={sName} colorKey={statusColor(sName)} />
                </dd>
              </div>
              <div className="ttd-info-row">
                <dt>Assignee</dt>
                <dd>{ticket.assignee?.full_name || <em className="ttd-muted">Unassigned</em>}</dd>
              </div>
              <div className="ttd-info-row">
                <dt>Created</dt>
                <dd>{timeAgo(ticket.created_at)}</dd>
              </div>
              {ticket.resolved_at && (
                <div className="ttd-info-row">
                  <dt>Resolved</dt>
                  <dd>{timeAgo(ticket.resolved_at)}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Update Status */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Update Status</h3>

            {statusSuccess && (
              <div className="ttd-success">
                <i className="ti ti-circle-check" /> {statusSuccess}
              </div>
            )}

            <div className="ttd-status-form">
              <select
                className="ttd-select"
                value={newStatusId}
                onChange={(e) => setNewStatusId(e.target.value)}
              >
                <option value="">— Select new status —</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.status_name}
                  </option>
                ))}
              </select>

              <textarea
                className="ttd-textarea ttd-textarea--sm"
                placeholder="Optional note about this change…"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={2}
              />

              <button
                className="ttd-btn ttd-btn--primary ttd-btn--full"
                onClick={handleStatusUpdate}
                disabled={updatingStatus || !newStatusId}
              >
                {updatingStatus ? (
                  <><i className="ti ti-loader ttd-spin" /> Updating…</>
                ) : (
                  <><i className="ti ti-refresh" /> Update Status</>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}