import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./NotificationPanel.css";

const Icon = ({ d, size = 15 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  bell:     "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  check:    "M20 6L9 17l-5-5",
  checkAll: "M18 6L7 17l-5-5 M23 6L12 17",
  trash:    "M3 6h18 M8 6V4h8v2 M19 6l-1 14H6L5 6",
  ticket:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  comment:  "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  resolve:  "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  status:   "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  empty:    "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  x:        "M18 6L6 18 M6 6l12 12",
};

// Icon per notification type
const TYPE_CONFIG = {
  ticket_assigned: { icon: IC.ticket,  color: "#6d28d9", bg: "#ede9fe", dot: "#8b5cf6" },
  status_changed:  { icon: IC.status,  color: "#d97706", bg: "#fef9c3", dot: "#f59e0b" },
  new_comment:     { icon: IC.comment, color: "#0369a1", bg: "#dbeafe", dot: "#3b82f6" },
  ticket_resolved: { icon: IC.resolve, color: "#15803d", bg: "#dcfce7", dot: "#22c55e" },
  default:         { icon: IC.bell,    color: "#03363d", bg: "#f1f5f9", dot: "#64748b" },
};

const BASE_URL = "http://127.0.0.1:8000/api";

// ── The panel component ────────────────────────────────────
// Usage in AgentLayout:
//   <NotificationPanel />
// It renders the bell button AND the dropdown panel.
// Replace your existing bell button with this component.

export default function NotificationPanel() {
  const navigate    = useNavigate();
  const token       = localStorage.getItem("token");
  const panelRef    = useRef(null);

  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [filter,        setFilter]        = useState("all"); // "all" | "unread"

  // ── Fetch notifications ─────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread_count ?? 0);
    } catch (err) {
      console.error("Notifications fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Load on mount and poll every 30s
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Actions ─────────────────────────────────────────────
  const markRead = async (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnread(prev => Math.max(0, prev - 1));
    await fetch(`${BASE_URL}/notifications/${id}/read`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
    await fetch(`${BASE_URL}/notifications/read-all`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => {});
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    const removed = notifications.find(n => n.id === id);
    if (removed && !removed.is_read) setUnread(prev => Math.max(0, prev - 1));
    await fetch(`${BASE_URL}/notifications/${id}`, {
      method:  "DELETE",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    }).catch(() => {});
  };

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.ticket_id) {
      setOpen(false);
      navigate("/agent/ticket-details", { state: { ticketId: n.ticket_id } });
    }
  };

  const displayed = filter === "unread"
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const cfg = (type) => TYPE_CONFIG[type] ?? TYPE_CONFIG.default;

  return (
    <div className="notif-wrap" ref={panelRef}>

      {/* ── Bell button ── */}
      <button
        className={`agent-topbar__action-btn notif-bell${open ? " active" : ""}`}
        title="Notifications"
        onClick={() => setOpen(o => !o)}
      >
        <Icon d={IC.bell} size={18} />
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {/* ── Dropdown panel ── */}
      {open && (
        <div className="notif-panel">

          {/* Header */}
          <div className="notif-panel__header">
            <div className="notif-panel__title">
              Notifications
              {unread > 0 && (
                <span className="notif-panel__unread-chip">{unread} new</span>
              )}
            </div>
            <div className="notif-panel__header-actions">
              {unread > 0 && (
                <button className="notif-text-btn" onClick={markAllRead} title="Mark all read">
                  <Icon d={IC.checkAll} size={13} /> All read
                </button>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="notif-panel__tabs">
            <button
              className={`notif-tab${filter === "all" ? " active" : ""}`}
              onClick={() => setFilter("all")}>
              All ({notifications.length})
            </button>
            <button
              className={`notif-tab${filter === "unread" ? " active" : ""}`}
              onClick={() => setFilter("unread")}>
              Unread ({unread})
            </button>
          </div>

          {/* List */}
          <div className="notif-panel__list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty__text">Loading…</div>
              </div>
            ) : displayed.length === 0 ? (
              <div className="notif-empty">
                <Icon d={IC.empty} size={32} />
                <div className="notif-empty__title">
                  {filter === "unread" ? "All caught up!" : "No notifications yet"}
                </div>
                <div className="notif-empty__text">
                  {filter === "unread"
                    ? "You have no unread notifications."
                    : "Ticket updates will appear here."}
                </div>
              </div>
            ) : (
              displayed.map(n => {
                const c = cfg(n.type);
                return (
                  <div
                    key={n.id}
                    className={`notif-item${n.is_read ? "" : " unread"}`}
                    onClick={() => handleClick(n)}
                  >
                    {/* Unread dot */}
                    {!n.is_read && <span className="notif-item__dot" style={{ background: c.dot }} />}

                    {/* Type icon */}
                    <div className="notif-item__icon" style={{ background: c.bg, color: c.color }}>
                      <Icon d={c.icon} size={14} />
                    </div>

                    {/* Content */}
                    <div className="notif-item__body">
                      <div className="notif-item__title">{n.title}</div>
                      <div className="notif-item__msg">{n.message}</div>
                      <div className="notif-item__meta">
                        {n.ticket_number && (
                          <span className="notif-item__ticket">#{n.ticket_number}</span>
                        )}
                        <span className="notif-item__time">{n.time}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="notif-item__actions">
                      {!n.is_read && (
                        <button className="notif-icon-btn" title="Mark as read"
                          onClick={e => { e.stopPropagation(); markRead(n.id); }}>
                          <Icon d={IC.check} size={12} />
                        </button>
                      )}
                      <button className="notif-icon-btn notif-icon-btn--delete" title="Delete"
                        onClick={e => deleteNotif(n.id, e)}>
                        <Icon d={IC.x} size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notif-panel__footer">
              <button className="notif-text-btn" onClick={() => { setOpen(false); navigate("/agent/notifications"); }}>
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}