import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Notifications.css";

const BASE_URL = "http://127.0.0.1:8000/api";

const Icon = ({ d, size = 16 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

const IC = {
  bell:
    "M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  refresh:
    "M21 2v6h-6 M3 22v-6h6 M20.49 9A9 9 0 005.64 5.64L3 8 M3.51 15A9 9 0 0018.36 18.36L21 16",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  x: "M18 6L6 18 M6 6l12 12",
  trash:
    "M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  ticket:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  user:
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  settings:
    "M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.38a2 2 0 00-.73-2.73l-.15-.09a2 2 0 01-1-1.74v-.51a2 2 0 011-1.72l.15-.1a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z M12 15a3 3 0 100-6 3 3 0 000 6z",
};

const ns = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.notifications)) return data.notifications;
  return [];
};

const getNotificationId = (notification) =>
  notification?.id ?? notification?.notification_id;

const getTitle = (notification) =>
  notification?.title ??
  notification?.subject ??
  notification?.notification_title ??
  "System Notification";

const getMessage = (notification) =>
  notification?.message ??
  notification?.body ??
  notification?.description ??
  notification?.notification_message ??
  "No message provided.";

const getType = (notification) =>
  notification?.type ??
  notification?.notification_type ??
  notification?.category ??
  "system";

const getSeverity = (notification) =>
  notification?.severity ?? notification?.priority ?? notification?.level ?? "normal";

const getSender = (notification) =>
  notification?.sender?.full_name ??
  notification?.sender?.username ??
  notification?.user?.full_name ??
  notification?.user?.username ??
  notification?.created_by_name ??
  "System";

const getTicketRef = (notification) =>
  notification?.ticket?.ticket_number ??
  notification?.ticket_number ??
  notification?.reference_number ??
  null;

const isRead = (notification) => {
  if (typeof notification?.is_read === "boolean") return notification.is_read;
  if (typeof notification?.read === "boolean") return notification.read;
  return Boolean(notification?.read_at);
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const timeAgo = (value) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return `${Math.max(0, seconds)}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(value);
};

const getTypeIcon = (type) => {
  const key = ns(type);

  if (key.includes("ticket")) return IC.ticket;
  if (key.includes("user") || key.includes("account")) return IC.user;
  if (key.includes("email") || key.includes("mail")) return IC.mail;
  if (key.includes("alert") || key.includes("warning")) return IC.warning;

  return IC.bell;
};

export default function Notifications() {
  const token = localStorage.getItem("token");
  const toastTimerRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [sort, setSort] = useState("newest");

  const [selectedNotification, setSelectedNotification] = useState(null);

  const [settings, setSettings] = useState({
    inApp: true,
    email: true,
    critical: true,
    weekly: false,
  });

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token]
  );

  const showToast = (message) => {
    setToast(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${BASE_URL}/notifications`, { headers });
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data?.message || "Failed to load notifications.");
      }

      setNotifications(normalizeArray(data));
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const requestWithFallback = async (attempts) => {
    let lastMessage = "Request failed.";

    for (const attempt of attempts) {
      const options = {
        method: attempt.method,
        headers: { ...headers },
      };

      if (attempt.body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(attempt.body);
      }

      const response = await fetch(attempt.url, options);
      const payload = await response.json().catch(() => ({}));

      if (response.ok) return payload;

      lastMessage = payload?.message || lastMessage;
    }

    throw new Error(lastMessage);
  };

  const updateNotificationRead = async (notification, desiredRead) => {
    const id = getNotificationId(notification);
    if (!id) return;

    setBusyId(id);

    try {
      if (desiredRead) {
        await requestWithFallback([
          {
            url: `${BASE_URL}/notifications/${id}/read`,
            method: "PATCH",
          },
          {
            url: `${BASE_URL}/notifications/${id}`,
            method: "PATCH",
            body: { is_read: true },
          },
          {
            url: `${BASE_URL}/notifications/${id}/read`,
            method: "POST",
          },
        ]);
      } else {
        await requestWithFallback([
          {
            url: `${BASE_URL}/notifications/${id}/unread`,
            method: "PATCH",
          },
          {
            url: `${BASE_URL}/notifications/${id}`,
            method: "PATCH",
            body: { is_read: false, read_at: null },
          },
        ]);
      }

      const patch = desiredRead
        ? { is_read: true, read: true, read_at: new Date().toISOString() }
        : { is_read: false, read: false, read_at: null };

      setNotifications((previous) =>
        previous.map((item) =>
          String(getNotificationId(item)) === String(id) ? { ...item, ...patch } : item
        )
      );

      setSelectedNotification((previous) =>
        previous && String(getNotificationId(previous)) === String(id)
          ? { ...previous, ...patch }
          : previous
      );

      showToast(desiredRead ? "Notification marked as read." : "Notification marked as unread.");
    } catch (err) {
      setError(err.message || "Could not update notification.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteNotification = async (notification) => {
    const id = getNotificationId(notification);
    if (!id) return;

    if (!window.confirm("Delete this notification?")) return;

    setBusyId(id);

    try {
      await requestWithFallback([
        {
          url: `${BASE_URL}/notifications/${id}`,
          method: "DELETE",
        },
      ]);

      setNotifications((previous) =>
        previous.filter((item) => String(getNotificationId(item)) !== String(id))
      );

      setSelectedNotification((previous) =>
        previous && String(getNotificationId(previous)) === String(id) ? null : previous
      );

      showToast("Notification deleted.");
    } catch (err) {
      setError(err.message || "Could not delete notification.");
    } finally {
      setBusyId(null);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((notification) => !isRead(notification));

    if (!unread.length) {
      showToast("No unread notifications.");
      return;
    }

    try {
      await requestWithFallback([
        {
          url: `${BASE_URL}/notifications/mark-all-read`,
          method: "PATCH",
        },
        {
          url: `${BASE_URL}/notifications/read-all`,
          method: "POST",
        },
      ]);

      const now = new Date().toISOString();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          is_read: true,
          read: true,
          read_at: notification.read_at ?? now,
        }))
      );

      showToast("All notifications marked as read.");
    } catch {
      setError("Could not mark all notifications as read.");
    }
  };

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter((notification) => !isRead(notification)).length;

    const critical = notifications.filter((notification) => {
      const severity = ns(getSeverity(notification));
      return severity === "critical" || severity === "high";
    }).length;

    const today = notifications.filter((notification) => {
      const createdAt = new Date(notification.created_at);
      if (Number.isNaN(createdAt.getTime())) return false;

      const now = new Date();
      return (
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate()
      );
    }).length;

    return { total, unread, critical, today };
  }, [notifications]);

  const typeOptions = useMemo(() => {
    return [...new Set(notifications.map((notification) => getType(notification)))]
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [notifications]);

  const severityOptions = useMemo(() => {
    return [...new Set(notifications.map((notification) => getSeverity(notification)))]
      .filter(Boolean)
      .sort((a, b) => String(a).localeCompare(String(b)));
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...notifications]
      .filter((notification) => {
        const title = getTitle(notification).toLowerCase();
        const message = getMessage(notification).toLowerCase();
        const sender = getSender(notification).toLowerCase();
        const ticket = String(getTicketRef(notification) ?? "").toLowerCase();

        if (
          term &&
          !title.includes(term) &&
          !message.includes(term) &&
          !sender.includes(term) &&
          !ticket.includes(term)
        ) {
          return false;
        }

        if (statusFilter === "unread" && isRead(notification)) return false;
        if (statusFilter === "read" && !isRead(notification)) return false;

        if (typeFilter && ns(getType(notification)) !== typeFilter) return false;

        if (severityFilter && ns(getSeverity(notification)) !== severityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "newest") {
          return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
        }

        if (sort === "oldest") {
          return new Date(a.created_at ?? 0) - new Date(b.created_at ?? 0);
        }

        if (sort === "unread") {
          return Number(isRead(a)) - Number(isRead(b));
        }

        return 0;
      });
  }, [notifications, search, statusFilter, typeFilter, severityFilter, sort]);

  const recentCritical = useMemo(() => {
    return notifications
      .filter((notification) => {
        const severity = ns(getSeverity(notification));
        return severity === "critical" || severity === "high";
      })
      .sort((a, b) => new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0))
      .slice(0, 4);
  }, [notifications]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
    setSeverityFilter("");
    setSort("newest");
  };

  return (
    <div className="admin-page notifications-page nt-page">
      <div className="nt-page-header">
        <div>
          <h1 className="nt-title">Notifications</h1>
          <p className="nt-subtitle">
            Manage admin notifications, ticket alerts, and system messages.
          </p>
        </div>

        <div className="nt-header-actions">
          <button className="nt-btn nt-btn--ghost" onClick={markAllRead}>
            <Icon d={IC.check} size={14} />
            Mark all read
          </button>

          <button className="nt-btn nt-btn--primary" onClick={loadNotifications}>
            <Icon d={IC.refresh} size={14} />
            Refresh
          </button>
        </div>
      </div>

      <section className="nt-stats">
        <div className="nt-stat-card">
          <div className="nt-stat-icon nt-stat-icon--blue">
            <Icon d={IC.bell} size={18} />
          </div>
          <div>
            <span>Total Notifications</span>
            <strong>{loading ? "—" : stats.total}</strong>
          </div>
        </div>

        <div className="nt-stat-card">
          <div className="nt-stat-icon nt-stat-icon--orange">
            <Icon d={IC.mail} size={18} />
          </div>
          <div>
            <span>Unread</span>
            <strong>{loading ? "—" : stats.unread}</strong>
          </div>
        </div>

        <div className="nt-stat-card">
          <div className="nt-stat-icon nt-stat-icon--red">
            <Icon d={IC.warning} size={18} />
          </div>
          <div>
            <span>High Priority</span>
            <strong>{loading ? "—" : stats.critical}</strong>
          </div>
        </div>

        <div className="nt-stat-card">
          <div className="nt-stat-icon nt-stat-icon--green">
            <Icon d={IC.check} size={18} />
          </div>
          <div>
            <span>Received Today</span>
            <strong>{loading ? "—" : stats.today}</strong>
          </div>
        </div>
      </section>

      <div className="nt-toolbar">
        <div className="nt-search-wrap">
          <Icon d={IC.search} size={14} />
          <input
            className="nt-search"
            placeholder="Search notifications, messages, sender, or ticket..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="nt-filters">
          <select
            className="nt-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="unread">Unread only</option>
            <option value="read">Read only</option>
          </select>

          <select
            className="nt-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">All types</option>
            {typeOptions.map((type) => (
              <option key={type} value={ns(type)}>
                {String(type).replace(/-/g, " ")}
              </option>
            ))}
          </select>

          <select
            className="nt-select"
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
          >
            <option value="">All priorities</option>
            {severityOptions.map((severity) => (
              <option key={severity} value={ns(severity)}>
                {String(severity).replace(/-/g, " ")}
              </option>
            ))}
          </select>

          <select
            className="nt-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="unread">Unread first</option>
          </select>

          {(search || statusFilter || typeFilter || severityFilter || sort !== "newest") && (
            <button className="nt-btn nt-btn--light" onClick={resetFilters}>
              <Icon d={IC.x} size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="nt-toast">
          <Icon d={IC.check} size={14} />
          {toast}
        </div>
      )}

      {error && (
        <div className="nt-error">
          <Icon d={IC.warning} size={14} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <Icon d={IC.x} size={13} />
          </button>
        </div>
      )}

      <div className="nt-layout">
        <section className="nt-card nt-list-card">
          <div className="nt-card-header">
            <div>
              <h2>Notification Center</h2>
              <p>
                {loading
                  ? "Loading notifications..."
                  : `${filteredNotifications.length} notification${
                      filteredNotifications.length !== 1 ? "s" : ""
                    } found`}
              </p>
            </div>

            <Icon d={IC.filter} size={16} />
          </div>

          {loading ? (
            <div className="nt-loading">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="nt-empty">
              <div className="nt-empty-icon">
                <Icon d={IC.bell} size={30} />
              </div>
              <h3>No notifications found</h3>
              <p>Try changing your filters or refreshing the page.</p>
              <button className="nt-btn nt-btn--primary" onClick={loadNotifications}>
                <Icon d={IC.refresh} size={14} />
                Refresh
              </button>
            </div>
          ) : (
            <div className="nt-list">
              {filteredNotifications.map((notification) => {
                const id = getNotificationId(notification);
                const read = isRead(notification);
                const severity = ns(getSeverity(notification));
                const type = getType(notification);
                const ticketRef = getTicketRef(notification);

                return (
                  <div
                    key={id}
                    className={`nt-item ${!read ? "nt-item--unread" : ""}`}
                  >
                    <div
                      className={`nt-item-icon nt-item-icon--${severity}`}
                      title={String(type)}
                    >
                      <Icon d={getTypeIcon(type)} size={16} />
                    </div>

                    <div className="nt-item-main">
                      <div className="nt-item-top">
                        <div>
                          <h3>{getTitle(notification)}</h3>
                          <p>{getMessage(notification)}</p>
                        </div>

                        {!read && <span className="nt-unread-dot" title="Unread" />}
                      </div>

                      <div className="nt-item-meta">
                        <span className="nt-chip nt-chip--type">
                          {String(type).replace(/-/g, " ")}
                        </span>

                        <span className={`nt-chip nt-chip--severity-${severity}`}>
                          {String(getSeverity(notification)).replace(/-/g, " ")}
                        </span>

                        {ticketRef && (
                          <span className="nt-chip nt-chip--ticket">
                            {ticketRef}
                          </span>
                        )}

                        <span>{getSender(notification)}</span>
                        <span>•</span>
                        <span title={formatDate(notification.created_at)}>
                          {timeAgo(notification.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="nt-item-actions">
                      <button
                        className="nt-icon-btn"
                        title="View details"
                        onClick={() => setSelectedNotification(notification)}
                      >
                        <Icon d={IC.eye} size={14} />
                      </button>

                      <button
                        className="nt-icon-btn"
                        disabled={busyId === id}
                        title={read ? "Mark unread" : "Mark read"}
                        onClick={() => updateNotificationRead(notification, !read)}
                      >
                        <Icon d={read ? IC.mail : IC.check} size={14} />
                      </button>

                      <button
                        className="nt-icon-btn nt-icon-btn--danger"
                        disabled={busyId === id}
                        title="Delete notification"
                        onClick={() => deleteNotification(notification)}
                      >
                        <Icon d={IC.trash} size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="nt-side">
          <div className="nt-card">
            <div className="nt-card-header">
              <div>
                <h2>Priority Alerts</h2>
                <p>Recent high priority notifications</p>
              </div>
              <Icon d={IC.warning} size={16} />
            </div>

            <div className="nt-priority-list">
              {recentCritical.length === 0 ? (
                <div className="nt-mini-empty">No priority alerts.</div>
              ) : (
                recentCritical.map((notification) => (
                  <button
                    key={getNotificationId(notification)}
                    className="nt-priority-item"
                    onClick={() => setSelectedNotification(notification)}
                  >
                    <span
                      className={`nt-priority-dot nt-priority-dot--${ns(
                        getSeverity(notification)
                      )}`}
                    />
                    <div>
                      <strong>{getTitle(notification)}</strong>
                      <span>{timeAgo(notification.created_at)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="nt-card nt-settings-card">
            <div className="nt-card-header">
              <div>
                <h2>Alert Preferences</h2>
                <p>Local admin notification options</p>
              </div>
              <Icon d={IC.settings} size={16} />
            </div>

            <div className="nt-settings-list">
              {[
                ["inApp", "In-app notifications", "Show alerts inside the admin panel"],
                ["email", "Email notifications", "Send important updates by email"],
                ["critical", "Critical alerts", "Always notify for SLA and critical tickets"],
                ["weekly", "Weekly digest", "Receive a weekly activity summary"],
              ].map(([key, title, desc]) => (
                <label className="nt-toggle-row" key={key}>
                  <div>
                    <strong>{title}</strong>
                    <span>{desc}</span>
                  </div>

                  <input
                    type="checkbox"
                    checked={settings[key]}
                    onChange={(event) =>
                      setSettings((previous) => ({
                        ...previous,
                        [key]: event.target.checked,
                      }))
                    }
                  />

                  <i />
                </label>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {selectedNotification && (
        <div
          className="nt-modal-overlay"
          onClick={(event) =>
            event.target === event.currentTarget && setSelectedNotification(null)
          }
        >
          <div className="nt-modal">
            <div className="nt-modal-header">
              <div>
                <h2>{getTitle(selectedNotification)}</h2>
                <p>{formatDate(selectedNotification.created_at)}</p>
              </div>

              <button
                className="nt-modal-close"
                onClick={() => setSelectedNotification(null)}
              >
                <Icon d={IC.x} size={16} />
              </button>
            </div>

            <div className="nt-modal-body">
              <div className="nt-detail-badges">
                <span className="nt-chip nt-chip--type">
                  {String(getType(selectedNotification)).replace(/-/g, " ")}
                </span>

                <span
                  className={`nt-chip nt-chip--severity-${ns(
                    getSeverity(selectedNotification)
                  )}`}
                >
                  {String(getSeverity(selectedNotification)).replace(/-/g, " ")}
                </span>

                <span
                  className={`nt-chip ${
                    isRead(selectedNotification)
                      ? "nt-chip--read"
                      : "nt-chip--unread"
                  }`}
                >
                  {isRead(selectedNotification) ? "Read" : "Unread"}
                </span>
              </div>

              <p className="nt-detail-message">{getMessage(selectedNotification)}</p>

              <div className="nt-detail-grid">
                <div>
                  <span>Sender</span>
                  <strong>{getSender(selectedNotification)}</strong>
                </div>

                <div>
                  <span>Ticket Reference</span>
                  <strong>{getTicketRef(selectedNotification) ?? "—"}</strong>
                </div>

                <div>
                  <span>Created</span>
                  <strong>{formatDate(selectedNotification.created_at)}</strong>
                </div>

                <div>
                  <span>Read At</span>
                  <strong>{formatDate(selectedNotification.read_at)}</strong>
                </div>
              </div>
            </div>

            <div className="nt-modal-footer">
              <button
                className="nt-btn nt-btn--ghost"
                onClick={() =>
                  updateNotificationRead(
                    selectedNotification,
                    !isRead(selectedNotification)
                  )
                }
              >
                {isRead(selectedNotification) ? "Mark Unread" : "Mark Read"}
              </button>

              <button
                className="nt-btn nt-btn--danger"
                onClick={() => deleteNotification(selectedNotification)}
              >
                <Icon d={IC.trash} size={14} />
                Delete
              </button>

              <button
                className="nt-btn nt-btn--primary"
                onClick={() => setSelectedNotification(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}