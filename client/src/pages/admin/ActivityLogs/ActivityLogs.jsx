import { useEffect, useMemo, useState } from "react";

import "./ActivityLogs.css";
import { getActivityLogs } from "../../../services/ticketService";

const DEFAULT_FILTERS = {
  module: "All Modules",
  severity: "All Severity",
  role: "All Actors",
};

function norm(v) {
  return v == null ? "" : String(v).toLowerCase();
}


function computeActionStyle(action) {
  // No hardcoded action arrays; derive style heuristically from action string.
  const a = norm(action);
  if (a.includes("resolve")) return { icon: "ti-circle-check", color: "green" };
  if (a.includes("create") || a.includes("open")) return { icon: "ti-user-plus", color: "blue" };
  if (a.includes("breach") || a.includes("fail") || a.includes("error"))
    return { icon: "ti-alert-triangle", color: "orange" };
  if (a.includes("assign")) return { icon: "ti-arrows-exchange", color: "purple" };
  if (a.includes("update") || a.includes("edit")) return { icon: "ti-edit", color: "blue" };
  if (a.includes("comment") || a.includes("message")) return { icon: "ti-message", color: "slate" };
  if (a.includes("delete") || a.includes("remove")) return { icon: "ti-trash", color: "orange" };
  if (a.includes("login")) return { icon: "ti-lock-exclamation", color: "red" };
  return { icon: "ti-point", color: "slate" };
}

export default function ActivityLogs() {
  // localStorage stores the raw JWT string; if it was JSON-stringified by mistake (includes quotes), strip them.
  const token = (() => {
    const t = localStorage.getItem("token");
    if (!t) return null;
    return typeof t === "string" && t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
  })();





  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModule, setSelectedModule] = useState(DEFAULT_FILTERS.module);
  const [selectedSeverity, setSelectedSeverity] = useState(DEFAULT_FILTERS.severity);
  const [selectedRole, setSelectedRole] = useState(DEFAULT_FILTERS.role);

  const [expandedItemId, setExpandedItemId] = useState(null);

  const [stats, setStats] = useState({ total: 0, info: 0, warning: 0, danger: 0 });
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [moduleOptions, setModuleOptions] = useState([DEFAULT_FILTERS.module]);
  const [severityOptions, setSeverityOptions] = useState([DEFAULT_FILTERS.severity]);
  const [roleOptions, setRoleOptions] = useState([DEFAULT_FILTERS.role]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiFilters = useMemo(() => {
    const params = {};

    if (selectedModule !== DEFAULT_FILTERS.module) params.module = selectedModule;
    if (selectedSeverity !== DEFAULT_FILTERS.severity) params.severity = selectedSeverity;

    // Backend supports `search` field.
    if (searchQuery.trim()) params.search = searchQuery.trim();

    return params;
  }, [selectedModule, selectedSeverity, searchQuery]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getActivityLogs(token, apiFilters);
        if (cancelled) return;

        setStats(data?.stats ?? { total: 0, info: 0, warning: 0, danger: 0 });

        const fetchedLogs = Array.isArray(data?.logs) ? data.logs : [];

        const roleFiltered =
          selectedRole === DEFAULT_FILTERS.role
            ? fetchedLogs
            : fetchedLogs.filter((l) => l.actorRole === selectedRole);

        setLogs(roleFiltered);

        const p = data?.pagination ?? {};
        setPagination({
          current_page: p.current_page ?? 1,
          last_page: p.last_page ?? 1,
          total: p.total ?? roleFiltered.length,
        });

        const modules = Array.from(new Set(fetchedLogs.map((l) => l.module).filter(Boolean)));
        const severities = Array.from(new Set(fetchedLogs.map((l) => l.severity).filter(Boolean)));
        const roles = Array.from(new Set(fetchedLogs.map((l) => l.actorRole).filter(Boolean)));

        setModuleOptions([DEFAULT_FILTERS.module, ...modules]);
        setSeverityOptions([DEFAULT_FILTERS.severity, ...severities]);
        setRoleOptions([DEFAULT_FILTERS.role, ...roles]);
      } catch (e) {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load activity logs");
        setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [token, apiFilters, selectedRole]);

  const filteredActivities = logs;

  const clearSearch = () => setSearchQuery("");

  const toggleExpand = (id) => {
    setExpandedItemId((prev) => (prev === id ? null : id));
  };

  const showLoadMore = pagination.current_page < pagination.last_page;

  const onLoadMore = async () => {
    if (!token || !showLoadMore) return;

    const nextPage = pagination.current_page + 1;
    setLoading(true);
    try {
      const data = await getActivityLogs(token, { ...apiFilters, page: nextPage });
      const fetchedLogs = Array.isArray(data?.logs) ? data.logs : [];

      const roleFiltered =
        selectedRole === DEFAULT_FILTERS.role
          ? fetchedLogs
          : fetchedLogs.filter((l) => l.actorRole === selectedRole);

      setLogs((prev) => [...prev, ...roleFiltered]);

      const p = data?.pagination ?? {};
      setPagination({
        current_page: p.current_page ?? nextPage,
        last_page: p.last_page ?? pagination.last_page,
        total: p.total ?? pagination.total,
      });

      const modules = Array.from(new Set([...moduleOptions, ...fetchedLogs.map((l) => l.module).filter(Boolean)]));
      const severities = Array.from(new Set([...severityOptions, ...fetchedLogs.map((l) => l.severity).filter(Boolean)]));
      const roles = Array.from(new Set([...roleOptions, ...fetchedLogs.map((l) => l.actorRole).filter(Boolean)]));

      setModuleOptions(modules);
      setSeverityOptions(severities);
      setRoleOptions(roles);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activity-log-container">
      <div className="log-header">
        <div className="log-header-text">
          <h1 className="log-title">Activity Logs</h1>
          <p className="log-subtitle">Full audit trail of all system and user actions</p>
        </div>
        <button
          className="export-button"
          type="button"
          onClick={async () => {
            if (!token) return;
            const params = new URLSearchParams();
            if (selectedModule !== DEFAULT_FILTERS.module) params.set("module", selectedModule);
            if (selectedSeverity !== DEFAULT_FILTERS.severity) params.set("severity", selectedSeverity);
            if (searchQuery.trim()) params.set("search", searchQuery.trim());

            const url = `${"http://127.0.0.1:8000/api"}/admin/activity-logs/export/csv${params.toString() ? `?${params.toString()}` : ""}`;

            const res = await fetch(url, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "text/csv",
              },
            });

            if (!res.ok) {
              // eslint-disable-next-line no-console
              console.error("Export CSV failed", res.status);
              return;
            }

            const blob = await res.blob();
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(downloadUrl);
          }}
          disabled={!token || (!filteredActivities.length && !loading)}
        >
          <i className="ti ti-download" /> Export CSV
        </button>
      </div>


      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Events</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-card">
          <span className="stat-dot stat-dot-info"></span>
          <span className="stat-value stat-value-info">{stats.info}</span>
          <span className="stat-label">Info</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-card">
          <span className="stat-dot stat-dot-warning"></span>
          <span className="stat-value stat-value-warning">{stats.warning}</span>
          <span className="stat-label">Warnings</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-card">
          <span className="stat-dot stat-dot-danger"></span>
          <span className="stat-value stat-value-danger">{stats.danger}</span>
          <span className="stat-label">Errors</span>
        </div>
      </div>

      <div className="filters-toolbar">
        <div className="search-wrapper">
          <i className="ti ti-search" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search actors, targets, details…"
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search" onClick={clearSearch} type="button">
              <i className="ti ti-x" />
            </button>
          )}
        </div>

        <div className="filter-controls">
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="filter-select"
          >
            {moduleOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="filter-select"
          >
            {severityOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="filter-select"
          >
            {roleOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="activities-card">
        {loading && filteredActivities.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-history" />
            <span>Loading activity logs…</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="empty-state">
            <i className="ti ti-history" />
            <span>No log entries match your filters.</span>
          </div>
        ) : (
          <div className="activities-list">
            {filteredActivities.map((activity, index) => {
              const actionStyle = computeActionStyle(activity.action);
              const isExpanded = expandedItemId === activity.id;

              return (
                <div
                  key={activity.id}
                  className={`activity-item activity-severity-${activity.severity} ${isExpanded ? "expanded" : ""}`}
                  onClick={() => toggleExpand(activity.id)}
                >
                  {index < filteredActivities.length - 1 && <div className="timeline-line" />}

                  <div className={`action-icon action-color-${actionStyle.color}`}>
                    <i className={`ti ${actionStyle.icon}`} />
                  </div>

                  <div className="activity-content">
                    <div className="activity-main-row">
                      <div className="activity-left">
                        <div className="actor-info">
                          <div className="actor-avatar">{activity.actor?.[0] ?? "S"}</div>
                          <span className="actor-name">{activity.actor}</span>
                        </div>

                        <div className="action-description">
                          <span className={`action-verb severity-${activity.severity}`}>
                            {String(activity.action ?? "").replace("_", " ")}
                          </span>
                          <span className="action-target">{activity.target}</span>
                        </div>

                        <p className="action-detail">{activity.detail}</p>
                      </div>

                      <div className="activity-right">
                        <span className={`severity-badge severity-${activity.severity}`}>{activity.severity}</span>
                        <span className="module-tag">{activity.module}</span>
                        <span className="time-stamp">
                          <i className="ti ti-clock" /> {activity.time}
                        </span>
                        <i className={`ti ${isExpanded ? "ti-chevron-up" : "ti-chevron-down"} expand-icon`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="expanded-details">
                        <div className="details-grid">
                          <div className="detail-field">
                            <span className="detail-label">Full Timestamp</span>
                            <span className="detail-value">{activity.date}</span>
                          </div>

                          <div className="detail-field">
                            <span className="detail-label">Affected Ticket</span>
                            <span className="detail-value mono-text">{activity.affected_ticket}</span>
                          </div>

                          <div className="detail-field">
                            <span className="detail-label">Module</span>
                            <span className="detail-value">{activity.module}</span>
                          </div>

                          <div className="detail-field">
                            <span className="detail-label">Severity</span>
                            <span className={`severity-badge severity-${activity.severity}`}>{activity.severity}</span>
                          </div>

                          <div className="detail-field full-width">
                            <span className="detail-label">Full Detail</span>
                            <span className="detail-value">{activity.detail}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="list-footer">
          <span className="footer-info">
            Showing {filteredActivities.length} logs
            {pagination.total ? ` of ${pagination.total}` : ""}
          </span>
          <button className="load-more" onClick={onLoadMore} disabled={!showLoadMore || loading} type="button">
            Load older events <i className="ti ti-chevron-down" />
          </button>
        </div>

        {error ? <div style={{ padding: "0 20px 16px", color: "#ef4444", fontSize: 13 }}>{error}</div> : null}
      </div>
    </div>
  );
}

