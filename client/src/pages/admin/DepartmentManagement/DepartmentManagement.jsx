import { useEffect, useMemo, useState } from "react";
import "./DepartmentManagement.css";

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
  building:
    "M3 21h18 M5 21V5a2 2 0 012-2h7a2 2 0 012 2v16 M9 7h1 M13 7h1 M9 11h1 M13 11h1 M9 15h1 M13 15h1 M17 21v-8h2a2 2 0 012 2v6",
  plus: "M12 5v14 M5 12h14",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  users:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  edit:
    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:
    "M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6",
  x: "M18 6L6 18 M6 6l12 12",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  userPlus:
    "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M8.5 11a4 4 0 100-8 4 4 0 000 8z M20 8v6 M23 11h-6",
  refresh:
    "M21 2v6h-6 M3 22v-6h6 M20.49 9A9 9 0 005.64 5.64L3 8 M3.51 15A9 9 0 0018.36 18.36L21 16",
};

const ns = (value) =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");

const normalizeArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getDepartmentName = (department) =>
  department?.department_name ?? department?.name ?? "Untitled Department";

const getDepartmentDescription = (department) =>
  department?.description ?? department?.department_description ?? "";

const getDepartmentId = (department) =>
  department?.id ?? department?.department_id ?? department?.name;

const getManagerId = (department) =>
  department?.manager_id ??
  department?.department_head_id ??
  department?.head_id ??
  department?.manager?.id ??
  "";

const getUserName = (user) =>
  user?.full_name ?? user?.name ?? user?.username ?? `User #${user?.id}`;

const getUserEmail = (user) => user?.email ?? user?.email_address ?? "No email";

const getUserRole = (user) =>
  user?.role?.role_name ?? user?.role?.name ?? user?.role_name ?? user?.role ?? "User";

const getUserDepartmentId = (user) =>
  user?.department_id ?? user?.department?.id ?? user?.departmentId ?? null;

const getUserDepartmentName = (user) => {
  if (typeof user?.department === "string") return user.department;
  return (
    user?.department?.department_name ??
    user?.department?.name ??
    user?.department_name ??
    "Unassigned"
  );
};

const isDepartmentActive = (department) => {
  if (typeof department?.is_active === "boolean") return department.is_active;
  if (typeof department?.active === "boolean") return department.active;
  if (department?.status) return ns(department.status) !== "inactive";
  return true;
};

const initials = (name) => {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const emptyForm = {
  department_name: "",
  description: "",
  manager_id: "",
  is_active: true,
};

export default function DepartmentManagement() {
  const token = localStorage.getItem("token");

  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("name");

  const [modalMode, setModalMode] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [assignDepartment, setAssignDepartment] = useState(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assigningUserId, setAssigningUserId] = useState(null);

  const [toast, setToast] = useState("");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token]
  );

  const showToast = (message) => {
    setToast(message);
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(""), 2200);
  };

  const isUserInDepartment = (user, department) => {
    const departmentId = String(getDepartmentId(department) ?? "");
    const userDepartmentId = getUserDepartmentId(user);

    if (userDepartmentId !== null && userDepartmentId !== undefined) {
      return String(userDepartmentId) === departmentId;
    }

    return ns(getUserDepartmentName(user)) === ns(getDepartmentName(department));
  };

  const membersForDepartment = (department) =>
    users.filter((user) => isUserInDepartment(user, department));

  const memberCount = (department) => {
    if (users.length) return membersForDepartment(department).length;

    return Number(
      department?.users_count ??
        department?.members_count ??
        department?.agents_count ??
        department?.employee_count ??
        0
    );
  };

  const managerForDepartment = (department) => {
    const managerId = getManagerId(department);

    const managerFromUsers = users.find(
      (user) => String(user.id) === String(managerId)
    );

    if (managerFromUsers) return getUserName(managerFromUsers);

    return (
      department?.manager?.full_name ??
      department?.manager?.name ??
      department?.manager?.username ??
      department?.head?.full_name ??
      department?.head?.username ??
      "No manager"
    );
  };

  const userDepartmentLabel = (user) => {
    const departmentId = getUserDepartmentId(user);

    if (departmentId !== null && departmentId !== undefined) {
      const department = departments.find(
        (dept) => String(getDepartmentId(dept)) === String(departmentId)
      );

      if (department) return getDepartmentName(department);
    }

    return getUserDepartmentName(user);
  };

  useEffect(() => {
    let ignore = false;

    const loadUsers = async () => {
      let response = await fetch(`${BASE_URL}/users`, { headers });

      if (!response.ok) {
        response = await fetch(`${BASE_URL}/users?role=agent`, { headers });
      }

      if (!response.ok) return [];

      const data = await response.json().catch(() => []);
      return normalizeArray(data);
    };

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const departmentResponse = await fetch(`${BASE_URL}/departments`, {
          headers,
        });

        if (!departmentResponse.ok) {
          throw new Error("Failed to load departments.");
        }

        const departmentData = await departmentResponse.json().catch(() => []);

        const usersData = await loadUsers();

        if (ignore) return;

        setDepartments(normalizeArray(departmentData));
        setUsers(usersData);
      } catch {
        if (!ignore) setError("Failed to load department management data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [headers]);

  const stats = useMemo(() => {
    const total = departments.length;
    const active = departments.filter(isDepartmentActive).length;
    const inactive = total - active;

    const assignedUsers = users.filter((user) => {
      const departmentId = getUserDepartmentId(user);

      return (
        departmentId !== null ||
        (getUserDepartmentName(user) && getUserDepartmentName(user) !== "Unassigned")
      );
    }).length;

    const unassignedUsers = Math.max(0, users.length - assignedUsers);

    return {
      total,
      active,
      inactive,
      assignedUsers,
      unassignedUsers,
    };
  }, [departments, users]);

  const filteredDepartments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...departments]
      .filter((department) => {
        const name = getDepartmentName(department).toLowerCase();
        const description = getDepartmentDescription(department).toLowerCase();
        const manager = managerForDepartment(department).toLowerCase();

        if (
          term &&
          !name.includes(term) &&
          !description.includes(term) &&
          !manager.includes(term)
        ) {
          return false;
        }

        if (statusFilter === "active" && !isDepartmentActive(department)) {
          return false;
        }

        if (statusFilter === "inactive" && isDepartmentActive(department)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "name") {
          return getDepartmentName(a).localeCompare(getDepartmentName(b));
        }

        if (sort === "newest") {
          return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
        }

        if (sort === "members") {
          return memberCount(b) - memberCount(a);
        }

        return 0;
      });
  }, [departments, search, statusFilter, sort, users]);

  const assignableUsers = useMemo(() => {
    const term = assignSearch.trim().toLowerCase();

    return [...users]
      .filter((user) => {
        if (!term) return true;

        return (
          getUserName(user).toLowerCase().includes(term) ||
          getUserEmail(user).toLowerCase().includes(term) ||
          getUserRole(user).toLowerCase().includes(term) ||
          userDepartmentLabel(user).toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (!assignDepartment) return 0;

        const aIn = isUserInDepartment(a, assignDepartment) ? 0 : 1;
        const bIn = isUserInDepartment(b, assignDepartment) ? 0 : 1;

        return aIn - bIn || getUserName(a).localeCompare(getUserName(b));
      });
  }, [users, assignSearch, assignDepartment, departments]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingDepartment(null);
    setForm(emptyForm);
    setFormError("");
  };

  const openEditModal = (department) => {
    setModalMode("edit");
    setEditingDepartment(department);
    setForm({
      department_name: getDepartmentName(department),
      description: getDepartmentDescription(department),
      manager_id: getManagerId(department) ? String(getManagerId(department)) : "",
      is_active: isDepartmentActive(department),
    });
    setFormError("");
  };

  const closeDepartmentModal = () => {
    setModalMode(null);
    setEditingDepartment(null);
    setForm(emptyForm);
    setFormError("");
    setSaving(false);
  };

  const handleSaveDepartment = async () => {
    const departmentName = form.department_name.trim();

    if (!departmentName) {
      setFormError("Department name is required.");
      return;
    }

    setSaving(true);
    setFormError("");

    const body = {
      department_name: departmentName,
      description: form.description.trim(),
      manager_id: form.manager_id ? Number(form.manager_id) : null,
      is_active: Boolean(form.is_active),
    };

    const isEdit = modalMode === "edit" && editingDepartment;
    const url = isEdit
      ? `${BASE_URL}/departments/${getDepartmentId(editingDepartment)}`
      : `${BASE_URL}/departments`;

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Could not save department.");
      }

      const savedDepartment =
        payload?.data && !Array.isArray(payload.data)
          ? payload.data
          : payload && !Array.isArray(payload)
          ? payload
          : {
              ...(editingDepartment ?? {}),
              ...body,
            };

      if (isEdit) {
        setDepartments((previous) =>
          previous.map((department) =>
            String(getDepartmentId(department)) ===
            String(getDepartmentId(editingDepartment))
              ? { ...department, ...savedDepartment }
              : department
          )
        );
      } else {
        setDepartments((previous) => [savedDepartment, ...previous]);
      }

      closeDepartmentModal();
      showToast(isEdit ? "Department updated." : "Department created.");
    } catch (err) {
      setFormError(err.message || "Could not save department.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDepartment = async (department) => {
    const departmentName = getDepartmentName(department);

    if (!window.confirm(`Delete "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(
        `${BASE_URL}/departments/${getDepartmentId(department)}`,
        {
          method: "DELETE",
          headers,
        }
      );

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Could not delete department.");
      }

      setDepartments((previous) =>
        previous.filter(
          (item) => String(getDepartmentId(item)) !== String(getDepartmentId(department))
        )
      );

      showToast("Department deleted.");
    } catch (err) {
      setError(err.message || "Could not delete department.");
    }
  };

  const updateUserDepartment = async (user, departmentId) => {
    setAssigningUserId(user.id);

    const body = {
      department_id: departmentId ? Number(departmentId) : null,
    };

    try {
      let response = await fetch(`${BASE_URL}/users/${user.id}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (response.status === 405) {
        response = await fetch(`${BASE_URL}/users/${user.id}`, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Could not update user department.");
      }

      const selectedDepartment = departmentId
        ? departments.find(
            (department) => String(getDepartmentId(department)) === String(departmentId)
          )
        : null;

      const updatedUser =
        payload?.data && !Array.isArray(payload.data)
          ? payload.data
          : payload && !Array.isArray(payload)
          ? payload
          : {};

      setUsers((previous) =>
        previous.map((item) =>
          String(item.id) === String(user.id)
            ? {
                ...item,
                ...updatedUser,
                department_id: body.department_id,
                department: selectedDepartment,
              }
            : item
        )
      );

      showToast(departmentId ? "User assigned to department." : "User removed from department.");
    } catch (err) {
      setError(err.message || "Could not update user department.");
    } finally {
      setAssigningUserId(null);
    }
  };

  return (
    <div className="dm-page admin-page">
      <div className="dm-page-header">
        <div>
          <h1 className="dm-title">Department Management</h1>
          <p className="dm-subtitle">
            Create departments, assign managers, and organize users by support team.
          </p>
        </div>

        <button className="dm-btn dm-btn--primary" onClick={openCreateModal}>
          <Icon d={IC.plus} size={15} />
          New Department
        </button>
      </div>

      <section className="dm-stats">
        <div className="dm-stat-card">
          <div className="dm-stat-icon dm-stat-icon--blue">
            <Icon d={IC.building} size={18} />
          </div>
          <div>
            <span>Total Departments</span>
            <strong>{loading ? "—" : stats.total}</strong>
          </div>
        </div>

        <div className="dm-stat-card">
          <div className="dm-stat-icon dm-stat-icon--green">
            <Icon d={IC.check} size={18} />
          </div>
          <div>
            <span>Active</span>
            <strong>{loading ? "—" : stats.active}</strong>
          </div>
        </div>

        <div className="dm-stat-card">
          <div className="dm-stat-icon dm-stat-icon--orange">
            <Icon d={IC.users} size={18} />
          </div>
          <div>
            <span>Assigned Users</span>
            <strong>{loading ? "—" : stats.assignedUsers}</strong>
          </div>
        </div>

        <div className="dm-stat-card">
          <div className="dm-stat-icon dm-stat-icon--red">
            <Icon d={IC.warning} size={18} />
          </div>
          <div>
            <span>Unassigned Users</span>
            <strong>{loading ? "—" : stats.unassignedUsers}</strong>
          </div>
        </div>
      </section>

      <div className="dm-toolbar">
        <div className="dm-search-wrap">
          <Icon d={IC.search} size={14} />
          <input
            className="dm-search"
            placeholder="Search departments, managers, or descriptions..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="dm-filters">
          <select
            className="dm-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <select
            className="dm-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="name">Sort by name</option>
            <option value="newest">Newest first</option>
            <option value="members">Most members</option>
          </select>

          {(search || statusFilter || sort !== "name") && (
            <button
              className="dm-btn dm-btn--light"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setSort("name");
              }}
            >
              <Icon d={IC.refresh} size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="dm-toast">
          <Icon d={IC.check} size={14} />
          {toast}
        </div>
      )}

      {error && (
        <div className="dm-error">
          <Icon d={IC.warning} size={14} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <Icon d={IC.x} size={13} />
          </button>
        </div>
      )}

      <div className="dm-card">
        <div className="dm-card-header">
          <div>
            <h2>Departments</h2>
            <p>
              {loading
                ? "Loading departments..."
                : `${filteredDepartments.length} department${
                    filteredDepartments.length !== 1 ? "s" : ""
                  } found`}
            </p>
          </div>
          <Icon d={IC.filter} size={16} />
        </div>

        {loading ? (
          <div className="dm-loading">Loading departments...</div>
        ) : filteredDepartments.length === 0 ? (
          <div className="dm-empty">
            <div className="dm-empty-icon">
              <Icon d={IC.building} size={30} />
            </div>
            <h3>No departments found</h3>
            <p>Create a department or adjust your filters.</p>
            <button className="dm-btn dm-btn--primary" onClick={openCreateModal}>
              <Icon d={IC.plus} size={15} />
              New Department
            </button>
          </div>
        ) : (
          <div className="dm-table-wrap">
            <table className="dm-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Members</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map((department) => {
                  const members = membersForDepartment(department);
                  const count = memberCount(department);
                  const active = isDepartmentActive(department);

                  return (
                    <tr key={getDepartmentId(department)}>
                      <td>
                        <div className="dm-department-cell">
                          <div className="dm-department-avatar">
                            {initials(getDepartmentName(department))}
                          </div>
                          <div>
                            <strong>{getDepartmentName(department)}</strong>
                            <span>
                              {getDepartmentDescription(department) ||
                                "No description provided"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="dm-manager-chip">
                          {managerForDepartment(department)}
                        </span>
                      </td>

                      <td>
                        <div className="dm-member-stack-wrap">
                          <div className="dm-member-stack">
                            {members.slice(0, 4).map((member) => (
                              <span
                                key={member.id}
                                className="dm-member-avatar"
                                title={getUserName(member)}
                              >
                                {initials(getUserName(member))}
                              </span>
                            ))}

                            {count > 4 && (
                              <span className="dm-member-avatar dm-member-avatar--more">
                                +{count - 4}
                              </span>
                            )}
                          </div>

                          <span className="dm-member-count">
                            {count} member{count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`dm-status-badge ${
                            active ? "dm-status-badge--active" : "dm-status-badge--inactive"
                          }`}
                        >
                          {active ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="dm-muted">{formatDate(department.created_at)}</td>

                      <td>
                        <div className="dm-actions">
                          <button
                            className="dm-icon-btn"
                            title="Manage assignments"
                            onClick={() => {
                              setAssignDepartment(department);
                              setAssignSearch("");
                            }}
                          >
                            <Icon d={IC.userPlus} size={14} />
                          </button>

                          <button
                            className="dm-icon-btn"
                            title="Edit department"
                            onClick={() => openEditModal(department)}
                          >
                            <Icon d={IC.edit} size={14} />
                          </button>

                          <button
                            className="dm-icon-btn dm-icon-btn--danger"
                            title="Delete department"
                            onClick={() => handleDeleteDepartment(department)}
                          >
                            <Icon d={IC.trash} size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalMode && (
        <div
          className="dm-modal-overlay"
          onClick={(event) =>
            event.target === event.currentTarget && closeDepartmentModal()
          }
        >
          <div className="dm-modal">
            <div className="dm-modal-header">
              <div>
                <h2>{modalMode === "edit" ? "Edit Department" : "New Department"}</h2>
                <p>
                  {modalMode === "edit"
                    ? "Update department details and status."
                    : "Create a new support department."}
                </p>
              </div>

              <button className="dm-modal-close" onClick={closeDepartmentModal}>
                <Icon d={IC.x} size={16} />
              </button>
            </div>

            <div className="dm-modal-body">
              <label className="dm-label">
                Department Name
                <input
                  className="dm-input"
                  value={form.department_name}
                  placeholder="Example: Network Support"
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      department_name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="dm-label">
                Description
                <textarea
                  className="dm-textarea"
                  value={form.description}
                  placeholder="Describe what this department handles..."
                  rows={4}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="dm-form-grid">
                <label className="dm-label">
                  Department Manager
                  <select
                    className="dm-select dm-select--full"
                    value={form.manager_id}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        manager_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">No manager</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {getUserName(user)} · {getUserRole(user)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="dm-label">
                  Status
                  <select
                    className="dm-select dm-select--full"
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        is_active: event.target.value === "active",
                      }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>

              {formError && (
                <div className="dm-modal-error">
                  <Icon d={IC.warning} size={14} />
                  {formError}
                </div>
              )}
            </div>

            <div className="dm-modal-footer">
              <button className="dm-btn dm-btn--ghost" onClick={closeDepartmentModal}>
                Cancel
              </button>

              <button
                className="dm-btn dm-btn--primary"
                disabled={saving}
                onClick={handleSaveDepartment}
              >
                {saving
                  ? "Saving..."
                  : modalMode === "edit"
                  ? "Save Changes"
                  : "Create Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      {assignDepartment && (
        <div
          className="dm-modal-overlay"
          onClick={(event) =>
            event.target === event.currentTarget && setAssignDepartment(null)
          }
        >
          <div className="dm-modal dm-modal--wide">
            <div className="dm-modal-header">
              <div>
                <h2>Department Assignments</h2>
                <p>
                  Assign users to{" "}
                  <strong>{getDepartmentName(assignDepartment)}</strong>.
                </p>
              </div>

              <button
                className="dm-modal-close"
                onClick={() => setAssignDepartment(null)}
              >
                <Icon d={IC.x} size={16} />
              </button>
            </div>

            <div className="dm-assignment-summary">
              <div>
                <span>Department</span>
                <strong>{getDepartmentName(assignDepartment)}</strong>
              </div>
              <div>
                <span>Manager</span>
                <strong>{managerForDepartment(assignDepartment)}</strong>
              </div>
              <div>
                <span>Members</span>
                <strong>{memberCount(assignDepartment)}</strong>
              </div>
            </div>

            <div className="dm-assignment-search">
              <Icon d={IC.search} size={14} />
              <input
                placeholder="Search users by name, email, role, or department..."
                value={assignSearch}
                onChange={(event) => setAssignSearch(event.target.value)}
              />
            </div>

            <div className="dm-assignment-list">
              {assignableUsers.length === 0 ? (
                <div className="dm-empty-small">No users match your search.</div>
              ) : (
                assignableUsers.map((user) => {
                  const inDepartment = isUserInDepartment(user, assignDepartment);

                  return (
                    <div className="dm-user-row" key={user.id}>
                      <div className="dm-user-main">
                        <div className="dm-user-avatar">{initials(getUserName(user))}</div>

                        <div>
                          <strong>{getUserName(user)}</strong>
                          <span>
                            {getUserEmail(user)} · {getUserRole(user)}
                          </span>
                        </div>
                      </div>

                      <div className="dm-user-meta">
                        <span
                          className={`dm-user-department ${
                            inDepartment ? "dm-user-department--current" : ""
                          }`}
                        >
                          {inDepartment
                            ? "In this department"
                            : userDepartmentLabel(user)}
                        </span>

                        <button
                          className={`dm-btn ${
                            inDepartment ? "dm-btn--ghost" : "dm-btn--primary"
                          }`}
                          disabled={assigningUserId === user.id}
                          onClick={() =>
                            updateUserDepartment(
                              user,
                              inDepartment ? null : getDepartmentId(assignDepartment)
                            )
                          }
                        >
                          {assigningUserId === user.id
                            ? "Updating..."
                            : inDepartment
                            ? "Remove"
                            : "Assign here"}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}