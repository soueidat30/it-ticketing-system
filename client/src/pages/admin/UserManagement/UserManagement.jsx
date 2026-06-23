import { useEffect, useMemo, useState } from "react";
import "./UserManagement.css";

import {
  bulkDeactivateAdminUsers,
  bulkDeleteAdminUsers,
  createAdminUser,
  getAdminUsers,
  getDepartments,
  getRoles,
  updateAdminUser,
} from "../../../services/adminUserService";

const STATUSES = ["All", "Active", "Inactive"];


const EMPTY_FORM = {
  full_name: "",
  username: "",
  email: "",
  department: "",
  status: "Active",
  role: "",
  password: "",
};

export default function UserManagement() {
  const token = useMemo(() => localStorage.getItem("token"), []);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers;


  const toggleSelectUser = (id) =>
    setSelectedUsers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUsers.includes(u.id));
  const toggleSelectAll = () => setSelectedUsers(allSelected ? [] : filteredUsers.map((u) => u.id));

  const fetchAll = async (opts = {}) => {
    if (!token) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const roleName = opts.role === "All" || !opts.role ? undefined : opts.role;
      const departmentName = opts.department === "All" || !opts.department ? undefined : opts.department;
      const statusName = opts.status === "All" || !opts.status ? undefined : opts.status;

      const data = await getAdminUsers(token, {

        search: opts.search || undefined,

        role: roleName,
        department: departmentName,
        status: statusName,
        page: 1,
        perPage: 50,
      });

      const apiUsers = data?.users ?? data?.data ?? data;
      setUsers(Array.isArray(apiUsers) ? apiUsers : []);



      setPagination(
        data?.pagination ?? {
          current_page: 1,
          last_page: 1,
          total: (data?.users ?? []).length,
        }
      );
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load users.");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      try {
        const [rolesRes, deptRes] = await Promise.all([getRoles(token), getDepartments(token)]);
        setRoles(Array.isArray(rolesRes) ? rolesRes : []);
        setDepartments(Array.isArray(deptRes) ? deptRes.map((d) => d.name) : []);
      } catch {
        setRoles([]);
        setDepartments([]);
      }
    };

    run();
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await fetchAll({
          search: searchQuery,
          role: roleFilter,
          department: deptFilter,
          status: statusFilter,
        });
      } catch {
        // handled inside fetchAll
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, roleFilter, deptFilter, statusFilter, token]);


  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      ...EMPTY_FORM,
      role: roles[0]?.name ?? "",
      department: departments[0] ?? "",
      status: "Active",
    });
    setShowModal(true);
  };

  const openEditModal = (u) => {
    setEditingUser(u);
    setFormData({
      full_name: u.name ?? "",
      username: u.email ? String(u.email).split("@")[0] : "",
      email: u.email ?? "",
      department: u.dept ?? "",
      status: u.status ?? "Active",
      role: u.role ?? "",
      password: "",
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const validateAndBuildPayload = () => {
    const base = {
      full_name: formData.full_name,
      username: formData.username,
      email: formData.email,
      department: formData.department,
      status: formData.status,
      role: formData.role || undefined,
    };

    if (!editingUser) {
      return {
        ...base,
        password: formData.password,
      };
    }
    const payload = {
      ...base,
    };

    if (formData.password && formData.password.length >= 8) payload.password = formData.password;
    return payload;
  };

  const onSave = async () => {
    if (!token) return;
    setErrorMsg("");

    try {
      const payload = validateAndBuildPayload();

      if (editingUser) {
        await updateAdminUser(token, editingUser.id, payload);
      } else {
        await createAdminUser(token, payload);
      }

      closeModal();
      await fetchAll({ search: searchQuery, role: roleFilter, department: deptFilter, status: statusFilter });
    } catch (e) {
      setErrorMsg(e?.message || "Failed to save user.");
    }
  };

  const onBulkDelete = async () => {
    if (!token || selectedUsers.length === 0) return;
    try {
      await bulkDeleteAdminUsers(token, selectedUsers);
      setSelectedUsers([]);
      await fetchAll({ search: searchQuery, role: roleFilter, department: deptFilter, status: statusFilter });
    } catch {
      setErrorMsg("Failed to delete selected users.");
    }
  };

  const onBulkDeactivate = async () => {
    if (!token || selectedUsers.length === 0) return;
    try {
      await bulkDeactivateAdminUsers(token, selectedUsers);
      setSelectedUsers([]);
      await fetchAll({ search: searchQuery, role: roleFilter, department: deptFilter, status: statusFilter });
    } catch {
      setErrorMsg("Failed to deactivate selected users.");
    }
  };



  return (
    <div className="user-management-container">

      <div className="user-management-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            {pagination.total} users total · {filteredUsers.filter((u) => u.status === "Active").length} active

          </p>
        </div>
        <button className="button-primary" onClick={openCreateModal}>
          <i className="ti ti-user-plus" /> Add User
        </button>
      </div>


      <div className="toolbar">
        <div className="search-wrapper">
          <i className="ti ti-search" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="search-input"
          />
          {searchQuery && <button className="search-clear" onClick={() => setSearchQuery("")}><i className="ti ti-x" /></button>}
        </div>
        <div className="filters-group">
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
            <option value="All">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="filter-select">
            <option value="All">All Depts</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
            {STATUSES.map((s) => (
              <option key={s} value={s === "All" ? "All" : s}>
                {s === "All" ? "All Status" : s}
              </option>
            ))}
          </select>

        </div>
        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span className="bulk-label">{selectedUsers.length} selected</span>
            <button
              className="bulk-button bulk-button--danger"
              onClick={onBulkDelete}
              title="Delete selected users"
            >
              <i className="ti ti-trash" /> Delete
            </button>
            <button
              className="bulk-button"
              onClick={onBulkDeactivate}
              title="Deactivate selected users"
            >
              <i className="ti ti-ban" /> Deactivate
            </button>
          </div>

        )}
      </div>

      <div className="table-card">
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="checkbox" />
                </th>
                <th>User</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Tickets</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className={`table-row ${selectedUsers.includes(u.id) ? "table-row--selected" : ""}`}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(u.id)}
                      onChange={() => toggleSelectUser(u.id)}
                      className="checkbox"
                    />
                  </td>
                  <td>
                    <div className="user-cell">
                      <div className="user-avatar">{u.name[0]}</div>
                      <div className="user-details">
                        <span className="user-name">{u.name}</span>
                        <span className="user-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td><span className="department-name">{u.dept}</span></td>
                  <td>
                    <span className={`role-badge role-badge--${(u.role || "").toLowerCase().replace(" ", "-")}`}>{u.role}</span>
                  </td>

                  <td>
                    <span className={`status-dot status-dot--${u.status.toLowerCase()}`} />
                    <span className="status-label">{u.status}</span>
                  </td>
                  <td><span className="ticket-count">{u.tickets}</span></td>
                  <td><span className="joined-date">{u.joined}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-button" title="Edit" onClick={() => { setEditingUser(u); setShowModal(true); }}>
                        <i className="ti ti-edit" />
                      </button>
                      <button className="action-button" title="View tickets">
                        <i className="ti ti-ticket" />
                      </button>
                      <button className="action-button action-button--danger" title="Delete">
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <i className="ti ti-users-group" />
                    <span>No users match your filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="page-info">Showing {filteredUsers.length} of {pagination.total} users</span>

          <div className="page-controls">
            <button className="page-button" disabled><i className="ti ti-chevron-left" /></button>
            <button className="page-button page-button--active">1</button>
            <button className="page-button"><i className="ti ti-chevron-right" /></button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingUser ? "Edit User" : "Add New User"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" defaultValue={editingUser?.name} placeholder="e.g. Sara El-Khoury" />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input className="form-input" defaultValue={editingUser?.email} placeholder="user@ids.com" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Department</label>
                  <select
                    className="form-input"
                    value={formData.department}
                    onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))}
                    disabled={false}
                  >
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>

                </div>
                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select
                    className="form-input"
                    value={formData.role}
                    onChange={(e) => setFormData((p) => ({ ...p, role: e.target.value }))}
                  >
                    <option value="">Select role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>

                </div>
              </div>
              {!editingUser && (
                <div className="form-field">
                  <label className="form-label">Temporary Password</label>
                  <input className="form-input" type="password" placeholder="Min 8 characters" />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="button-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="button-primary">{editingUser ? "Save Changes" : "Create User"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}