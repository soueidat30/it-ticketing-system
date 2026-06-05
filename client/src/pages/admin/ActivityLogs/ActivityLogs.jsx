import { useState } from "react";
import "./ActivityLogs.css";

const ACTIVITY_DATA = [
    { id: 1, actor: "Ali Hassan", actorRole: "Agent", action: "resolved", target: "Ticket #4815", detail: "Marked as resolved after user confirmation", module: "Tickets", time: "2 min ago", date: "Today, 10:42 AM", ip: "192.168.1.14", severity: "info" },
    { id: 2, actor: "Admin", actorRole: "Admin", action: "created", target: "User Lara Haddad", detail: "New user account created in HR department", module: "Users", time: "34 min ago", date: "Today, 10:10 AM", ip: "192.168.1.1", severity: "info" },
    { id: 3, actor: "System", actorRole: "System", action: "breached", target: "SLA on Ticket #4810", detail: "Response time exceeded 4h SLA threshold", module: "SLA", time: "1h ago", date: "Today, 09:44 AM", ip: "—", severity: "warning" },
    { id: 4, actor: "Dina Farhat", actorRole: "Agent", action: "assigned", target: "Ticket #4821", detail: "Ticket reassigned from queue to Ali Hassan", module: "Tickets", time: "1h ago", date: "Today, 09:38 AM", ip: "192.168.1.22", severity: "info" },
    { id: 5, actor: "Admin", actorRole: "Admin", action: "updated", target: "System Settings", detail: "Email notification templates updated", module: "Settings", time: "2h ago", date: "Today, 08:55 AM", ip: "192.168.1.1", severity: "info" },
    { id: 6, actor: "Nour Khalil", actorRole: "End User", action: "failed_login", target: "Login", detail: "3 consecutive failed login attempts detected", module: "Auth", time: "2h ago", date: "Today, 08:30 AM", ip: "10.0.0.87", severity: "danger" },
    { id: 7, actor: "Omar Saab", actorRole: "Agent", action: "commented", target: "Ticket #4802", detail: "Added internal note for IT team review", module: "Tickets", time: "3h ago", date: "Today, 07:58 AM", ip: "192.168.1.33", severity: "info" },
    { id: 8, actor: "Admin", actorRole: "Admin", action: "deleted", target: "Category 'Misc'", detail: "Category removed and tickets migrated to 'General'", module: "Config", time: "5h ago", date: "Today, 05:44 AM", ip: "192.168.1.1", severity: "warning" },
    { id: 9, actor: "Rana Moussa", actorRole: "Agent", action: "resolved", target: "Ticket #4799", detail: "Resolved hardware issue — replaced keyboard", module: "Tickets", time: "Yesterday", date: "Yesterday, 4:20 PM", ip: "192.168.1.44", severity: "info" },
    { id: 10, actor: "System", actorRole: "System", action: "backup", target: "Database Backup", detail: "Automated nightly backup completed successfully", module: "System", time: "Yesterday", date: "Yesterday, 2:00 AM", ip: "—", severity: "info" },
    { id: 11, actor: "Hassan Nasser", actorRole: "Manager", action: "exported", target: "Reports Q1 2025", detail: "Exported ticket analytics report as CSV", module: "Reports", time: "2 days ago", date: "Jun 3, 3:15 PM", ip: "10.0.0.12", severity: "info" },
    { id: 12, actor: "Admin", actorRole: "Admin", action: "deactivated", target: "User Hassan Nasser", detail: "Account deactivated pending HR review", module: "Users", time: "2 days ago", date: "Jun 3, 11:00 AM", ip: "192.168.1.1", severity: "warning" },
    { id: 13, actor: "System", actorRole: "System", action: "error", target: "Email Service", detail: "SMTP connection failed — retry scheduled in 5m", module: "System", time: "3 days ago", date: "Jun 2, 6:00 AM", ip: "—", severity: "danger" },
    { id: 14, actor: "Sara El-Khoury", actorRole: "End User", action: "opened", target: "Ticket #4821", detail: "New ticket submitted via web portal", module: "Tickets", time: "3 days ago", date: "Jun 2, 9:30 AM", ip: "10.0.0.54", severity: "info" },
];

const MODULE_OPTIONS = ["All Modules", "Tickets", "Users", "Settings", "Config", "Auth", "Reports", "SLA", "System"];
const SEVERITY_OPTIONS = ["All Severity", "info", "warning", "danger"];
const ROLE_OPTIONS = ["All Actors", "Admin", "System", "Agent", "End User", "Manager"];

const ACTION_STYLES = {
    resolved: { icon: "ti-circle-check", color: "green" },
    created: { icon: "ti-user-plus", color: "blue" },
    breached: { icon: "ti-alert-triangle", color: "orange" },
    assigned: { icon: "ti-arrows-exchange", color: "purple" },
    updated: { icon: "ti-edit", color: "blue" },
    failed_login: { icon: "ti-lock-exclamation", color: "red" },
    commented: { icon: "ti-message", color: "slate" },
    deleted: { icon: "ti-trash", color: "orange" },
    backup: { icon: "ti-database", color: "green" },
    exported: { icon: "ti-download", color: "blue" },
    deactivated: { icon: "ti-ban", color: "orange" },
    error: { icon: "ti-exclamation-mark", color: "red" },
    opened: { icon: "ti-ticket", color: "blue" },
};

export default function ActivityLogs() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModule, setSelectedModule] = useState("All Modules");
    const [selectedSeverity, setSelectedSeverity] = useState("All Severity");
    const [selectedRole, setSelectedRole] = useState("All Actors");
    const [expandedItemId, setExpandedItemId] = useState(null);

    const getFilteredActivities = () => {
    const searchTerm = searchQuery.toLowerCase();

    return ACTIVITY_DATA.filter(activity => {
        const matchesSearch = activity.actor.toLowerCase().includes(searchTerm) ||
        activity.target.toLowerCase().includes(searchTerm) ||
        activity.detail.toLowerCase().includes(searchTerm);

        const matchesModule = selectedModule === "All Modules" || activity.module === selectedModule;
        const matchesSeverity = selectedSeverity === "All Severity" || activity.severity === selectedSeverity;
        const matchesRole = selectedRole === "All Actors" || activity.actorRole === selectedRole;

        return matchesSearch && matchesModule && matchesSeverity && matchesRole;
    });
    };

    const calculateStats = () => {
    return {
        total: ACTIVITY_DATA.length,
        info: ACTIVITY_DATA.filter(item => item.severity === "info").length,
        warning: ACTIVITY_DATA.filter(item => item.severity === "warning").length,
        danger: ACTIVITY_DATA.filter(item => item.severity === "danger").length,
    };
    };

    const filteredActivities = getFilteredActivities();
    const stats = calculateStats();

    const clearSearch = () => setSearchQuery("");

    const toggleExpand = (id) => {
    setExpandedItemId(expandedItemId === id ? null : id);
    };

    return (
    <div className="activity-log-container">
        <div className="log-header">
        <div className="log-header-text">
            <h1 className="log-title">Activity Logs</h1>
            <p className="log-subtitle">Full audit trail of all system and user actions</p>
        </div>
        <button className="export-button">
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
            <button className="clear-search" onClick={clearSearch}>
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
            {MODULE_OPTIONS.map(option => <option key={option}>{option}</option>)}
            </select>

            <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="filter-select"
            >
            {SEVERITY_OPTIONS.map(option => <option key={option}>{option}</option>)}
            </select>

            <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="filter-select"
            >
            {ROLE_OPTIONS.map(option => <option key={option}>{option}</option>)}
            </select>
        </div>
        </div>

        <div className="activities-card">
        {filteredActivities.length === 0 ? (
            <div className="empty-state">
            <i className="ti ti-history" />
            <span>No log entries match your filters.</span>
            </div>
        ) : (
            <div className="activities-list">
            {filteredActivities.map((activity, index) => {
                const actionStyle = ACTION_STYLES[activity.action] ?? { icon: "ti-point", color: "slate" };
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
                            <div className="actor-avatar">{activity.actor[0]}</div>
                            <span className="actor-name">{activity.actor}</span>
                            <span className={`role-badge role-${activity.actorRole.toLowerCase().replace(" ", "-")}`}>
                            {activity.actorRole}
                            </span>
                        </div>

                        <div className="action-description">
                            <span className={`action-verb severity-${activity.severity}`}>
                            {activity.action.replace("_", " ")}
                            </span>
                            <span className="action-target">{activity.target}</span>
                        </div>

                        <p className="action-detail">{activity.detail}</p>
                        </div>

                        <div className="activity-right">
                        <span className={`severity-badge severity-${activity.severity}`}>
                            {activity.severity}
                        </span>
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
                            <span className="detail-label">IP Address</span>
                            <span className="detail-value mono-text">{activity.ip}</span>
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
            Showing {filteredActivities.length} of {ACTIVITY_DATA.length} events
            </span>
            <button className="load-more">
            Load older events <i className="ti ti-chevron-down" />
            </button>
        </div>
        </div>
    </div>
  );
}