import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./TeamTicketDetail.css";

import {
  getTicketById,
  getTicketComments,
  addTicketComment,
  getTicketHistory,
  updateTicketStatus,
  getStatuses,
  deleteTicketComment,
  assignTicket,
  getUsersByRole,
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
  // eslint-disable-next-line no-unused-vars
  const [statuses, setStatuses] = useState([]);

  const [loading,  setLoading]  = useState(true);

  const [text,        setText]        = useState("");
  const [recipientType, setRecipientType] = useState("employee"); 
  const [sending,     setSending]     = useState(false);

  const [agents, setAgents] = useState([]);
  const [agentId, setAgentId] = useState("");
  const [assignNote, setAssignNote] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");

  const [newStatusId,    setNewStatusId]    = useState("");
  const [statusNote,     setStatusNote]     = useState("");
  // eslint-disable-next-line no-unused-vars
  const [updatingStatus, setUpdatingStatus] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [statusSuccess,  setStatusSuccess]  = useState("");

  const handleAssignTicket = async () => {
    if (!agentId) return;
    setAssigning(true);
    setAssignSuccess("");
    try {
      await assignTicket(token, id, agentId, assignNote);
      setAssignSuccess("Ticket assigned successfully.");
      setTimeout(() => setAssignSuccess(""), 3000);
      const updated = await getTicketById(token, id);
      setTicket(updated);
    } catch (err) {
      console.error("Assign failed:", err);
    } finally {
      setAssigning(false);
    }
  };

  const [tab, setTab] = useState("comments");

  // ── fetch everything ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;

    const fetchAll = async () => {
      try {
        const [t, c, h, s] = await Promise.all([
          getTicketById(token, id),
          getTicketComments(token, id),
          getTicketHistory(token, id),
          getStatuses(token),
        ]);

        let agentUsers = [];
        try {
          agentUsers = await getUsersByRole(token, "agent");
        } catch (e) {
          console.error("Failed to load agents dropdown:", e);
          agentUsers = [];
        }


        const normalizedAgents = Array.isArray(agentUsers)
          ? agentUsers
          : Array.isArray(agentUsers?.data)
            ? agentUsers.data
            : [];



        setAgents(normalizedAgents);

        const currentAssigneeId = t?.assignee?.id ?? "";
        setAgentId(currentAssigneeId ? String(currentAssigneeId) : "");

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

    const internal = recipientType === "internal";

    const notifyUserId = (() => {
      if (internal) return null;
      if (!ticket) return null;
      if (recipientType === "employee") return ticket.user?.id ?? null;
      if (recipientType === "agent") return ticket.assignee?.id ?? null;
      return null;
    })();

    setSending(true);
    try {
      const created = await addTicketComment(token, id, text.trim(), internal, notifyUserId);

      if (created && typeof created === "object" && created.id != null) {
        setComments((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          if (!next.some((c) => c.id === created.id)) next.push(created);
          return next;
        });
      } else {
        const updated = await getTicketComments(token, id);
        setComments(Array.isArray(updated) ? updated : []);
      }

      setText("");
      setRecipientType("employee");
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSending(false);
    }
  };


  // ── update status ───────────────────────────────────────────────────────────
  // eslint-disable-next-line no-unused-vars
  const handleStatusUpdate = async () => {

    if (!newStatusId) return;
    setUpdatingStatus(true);
    setStatusSuccess("");
    try {
      const updated = await updateTicketStatus(token, id, newStatusId, statusNote);
      setTicket(updated);
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
                          className={`ttd-comment ${c.internal ? "ttd-comment--internal" : ""} ${isMe ? "ttd-comment--mine" : ""}`}
                        >
                          <div className="ttd-comment__avatar">
                            {(c.user?.full_name?.[0] || "?").toUpperCase()}
                          </div>
                          <div className="ttd-comment__body">
                            <div className="ttd-comment__meta">
                              <span className="ttd-comment__author">
                                {c.user?.full_name || c.author || "Unknown"}
                              </span>
                              {c.internal && (
                                <span className="ttd-internal-badge">
                                  <i className="ti ti-lock" /> Internal note
                                </span>
                              )}
                            <span className="ttd-comment__time">
                                {c.time || timeAgo(c.created_at)}
                            </span>
                            <button
                              type="button"
                              className="ttd-btn ttd-btn--ghost"
                              style={{ marginLeft: 8, fontSize: 12, padding: "4px 10px" }}
                              onClick={() => {
                                const ok = window.confirm("Are you sure you want to delete this comment?");
                                if (!ok) return;

                                deleteTicketComment(token, id, c.id).then(() => getTicketComments(token, id)).then((updated) => setComments(Array.isArray(updated) ? updated : [])).catch((e) => console.error("Delete failed:", e));
                              }}
                            >
                              Delete
                            </button>
                            </div>
                            <p className="ttd-comment__text">
                              {(c.text ?? c.content ?? "—")}
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
                      <span style={{ marginRight: 10, fontSize: 13, fontWeight: 600 }}>Send to:</span>
                      <select
                        value={recipientType}
                        onChange={(e) => setRecipientType(e.target.value)}
                        className="ttd-select"
                        style={{ padding: '8px 10px' }}
                      >
                        <option value="employee">Employee (public reply)</option>
                        <option value="agent">Agent (agent-only public reply)</option>
                        <option value="internal">Manager-only internal note</option>


                      </select>

                    </label>
                  </div>


                  <textarea
                    className={`ttd-textarea ${recipientType === "internal" ? "ttd-textarea--internal" : ""}`}
                    placeholder={
                      recipientType === "internal"
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
                            <Badge
                              text={h.new_status}
                              colorKey={statusColor(h.new_status)}
                            />
                            <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                              Status set to <b>{h.new_status}</b>
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

          {/* Assignment */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Assign Ticket</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 6 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Agent</span>
                <select
                  className="ttd-select"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  disabled={!agents || agents.length === 0}
                >
                  <option value="">{agents?.length ? "Select an agent" : "No agents found"}</option>
                  {Array.isArray(agents) && agents.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.full_name || a.username || `Agent #${a.id}`}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Note (optional)</span>
                <input
                  className="ttd-input"
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Add note for this assignment"
                />
              </label>

              {assignSuccess && (
                <div style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>{assignSuccess}</div>
              )}

              <button
                className="ttd-btn ttd-btn--primary"
                onClick={handleAssignTicket}
                disabled={assigning || !agentId}
              >
                {assigning ? (
                  <><i className="ti ti-loader ttd-spin" /> Assigning…</>
                ) : (
                  <><i className="ti ti-user-check" /> Assign</>
                )}
              </button>
            </div>
          </div>

          {/* Ticket Info */}


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


        </div>
      </div>
    </div>
  );
}