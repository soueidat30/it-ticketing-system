import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./TeamTicketDetail.css";

import {
  getTicketById,
  getTicketComments,
  addTicketComment,
  getTicketHistory,
  deleteTicketComment,
  assignTicket,
  getUsersByRole,
  getTicketAttachments,
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

  const BASE_URL = "http://127.0.0.1:8000";



// ─────────────────────────────────────────────────────────────────────────────
export default function TeamTicketDetail() {
  const { id }   = useParams();
  const token    = localStorage.getItem("token");
  const me       = JSON.parse(localStorage.getItem("user") || "{}");

  const [ticket,      setTicket]      = useState(null);
  const [comments,    setComments]    = useState([]);
  const [history,     setHistory]     = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [agents,      setAgents]      = useState([]);
  const [loading,     setLoading]     = useState(true);

  // comment form
  const [text,           setText]          = useState("");
  const [recipientType,  setRecipientType] = useState("employee");
  const [sending,        setSending]       = useState(false);
  const [successMessage, setSuccessMessage]= useState("");

  // assignment
  const [agentId,       setAgentId]       = useState("");
  const [assignNote,    setAssignNote]     = useState("");
  const [assigning,     setAssigning]      = useState(false);
  const [assignSuccess, setAssignSuccess]  = useState("");

 

  const [tab, setTab] = useState("comments");

  // ── fetch everything ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !id) return;

    const fetchAll = async () => {
      try {
        // fetch all in parallel — note: 5 promises, 5 variables
        const [t, c, h, s, attachRes] = await Promise.all([
          getTicketById(token, id),
          getTicketComments(token, id),
          getTicketHistory(token, id),
          getTicketAttachments(id, token),
        ]);

        // agents dropdown
        let agentUsers = [];
        try {
          agentUsers = await getUsersByRole(token, "agent");
        } catch (e) {
          console.warn("Failed to load agents:", e);
        }

        const normalizedAgents = Array.isArray(agentUsers)
          ? agentUsers
          : Array.isArray(agentUsers?.data)
            ? agentUsers.data
            : [];

        setAgents(normalizedAgents);
        setAgentId(t?.assignee?.id ? String(t.assignee.id) : "");

        setTicket(t);
        setComments(Array.isArray(c) ? c : c?.data || []);
        setHistory(Array.isArray(h) ? h : []);
  

        // attachRes shape can be array, { data: [] }, or { attachments: [] }
        const attachArr = Array.isArray(attachRes)
          ? attachRes
          : Array.isArray(attachRes?.data)
            ? attachRes.data
            : Array.isArray(attachRes?.attachments)
              ? attachRes.attachments
              : [];
        setAttachments(attachArr);

      } catch (err) {
        console.error("Error loading ticket detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, id]);

  // ── add comment ──────────────────────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!text.trim()) return;

    const isInternal = recipientType === "internal";
    setSending(true);

    try {
      // addTicketComment(token, ticketId, content, isInternal)
      const created = await addTicketComment(token, id, text.trim(), isInternal);

      if (created?.id != null) {
        setComments((prev) => {
          const arr = Array.isArray(prev) ? [...prev] : [];
          if (!arr.some((c) => c.id === created.id)) arr.push(created);
          return arr;
        });
      } else {
        const updated = await getTicketComments(token, id);
        setComments(Array.isArray(updated) ? updated : []);
      }

      setText("");
      setRecipientType("employee");
      setSuccessMessage("Comment sent ✓");
      setTimeout(() => setSuccessMessage(""), 2500);
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSending(false);
    }
  };

  // ── delete comment ───────────────────────────────────────────────────────────
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteTicketComment(token, id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  // ── assign ticket ────────────────────────────────────────────────────────────
  const handleAssignTicket = async () => {
    if (!agentId) return;
    setAssigning(true);
    setAssignSuccess("");
    try {
      await assignTicket(token, id, agentId, assignNote);
      const updated = await getTicketById(token, id);
      setTicket(updated);
      setAssignSuccess("Ticket assigned successfully ✓");
      setTimeout(() => setAssignSuccess(""), 3000);
    } catch (err) {
      console.error("Assign failed:", err);
    } finally {
      setAssigning(false);
    }
  };

 

  // ── guards ───────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="ttd-loading">
      <i className="ti ti-loader ttd-spin" />
      <span>Loading ticket…</span>
    </div>
  );

  if (!ticket) return (
    <div className="ttd-empty">
      <i className="ti ti-ticket-off" />
      <p>Ticket not found.</p>
    </div>
  );

  const sName = ticket.status?.status_name || "Unknown";
  const pName = ticket.priority?.priority_name || "Unknown";
  const cName = ticket.category?.category_name || "—";

  return (
    <div className="ttd-page">

      {/* ── HEADER ── */}
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

      {/* ── BODY ── */}
      <div className="ttd-body">

        {/* ── LEFT ── */}
        <div className="ttd-main">

          {/* Description */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Description</h3>
            <p className="ttd-description">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {/* ── ATTACHMENTS ── */}
          {attachments.length > 0 && (
            <div className="ttd-card">
              <h3 className="ttd-card__title">
                <i className="ti ti-paperclip" style={{ marginRight: 6 }} />
                Attachments ({attachments.length})
              </h3>
              <div className="ttd-attachments">
                {attachments.map((file) => {
                  const isImage = String(file.file_type ?? "").includes("image");
                  const fileUrl = `${BASE_URL}/storage/${file.file_path}`;

                  const preview = async () => {
                    const previewRes = await fetch(
                      `${BASE_URL}/api/manager/tickets/${id}/attachments/${file.id}/preview`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          Accept: "*/*",
                        },
                      }
                    );
                    if (!previewRes.ok) {
                      const msg = await previewRes.text().catch(() => "Preview failed");
                      throw new Error(msg);
                    }
                    const blob = await previewRes.blob();
                    const url = window.URL.createObjectURL(blob);
                    window.open(url, "_blank", "noopener,noreferrer");
                    setTimeout(() => window.URL.revokeObjectURL(url), 60000);
                  };

                  const download = async () => {
                    const dlRes = await fetch(
                      `${BASE_URL}/api/manager/tickets/${id}/attachments/${file.id}`,
                      {
                        headers: {
                          Authorization: `Bearer ${token}`,
                          Accept: "*/*",
                        },
                      }
                    );
                    if (!dlRes.ok) {
                      const msg = await dlRes.text().catch(() => "Download failed");
                      throw new Error(msg);
                    }
                    const blob = await dlRes.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = file.file_name || "attachment";
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    URL.revokeObjectURL(url);
                  };

                  return (
                   <div key={file.id} className="ttd-attachment-item">
  {isImage ? (
    <a href={fileUrl} target="_blank" rel="noreferrer">
      <img
        src={fileUrl}
        alt={file.file_name}
        className="ttd-attachment-thumb"
      />
    </a>
  ) : (
    <div className="ttd-attachment-file">
      <i className="ti ti-file-description" />
    </div>
  )}

  <div className="ttd-attachment-info">
    <span className="ttd-attachment-name">{file.file_name}</span>
    <span className="ttd-attachment-size">
      {file.file_size
        ? `${(file.file_size / 1024).toFixed(0)} KB`
        : file.file_type}
    </span>
  </div>

  <div className="ttd-attachment-actions">
   <button
  className="ttd-btn ttd-btn-preview"
  onClick={() =>
    axios.get(`${BASE_URL}/api/manager/tickets/${id}/attachments/${file.id}/preview`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      // handle preview response
      window.open(`${BASE_URL}/api/manager/tickets/${id}/attachments/${file.id}/preview?token=${token}`, "_blank");
    })
    .catch(err => console.error("Preview failed:", err))
  }
>
  Preview
</button>
<button
  className="ttd-btn ttd-btn-download"
  onClick={() =>
    axios.get(`${BASE_URL}/api/manager/tickets/${id}/attachments/${file.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob" // important for file downloads
    })
    .then((res) => {
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.file_name); // use original filename
      document.body.appendChild(link);
      link.click();
      link.remove();
    })
    .catch((err) => console.error("Download failed:", err))
  }
>
  Download
</button>

  </div>
</div>

                  );
                })}
              </div>
            </div>
          )}

          {/* ── TABS ── */}
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

            {/* COMMENTS TAB */}
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
                                {c.user?.full_name || "Unknown"}
                              </span>
                              {c.internal && (
                                <span className="ttd-internal-badge">
                                  <i className="ti ti-lock" /> Internal note
                                </span>
                              )}
                              <span className="ttd-comment__time">
                                {timeAgo(c.created_at)}
                              </span>
                              <button
                                className="ttd-btn ttd-btn--ghost ttd-btn--sm"
                                onClick={() => handleDeleteComment(c.id)}
                              >
                                <i className="ti ti-trash" />
                              </button>
                            </div>
                            <p className="ttd-comment__text">
                              {c.content || c.text || "—"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Comment input */}
                <div className="ttd-comment-input">
                  <div className="ttd-comment-input__toolbar">
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginRight: 8 }}>
                      Send to:
                    </span>
                    <select
                      className="ttd-select"
                      value={recipientType}
                      onChange={(e) => setRecipientType(e.target.value)}
                      style={{ padding: "6px 10px" }}
                    >
                      <option value="employee">Employee (public reply)</option>
                      <option value="agent">Agent only</option>
                      <option value="internal">Internal note (manager only)</option>
                    </select>
                  </div>

                  <textarea
                    className={`ttd-textarea ${recipientType === "internal" ? "ttd-textarea--internal" : ""}`}
                    placeholder={
                      recipientType === "internal"
                        ? "Write an internal note (only visible to managers)…"
                        : "Write a reply visible to the employee…"
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
                    {successMessage && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#16a34a" }}>
                        {successMessage}
                      </span>
                    )}
                    <button
                      className="ttd-btn ttd-btn--primary"
                      onClick={handleAddComment}
                      disabled={sending || !text.trim()}
                    >
                      {sending
                        ? <><i className="ti ti-loader ttd-spin" /> Sending…</>
                        : <><i className="ti ti-send" /> Send</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
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
                            <Badge text={h.new_status} colorKey={statusColor(h.new_status)} />
                            <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                              Status set to <b>{h.new_status}</b>
                            </span>
                          </div>
                          <div className="ttd-timeline__meta">
                            <span><i className="ti ti-user" /> {h.changed_by_name || "System"}</span>
                            <span><i className="ti ti-clock" /> {timeAgo(h.created_at)}</span>
                          </div>
                          {h.note && <p className="ttd-timeline__note">"{h.note}"</p>}
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

          {/* Assign */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Assign Ticket</h3>
            <div className="ttd-status-form">
              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Agent</label>
              <select
                className="ttd-select"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                disabled={!agents.length}
              >
                <option value="">
                  {agents.length ? "Select an agent" : "No agents found"}
                </option>
                {agents.map((a) => (
                  <option key={a.id} value={String(a.id)}>
                    {a.full_name || a.username || `Agent #${a.id}`}
                  </option>
                ))}
              </select>

              <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Note (optional)</label>
              <input
                className="ttd-select"
                value={assignNote}
                onChange={(e) => setAssignNote(e.target.value)}
                placeholder="Add note for this assignment"
                style={{ fontFamily: "inherit" }}
              />

              {assignSuccess && (
                <div className="ttd-success">
                  <i className="ti ti-circle-check" /> {assignSuccess}
                </div>
              )}

              <button
                className="ttd-btn ttd-btn--primary ttd-btn--full"
                onClick={handleAssignTicket}
                disabled={assigning || !agentId}
              >
                {assigning
                  ? <><i className="ti ti-loader ttd-spin" /> Assigning…</>
                  : <><i className="ti ti-user-check" /> Assign</>
                }
              </button>
            </div>
          </div>

     
          {/* Ticket Info */}
          <div className="ttd-card">
            <h3 className="ttd-card__title">Ticket Info</h3>
            <dl className="ttd-info-list">
              <div className="ttd-info-row"><dt>Employee</dt><dd>{ticket.user?.full_name || "—"}</dd></div>
              <div className="ttd-info-row"><dt>Department</dt><dd>{ticket.user?.department || "—"}</dd></div>
              <div className="ttd-info-row"><dt>Category</dt><dd>{cName}</dd></div>
              <div className="ttd-info-row">
                <dt>Priority</dt>
                <dd><Badge text={pName} colorKey={priorityColor(pName)} /></dd>
              </div>
              <div className="ttd-info-row">
                <dt>Status</dt>
                <dd><Badge text={sName} colorKey={statusColor(sName)} /></dd>
              </div>
              <div className="ttd-info-row">
                <dt>Assignee</dt>
                <dd>{ticket.assignee?.full_name || <em className="ttd-muted">Unassigned</em>}</dd>
              </div>
              <div className="ttd-info-row"><dt>Created</dt><dd>{timeAgo(ticket.created_at)}</dd></div>
              {ticket.resolved_at && (
                <div className="ttd-info-row"><dt>Resolved</dt><dd>{timeAgo(ticket.resolved_at)}</dd></div>
              )}
            </dl>
          </div>

        </div>
      </div>
    </div>
  );
}