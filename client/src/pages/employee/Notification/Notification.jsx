import { useEffect, useState, useCallback } from "react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../../../services/ticketService";
import "./Notification.css";

// ── Type metadata ─────────────────────────────────────────────────────────────
const TYPE_META = {
  comment_added:   { icon: "ti-message-circle",  color: "blue",   label: "New Reply"       },
  status_changed:  { icon: "ti-refresh",          color: "orange", label: "Status Update"   },
  ticket_assigned: { icon: "ti-user-check",       color: "purple", label: "Ticket Assigned" },
  ticket_created:  { icon: "ti-ticket",           color: "green",  label: "Ticket Created"  },
  ticket_resolved: { icon: "ti-circle-check",     color: "green",  label: "Resolved"        },
  ticket_closed:   { icon: "ti-lock",             color: "gray",   label: "Closed"          },
};

const getMeta = (type) =>
  TYPE_META[type] || { icon: "ti-bell", color: "gray", label: "Notification" };

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all"); // all | unread | read
  const [deleting,      setDeleting]      = useState(null);

  const token = localStorage.getItem("token");

  const load = useCallback(async () => {
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

  useEffect(() => { load(); }, [load]);

  // ── actions ─────────────────────────────────────────────────────────────────
  const handleRead = async (id) => {
    await markNotificationRead(token, id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const handleReadAll = async () => {
    await markAllNotificationsRead(token);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await deleteNotification(token, id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  // ── derived ──────────────────────────────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read")   return  n.is_read;
    return true;
  });

  // group by date label
  const grouped = filtered.reduce((acc, n) => {
    const d   = new Date(n.created_at);
    const now = new Date();
    let label;
    if (d.toDateString() === now.toDateString()) {
      label = "Today";
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      label = d.toDateString() === yesterday.toDateString()
        ? "Yesterday"
        : d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    }
    if (!acc[label]) acc[label] = [];
    acc[label].push(n);
    return acc;
  }, {});

  return (
    <div className="notif-page">

      {/* ── HEADER ── */}
      <div className="notif-header">
        <div className="notif-header__left">
          <h1 className="notif-header__title">Notifications</h1>
          <p className="notif-header__sub">
            Stay updated on your tickets and team activity
          </p>
        </div>

        <div className="notif-header__actions">
          {unreadCount > 0 && (
            <button className="notif-btn notif-btn--ghost" onClick={handleReadAll}>
              <i className="ti ti-checks" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* ── FILTER TABS ── */}
      <div className="notif-tabs">
        {[
          { key: "all",    label: "All",    count: notifications.length },
          { key: "unread", label: "Unread", count: unreadCount          },
          { key: "read",   label: "Read",   count: notifications.length - unreadCount },
        ].map(tab => (
          <button
            key={tab.key}
            className={`notif-tab ${filter === tab.key ? "notif-tab--active" : ""}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="notif-tab__count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="notif-content">
        {loading ? (
          <div className="notif-empty">
            <i className="ti ti-loader notif-spin" />
            <p>Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-empty">
            <i className="ti ti-bell-off" />
            <p>
              {filter === "unread"
                ? "You're all caught up!"
                : "No notifications yet."}
            </p>
            {filter === "unread" && (
              <span className="notif-empty__hint">
                Notifications appear here when agents update your tickets.
              </span>
            )}
          </div>
        ) : (
          Object.entries(grouped).map(([dateLabel, items]) => (
            <div key={dateLabel} className="notif-group">
              <div className="notif-group__label">{dateLabel}</div>

              {items.map(n => {
                const meta = getMeta(n.type);
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${!n.is_read ? "notif-item--unread" : ""}`}
                    onClick={() => !n.is_read && handleRead(n.id)}
                  >
                    {/* unread dot */}
                    {!n.is_read && <span className="notif-item__dot" />}

                    {/* icon */}
                    <div className={`notif-item__icon notif-item__icon--${meta.color}`}>
                      <i className={`ti ${meta.icon}`} />
                    </div>

                    {/* body */}
                    <div className="notif-item__body">
                      <div className="notif-item__top">
                        <span className={`notif-type-badge notif-type-badge--${meta.color}`}>
                          {meta.label}
                        </span>
                        <span className="notif-item__time">{timeAgo(n.created_at)}</span>
                      </div>

                      <p className="notif-item__title">{n.title}</p>
                      <p className="notif-item__message">{n.message}</p>

                      {n.ticket && (
                        <span className="notif-item__ticket">
                          <i className="ti ti-ticket" />
                          {n.ticket.ticket_number} — {n.ticket.title}
                        </span>
                      )}

                      {n.triggered_by && (
                        <span className="notif-item__agent">
                          <i className="ti ti-user" />
                          {n.triggered_by.full_name}
                        </span>
                      )}
                    </div>

                    {/* delete button */}
                    <button
                      className="notif-item__delete"
                      onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
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
    </div>
  );
}