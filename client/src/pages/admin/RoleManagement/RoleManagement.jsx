import { useState } from "react";
import "./RoleManagement.css";

const PERMISSION_GROUPS = [
    {
    group: "Tickets",
    icon: "ti-ticket",
    permissions: [
        { key: "tickets.view",          label: "View Tickets",          desc: "Browse and read all tickets"             },
        { key: "tickets.create",        label: "Create Tickets",        desc: "Submit new support tickets"              },
        { key: "tickets.edit",          label: "Edit Tickets",          desc: "Modify ticket details and metadata"      },
        { key: "tickets.assign",        label: "Assign Tickets",        desc: "Assign tickets to agents or departments" },
        { key: "tickets.close",         label: "Close / Resolve",       desc: "Mark tickets as resolved or closed"      },
        { key: "tickets.delete",        label: "Delete Tickets",        desc: "Permanently remove tickets"              },
    ],
    },
    {
    group: "Users",
    icon: "ti-users",
    permissions: [
        { key: "users.view",            label: "View Users",            desc: "See the user directory"                  },
        { key: "users.create",          label: "Create Users",          desc: "Add new user accounts"                   },
        { key: "users.edit",            label: "Edit Users",            desc: "Modify user profiles and roles"          },
        { key: "users.delete",          label: "Delete Users",          desc: "Remove user accounts from the system"    },
    ],
    },
    {
    group: "Reports",
    icon: "ti-chart-bar",
    permissions: [
        { key: "reports.view",          label: "View Reports",          desc: "Access analytics and reporting dashboards"},
        { key: "reports.export",        label: "Export Reports",        desc: "Download reports as CSV or PDF"          },
    ],
    },
    {
    group: "System Config",
    icon: "ti-settings",
    permissions: [
        { key: "config.categories",     label: "Manage Categories",     desc: "Create and edit ticket categories"       },
        { key: "config.priorities",     label: "Manage Priorities",     desc: "Configure priority levels and SLAs"      },
        { key: "config.statuses",       label: "Manage Statuses",       desc: "Define ticket workflow statuses"         },
        { key: "config.departments",    label: "Manage Departments",    desc: "Add and configure departments"           },
        { key: "config.roles",          label: "Manage Roles",          desc: "Create and edit permission roles"        },
        { key: "config.settings",       label: "System Settings",       desc: "Access global system configuration"      },
    ],
    },
    {
    group: "Activity",
    icon: "ti-history",
    permissions: [
        { key: "logs.view",             label: "View Activity Logs",    desc: "Access full system audit trail"          },
        { key: "logs.export",           label: "Export Logs",           desc: "Download activity logs"                  },
    ],
    },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

const INITIAL_ROLES = [
    {
    id: 1,
    name: "Administrator",
    description: "Full access to all system features and configuration.",
    color: "#03363d",
    icon: "ti-shield-check",
    system: true,
    userCount: 2,
    permissions: new Set(ALL_PERMISSION_KEYS),
    },
    {
    id: 2,
    name: "Agent",
    description: "Handles tickets, can view users, and access basic reports.",
    color: "#3b82f6",
    icon: "ti-headset",
    system: false,
    userCount: 4,
    permissions: new Set([
        "tickets.view","tickets.create","tickets.edit","tickets.assign","tickets.close",
        "users.view",
        "reports.view",
    ]),
    },
    {
    id: 3,
    name: "Manager",
    description: "Oversees team activity, views all reports, manages users.",
    color: "#8b5cf6",
    icon: "ti-briefcase",
    system: false,
    userCount: 3,
    permissions: new Set([
        "tickets.view","tickets.create","tickets.edit","tickets.assign","tickets.close",
        "users.view","users.edit",
        "reports.view","reports.export",
        "logs.view",
    ]),
    },
    {
    id: 4,
    name: "End User",
    description: "Can only submit and track their own support tickets.",
    color: "#6b7280",
    icon: "ti-user",
    system: true,
    userCount: 18,
    permissions: new Set([
        "tickets.view","tickets.create",
    ]),
    },
];

const COLOR_OPTIONS = [
    "#03363d","#3b82f6","#8b5cf6","#10b981","#f59e0b",
    "#f97316","#ef4444","#ec4899","#06b6d4","#64748b",
];
const ICON_OPTIONS = [
    "ti-shield-check","ti-headset","ti-briefcase","ti-user",
    "ti-users","ti-shield","ti-star","ti-crown",
    "ti-settings","ti-eye",
];

const EMPTY_FORM = { name: "", description: "", color: "#3b82f6", icon: "ti-user", permissions: new Set() };

export default function RoleManagement() {
    const [roles, setRoles] = useState(INITIAL_ROLES);
    const [activeRole, setActiveRole] = useState(INITIAL_ROLES[0]);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    const syncActiveRole = (updatedRoles) =>
    setActiveRole(prev => updatedRoles.find(r => r.id === prev?.id) ?? updatedRoles[0]);

    const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ ...EMPTY_FORM, permissions: new Set() });
    setShowModal(true);
    };

    const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
        name: role.name, description: role.description,
        color: role.color, icon: role.icon,
        permissions: new Set(role.permissions),
    });
    setShowModal(true);
    };

    const saveForm = () => {
    if (!formData.name.trim()) return;
    let updatedRoles;
    if (editingRole) {
        updatedRoles = roles.map(r => r.id === editingRole.id ? { ...r, ...formData } : r);
    } else {
        updatedRoles = [...roles, { id: Date.now(), ...formData, system: false, userCount: 0 }];
    }
    setRoles(updatedRoles);
    syncActiveRole(updatedRoles);
    setShowModal(false);
    };

    const deleteRole = (id) => {
    const updatedRoles = roles.filter(r => r.id !== id);
    setRoles(updatedRoles);
    syncActiveRole(updatedRoles);
    setDeleteConfirm(null);
    };

    const togglePermission = (key) => {
    setFormData(prev => {
        const newPermissions = new Set(prev.permissions);
        newPermissions.has(key) ? newPermissions.delete(key) : newPermissions.add(key);
        return { ...prev, permissions: newPermissions };
    });
    };

    const toggleGroupPermissions = (keys, allOn) => {
    setFormData(prev => {
        const newPermissions = new Set(prev.permissions);
        if (allOn) keys.forEach(k => newPermissions.delete(k));
        else keys.forEach(k => newPermissions.add(k));
        return { ...prev, permissions: newPermissions };
    });
    };

    const toggleAllPermissions = () => {
    const allOn = formData.permissions.size === ALL_PERMISSION_KEYS.length;
    setFormData(prev => ({ 
        ...prev, 
        permissions: allOn ? new Set() : new Set(ALL_PERMISSION_KEYS) 
    }));
    };

  const calculatePermissionPercentage = (permissions) => Math.round((permissions.size / ALL_PERMISSION_KEYS.length) * 100);

    return (
    <div className="role-management-container">

        <div className="role-header">
        <div>
            <h1 className="page-title">Role Management</h1>
            <p className="page-subtitle">{roles.length} roles · {roles.reduce((sum, r) => sum + r.userCount, 0)} users assigned</p>
        </div>
        <button className="button-primary" onClick={openCreateModal}>
            <i className="ti ti-plus" /> New Role
        </button>
        </div>

        <div className="two-pane-layout">

        <div className="role-list-pane">
            <div className="list-header">
            <span className="list-header-label">All Roles</span>
            </div>
            <div className="roles-list">
            {roles.map(role => (
                <button
                key={role.id}
                className={`role-item ${activeRole?.id === role.id ? "role-item--active" : ""}`}
                onClick={() => setActiveRole(role)}
                style={activeRole?.id === role.id ? { "--active-color": role.color } : {}}
                >
                <div className="role-icon" style={{ background: role.color + "18", color: role.color }}>
                    <i className={`ti ${role.icon}`} />
                </div>
                <div className="role-info">
                    <div className="role-name-row">
                    <span className="role-name">{role.name}</span>
                    {role.system && <span className="system-badge">System</span>}
                    </div>
                    <span className="role-users">
                    <i className="ti ti-users" /> {role.userCount} users
                    </span>
                </div>
                <div className="role-progress-wrapper">
                    <div className="progress-bar-bg">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${calculatePermissionPercentage(role.permissions)}%`, background: role.color }}
                    />
                    </div>
                    <span className="progress-percentage">{calculatePermissionPercentage(role.permissions)}%</span>
                </div>
                </button>
            ))}
            </div>
        </div>

        {activeRole && (
            <div className="detail-pane">
            <div className="detail-header">
                <div className="detail-icon" style={{ background: activeRole.color + "18", color: activeRole.color }}>
                <i className={`ti ${activeRole.icon}`} />
                </div>
                <div className="detail-info">
                <div className="detail-name-row">
                    <h2 className="detail-name">{activeRole.name}</h2>
                    {activeRole.system && <span className="system-badge">System</span>}
                </div>
                <p className="detail-description">{activeRole.description}</p>
                </div>
                <div className="detail-actions">
                <button className="icon-button" title="Edit role" onClick={() => openEditModal(activeRole)}>
                    <i className="ti ti-edit" />
                </button>
                {!activeRole.system && (
                    <button className="icon-button icon-button--danger" title="Delete role" onClick={() => setDeleteConfirm(activeRole)}>
                    <i className="ti ti-trash" />
                    </button>
                )}
                </div>
            </div>

            <div className="stats-strip">
                <div className="stat-item">
                <span className="stat-value" style={{ color: activeRole.color }}>
                    {activeRole.permissions.size}
                </span>
                <span className="stat-label">Permissions</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                <span className="stat-value">{ALL_PERMISSION_KEYS.length - activeRole.permissions.size}</span>
                <span className="stat-label">Restricted</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                <span className="stat-value">{calculatePermissionPercentage(activeRole.permissions)}%</span>
                <span className="stat-label">Access Level</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                <span className="stat-value">{activeRole.userCount}</span>
                <span className="stat-label">Users</span>
                </div>
            </div>

            <div className="permissions-view">
                {PERMISSION_GROUPS.map(group => {
                const grantedCount = group.permissions.filter(p => activeRole.permissions.has(p.key)).length;
                return (
                    <div key={group.group} className="permission-group">
                    <div className="group-header">
                        <i className={`ti ${group.icon} group-icon`} />
                        <span className="group-name">{group.group}</span>
                        <span className="group-count">
                        {grantedCount}/{group.permissions.length}
                        </span>
                    </div>
                    <div className="permissions-list">
                        {group.permissions.map(perm => {
                        const granted = activeRole.permissions.has(perm.key);
                        return (
                            <div key={perm.key} className={`permission-item ${granted ? "permission-item--granted" : "permission-item--denied"}`}>
                            <i className={`ti ${granted ? "ti-check" : "ti-x"} permission-icon`} />
                            <div className="permission-text">
                                <span className="permission-label">{perm.label}</span>
                                <span className="permission-description">{perm.desc}</span>
                            </div>
                            </div>
                        );
                        })}
                    </div>
                    </div>
                );
                })}
            </div>
            </div>
        )}
        </div>

        {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <div className="modal-header-left">
                <div className="modal-icon" style={{ background: formData.color + "18", color: formData.color }}>
                    <i className={`ti ${formData.icon}`} />
                </div>
                <h2 className="modal-title">{editingRole ? `Edit: ${editingRole.name}` : "New Role"}</h2>
                </div>
                <button className="modal-close" onClick={() => setShowModal(false)}><i className="ti ti-x" /></button>
            </div>

            <div className="modal-body">
                <div className="form-section">
                <h3 className="section-title">Basic Info</h3>
                <div className="form-row">
                    <div className="form-field">
                    <label className="form-label">Role Name <span className="required">*</span></label>
                    <input className="form-input" value={formData.name}
                        onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                        placeholder="e.g. Agent" />
                    </div>
                    <div className="form-field">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={formData.description}
                        onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
                        placeholder="Brief role description" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-field">
                    <label className="form-label">Icon</label>
                    <div className="icon-grid">
                        {ICON_OPTIONS.map(ic => (
                        <button key={ic}
                            className={`icon-option ${formData.icon === ic ? "icon-option--active" : ""}`}
                            style={formData.icon === ic ? { background: formData.color + "18", color: formData.color, borderColor: formData.color } : {}}
                            onClick={() => setFormData(prev => ({...prev, icon: ic}))}>
                            <i className={`ti ${ic}`} />
                        </button>
                        ))}
                    </div>
                    </div>
                    <div className="form-field">
                    <label className="form-label">Color</label>
                    <div className="color-grid">
                        {COLOR_OPTIONS.map(col => (
                        <button key={col}
                            className={`color-swatch ${formData.color === col ? "color-swatch--active" : ""}`}
                            style={{ background: col }}
                            onClick={() => setFormData(prev => ({...prev, color: col}))}>
                            {formData.color === col && <i className="ti ti-check" />}
                        </button>
                        ))}
                    </div>
                    </div>
                </div>
                </div>

                <div className="form-section">
                <div className="section-header">
                    <h3 className="section-title">Permissions</h3>
                    <div className="section-meta">
                    <span className="permission-counter">
                        {formData.permissions.size}/{ALL_PERMISSION_KEYS.length} granted
                    </span>
                    <button className="toggle-all-button" onClick={toggleAllPermissions}>
                        {formData.permissions.size === ALL_PERMISSION_KEYS.length ? "Revoke All" : "Grant All"}
                    </button>
                    </div>
                </div>

                <div className="modal-permissions">
                    {PERMISSION_GROUPS.map(group => {
                    const groupKeys = group.permissions.map(p => p.key);
                    const allGranted = groupKeys.every(k => formData.permissions.has(k));
                    const someGranted = groupKeys.some(k => formData.permissions.has(k));
                    return (
                        <div key={group.group} className="modal-permission-group">
                        <div className="modal-group-header">
                            <label className="group-checkbox-row">
                            <input
                                type="checkbox"
                                checked={allGranted}
                                ref={el => { if (el) el.indeterminate = someGranted && !allGranted; }}
                                onChange={() => toggleGroupPermissions(groupKeys, allGranted)}
                                className="checkbox"
                            />
                            <i className={`ti ${group.icon} group-icon`} />
                            <span className="group-name">{group.group}</span>
                            </label>
                            <span className="group-count">
                            {groupKeys.filter(k => formData.permissions.has(k)).length}/{groupKeys.length}
                            </span>
                        </div>
                        <div className="modal-permission-list">
                            {group.permissions.map(perm => (
                            <label key={perm.key} className="permission-checkbox-row">
                                <input
                                type="checkbox"
                                checked={formData.permissions.has(perm.key)}
                                onChange={() => togglePermission(perm.key)}
                                className="checkbox"
                                />
                                <div className="permission-checkbox-info">
                                <span className="permission-checkbox-label">{perm.label}</span>
                                <span className="permission-checkbox-desc">{perm.desc}</span>
                                </div>
                            </label>
                            ))}
                        </div>
                        </div>
                    );
                    })}
                </div>
                </div>
            </div>

            <div className="modal-footer">
                <span className="footer-count">{formData.permissions.size} permissions selected</span>
                <div className="footer-actions">
                <button className="button-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="button-primary" onClick={saveForm} disabled={!formData.name.trim()}>
                    {editingRole ? "Save Changes" : "Create Role"}
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

        {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon"><i className="ti ti-alert-triangle" /></div>
            <h3 className="confirm-title">Delete "{deleteConfirm.name}"?</h3>
            <p className="confirm-text">
                This role is assigned to {deleteConfirm.userCount} users.
                Deleting it is permanent — those users will lose their permissions.
            </p>
            <div className="confirm-actions">
                <button className="button-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="button-danger" onClick={() => deleteRole(deleteConfirm.id)}>
                <i className="ti ti-trash" /> Delete
                </button>
            </div>
            </div>
        </div>
        )}
    </div>
    );
}