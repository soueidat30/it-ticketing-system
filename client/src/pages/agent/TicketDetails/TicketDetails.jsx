import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./TicketDetails.css";

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  back:      "M19 12H5 M12 19l-7-7 7-7",
  resolve:   "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  update:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  comment:   "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  lock:      "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  attach:    "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  history:   "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  info:      "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  send:      "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  download:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  user:      "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  mail:      "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone:     "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  warning:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  clip:      "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
};

const initials = (name = "") =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const PriorityBadge = ({ p = "low" }) => {
  const value = (typeof p === "string" ? p : String(p ?? "low")).toLowerCase();
  return <span className={`agent-badge agent-badge--${value}`}>{value}</span>;
};
const StatusBadge = ({ s = "open" }) => {
  const value = (typeof s === "string" ? s : String(s ?? "open")).toLowerCase();
  return <span className={`agent-badge agent-badge--${value.replace(/\s+/g, "-")}`}>{value}</span>;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

const ATTACH_TYPE_CLASS = { img: "img", pdf: "pdf", log: "log", doc: "doc" };
const ATTACH_TYPE_LABEL = { img: "IMG", pdf: "PDF", log: "LOG", doc: "DOC" };

const BASE_URL = "http://127.0.0.1:8000/api";

export default function TicketDetails() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const ticketId   = location.state?.ticketId;

  const [ticket,        setTicket]        = useState(null);
  const [comments,      setComments]      = useState([]);
  const [attachments,   setAttachments]   = useState([]);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [activeTab,     setActiveTab]     = useState("details");
  const [commentText,   setCommentText]   = useState("");
  const [commentType,   setCommentType]   = useState("public");
  const [submitting,    setSubmitting]    = useState(false);
  const [commentError,  setCommentError]  = useState(null);

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const agentName = user.full_name || user.username || "Agent";

  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) { setError("Ticket not found."); setLoading(false); return; }

      const token = localStorage.getItem("token");
      if (!token)  { setError("Unauthorized. Please log in."); setLoading(false); return; }

      try {
        const res  = await fetch(`${BASE_URL}/agent/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json();

        if (!res.ok) { setError(data.message || "Failed to load ticket."); return; }

        setTicket(data.ticket ?? data);
        setComments(data.comments    ?? []);
        setAttachments(data.attachments ?? []);
        setTicketHistory(data.history    ?? []);
      } catch (err) {
        console.error(err);
        setError("Unable to load ticket.");
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [ticketId]);

  const ticketNumber   = ticket?.ticket_number ?? ticket?.id ?? "Unknown";
  const subject        = ticket?.title        ?? "Untitled ticket";
  const desc           = ticket?.description  ?? "No description available.";

  const requesterName  = ticket?.user?.full_name  ?? ticket?.user?.username ?? "Unknown";
  const requesterDept  = ticket?.user?.department ?? "N/A";
  const requesterEmail = ticket?.user?.email      ?? "—";
  const requesterPhone = ticket?.user?.phone      ?? "—";          
  const requesterJoined = ticket?.user?.created_at
    ? new Date(ticket.user.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";

  const assignee = ticket?.assignee?.full_name ?? ticket?.assignee?.username ?? "Unassigned";

  const category = ticket?.category?.category_name ?? "General";
  const priority = (ticket?.priority?.priority_name ?? "low").toLowerCase();
  const status   = (ticket?.status?.status_name   ?? "open").toLowerCase().replace(/\s+/g, "-");

  const createdLabel = formatDate(ticket?.created_at);
  const updatedLabel = formatDate(ticket?.updated_at);
  const dueLabel     = formatDate(ticket?.due_at ?? ticket?.resolved_at); 
  const slaBreached  = ticket?.sla_breached  ?? false;
  const slaPercent   = Number(ticket?.sla_percent ?? 100);
  const timeOpen     = ticket?.time_open     ?? "—";
  const tags         = ticket?.tags          ?? [];

  const tabs = [
    { key: "details",     label: "Details",     icon: IC.info },
    { key: "comments",    label: "Comments",    icon: IC.comment, count: comments.length },
    { key: "attachments", label: "Attachments", icon: IC.attach,  count: attachments.length },
    { key: "history",     label: "History",     icon: IC.history, count: ticketHistory.length },
  ];

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    setCommentError(null);

    const token = localStorage.getItem("token");
    try {
      const res  = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/comments`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept:         "application/json",
        },
        body: JSON.stringify({
          content:  commentText.trim(),
          internal: commentType === "internal",
        }),
      });

      const data = await res.json();
      if (!res.ok) { setCommentError(data.message || "Failed to post comment."); return; }

      setComments(prev => [...prev, data]);
      setCommentText("");
    } catch (err) {
      console.error(err);
      setCommentError("Network error — could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const CommentAvatar = ({ role, name }) => {
    const cls = role === "agent" ? "agent" : role === "system" ? "system" : "user";
    return <div className={`td-comment-avatar td-comment-avatar--${cls}`}>{initials(name)}</div>;
  };

  if (loading) {
    return (
      <div className="ticket-details">
        <div className="agent-page-header">
          <div>
            <h1 className="agent-page-title">Ticket Details</h1>
            <p className="agent-page-subtitle">Loading ticket…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-details">
        <div className="agent-page-header">
          <div>
            <h1 className="agent-page-title">Ticket Details</h1>
            <p className="agent-page-subtitle">{error}</p>
          </div>
          <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
            <Icon d={IC.back} /> Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-details">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Ticket Details</h1>
          <p className="agent-page-subtitle">Full view of ticket #{ticketNumber}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
            <Icon d={IC.back} /> Back
          </button>
          <button className="agent-btn agent-btn--ghost" onClick={() => navigate("/agent/update-status", { state: { ticketId } })}>
            <Icon d={IC.update} /> Update Status
          </button>
          <button className="agent-btn agent-btn--accent" onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}>
            <Icon d={IC.resolve} /> Resolve
          </button>
        </div>
      </div>

      <div className="td-layout">
        <div>
          <div className="td-hero">
            <div className="td-hero-top">
              <span className="td-hero-id">#{ticketNumber}</span>
              <div className="td-hero-badges">
                {slaBreached && (
                  <span style={{ fontSize: 11, fontWeight: 700, background: "#fee2e2", color: "#b91c1c", padding: "3px 9px", borderRadius: 20 }}>
                    SLA BREACHED
                  </span>
                )}
                <PriorityBadge p={priority} />
                <StatusBadge   s={status}   />
              </div>
            </div>
            <div className="td-hero-title">{subject}</div>
            <div className="td-hero-desc">{desc}</div>
            <div className="td-hero-meta">
              {[
                { label: "Category",  value: category },
                { label: "Requester", value: requesterName },
                { label: "Assignee",  value: assignee },
                { label: "Created",   value: createdLabel },
                { label: "Due",       value: dueLabel, style: { color: "#fca5a5" } },
                { label: "Time Open", value: timeOpen },
              ].map(item => (
                <div className="td-hero-meta-item" key={item.label}>
                  <span className="td-hero-meta-label">{item.label}</span>
                  <span className="td-hero-meta-value" style={item.style}>{item.value}</span>
                </div>
              ))}
            </div>
            {tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                {tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 600, padding: "2px 9px", background: "rgba(212,242,101,0.15)", color: "var(--agent-accent)", borderRadius: 20, border: "1px solid rgba(212,242,101,0.25)" }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="td-tabs">
            {tabs.map(tab => (
              <button key={tab.key} className={`td-tab${activeTab === tab.key ? " active" : ""}`} onClick={() => setActiveTab(tab.key)}>
                <Icon d={tab.icon} size={14} />
                {tab.label}
                {tab.count != null && <span className="td-tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab === "details" && (
            <div className="td-panel">
              <div className="td-requester-card">
                <div className="td-requester-avatar">{initials(requesterName)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="td-requester-name">{requesterName}</div>
                  <div className="td-requester-meta">{requesterDept} · Member since {requesterJoined}</div>
                  <div className="td-requester-contact">
                    <button className="agent-btn agent-btn--ghost agent-btn--sm"><Icon d={IC.mail} size={12} /> {requesterEmail}</button>
                    <button className="agent-btn agent-btn--ghost agent-btn--sm"><Icon d={IC.phone} size={12} /> {requesterPhone}</button>
                  </div>
                </div>
              </div>

              <div className="td-details-grid">
                <div className="td-detail-card">
                  <div className="td-detail-card-title">Ticket Info</div>
                  <div className="td-detail-rows">
                    {[
                      { key: "Ticket ID",   val: `#${ticketNumber}` },
                      { key: "Category",    val: category },
                      { key: "Priority",    val: <PriorityBadge p={priority} /> },
                      { key: "Status",      val: <StatusBadge   s={status}   /> },
                      { key: "Created",     val: createdLabel },
                      { key: "Last Update", val: updatedLabel },
                    ].map(row => (
                      <div className="td-detail-row" key={row.key}>
                        <span className="td-detail-key">{row.key}</span>
                        <span className="td-detail-val">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="td-detail-card">
                  <div className="td-detail-card-title">Assignment & SLA</div>
                  <div className="td-detail-rows">
                    {[
                      { key: "Assignee",  val: assignee },
                      { key: "Due Date",  val: dueLabel, style: { color: "var(--agent-danger)" } },
                      { key: "Time Open", val: timeOpen },
                    ].map(row => (
                      <div className="td-detail-row" key={row.key}>
                        <span className="td-detail-key">{row.key}</span>
                        <span className="td-detail-val" style={row.style}>{row.val}</span>
                      </div>
                    ))}
                    <div className="td-detail-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <span className="td-detail-key">SLA Status</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: slaBreached ? "var(--agent-danger)" : "var(--agent-success)" }}>
                          {slaBreached ? `Breached (+${Math.max(slaPercent - 100, 0)}%)` : "Within SLA"}
                        </span>
                      </div>
                      <div className="td-sla-bar-track" style={{ width: "100%" }}>
                        <div className={`td-sla-bar-fill ${slaBreached ? "td-sla-bar-fill--danger" : "td-sla-bar-fill--success"}`} style={{ width: `${Math.min(Math.max(slaPercent, 0), 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="td-panel">
              <div className="td-comments">
                {comments.length === 0 && (
                  <div className="td-empty">
                    <Icon d={IC.comment} size={32} />
                    <div className="td-empty-title">No comments yet</div>
                    <p style={{ fontSize: 13 }}>Be the first to reply to this ticket.</p>
                  </div>
                )}

                {comments.map((c, i) => (
                  <div key={c.id ?? i} className={`td-comment${c.internal ? " internal" : ""}`}>
                    <CommentAvatar role={c.role} name={c.author} />
                    <div className="td-comment-body">
                      <div className="td-comment-header">
                        <span className="td-comment-author">{c.author}</span>
                        <span className={`td-comment-role td-comment-role--${c.internal ? "internal" : c.role}`}>
                          {c.internal ? "Internal Note" : c.role === "agent" ? "Support Agent" : c.role === "system" ? "System" : "Requester"}
                        </span>
                        <span className="td-comment-time">{c.time}</span>
                      </div>
                      <div className="td-comment-text">{c.text}</div>
                      {c.internal && (
                        <div className="td-internal-label"><Icon d={IC.lock} size={10} /> Internal — not visible to requester</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="td-comment-form">
                <div className="td-comment-form-top">
                  <button className={`td-comment-type-btn${commentType === "public"   ? " active" : ""}`} onClick={() => setCommentType("public")}>
                    <Icon d={IC.comment} size={14} /> Public Reply
                  </button>
                  <button className={`td-comment-type-btn${commentType === "internal" ? " active" : ""}`} onClick={() => setCommentType("internal")}>
                    <Icon d={IC.lock}    size={14} /> Internal Note
                  </button>
                </div>
                <textarea
                  className={`td-comment-textarea${commentType === "internal" ? " internal-mode" : ""}`}
                  placeholder={commentType === "public" ? "Write a reply to the requester…" : "Write an internal note (only visible to agents)…"}
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={4}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
                />
                {commentError && (
                  <div style={{ padding: "6px 16px", background: "#fee2e2", color: "#b91c1c", fontSize: 12 }}>
                    {commentError}
                  </div>
                )}
                <div className="td-comment-form-footer">
                  <span className="td-comment-hint">Ctrl+Enter to send</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button className="agent-btn agent-btn--ghost agent-btn--sm"><Icon d={IC.clip} size={13} /> Attach</button>
                    <button
                      className="agent-btn agent-btn--primary agent-btn--sm"
                      onClick={handleSendComment}
                      disabled={!commentText.trim() || submitting}
                      style={{ opacity: !commentText.trim() ? 0.5 : 1 }}
                    >
                      {submitting ? "Sending…" : <><Icon d={IC.send} size={13} /> {commentType === "public" ? "Send Reply" : "Add Note"}</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="td-panel">
              {attachments.length === 0 ? (
                <div className="td-empty">
                  <Icon d={IC.attach} size={32} />
                  <div className="td-empty-title">No attachments</div>
                  <p style={{ fontSize: 13 }}>No files have been uploaded to this ticket yet.</p>
                </div>
              ) : (
                <div className="td-attachments-grid">
                  {attachments.map((a, i) => (
                    <div className="td-attachment-card" key={a.id ?? i}>
                      <div className={`td-attachment-icon td-attachment-icon--${ATTACH_TYPE_CLASS[a.type] ?? "doc"}`}>
                        {ATTACH_TYPE_LABEL[a.type] ?? "DOC"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="td-attachment-name">{a.name}</div>
                        <div className="td-attachment-size">{a.size} · {a.uploaded}</div>
                      </div>
                      <button className="agent-btn agent-btn--ghost agent-btn--sm" title="Download">
                        <Icon d={IC.download} size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="td-panel">
              {ticketHistory.length === 0 ? (
                <div className="td-empty">
                  <Icon d={IC.history} size={32} />
                  <div className="td-empty-title">No history yet</div>
                  <p style={{ fontSize: 13 }}>Activity and ticket events will appear here once they are recorded.</p>
                </div>
              ) : (
                <div style={{ background: "var(--agent-surface)", border: "1px solid var(--agent-border)", borderRadius: "var(--radius)", padding: "20px 24px", boxShadow: "var(--agent-shadow)" }}>
                  <div className="td-history">
                    {ticketHistory.map((ev, i) => (
                      <div className="td-history-item" key={ev.id ?? i}>
                        <div className="td-history-spine">
                          <div className={`td-history-dot td-history-dot--${ev.type ?? "status"}`} />
                          <div className="td-history-line" />
                        </div>
                        <div className="td-history-content">
                          <div className="td-history-event">{ev.event}</div>
                          <div className="td-history-actor">{ev.actor}</div>
                          <div className="td-history-time">{ev.time}</div>
                          {ev.note && <div style={{ fontSize: 12, color: "var(--agent-muted)", marginTop: 2 }}>{ev.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="td-sidebar">
          <div className="td-side-card">
            <div className="td-side-header">Quick Actions</div>
            <div className="td-quick-actions">
              <button className="agent-btn agent-btn--primary"  style={{ justifyContent: "center" }} onClick={() => navigate("/agent/update-status",  { state: { ticketId } })}><Icon d={IC.update}  /> Update Status</button>
              <button className="agent-btn agent-btn--accent"   style={{ justifyContent: "center" }} onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}><Icon d={IC.resolve} /> Resolve Ticket</button>
              <button className="agent-btn agent-btn--ghost"    style={{ justifyContent: "center" }} onClick={() => setActiveTab("comments")}><Icon d={IC.comment} /> Add Comment</button>
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">Ticket Metadata</div>
            <div className="td-side-body">
              {[
                { key: "ID",       val: `#${ticketNumber}` },
                { key: "Priority", val: <PriorityBadge p={priority} /> },
                { key: "Status",   val: <StatusBadge   s={status}   /> },
                { key: "Category", val: category },
                { key: "Assignee", val: assignee },
                { key: "Created",  val: createdLabel },
                { key: "Updated",  val: updatedLabel },
              ].map(row => (
                <div className="td-side-row" key={row.key}>
                  <span className="td-side-key">{row.key}</span>
                  <span className="td-side-val">{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">SLA Status</div>
            <div className="td-side-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: slaBreached ? "var(--agent-danger)" : "var(--agent-success)" }}>{slaBreached ? "Breached" : "On track"}</span>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: slaBreached ? "var(--agent-danger)" : "var(--agent-success)" }}>{Math.min(Math.max(slaPercent, 0), 200)}%</span>
              </div>
              <div className="td-sla-bar-track">
                <div className={`td-sla-bar-fill ${slaBreached ? "td-sla-bar-fill--danger" : "td-sla-bar-fill--success"}`} style={{ width: `${Math.min(Math.max(slaPercent, 0), 100)}%` }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--agent-muted)", marginTop: 4 }}>
                Due was {dueLabel} · {slaBreached ? "Overdue" : "On schedule"}
              </div>
              {slaBreached && (
                <div style={{ padding: "8px 12px", background: "#fee2e2", borderRadius: "var(--radius-sm)", display: "flex", gap: 7, alignItems: "flex-start", marginTop: 4 }}>
                  <Icon d={IC.warning} size={14} />
                  <span style={{ fontSize: 12, color: "#b91c1c", lineHeight: 1.5 }}>Escalation sent to manager. Resolve this ticket as soon as possible.</span>
                </div>
              )}
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">Requester</div>
            <div className="td-side-body">
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--agent-primary), #0a5f6e)", color: "var(--agent-accent)", fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {initials(requesterName)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{requesterName}</div>
                  <div style={{ fontSize: 12, color: "var(--agent-muted)" }}>{requesterDept}</div>
                </div>
              </div>
              {[
                { label: "Email", val: requesterEmail },
                { label: "Phone", val: requesterPhone },
                { label: "Since", val: requesterJoined },
              ].map(row => (
                <div className="td-side-row" key={row.label}>
                  <span className="td-side-key">{row.label}</span>
                  <span className="td-side-val" style={{ fontSize: 12 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">Tags</div>
            <div className="td-side-body">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {tags.length > 0 ? tags.map(tag => (
                  <span key={tag} style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", background: "rgba(3,54,61,0.06)", color: "var(--agent-primary)", borderRadius: 20, border: "1px solid rgba(3,54,61,0.12)" }}>#{tag}</span>
                )) : (
                  <span style={{ fontSize: 12, color: "var(--agent-muted)" }}>No tags assigned</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}