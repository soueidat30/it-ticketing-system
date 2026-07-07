import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
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

const PriorityBadge = ({ p = "low", t }) => {
  const v = String(p ?? "low").toLowerCase();
  return (
    <span className={`agent-badge agent-badge--${v}`}>
      {t ? t(`agent.priority.${v}`, v) : v}
    </span>
  );
};
const StatusBadge = ({ s = "open", t }) => {
  const v = String(s ?? "open").toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`agent-badge agent-badge--${v}`}>
      {t ? t(`agent.status.${v}`, v) : v}
    </span>
  );
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

const buildAttachTypeLabel = (t) => ({
  img: t("agent.ticketDetails.attachTypeImg", "IMG"),
  pdf: t("agent.ticketDetails.attachTypePdf", "PDF"),
  doc: t("agent.ticketDetails.attachTypeDoc", "DOC"),
  xls: t("agent.ticketDetails.attachTypeXls", "XLS"),
  log: t("agent.ticketDetails.attachTypeLog", "LOG"),
});

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
  const { t } = useLanguage();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  })();
  const currentUserId   = user.id;
  const currentUserRole = user.role ?? "employee";

  const token = localStorage.getItem("token");

  const ATTACH_TYPE_LABEL = buildAttachTypeLabel(t);

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
          if (!cancelled) setError(t("agent.ticketDetails.notFound", "Ticket not found."));
          return;
        }
        if (!token) {
          if (!cancelled) setError(t("agent.ticketDetails.unauthorized", "Unauthorized."));
          return;
        }

        const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.message || t("agent.ticketDetails.loadError", "Failed to load ticket."));
          return;
        }

        if (!cancelled) {
          setTicket(data.ticket ?? data);
          setComments(data.comments ?? []);
          setAttachments(data.attachments ?? []);
          setTicketHistory(data.history ?? []);
        }
      } catch {
        if (!cancelled) setError(t("agent.ticketDetails.loadErrorGeneric", "Unable to load ticket."));
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
  }, [ticketId, token, t]);

  useEffect(() => {
    if (!uploadedName) return;
    const t = setTimeout(() => setUploadedName(null), 5000);
    return () => clearTimeout(t);
  }, [uploadedName]);

  const ticketNumber   = ticket?.ticket_number ?? ticket?.id ?? "?";
  const subject        = ticket?.title        ?? t("agent.ticketDetails.untitled", "Untitled ticket");
  const desc           = ticket?.description  ?? t("agent.ticketDetails.noDescription", "No description available.");
  const requesterName  = ticket?.user?.full_name  ?? ticket?.user?.username ?? t("common.unknown", "Unknown");
  const requesterDept  = ticket?.user?.department ?? t("common.notSpecified", "No department");
  const requesterEmail = ticket?.user?.email ?? "—";

  const requesterJoined = ticket?.user?.created_at
    ? new Date(ticket.user.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";
  const assignee  = ticket?.assignee?.full_name ?? ticket?.assignee?.username ?? t("common.unassigned", "Unassigned");
  const category  = ticket?.category?.category_name ?? t("agent.ticketDetails.general", "General");
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
    { key: "details",     label: t("agent.ticketDetails.tabDetails",     "Details"),     icon: IC.info    },
    { key: "comments",    label: t("agent.ticketDetails.tabComments",    "Comments"),    icon: IC.comment, count: comments.filter(c => !c.internal || canSeeInternal).length },
    { key: "attachments", label: t("agent.ticketDetails.tabAttachments", "Attachments"), icon: IC.attach,  count: attachments.length },
    { key: "history",     label: t("agent.ticketDetails.tabHistory",     "History"),     icon: IC.history, count: ticketHistory.length },
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
      if (!res.ok) { setCommentError(data.message || t("agent.ticketDetails.commentPostFailed", "Failed to post comment.")); return; }
      setComments(prev => [...prev, data]);
      setCommentText("");
      setActiveSection(commentType === "internal" ? "internal" : "public");
    } catch {
      setCommentError(t("agent.ticketDetails.networkErrorComment", "Network error — could not post comment."));
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
      if (!res.ok) { setDeleteError(data.message || t("agent.ticketDetails.commentDeleteFailed", "Failed to delete.")); return; }
      setComments(prev => prev.filter(c => c.id !== commentId));
      setDeletingId(null);
    } catch {
      setDeleteError(t("agent.ticketDetails.networkErrorDeleteComment", "Network error — could not delete."));
    }
  };

  const validateAndStageAttachment = async (file) => {
    if (!file) return;
    setPendingAttachmentError(null);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
      setPendingAttachmentError(
        t("agent.ticketDetails.attachmentTypeError", "\"{{name}}\" isn't an allowed file type. Allowed: PDF, PNG, JFIF, DOC, DOCX, XLS, XLSX.", { name: file.name })
      );
      return;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setPendingAttachmentError(
        t("agent.ticketDetails.attachmentSizeError", "\"{{name}}\" is {{size}} — the max allowed size is 1 MB.", { name: file.name, size: formatBytes(file.size) })
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
        setUploadError(data.message || t("agent.ticketDetails.uploadFailed", "Upload failed. Please try again."));
        return;
      }

      setAttachments((prev) => [...prev, data]);
      setUploadedName(data.name || file.name);
      setPendingAttachmentFile(null);
    } catch {
      setUploadError(t("agent.ticketDetails.networkErrorUpload", "Network error — could not upload file."));
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
      setUploadError(t("agent.ticketDetails.missingTicketId", "Missing ticketId. Please go back and open the ticket again."));
      return;
    }
    if (!attachmentId) {
      setUploadError(t("agent.ticketDetails.missingAttachmentId", "Missing attachment id. Cannot preview this file."));
      return;
    }

    setBusyAttachmentId(attachmentId);
    try {
      const res = await fetch(
        `${BASE_URL}/agent/tickets/${ticketId}/attachments/${attachmentId}/preview`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      if (!res.ok) {
        setUploadError(await readErrorMessage(res, t("agent.ticketDetails.previewFailed", "Could not preview this file")));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setUploadError(t("agent.ticketDetails.networkErrorPreview", "Network error — could not preview file."));
    } finally {
      setBusyAttachmentId(null);
    }
  };

  const handleDownload = async (attachmentId, fileName) => {
    setUploadError(null);

    if (!ticketId) {
      setUploadError(t("agent.ticketDetails.missingTicketId", "Missing ticketId. Please go back and open the ticket again."));
      return;
    }
    if (!attachmentId) {
      setUploadError(t("agent.ticketDetails.missingAttachmentIdDownload", "Missing attachment id. Cannot download this file."));
      return;
    }

    setBusyAttachmentId(attachmentId);
    try {
      const res = await fetch(
        `${BASE_URL}/agent/tickets/${ticketId}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } }
      );
      if (!res.ok) {
        setUploadError(await readErrorMessage(res, t("agent.ticketDetails.downloadFailed", "Could not download this file")));
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
      setUploadError(t("agent.ticketDetails.networkErrorDownload", "Network error — could not download file."));
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
        setDeleteAttachmentError(data.message || t("agent.ticketDetails.attachmentDeleteFailed", "Failed to delete attachment."));
        return;
      }
      setAttachments((prev) => prev.filter((a) => (a.id ?? a.attachment_id) !== attachmentId));
      setDeletingAttachmentId(null);
    } catch {
      setDeleteAttachmentError(t("agent.ticketDetails.networkErrorDeleteAttachment", "Network error — could not delete attachment."));
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
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.ticketDetails.title", "Ticket Details")}</h1>
          <p className="agent-page-subtitle">{t("agent.ticketDetails.loadingSubtitle", "Loading ticket…")}</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="ticket-details">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.ticketDetails.title", "Ticket Details")}</h1>
          <p className="agent-page-subtitle agent-page-subtitle--error">{error}</p>
        </div>
        <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> {t("common.back", "Back")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="ticket-details">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.ticketDetails.title", "Ticket Details")}</h1>
          <p className="agent-page-subtitle">
            {t("agent.ticketDetails.fullView", "Full view of ticket #{{id}}", { id: ticketNumber })}
          </p>
        </div>
        <div className="ticket-details__actions">
          <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
            <Icon d={IC.back} /> {t("common.back", "Back")}
          </button>
          <button className="agent-btn agent-btn--ghost"
            onClick={() => navigate("/agent/update-status", { state: { ticketId } })}>
            <Icon d={IC.update} /> {t("common.update", "Update Status")}
          </button>
          <button className="agent-btn agent-btn--accent"
            onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}>
            <Icon d={IC.resolve} /> {t("common.resolve", "Resolve")}
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
                  <span className="td-hero-sla-broken">
                    {t("agent.ticketDetails.slaBreached", "SLA BREACHED")}
                  </span>
                )}
                <PriorityBadge p={priority} t={t} />
                <StatusBadge s={status} t={t} />
              </div>
            </div>
            <div className="td-hero-title">{subject}</div>
            <div className="td-hero-desc">{desc}</div>
            <div className="td-hero-meta">
              {[
                { label: t("agent.ticketDetails.metaCategory",  "Category"),  value: category },
                { label: t("agent.ticketDetails.metaRequester", "Requester"), value: requesterName },
                { label: t("agent.ticketDetails.metaAssignee",  "Assignee"),  value: assignee },
                { label: t("agent.ticketDetails.metaCreated",   "Created"),   value: createdLabel },
                { label: t("agent.ticketDetails.metaDue",       "Due"),       value: dueLabel, style: slaBreached ? { color: "#fca5a5" } : {} },
                { label: t("agent.ticketDetails.metaTimeOpen", "Time Open"), value: timeOpen },
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
                <div className="td-requester-info">
                  <div className="td-requester-name">{requesterName}</div>
                  <div className="td-requester-meta">
                    {requesterDept} · {t("agent.ticketDetails.memberSince", "Member since {{date}}", { date: requesterJoined })}
                  </div>
                  <div className="td-requester-contact">
                    <button className="agent-btn agent-btn--ghost agent-btn--sm">
                      <Icon d={IC.mail} size={12} /> {requesterEmail}
                    </button>
                  </div>
                </div>
              </div>
              <div className="td-details-grid">
                <div className="td-detail-card">
                  <div className="td-detail-card-title">{t("agent.ticketDetails.ticketInfo", "Ticket Info")}</div>
                  <div className="td-detail-rows">
                    {[
                      { key: t("agent.ticketDetails.colTicketId",   "Ticket ID"),   val: `#${ticketNumber}` },
                      { key: t("agent.ticketDetails.colCategory",    "Category"),    val: category },
                      { key: t("agent.ticketDetails.colPriority",    "Priority"),    val: <PriorityBadge p={priority} t={t} /> },
                      { key: t("agent.ticketDetails.colStatus",      "Status"),      val: <StatusBadge s={status} t={t} /> },
                      { key: t("agent.ticketDetails.colCreated",     "Created"),     val: createdLabel },
                      { key: t("agent.ticketDetails.colLastUpdate", "Last Update"), val: updatedLabel },
                    ].map(row => (
                      <div className="td-detail-row" key={row.key}>
                        <span className="td-detail-key">{row.key}</span>
                        <span className="td-detail-val">{row.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="td-detail-card">
                  <div className="td-detail-card-title">{t("agent.ticketDetails.assignmentSla", "Assignment & SLA")}</div>
                  <div className="td-detail-rows">
                    {[
                      { key: t("agent.ticketDetails.colAssignee",  "Assignee"),  val: assignee },
                      { key: t("agent.ticketDetails.colDueDate",  "Due Date"),  val: dueLabel, style: slaBreached ? { color: "var(--agent-danger)" } : {} },
                      { key: t("agent.ticketDetails.colTimeOpen", "Time Open"), val: timeOpen },
                    ].map(row => (
                      <div className="td-detail-row" key={row.key}>
                        <span className="td-detail-key">{row.key}</span>
                        <span className="td-detail-val" style={row.style}>{row.val}</span>
                      </div>
                    ))}
                    <div className="td-detail-row td-detail-row--col">
                      <div className="td-detail-row-top">
                        <span className="td-detail-key">{t("agent.ticketDetails.slaStatus", "SLA Status")}</span>
                        <span className={`td-detail-val td-sla-text ${slaBreached ? "td-sla-text--danger" : "td-sla-text--good"}`}>
                          {slaBreached ? t("agent.ticketDetails.slaBreachedText", "Breached") : t("agent.ticketDetails.slaWithinText", "Within SLA")} ({slaPercent}%)
                        </span>
                      </div>
                      <div className="td-sla-bar-track">
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
                  {t("agent.ticketDetails.publicReplies", "Public Replies")}
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
                    {t("agent.ticketDetails.internalNotes", "Internal Notes")}
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
                        {activeSection === "internal"
                          ? t("agent.ticketDetails.noInternalNotes", "No internal notes")
                          : t("agent.ticketDetails.noPublicReplies", "No public replies yet")}
                      </div>
                      <p className="td-empty-desc">
                        {activeSection === "internal"
                          ? t("agent.ticketDetails.internalOnlyHint", "Internal notes are only visible to agents and admins.")
                          : t("agent.ticketDetails.beFirstToReply", "Be the first to reply to this ticket.")}
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
                              {c.internal
                                ? t("agent.ticketDetails.internalNote", "Internal Note")
                                : c.role === "agent"
                                  ? t("agent.ticketDetails.supportAgent", "Support Agent")
                                  : c.role === "system"
                                    ? t("agent.ticketDetails.system", "System")
                                    : t("agent.ticketDetails.requesterRole", "Requester")}
                            </span>
                            <span className="td-comment-time">{c.time}</span>

                            {canDelete && !isDeleting && (
                              <button
                                className="td-comment-delete-btn"
                                title={t("agent.ticketDetails.deleteComment", "Delete comment")}
                                onClick={() => { setDeletingId(c.id); setDeleteError(null); }}
                              >
                                <Icon d={IC.trash} size={13} />
                              </button>
                            )}
                          </div>

                          <div className="td-comment-text">{c.text}</div>

                          {c.internal && (
                            <div className="td-internal-label">
                              <Icon d={IC.lock} size={10} /> {t("agent.ticketDetails.internalNotVisible", "Internal — not visible to requester")}
                            </div>
                          )}

                          {isDeleting && (
                            <div className="td-comment-confirm-delete">
                              <Icon d={IC.warning} size={14} />
                              <span className="td-comment-confirm-text">{t("agent.ticketDetails.confirmDeleteComment", "Delete this comment? This cannot be undone.")}</span>
                              <div className="td-comment-confirm-actions">
                                <button
                                  className="agent-btn agent-btn--ghost agent-btn--sm"
                                  onClick={() => { setDeletingId(null); setDeleteError(null); }}
                                >
                                  {t("common.cancel", "Cancel")}
                                </button>
                                <button
                                  className="agent-btn agent-btn--sm agent-btn--danger"
                                  onClick={() => handleDeleteComment(c.id)}
                                >
                                  <Icon d={IC.trash} size={12} /> {t("common.delete", "Delete")}
                                </button>
                              </div>
                              {deleteError && (
                                <div className="td-comment-confirm-error">{deleteError}</div>
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
                    <Icon d={IC.comment} size={14} /> {t("agent.ticketDetails.publicReply", "Public Reply")}
                  </button>

                  {canSeeInternal && (
                    <button
                      className={`td-comment-type-btn${commentType === "internal" ? " active" : ""}`}
                      onClick={() => setCommentType("internal")}
                    >
                      <Icon d={IC.lock} size={14} /> {t("agent.ticketDetails.internalNoteBtn", "Internal Note")}
                    </button>
                  )}
                </div>

                <textarea
                  className={`td-comment-textarea${commentType === "internal" ? " internal-mode" : ""}`}
                  placeholder={
                    commentType === "public"
                      ? t("agent.ticketDetails.publicReplyPh", "Write a reply to the requester…")
                      : t("agent.ticketDetails.internalNotePh", "Write an internal note (only visible to agents)…")
                  }
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  rows={4}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSendComment(); }}
                />

                {commentError && (
                  <div className="td-comment-form-error">{commentError}</div>
                )}

                <div className="td-comment-form-footer">
                  <span className="td-comment-hint">{t("agent.ticketDetails.ctrlEnterHint", "Ctrl+Enter to send")}</span>
                  <div className="td-comment-form-actions">
                    <button
                      className="agent-btn agent-btn--ghost agent-btn--sm"
                      type="button"
                      onClick={() => setActiveTab("attachments")}
                      disabled={uploading}
                      title={t("agent.ticketDetails.attach", "Attach")}
                    >
                      <Icon d={IC.clip} size={13} /> {t("agent.ticketDetails.attach", "Attach")}
                    </button>
                    <button
                      className="agent-btn agent-btn--primary agent-btn--sm"
                      onClick={handleSendComment}
                      disabled={!commentText.trim() || submitting}
                    >
                      {submitting
                        ? t("agent.ticketDetails.sending", "Sending…")
                        : <><Icon d={IC.send} size={13} /> {commentType === "public" ? t("agent.ticketDetails.sendReply", "Send Reply") : t("agent.ticketDetails.addNote", "Add Note")}</>
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
                className={`td-dropzone ${isDragging ? "is-dragging" : ""} ${uploading ? "is-uploading" : ""}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_ACCEPT_ATTR}
                  onChange={handleFileSelected}
                  disabled={uploading}
                  style={{ display: "none" }}
                />

                <div className={`td-dropzone-icon ${isDragging ? "is-dragging" : ""}`}>
                  {uploading ? (
                    <svg className="td-dropzone-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={IC.spin} />
                    </svg>
                  ) : (
                    <Icon d={IC.upload} size={18} />
                  )}
                </div>

                {uploading ? (
                  <span className="td-dropzone-text">
                    {t("agent.ticketDetails.uploading", "Uploading…")}
                  </span>
                ) : (
                  <>
                    <span className="td-dropzone-text">
                      {isDragging
                        ? t("agent.ticketDetails.dropHere", "Drop the file here")
                        : t("agent.ticketDetails.dragDropHint", "Drag & drop a file, or click to browse")}
                    </span>
                    <span className="td-dropzone-hint">
                      {t("agent.ticketDetails.allowedTypes", "PDF, PNG, JFIF, DOC, DOCX, XLS, XLSX · Max 1 MB")}
                    </span>
                  </>
                )}
              </div>

              {pendingAttachmentError && (
                <div className="td-banner td-banner--error">
                  <Icon d={IC.warning} size={14} />
                  {pendingAttachmentError}
                </div>
              )}

              {uploadError && (
                <div className="td-banner td-banner--error">
                  <Icon d={IC.warning} size={14} />
                  {uploadError}
                </div>
              )}

              {uploadedName && (
                <div className="td-banner td-banner--success">
                  <Icon d={IC.checkSm} size={14} />
                  {t("agent.ticketDetails.uploaded", "\"{{name}}\" uploaded — the requester has been notified.", { name: uploadedName })}
                </div>
              )}

              {pendingAttachmentFile && !uploading && (
                <div className="td-pending-bar">
                  <div className="td-pending-bar-info">
                    <div className="td-pending-bar-title">{t("agent.ticketDetails.readyToSend", "Ready to send attachment")}</div>
                    <div className="td-pending-bar-name">{pendingAttachmentFile.name}</div>
                  </div>
                  <button
                    className="agent-btn agent-btn--primary"
                    type="button"
                    onClick={uploadStagedAttachment}
                    disabled={uploading}
                    title={t("agent.ticketDetails.sendAttachment", "Send Attachment")}
                  >
                    <Icon d={IC.send} size={13} /> {t("agent.ticketDetails.sendAttachment", "Send Attachment")}
                  </button>
                </div>
              )}

              {deleteAttachmentError && (
                <div className="td-banner td-banner--error">
                  <Icon d={IC.warning} size={14} />
                  {deleteAttachmentError}
                </div>
              )}

              {attachments.length === 0 ? (
                <div className="td-empty">
                  <Icon d={IC.attach} size={32} />
                  <div className="td-empty-title">{t("agent.ticketDetails.noAttachments", "No attachments")}</div>
                  <p className="td-empty-desc">{t("agent.ticketDetails.noAttachmentsDesc", "No files have been uploaded to this ticket yet.")}</p>
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
                      <div key={attachmentId ?? i} className={`td-attachment-card ${isConfirmingDelete ? "is-confirming-delete" : ""}`}>
                        <div className="td-attachment-row">
                          <div
                            className={`td-attachment-icon td-attachment-icon--${ATTACH_TYPE_CLASS[attachmentType] ?? "doc"}`}
                            style={{ background: colors.bg, color: colors.color }}
                          >
                            {ATTACH_TYPE_LABEL[attachmentType] ?? "DOC"}
                          </div>
                          <div className="td-attachment-info">
                            <div className="td-attachment-name">{attachmentName}</div>
                            <div className="td-attachment-size">
                              {a.size} · {a.uploaded}
                              {a.uploaded_by_name ? ` · ${t("agent.ticketDetails.by", "by {{name}}", { name: a.uploaded_by_name })}` : ""}
                            </div>
                          </div>
                          {!isConfirmingDelete && (
                            <div className="td-attachment-actions">
                              <button
                                className="agent-btn agent-btn--ghost agent-btn--sm"
                                title={t("common.preview", "Preview")}
                                disabled={isBusy}
                                onClick={() => handlePreview(attachmentId)}
                              >
                                <Icon d={IC.eye} size={13} />
                              </button>
                              <button
                                className="agent-btn agent-btn--ghost agent-btn--sm"
                                title={t("common.download", "Download")}
                                disabled={isBusy}
                                onClick={() => handleDownload(attachmentId, attachmentName)}
                              >
                                <Icon d={IC.download} size={13} />
                              </button>
                              {canDeleteAttachment && (
                                <button
                                  className="agent-btn agent-btn--ghost agent-btn--sm agent-btn--danger-ghost"
                                  title={t("common.delete", "Delete")}
                                  disabled={isBusy}
                                  onClick={() => { setDeletingAttachmentId(attachmentId); setDeleteAttachmentError(null); }}
                                >
                                  <Icon d={IC.trash} size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {isConfirmingDelete && (
                          <div className="td-attachment-confirm-delete">
                            <Icon d={IC.warning} size={14} />
                            <span className="td-attachment-confirm-text">
                              {t("agent.ticketDetails.confirmDeleteAttachment", "Delete \"{{name}}\"? This cannot be undone.", { name: attachmentName })}
                            </span>
                            <div className="td-attachment-confirm-actions">
                              <button
                                className="agent-btn agent-btn--ghost agent-btn--sm"
                                onClick={() => { setDeletingAttachmentId(null); setDeleteAttachmentError(null); }}
                                disabled={deletingAttachmentBusy}
                              >
                                {t("common.cancel", "Cancel")}
                              </button>
                              <button
                                className="agent-btn agent-btn--sm agent-btn--danger"
                                onClick={() => handleDeleteAttachment(attachmentId)}
                                disabled={deletingAttachmentBusy}
                              >
                                {deletingAttachmentBusy ? t("agent.ticketDetails.deleting", "Deleting…") : <><Icon d={IC.trash} size={12} /> {t("common.delete", "Delete")}</>}
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
                  <div className="td-empty-title">{t("agent.ticketDetails.noHistoryTitle", "No history yet")}</div>
                  <p className="td-empty-desc">{t("agent.ticketDetails.noHistoryDesc", "Status changes will appear here.")}</p>
                </div>
              ) : (
                <div className="td-card">
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
                          {ev.note && <div className="td-history-note">"{ev.note}"</div>}
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
            <div className="td-side-header">{t("agent.ticketDetails.quickActions", "Quick Actions")}</div>
            <div className="td-quick-actions">
              <button className="agent-btn agent-btn--primary td-quick-btn"
                onClick={() => navigate("/agent/update-status", { state: { ticketId } })}>
                <Icon d={IC.update} /> {t("common.update", "Update Status")}
              </button>
              <button className="agent-btn agent-btn--accent td-quick-btn"
                onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}>
                <Icon d={IC.resolve} /> {t("common.resolve", "Resolve Ticket")}
              </button>
              <button className="agent-btn agent-btn--ghost td-quick-btn"
                onClick={() => { setActiveTab("comments"); setActiveSection("public"); }}>
                <Icon d={IC.comment} /> {t("agent.ticketDetails.addComment", "Add Comment")}
              </button>
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">{t("agent.ticketDetails.metadata", "Ticket Metadata")}</div>
            <div className="td-side-body">
              {[
                { key: t("common.na", "ID"),    val: `#${ticketNumber}` },
                { key: t("common.priority", "Priority"), val: <PriorityBadge p={priority} t={t} /> },
                { key: t("common.status",   "Status"),   val: <StatusBadge s={status} t={t} /> },
                { key: t("common.category", "Category"), val: category },
                { key: t("common.assignee", "Assignee"), val: assignee },
                { key: t("common.created",  "Created"),  val: createdLabel },
                { key: t("common.updated",  "Updated"),  val: updatedLabel },
              ].map(row => (
                <div className="td-side-row" key={row.key}>
                  <span className="td-side-key">{row.key}</span>
                  <span className="td-side-val">{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">{t("agent.ticketDetails.slaStatus", "SLA Status")}</div>
            <div className="td-side-body">
              <div className="td-sla-headline">
                <span className={`td-sla-text ${slaBreached ? "td-sla-text--danger" : "td-sla-text--good"}`}>
                  {slaBreached ? t("agent.ticketDetails.slaBreachedText", "Breached") : t("agent.ticketDetails.slaWithinText", "On track")}
                </span>
                <span className={`td-sla-percent ${slaBreached ? "td-sla-text--danger" : "td-sla-text--good"}`}>
                  {slaPercent}%
                </span>
              </div>
              <div className="td-sla-bar-track">
                <div
                  className={`td-sla-bar-fill ${slaBreached ? "td-sla-bar-fill--danger" : "td-sla-bar-fill--good"}`}
                  style={{ width: `${Math.min(slaPercent, 100)}%` }}
                />
              </div>
              <div className="td-sla-meta">
                {t("agent.ticketDetails.due", "Due")}: {dueLabel} · {t("agent.ticketDetails.open", "Open")}: {timeOpen}
              </div>
              {slaBreached && (
                <div className="td-sla-warning">
                  <Icon d={IC.warning} size={14} />
                  <span>{t("agent.ticketDetails.resolveAsap", "SLA breached. Resolve this ticket as soon as possible.")}</span>
                </div>
              )}
            </div>
          </div>

          <div className="td-side-card">
            <div className="td-side-header">{t("agent.ticketDetails.requester", "Requester")}</div>
            <div className="td-side-body">
              <div className="td-requester-mini">
                <div className="td-requester-mini-avatar">{initials(requesterName)}</div>
                <div>
                  <div className="td-requester-mini-name">{requesterName}</div>
                  <div className="td-requester-mini-dept">{requesterDept}</div>
                </div>
              </div>
              {[
                { label: t("common.unknown", "Email"), val: requesterEmail },
                { label: t("agent.ticketDetails.since", "Since"), val: requesterJoined },
              ].map(row => (
                <div className="td-side-row" key={row.label}>
                  <span className="td-side-key">{row.label}</span>
                  <span className="td-side-val td-side-val--small">{row.val}</span>
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