import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getEmployeeComments,
} from "../../../services/ticketService";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./Notification.css";

const buildTypeMeta = (t) => ({
  comment_added:    { icon: "ti-message-circle", color: "blue",   label: t("agent.notifications.typeCommentAdded",   "New Reply")       },
  status_changed:   { icon: "ti-refresh",         color: "orange", label: t("agent.notifications.typeStatusChanged",  "Status Update")    },
  ticket_assigned:  { icon: "ti-user-check",      color: "purple", label: t("agent.notifications.typeTicketAssigned", "Ticket Assigned")  },
  ticket_created:   { icon: "ti-ticket",          color: "green",  label: t("agent.notifications.typeTicketCreated",  "Ticket Created")   },
  ticket_resolved:  { icon: "ti-circle-check",   color: "green",  label: t("agent.notifications.typeTicketResolved", "Resolved")         },
  ticket_closed:    { icon: "ti-lock",            color: "gray",   label: t("agent.notifications.typeTicketClosed",   "Closed")           },
  attachment_added: { icon: "ti-paperclip",       color: "teal",   label: t("agent.notifications.typeAttachmentAdded","Attachment")       },
});

const getMeta = (type, TYPE_META) =>
  TYPE_META[type] || {
    icon: "ti-bell",
    color: "gray",
    label: t("agent.notifications.typeGeneric", "Notification"),
  };

const BASE_URL = "http://127.0.0.1:8000/api";

export default function Notifications() {
  const me = JSON.parse(localStorage.getItem("user") || "{}");
  const role = me.role?.name;
  const { t, language } = useLanguage();

  const prefix = role === "manager" ? "manager" : role === "agent" ? "agent" : "agent";

  // Localized type meta (rebuilds on language change)
  const TYPE_META = useMemo(() => buildTypeMeta(t), [t, language]);

  const [notifications, setNotifications] = useState([]);
  const [comments, setComments]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  const [filter, setFilter]   = useState("all");
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab]         = useState("notifications");

  const token = localStorage.getItem("token");

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getNotifications(token);
      setNotifications(Array.isArray(data) ? data : []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadComments = useCallback(async () => {
    setLoadingComments(true);
    try {
      const data = await getEmployeeComments(token);
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await loadNotifications();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [loadNotifications]);

  useEffect(() => {
    if (tab !== "comments") return;
    let cancelled = false;
    (async () => {
      await loadComments();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [tab, loadComments]);

  const handleRead = async (id) => {
    await markNotificationRead(token, id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead(token);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteNotification(token, id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  // ── Localized helpers ──
  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    if (diff < 60)   return t("agent.dashboard.timeAgo.seconds", "{{n}}s ago", { n: Math.max(0, Math.floor(diff)) });
    if (diff < 3600) return t("agent.dashboard.timeAgo.minutes", "{{n}}m ago", { n: Math.floor(diff / 60) });
    if (diff < 86400) return t("agent.dashboard.timeAgo.hours", "{{n}}h ago", { n: Math.floor(diff / 3600) });
    return new Date(dateStr).toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "short" });
  };

  const formatDateTime = (isoOrDateStr) => {
    if (!isoOrDateStr) return "—";
    const d = new Date(isoOrDateStr);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(language === "ar" ? "ar-EG" : undefined, {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateLabel = (d, today, yesterday) => {
    if (d.toDateString() === today.toDateString()) {
      return t("agent.notifications.dateToday", "Today");
    }
    if (d.toDateString() === yesterday.toDateString()) {
      return t("agent.notifications.dateYesterday", "Yesterday");
    }
    return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-GB", { day: "2-digit", month: "long", year: "numeric" });
  };

  const grouped = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const acc = {};
    for (const n of filtered) {
      const d = new Date(n.created_at);
      const label = formatDateLabel(d, now, yesterday);
      if (!acc[label]) acc[label] = [];
      acc[label].push(n);
    }
    return acc;
  }, [filtered, language, t]);

  // ── Render ──
  return (
    <div className="notif-page">
      <div className="notif-header">
        <div className="notif-header__left">
          <h1 className="notif-header__title">{t("agent.notifications.title", "Notifications")}</h1>
          <p className="notif-header__sub">
            {t("agent.notifications.subtitle", "Stay updated on your tickets and team activity")}
          </p>
        </div>

        <div className="notif-header__actions">
          {tab === "notifications" && unreadCount > 0 && (
            <button className="notif-btn notif-btn--ghost" onClick={handleReadAll}>
              <i className="ti ti-checks" />
              {t("agent.notifications.markAllRead", "Mark all as read")}
            </button>
          )}
        </div>
      </div>

      <div className="notif-tabs">
        <button
          className={`notif-tab ${tab === "notifications" ? "notif-tab--active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          {t("agent.notifications.tabNotifications", "Notifications")}
          <span className="notif-tab__count">{notifications.length}</span>
        </button>
        <button
          className={`notif-tab ${tab === "comments" ? "notif-tab--active" : ""}`}
          onClick={() => setTab("comments")}
        >
          {t("agent.notifications.tabComments", "Comments")}
          <span className="notif-tab__count">{comments.length}</span>
        </button>
      </div>

      {tab === "notifications" && (
        <>
          <div className="notif-tabs notif-tabs--sub">
            {[
              { key: "all",    labelKey: "agent.notifications.filterAll",    count: notifications.length },
              { key: "unread", labelKey: "agent.notifications.filterUnread", count: unreadCount },
              { key: "read",   labelKey: "agent.notifications.filterRead",   count: notifications.length - unreadCount },
            ].map((f) => (
              <button
                key={f.key}
                className={`notif-tab ${filter === f.key ? "notif-tab--active" : ""}`}
                onClick={() => setFilter(f.key)}
              >
                {t(f.labelKey, f.key === "all" ? "All" : f.key === "unread" ? "Unread" : "Read")}
                <span className="notif-tab__count">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="notif-content">
            {loading ? (
              <div className="notif-empty">
                <i className="ti ti-loader notif-spin" />
                <p>{t("agent.notifications.loading", "Loading notifications…")}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <i className="ti ti-bell-off" />
                <p>
                  {filter === "unread"
                    ? t("agent.notifications.allCaughtUp", "You're all caught up!")
                    : t("agent.notifications.noneYet", "No notifications yet.")}
                </p>
                {filter === "unread" && (
                  <span className="notif-empty__hint">
                    {t("agent.notifications.emptyHint", "Notifications appear here when agents update your tickets.")}
                  </span>
                )}
              </div>
            ) : (
              Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel} className="notif-group">
                  <div className="notif-group__label">{dateLabel}</div>

                  {items.map((n, idx) => {
                    const meta = getMeta(n.type, TYPE_META);
                    const key = `${n.id ?? "unknown"}-${n.type ?? "unknown"}-${idx}`;
                    const isDeleting = deleting === n.id;

                    return (
                      <div
                        key={key}
                        className={`notif-item ${!n.is_read ? "notif-item--unread" : ""}`}
                        onClick={() => !n.is_read && handleRead(n.id)}
                      >
                        {!n.is_read && <span className="notif-item__dot" />}

                        <div className={`notif-item__icon notif-item__icon--${meta.color}`}>
                          <i className={`ti ${meta.icon}`} />
                        </div>

                        <div className="notif-item__body">
                          <div className="notif-item__top">
                            <span className={`notif-type-badge notif-type-badge--${meta.color}`}>{meta.label}</span>
                            <span className="notif-item__time">{timeAgo(n.created_at)}</span>
                          </div>

                          <p className="notif-item__title">{n.title}</p>
                          <div className="notif-item__message">{n.message}</div>

                          {n.type === "attachment_added" && n.ticket?.id && (
                            <div className="notif-item__attachment-actions" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="notif-icon-btn"
                                title={t("common.preview", "Preview")}
                                onClick={async () => {
                                  try {
                                    const ticketId = n.ticket_id ?? n.ticket?.id;
                                    let attachmentId = n.attachment_id ?? n.attachmentId ?? n.attachment?.id ?? n.ticket_attachment_id;

                                    if (ticketId == null) {
                                      alert(t("agent.notifications.errMissingTicketId", "Ticket id is missing in this notification payload."));
                                      return;
                                    }

                                    if (attachmentId == null) {
                                      const resList = await fetch(`${BASE_URL}/tickets/${ticketId}/attachments`, {
                                        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
                                      });
                                      const dataList = await resList.json().catch(() => null);
                                      const list = Array.isArray(dataList)
                                        ? dataList
                                        : Array.isArray(dataList?.data)
                                          ? dataList.data
                                          : Array.isArray(dataList?.attachments)
                                            ? dataList.attachments
                                            : [];
                                      const first = list?.[0];
                                      if (!first?.id) {
                                        alert(t("agent.notifications.errMissingAttachmentId", "Attachment id is missing in this notification payload."));
                                        return;
                                      }
                                      attachmentId = first.id;
                                    }

                                    const res = await fetch(
                                      `${BASE_URL}/${prefix}/tickets/${ticketId}/attachments/${attachmentId}/preview`,
                                      { headers: { Authorization: `Bearer ${token}`, Accept: "*/*" } }
                                    );
                                    if (!res.ok) {
                                      const data = await res.json().catch(() => null);
                                      throw new Error(data?.message || `Preview failed (HTTP ${res.status})`);
                                    }
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, "_blank", "noopener,noreferrer");
                                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                                  } catch (e) {
                                    console.error(e);
                                    alert(e?.message || t("agent.notifications.errPreviewFailed", "Failed to preview attachment."));
                                  }
                                }}
                              >
                                <i className="ti ti-eye" />
                              </button>

                              <button
                                className="notif-icon-btn"
                                title={t("common.download", "Download")}
                                onClick={async () => {
                                  try {
                                    const ticketId = n.ticket_id ?? n.ticket?.id;
                                    let attachmentId = n.attachment_id ?? n.attachmentId ?? n.attachment?.id;

                                    if (ticketId == null) {
                                      alert(t("agent.notifications.errMissingTicketId", "Ticket id is missing in this notification payload."));
                                      return;
                                    }
                                    if (attachmentId == null) {
                                      const resList = await fetch(`${BASE_URL}/tickets/${ticketId}/attachments`, {
                                        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
                                      });
                                      const dataList = await resList.json().catch(() => null);
                                      const list = Array.isArray(dataList)
                                        ? dataList
                                        : Array.isArray(dataList?.data)
                                          ? dataList.data
                                          : Array.isArray(dataList?.attachments)
                                            ? dataList.attachments
                                            : [];
                                      const first = list?.[0];
                                      if (!first?.id) {
                                        alert(t("agent.notifications.errMissingAttachmentId", "Attachment id is missing in this notification payload."));
                                        return;
                                      }
                                      attachmentId = first.id;
                                    }
                                    const res = await fetch(
                                      `${BASE_URL}/${prefix}/tickets/${ticketId}/attachments/${attachmentId}`,
                                      { headers: { Authorization: `Bearer ${token}`, Accept: "*/*" } }
                                    );
                                    if (!res.ok) {
                                      const data = await res.json().catch(() => null);
                                      throw new Error(data?.message || `Download failed (HTTP ${res.status})`);
                                    }
                                    const blob = await res.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "attachment";
                                    document.body.appendChild(a);
                                    a.click();
                                    a.remove();
                                    URL.revokeObjectURL(url);
                                  } catch (e) {
                                    console.error(e);
                                    alert(e?.message || t("agent.notifications.errDownloadFailed", "Failed to download attachment."));
                                  }
                                }}
                              >
                                <i className="ti ti-download" />
                              </button>
                            </div>
                          )}

                          {n.ticket && (
                            <span className="notif-item__ticket">
                              <i className="ti ti-ticket" />
                              {n.ticket.ticket_number} — {n.ticket.title}
                            </span>
                          )}

                          {(n.triggered_by || n.triggeredBy) && (
                            <span className="notif-item__agent">
                              <i className="ti ti-user" />
                              {(n.triggered_by || n.triggeredBy)?.full_name}
                            </span>
                          )}
                        </div>

                        <button
                          className="notif-item__delete"
                          onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                          disabled={isDeleting}
                          title={t("agent.notifications.dismiss", "Dismiss")}
                        >
                          <i className={`ti ${isDeleting ? "ti-loader notif-spin" : "ti-x"}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {tab === "comments" && (
        <div className="notif-content">
          {loadingComments ? (
            <div className="notif-empty">
              <i className="ti ti-loader notif-spin" />
              <p>{t("agent.notifications.loadingComments", "Loading comments…")}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="notif-empty">
              <i className="ti ti-message-circle-off" />
              <p>{t("agent.notifications.noComments", "No comments yet.")}</p>
            </div>
          ) : (
            <div className="notif-comments-list">
              {comments.map((c) => (
                <div key={c.id} className="notif-item notif-item--static">
                  <div className="notif-item__icon notif-item__icon--blue">
                    <i className="ti ti-message-circle" />
                  </div>
                  <div className="notif-item__body">
                    <div className="notif-item__top">
                      <span className="notif-type-badge notif-type-badge--blue">
                        {t("agent.notifications.typeCommentAdded", "New Reply")}
                      </span>
                      <span className="notif-item__time">{timeAgo(c.created_at)}</span>
                    </div>
                    {c.ticket_number && (
                      <span className="notif-item__ticket">
                        <i className="ti ti-ticket" />
                        {c.ticket_number}
                      </span>
                    )}
                    <p className="notif-item__title">{c.author}</p>
                    <p className="notif-item__message">{c.text}</p>
                    <div className="notif-item__datetime">{formatDateTime(c.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}