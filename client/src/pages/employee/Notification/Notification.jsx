import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  getEmployeeComments,
} from "../../../services/ticketService";
import "./Notification.css";

const TYPE_META = {
  comment_added: { icon: "ti-message-circle", color: "blue", label: "New Reply" },
  status_changed: { icon: "ti-refresh", color: "orange", label: "Status Update" },
  ticket_assigned: { icon: "ti-user-check", color: "purple", label: "Ticket Assigned" },
  ticket_created: { icon: "ti-ticket", color: "green", label: "Ticket Created" },
  ticket_resolved: { icon: "ti-circle-check", color: "green", label: "Resolved" },
  ticket_closed: { icon: "ti-lock", color: "gray", label: "Closed" },
  attachment_added: { icon: "ti-paperclip", color: "teal", label: "Attachment" },
};

const getMeta = (type) =>
  TYPE_META[type] || { icon: "ti-bell", color: "gray", label: "Notification" };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function formatDateTime(isoOrDateStr) {
  if (!isoOrDateStr) return "—";
  const d = new Date(isoOrDateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Notifications() {

   const me = JSON.parse(localStorage.getItem("user") || "{}");
  const role = me.role?.name; // "agent", "employee", "manager"

  const prefix =
    role === "manager"
      ? "manager"
      : role === "agent"
      ? "agent"
      : "agent";
  const [notifications, setNotifications] = useState([]);
  const [comments, setComments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);

  // notifications filter
  const [filter, setFilter] = useState("all"); // all | unread | read
  const [deleting, setDeleting] = useState(null);

  // tabs for employee page: Notifications | Comments
  const [tab, setTab] = useState("notifications"); // notifications | comments

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

    return () => {
      cancelled = true;
    };
  }, [loadNotifications]);

  useEffect(() => {
    if (tab !== "comments") return;

    let cancelled = false;
    (async () => {
      await loadComments();
      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [tab, loadComments]);


const BASE_URL = "http://127.0.0.1:8000/api";

  // actions
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

  const grouped = filtered.reduce((acc, n) => {
    const d = new Date(n.created_at);
    const now = new Date();
    let label;
    if (d.toDateString() === now.toDateString()) {
      label = "Today";
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      label =
        d.toDateString() === yesterday.toDateString()
          ? "Yesterday"
          : d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    }
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <div className="notif-page">
      {/* header */}
      <div className="notif-header">
        <div className="notif-header__left">
          <h1 className="notif-header__title">Notifications</h1>
          <p className="notif-header__sub">Stay updated on your tickets and team activity</p>
        </div>

        <div className="notif-header__actions">
          {tab === "notifications" && unreadCount > 0 && (
            <button className="notif-btn notif-btn--ghost" onClick={handleReadAll}>
              <i className="ti ti-checks" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* tabs */}
      <div className="notif-tabs">
        <button
          className={`notif-tab ${tab === "notifications" ? "notif-tab--active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          Notifications
          <span className="notif-tab__count">{notifications.length}</span>
        </button>
        <button
          className={`notif-tab ${tab === "comments" ? "notif-tab--active" : ""}`}
          onClick={() => setTab("comments")}
        >
          Comments
          <span className="notif-tab__count">{comments.length}</span>
        </button>
      </div>

      {tab === "notifications" && (
        <>
          {/* filter tabs */}
          <div className="notif-tabs" style={{ marginTop: 12 }}>
            {[
              { key: "all", label: "All", count: notifications.length },
              { key: "unread", label: "Unread", count: unreadCount },
              { key: "read", label: "Read", count: notifications.length - unreadCount },
            ].map((t) => (
              <button
                key={t.key}
                className={`notif-tab ${filter === t.key ? "notif-tab--active" : ""}`}
                onClick={() => setFilter(t.key)}
              >
                {t.label}
                <span className="notif-tab__count">{t.count}</span>
              </button>
            ))}
          </div>

          {/* content */}
          <div className="notif-content">
            {loading ? (
              <div className="notif-empty">
                <i className="ti ti-loader notif-spin" />
                <p>Loading notifications…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="notif-empty">
                <i className="ti ti-bell-off" />
                <p>{filter === "unread" ? "You're all caught up!" : "No notifications yet."}</p>
                {filter === "unread" && (
                  <span className="notif-empty__hint">Notifications appear here when agents update your tickets.</span>
                )}
              </div>
            ) : (
              Object.entries(grouped).map(([dateLabel, items]) => (
                <div key={dateLabel} className="notif-group">
                  <div className="notif-group__label">{dateLabel}</div>

                  {items.map((n) => {
                    const meta = getMeta(n.type);
                    console.log("Notification payload:", n);

                    return (
                      <div
                        key={n.id}
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
                          title="Preview"
                          onClick={async () => {
                            try {
                              if (n.attachment_id == null) {
                                alert("Attachment id is missing in this notification payload.");
                                return;
                              }
                              const res = await fetch(
                                `${BASE_URL}/${prefix}/tickets/${n.ticket_id}/attachments/${n.attachment_id}/preview`,
                                {
                                  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                                }
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
                              alert(e?.message || "Failed to preview attachment.");
                            }
                          }}
                        >
                          <i className="ti ti-eye" />
                        </button>

                        <button
                          className="notif-icon-btn"
                          title="Download"
                          onClick={async () => {
                            try {
                              if (n.attachment_id == null) {
                                alert("Attachment id is missing in this notification payload.");
                                return;
                              }
                              const res = await fetch(
                                `${BASE_URL}/${prefix}/tickets/${n.ticket_id}/attachments/${n.attachment_id}`,
                                {
                                  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                                }
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
                              alert(e?.message || "Failed to download attachment.");
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          disabled={deleting === n.id}
                          title="Dismiss"
                        >
                          <i className={`ti ${deleting === n.id ? "ti-loader notif-spin" : "ti-x"}`} />
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
              <p>Loading comments…</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="notif-empty">
              <i className="ti ti-message-circle-off" />
              <p>No comments yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {comments.map((c) => (
                <div key={c.id} className="notif-item" style={{ cursor: "default" }}>
                  <div className="notif-item__icon notif-item__icon--blue">
                    <i className="ti ti-message-circle" />
                  </div>
                  <div className="notif-item__body">
                    <div className="notif-item__top">
                      <span className="notif-type-badge notif-type-badge--blue">New Reply</span>
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
                    <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>{formatDateTime(c.created_at)}</div>
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

