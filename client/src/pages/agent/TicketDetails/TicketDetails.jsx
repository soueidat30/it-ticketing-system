import { useState, useEffect, useRef } from "react";
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
  back:    "M19 12H5 M12 19l-7-7 7-7",
  resolve: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  update:  "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  comment: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  lock:    "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  attach:  "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  history: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  info:    "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  send:    "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  download:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  phone:   "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.22 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.06 6.06l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  clip:    "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13",
  trash:   "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6 M10 11v6 M14 11v6",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
  spin:    "M21 12a9 9 0 11-6.219-8.56",
  checkSm: "M20 6L9 17l-5-5",
  upload:  "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
};

const initials = (name = "") =>
  name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

const PriorityBadge = ({ p = "low" }) => {
  const v = String(p ?? "low").toLowerCase();
  return <span className={`agent-badge agent-badge--${v}`}>{v}</span>;
};
const StatusBadge = ({ s = "open" }) => {
  const v = String(s ?? "open").toLowerCase().replace(/\s+/g, "-");
  return <span className={`agent-badge agent-badge--${v}`}>{v}</span>;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const ALLOWED_ATTACHMENT_EXTENSIONS = ["pdf", "png", "jfif", "doc", "docx", "xls", "xlsx"];
const ALLOWED_ACCEPT_ATTR = ".pdf,.png,.jfif,.doc,.docx,.xls,.xlsx";
const MAX_ATTACHMENT_BYTES = 1024 * 1024; 

const formatBytes = (bytes) => {
  if (bytes == null) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const ATTACH_TYPE_CLASS = { img: "img", pdf: "pdf", doc: "doc", xls: "xls", log: "log" };
const ATTACH_TYPE_LABEL = { img: "IMG", pdf: "PDF", doc: "DOC", xls: "XLS", log: "LOG" };

const ATTACH_TYPE_COLOR = {
  img: { bg: "#dbeafe", color: "#1d4ed8" },
  pdf: { bg: "#fee2e2", color: "#b91c1c" },
  doc: { bg: "#dbeafe", color: "#1d4ed8" },
  xls: { bg: "#dcfce7", color: "#15803d" },
  log: { bg: "#f1f5f9", color: "#475569" },
};

const BASE_URL = "http://127.0.0.1:8000/api";

const readErrorMessage = async (res, fallback) => {
  try {
    const data = await res.clone().json();
    if (data?.message) return data.message;
  } catch {
    //
  }
  return `${fallback} (HTTP ${res.status})`;
};

export default function TicketDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketId = location.state?.ticketId;

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const currentUserId   = user.id;
  const currentUserRole = user.role ?? "employee"; 

  const token = localStorage.getItem("token");

  const [ticket,        setTicket]        = useState(null);
  const [comments,      setComments]      = useState([]);
  const [attachments,   setAttachments]   = useState([]);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const [activeTab,     setActiveTab]     = useState("details");
  const [activeSection, setActiveSection] = useState("public"); 

  const [commentText,  setCommentText]  = useState("");
  const [commentType,  setCommentType]  = useState("public");
  const [submitting,   setSubmitting]   = useState(false);
  const [commentError, setCommentError] = useState(null);

  const [deletingId,  setDeletingId]  = useState(null);  
  const [deleteError, setDeleteError] = useState(null);

  const fileInputRef          = useRef(null);
  const dragCounterRef        = useRef(0); 
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState(null);
  const [uploadedName, setUploadedName] = useState(null); 
  const [isDragging,   setIsDragging]   = useState(false);
  const [busyAttachmentId, setBusyAttachmentId] = useState(null); 
  const [pendingAttachmentFile, setPendingAttachmentFile] = useState(null);
  const [pendingAttachmentError, setPendingAttachmentError] = useState(null);

  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null);
  const [deleteAttachmentError, setDeleteAttachmentError] = useState(null);
  const [deletingAttachmentBusy, setDeletingAttachmentBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        if (!ticketId) {
          if (!cancelled) setError("Ticket not found.");
          return;
        }
        if (!token) {
          if (!cancelled) setError("Unauthorized.");
          return;
        }

        const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.message || "Failed to load ticket.");
          return;
        }

        if (!cancelled) {
          setTicket(data.ticket ?? data);
          setComments(data.comments ?? []);
          setAttachments(data.attachments ?? []);
          setTicketHistory(data.history ?? []);
        }
      } catch {
        if (!cancelled) setError("Unable to load ticket.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    Promise.resolve().then(() => {
      if (!cancelled) setLoading(true);
    });
    load();

    return () => {
      cancelled = true;
    };
  }, [ticketId, token]);

  useEffect(() => {
    if (!uploadedName) return;
    const t = setTimeout(() => setUploadedName(null), 5000);
    return () => clearTimeout(t);
  }, [uploadedName]);

  const ticketNumber   = ticket?.ticket_number ?? ticket?.id ?? "Unknown";
  const subject        = ticket?.title        ?? "Untitled ticket";
  const desc           = ticket?.description  ?? "No description available.";
  const requesterName  = ticket?.user?.full_name  ?? ticket?.user?.username ?? "Unknown";
  const requesterDept  = ticket?.user?.department ?? "No department";
  const requesterEmail = ticket?.user?.email ?? "—";

  const requesterJoined = ticket?.user?.created_at
    ? new Date(ticket.user.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";
  const assignee  = ticket?.assignee?.full_name ?? ticket?.assignee?.username ?? "Unassigned";
  const category  = ticket?.category?.category_name ?? "General";
  const priority  = String(ticket?.priority?.priority_name ?? "low").toLowerCase();
  const status    = String(ticket?.status?.status_name ?? "open").toLowerCase().replace(/\s+/g, "-");
  const createdLabel = formatDate(ticket?.created_at);
  const updatedLabel = formatDate(ticket?.updated_at);
  const dueRaw = ticket?.due_at ?? ticket?.due_date ?? ticket?.dueDate;
  const dueLabel = dueRaw ? formatDate(dueRaw) : "—";

  const slaBreached  = ticket?.sla_breached ?? false;
  const slaPercent   = Number(ticket?.sla_percent ?? 0);

  const timeOpen = ticket?.time_open ?? "—";

  const canSeeInternal = currentUserRole === "agent" || currentUserRole === "admin";

  const tabs = [
    { key: "details",     label: "Details",     icon: IC.info    },
    { key: "comments",    label: "Comments",    icon: IC.comment, count: comments.filter(c => !c.internal || canSeeInternal).length },
    { key: "attachments", label: "Attachments", icon: IC.attach,  count: attachments.length },
    { key: "history",     label: "History",     icon: IC.history, count: ticketHistory.length },
  ];

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    setCommentError(null);
    try {
      const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ content: commentText.trim(), internal: commentType === "internal" }),
      });
      const data = await res.json();
      if (!res.ok) { setCommentError(data.message || "Failed to post comment."); return; }
      setComments(prev => [...prev, data]);
      setCommentText("");
      setActiveSection(commentType === "internal" ? "internal" : "public");
    } catch {
      setCommentError("Network error — could not post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    setDeleteError(null);
    try {
      const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.message || "Failed to delete."); return; }
      setComments(prev => prev.filter(c => c.id !== commentId));
      setDeletingId(null);
    } catch {
      setDeleteError("Network error — could not delete.");
    }
  };

  const validateAndStageAttachment = async (file) => {
    if (!file) return;
    setPendingAttachmentError(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
      setPendingAttachmentError(
        `"${file.name}" isn't an allowed file type. Allowed: PDF, PNG, JFIF, DOC, DOCX, XLS, XLSX.`
      );
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setPendingAttachmentError(
        `"${file.name}" is ${formatBytes(file.size)} — the max allowed size is 1 MB.`
      );
      return;
    }

    setPendingAttachmentFile(file);
  };

  const uploadStagedAttachment = async () => {
    const file = pendingAttachmentFile;
    if (!file) return;

    setUploadError(null);
    setPendingAttachmentError(null);
    setUploadedName(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(data.message || "Upload failed. Please try again.");
        return;
      }

      setAttachments((prev) => [...prev, data]);
      setUploadedName(data.name || file.name);
      setPendingAttachmentFile(null);
    } catch {
      setUploadError("Network error — could not upload file.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; 
    validateAndStageAttachment(file);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading) return;
    dragCounterRef.current += 1;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    if (uploading) return;

    const file = e.dataTransfer?.files?.[0];
    validateAndStageAttachment(file);
  };

  const handlePreview = async (attachmentId) => {
    setUploadError(null);

    if (!ticketId) {
      setUploadError("Missing ticketId. Please go back and open the ticket again.");
      return;
    }
    if (!attachmentId) {
      setUploadError("Missing attachment id. Cannot preview this file.");
      return;
    }

    setBusyAttachmentId(attachmentId);
    try {
      const res = await fetch(
        `${BASE_URL}/agent/tickets/${ticketId}/attachments/${attachmentId}/preview`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      if (!res.ok) {
        setUploadError(await readErrorMessage(res, "Could not preview this file"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setUploadError("Network error — could not preview file.");
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const handleDownload = async (attachmentId, fileName) => {
    setUploadError(null);

    if (!ticketId) {
      setUploadError("Missing ticketId. Please go back and open the ticket again.");
      return;
    }
    if (!attachmentId) {
      setUploadError("Missing attachment id. Cannot download this file.");
      return;
    }

    setBusyAttachmentId(attachmentId);
    try {
      const res = await fetch(
        `${BASE_URL}/agent/tickets/${ticketId}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      if (!res.ok) {
        setUploadError(await readErrorMessage(res, "Could not download this file"));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName || "attachment";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setUploadError("Network error — could not download file.");
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    setDeleteAttachmentError(null);
    setDeletingAttachmentBusy(true);
    try {
      const res = await fetch(
        `${BASE_URL}/agent/tickets/${ticketId}/attachments/${attachmentId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteAttachmentError(data.message || "Failed to delete attachment.");
        return;
      }
      setAttachments((prev) => prev.filter((a) => (a.id ?? a.attachment_id) !== attachmentId));
      setDeletingAttachmentId(null);
    } catch {
      setDeleteAttachmentError("Network error — could not delete attachment.");
    } finally {
      setDeletingAttachmentBusy(false);
    }
  };

  const CommentAvatar = ({ role, name }) => {
    const cls = role === "agent" ? "agent" : role === "system" ? "system" : "user";
    return <div className={`td-comment-avatar td-comment-avatar--${cls}`}>{initials(name)}</div>;
  };

  if (loading) return (
    <div className="ticket-details">
      <div className="agent-page-header"><div>
        <h1 className="agent-page-title">Ticket Details</h1>
        <p className="agent-page-subtitle">Loading ticket…</p>
      </div></div>
    </div>
  );

  if (error) return (
    <div className="ticket-details">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Ticket Details</h1>
          <p className="agent-page-subtitle" style={{ color: "var(--agent-danger)" }}>{error}</p>
        </div>
        <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> Back
        </button>
      </div>
    </div>
  );

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
          <button className="agent-btn agent-btn--ghost"
            onClick={() => navigate("/agent/update-status", { state: { ticketId } })}>
            <Icon d={IC.update} /> Update Status
          </button>
          <button className="agent-btn agent-btn--accent"
            onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}>
            <Icon d={IC.resolve} /> Resolve
          </button>
        </div>
      </div>

      <div className="td-layout">
        <div>

          {/* Hero */}
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
                <StatusBadge s={status} />
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
                { label: "Due",       value: dueLabel, style: slaBreached ? { color: "#fca5a5" } : {} },
                { label: "Time Open", value: timeOpen },
              ].map(item => (
                <div className="td-hero-meta-item" key={item.label}>
                  <span className="td-hero-meta-label">{item.label}</span>
                  <span className="td-hero-meta-value" style={item.style}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="td-tabs">
            {tabs.map(tab => (
              <button key={tab.key}
                className={`td-tab${activeTab === tab.key ? " active" : ""}`}
                onClick={() => setActiveTab(tab.key)}>
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
                      { key: "Status",      val: <StatusBadge s={status} /> },
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
                      { key: "Due Date",  val: dueLabel, style: slaBreached ? { color: "var(--agent-danger)" } : {} },
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
                          {slaBreached ? "Breached" : "Within SLA"} ({slaPercent}%)
                        </span>
                      </div>
                      <div className="td-sla-bar-track" style={{ width: "100%" }}>
                        <div
                          className={`td-sla-bar-fill ${slaBreached ? "td-sla-bar-fill--danger" : "td-sla-bar-fill--good"}`}
                          style={{ width: `${Math.min(slaPercent, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="td-panel">

              <div className="td-comment-sections">
                <button
                  className={`td-comment-section-btn${activeSection === "public" ? " active" : ""}`}
                  onClick={() => setActiveSection("public")}
                >
                  <Icon d={IC.comment} size={13} />
                  Public Replies
                  <span className="td-comment-section-count">
                    {comments.filter(c => !c.internal).length}
                  </span>
                </button>

                {canSeeInternal && (
                  <button
                    className={`td-comment-section-btn td-comment-section-btn--internal${activeSection === "internal" ? " active" : ""}`}
                    onClick={() => setActiveSection("internal")}
                  >
                    <Icon d={IC.lock} size={13} />
                    Internal Notes
                    <span className="td-comment-section-count td-comment-section-count--internal">
                      {comments.filter(c => c.internal).length}
                    </span>
                  </button>
                )}
              </div>

              <div className="td-comments">
                {(() => {
                  const visible = activeSection === "internal"
                    ? comments.filter(c => c.internal)
                    : comments.filter(c => !c.internal);

                  if (visible.length === 0) return (
                    <div className="td-empty">
                      <Icon d={activeSection === "internal" ? IC.lock : IC.comment} size={32} />
                      <div className="td-empty-title">
                        {activeSection === "internal" ? "No internal notes" : "No public replies yet"}
                      </div>
                      <p style={{ fontSize: 13 }}>
                        {activeSection === "internal"
                          ? "Internal notes are only visible to agents and admins."
                          : "Be the first to reply to this ticket."}
                      </p>
                    </div>
                  );

                  return visible.map((c, i) => {
                    const canDelete  = c.user_id === currentUserId || currentUserRole === "admin" || currentUserRole === "manager";
                    const isDeleting = deletingId === c.id;

                    return (
                      <div key={c.id ?? i} className={`td-comment${c.internal ? " internal" : ""}`}>
                        <CommentAvatar role={c.role} name={c.author} />
                        <div className="td-comment-body">
                          <div className="td-comment-header">
                            <span className="td-comment-author">{c.author}</span>
                            <span className={`td-comment-role td-comment-role--${c.internal ? "internal" : c.role}`}>
                              {c.internal ? "Internal Note"
                                : c.role === "agent" ? "Support Agent"
                                : c.role === "system" ? "System"
                                : "Requester"}
                            </span>
                            <span className="td-comment-time">{c.time}</span>

                            {canDelete && !isDeleting && (
                              <button
                                className="td-comment-delete-btn"
                                title="Delete comment"
                                onClick={() => { setDeletingId(c.id); setDeleteError(null); }}
                              >
                                <Icon d={IC.trash} size={13} />
                              </button>
                            )}
                          </div>

                          <div className="td-comment-text">{c.text}</div>

                          {c.internal && (
                            <div className="td-internal-label">
                              <Icon d={IC.lock} size={10} /> Internal — not visible to requester
                            </div>
                          )}

                          {isDeleting && (
                            <div className="td-comment-confirm-delete">
                              <Icon d={IC.warning} size={14} />
                              <span style={{ flex: 1 }}>Delete this comment? This cannot be undone.</span>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  className="agent-btn agent-btn--ghost agent-btn--sm"
                                  onClick={() => { setDeletingId(null); setDeleteError(null); }}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="agent-btn agent-btn--sm"
                                  style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", fontWeight: 700 }}
                                  onClick={() => handleDeleteComment(c.id)}
                                >
                                  <Icon d={IC.trash} size={12} /> Delete
                                </button>
                              </div>
                              {deleteError && (
                                <div style={{ width: "100%", fontSize: 11.5, color: "#b91c1c", marginTop: 6 }}>
                                  {deleteError}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="td-comment-form">
                <div className="td-comment-form-top">
                  <button
                    className={`td-comment-type-btn${commentType === "public" ? " active" : ""}`}
                    onClick={() => setCommentType("public")}
                  >
                    <Icon d={IC.comment} size={14} /> Public Reply
                  </button>

                  {canSeeInternal && (
                    <button
                      className={`td-comment-type-btn${commentType === "internal" ? " active" : ""}`}
                      onClick={() => setCommentType("internal")}
                    >
                      <Icon d={IC.lock} size={14} /> Internal Note
                    </button>
                  )}
                </div>

                <textarea
                  className={`td-comment-textarea${commentType === "internal" ? " internal-mode" : ""}`}
                  placeholder={
                    commentType === "public"
                      ? "Write a reply to the requester…"
                      : "Write an internal note (only visible to agents)…"
                  }
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
                    <button
                      className="agent-btn agent-btn--ghost agent-btn--sm"
                      type="button"
                      onClick={() => setActiveTab("attachments")}
                      disabled={uploading}
                      title="Upload an attachment for this ticket"
                    >
                      <Icon d={IC.clip} size={13} /> Attach
                    </button>
                    <button
                      className="agent-btn agent-btn--primary agent-btn--sm"
                      onClick={handleSendComment}
                      disabled={!commentText.trim() || submitting}
                      style={{ opacity: !commentText.trim() ? 0.5 : 1 }}
                    >
                      {submitting
                        ? "Sending…"
                        : <><Icon d={IC.send} size={13} /> {commentType === "public" ? "Send Reply" : "Add Note"}</>
                      }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "attachments" && (
            <div className="td-panel">

              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "28px 16px",
                  marginBottom: 16,
                  textAlign: "center",
                  background: isDragging ? "rgba(3,54,61,0.06)" : "var(--agent-bg)",
                  border: `2px dashed ${isDragging ? "var(--agent-primary)" : "var(--agent-border)"}`,
                  borderRadius: "var(--radius)",
                  cursor: uploading ? "default" : "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_ACCEPT_ATTR}
                  onChange={handleFileSelected}
                  disabled={uploading}
                  style={{ display: "none" }}
                />

                <div
                  style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: isDragging ? "var(--agent-primary)" : "var(--agent-surface)",
                    color: isDragging ? "var(--agent-accent)" : "var(--agent-muted)",
                    border: isDragging ? "none" : "1.5px solid var(--agent-border)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                  }}
                >
                  {uploading ? (
                    <svg style={{ width: 18, height: 18, animation: "td-spin 1s linear infinite" }}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={IC.spin} />
                    </svg>
                  ) : (
                    <Icon d={IC.upload} size={18} />
                  )}
                </div>

                {uploading ? (
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--agent-text)" }}>
                    Uploading…
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--agent-text)" }}>
                      {isDragging ? "Drop the file here" : "Drag & drop a file, or click to browse"}
                    </span>
                    <span style={{ fontSize: 11.5, color: "var(--agent-muted)" }}>
                      PDF, PNG, JFIF, DOC, DOCX, XLS, XLSX · Max 1&nbsp;MB
                    </span>
                  </>
                )}
              </div>

              {pendingAttachmentError && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "10px 14px", marginBottom: 16,
                  background: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: "var(--radius-sm)", color: "#b91c1c", fontSize: 12.5,
                }}>
                  <Icon d={IC.warning} size={14} />
                  {pendingAttachmentError}
                </div>
              )}

              {uploadError && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "10px 14px", marginBottom: 16,
                  background: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: "var(--radius-sm)", color: "#b91c1c", fontSize: 12.5,
                }}>
                  <Icon d={IC.warning} size={14} />
                  {uploadError}
                </div>
              )}

      
              {uploadedName && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", marginBottom: 16,
                  background: "#dcfce7", border: "1px solid #86efac",
                  borderRadius: "var(--radius-sm)", color: "#15803d", fontSize: 12.5, fontWeight: 600,
                }}>
                  <Icon d={IC.checkSm} size={14} />
                  "{uploadedName}" uploaded — the requester has been notified.
                </div>
              )}

              {pendingAttachmentFile && !uploading && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "10px 14px", marginBottom: 16,
                  background: "var(--agent-surface)", border: "1px solid var(--agent-border)",
                  borderRadius: "var(--radius-sm)",
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 13, color: "var(--agent-text)", marginBottom: 2 }}>
                      Ready to send attachment
                    </div>
                    <div style={{ fontSize: 12, color: "var(--agent-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {pendingAttachmentFile.name}
                    </div>
                  </div>
                  <button
                    className="agent-btn agent-btn--primary"
                    type="button"
                    onClick={uploadStagedAttachment}
                    disabled={uploading}
                    style={{ flexShrink: 0 }}
                    title="Send Attachment to the requester"
                  >
                    <Icon d={IC.send} size={13} /> Send Attachment
                  </button>
                </div>
              )}

              {deleteAttachmentError && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  padding: "10px 14px", marginBottom: 16,
                  background: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: "var(--radius-sm)", color: "#b91c1c", fontSize: 12.5,
                }}>
                  <Icon d={IC.warning} size={14} />
                  {deleteAttachmentError}
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="td-empty">
                  <Icon d={IC.attach} size={32} />
                  <div className="td-empty-title">No attachments</div>
                  <p style={{ fontSize: 13 }}>No files have been uploaded to this ticket yet.</p>
                </div>
              ) : (
                <div className="td-attachments-grid">
                  {attachments.map((a, i) => {
                    const colors = ATTACH_TYPE_COLOR[a.type] ?? ATTACH_TYPE_COLOR.doc;
                    const attachmentId = a.id ?? a.attachment_id;
                    const attachmentName = a.name ?? a.file_name;
                    const attachmentType = a.type ?? a.file_type;
                    const isBusy = busyAttachmentId === attachmentId || (deletingAttachmentBusy && deletingAttachmentId === attachmentId);
                    const isConfirmingDelete = deletingAttachmentId === attachmentId;
                    const canDeleteAttachment =
                      currentUserRole === "admin" ||
                      currentUserRole === "manager" ||
                      (a.uploaded_by != null && Number(a.uploaded_by) === Number(currentUserId));

                    return (
                      <div className="td-attachment-card" key={attachmentId ?? i} style={isConfirmingDelete ? { flexDirection: "column", alignItems: "stretch" } : undefined}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
                          <div
                            className={`td-attachment-icon td-attachment-icon--${ATTACH_TYPE_CLASS[attachmentType] ?? "doc"}`}
                            style={{ background: colors.bg, color: colors.color }}
                          >
                            {ATTACH_TYPE_LABEL[attachmentType] ?? "DOC"}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="td-attachment-name">{attachmentName}</div>
                            <div className="td-attachment-size">
                              {a.size} · {a.uploaded}
                              {a.uploaded_by_name ? ` · by ${a.uploaded_by_name}` : ""}
                            </div>
                          </div>
                          {!isConfirmingDelete && (
                            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                              <button
                                className="agent-btn agent-btn--ghost agent-btn--sm"
                                title="Preview"
                                disabled={isBusy}
                                onClick={() => handlePreview(attachmentId)}
                              >
                                <Icon d={IC.eye} size={13} />
                              </button>
                              <button
                                className="agent-btn agent-btn--ghost agent-btn--sm"
                                title="Download"
                                disabled={isBusy}
                                onClick={() => handleDownload(attachmentId, attachmentName)}
                              >
                                <Icon d={IC.download} size={13} />
                              </button>
                              {canDeleteAttachment && (
                                <button
                                  className="agent-btn agent-btn--ghost agent-btn--sm"
                                  title="Delete"
                                  disabled={isBusy}
                                  onClick={() => { setDeletingAttachmentId(attachmentId); setDeleteAttachmentError(null); }}
                                  style={{ color: "var(--agent-danger)" }}
                                >
                                  <Icon d={IC.trash} size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {isConfirmingDelete && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                            marginTop: 10, padding: "8px 12px",
                            background: "#fee2e2", border: "1px solid #fca5a5",
                            borderRadius: "var(--radius-sm)", fontSize: 12.5, color: "#b91c1c",
                          }}>
                            <Icon d={IC.warning} size={14} />
                            <span style={{ flex: 1 }}>Delete "{attachmentName}"? This cannot be undone.</span>
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                className="agent-btn agent-btn--ghost agent-btn--sm"
                                onClick={() => { setDeletingAttachmentId(null); setDeleteAttachmentError(null); }}
                                disabled={deletingAttachmentBusy}
                              >
                                Cancel
                              </button>
                              <button
                                className="agent-btn agent-btn--sm"
                                style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fca5a5", fontWeight: 700 }}
                                onClick={() => handleDeleteAttachment(attachmentId)}
                                disabled={deletingAttachmentBusy}
                              >
                                {deletingAttachmentBusy ? "Deleting…" : <><Icon d={IC.trash} size={12} /> Delete</>}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                  <p style={{ fontSize: 13 }}>Status changes will appear here.</p>
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
                          {ev.note && <div style={{ fontSize: 12, color: "var(--agent-muted)", marginTop: 2 }}>"{ev.note}"</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="td-sidebar">
          <div className="td-side-card">
            <div className="td-side-header">Quick Actions</div>
            <div className="td-quick-actions">
              <button className="agent-btn agent-btn--primary" style={{ justifyContent: "center" }}
                onClick={() => navigate("/agent/update-status", { state: { ticketId } })}>
                <Icon d={IC.update} /> Update Status
              </button>
              <button className="agent-btn agent-btn--accent" style={{ justifyContent: "center" }}
                onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}>
                <Icon d={IC.resolve} /> Resolve Ticket
              </button>
              <button className="agent-btn agent-btn--ghost" style={{ justifyContent: "center" }}
                onClick={() => { setActiveTab("comments"); setActiveSection("public"); }}>
                <Icon d={IC.comment} /> Add Comment
              </button>
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">Ticket Metadata</div>
            <div className="td-side-body">
              {[
                { key: "ID",       val: `#${ticketNumber}` },
                { key: "Priority", val: <PriorityBadge p={priority} /> },
                { key: "Status",   val: <StatusBadge s={status} /> },
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
                <span style={{ fontSize: 13, fontWeight: 700, color: slaBreached ? "var(--agent-danger)" : "var(--agent-success)" }}>
                  {slaBreached ? "Breached" : "On track"}
                </span>
                <span style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: slaBreached ? "var(--agent-danger)" : "var(--agent-success)" }}>
                  {slaPercent}%
                </span>
              </div>
              <div className="td-sla-bar-track">
                <div
                  className={`td-sla-bar-fill ${slaBreached ? "td-sla-bar-fill--danger" : "td-sla-bar-fill--good"}`}
                  style={{ width: `${Math.min(slaPercent, 100)}%` }}
                />
              </div>
              <div style={{ fontSize: 12, color: "var(--agent-muted)", marginTop: 4 }}>
                Due: {dueLabel} · Open: {timeOpen}
              </div>
              {slaBreached && (
                <div style={{ padding: "8px 12px", background: "#fee2e2", borderRadius: "var(--radius-sm)", display: "flex", gap: 7, alignItems: "flex-start", marginTop: 4 }}>
                  <Icon d={IC.warning} size={14} />
                  <span style={{ fontSize: 12, color: "#b91c1c", lineHeight: 1.5 }}>
                    SLA breached. Resolve this ticket as soon as possible.
                  </span>
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
                { label: "Since", val: requesterJoined },
              ].map(row => (
                <div className="td-side-row" key={row.label}>
                  <span className="td-side-key">{row.label}</span>
                  <span className="td-side-val" style={{ fontSize: 12 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes td-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}