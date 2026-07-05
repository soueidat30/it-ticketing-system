import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./StatusManagement.css";

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
  status:
    "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  plus: "M12 5v14 M5 12h14",
  search: "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  edit:
    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:
    "M3 6h18 M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2 M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6 M10 11v6 M14 11v6",
  x: "M18 6L6 18 M6 6l12 12",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  refresh:
    "M21 2v6h-6 M3 22v-6h6 M20.49 9A9 9 0 005.64 5.64L3 8 M3.51 15A9 9 0 0018.36 18.36L21 16",
  ticket:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
};

const COLOR_PRESETS = [
  "#1f73b7",
  "#6b46c1",
  "#d97706",
  "#0f8b4c",
  "#c72a1c",
  "#5f6f73",
];

const DEFAULT_COLORS = {
  open: "#1f73b7",
  "in-progress": "#6b46c1",
  pending: "#d97706",
  resolved: "#0f8b4c",
  closed: "#5f6f73",
  cancelled: "#c72a1c",
};

const emptyForm = {
  status_name: "",
  description: "",
  color: "#1f73b7",
  sort_order: 1,
  is_active: true,
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

const getStatusId = (status) => status?.id ?? status?.status_id;

const getStatusName = (status) =>
  status?.status_name ?? status?.name ?? status?.label ?? "Untitled Status";

const getStatusDescription = (status) =>
  status?.description ?? status?.status_description ?? "";

const getStatusColor = (status) =>
  status?.color ??
  status?.status_color ??
  DEFAULT_COLORS[ns(getStatusName(status))] ??
  "#1f73b7";

const getStatusOrder = (status) =>
  Number(status?.sort_order ?? status?.order ?? status?.display_order ?? 1);

const isStatusActive = (status) => {
  if (typeof status?.is_active === "boolean") return status.is_active;
  if (typeof status?.active === "boolean") return status.active;
  if (status?.status) return ns(status.status) !== "inactive";
  return true;
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

export default function StatusManagement() {
  const token = localStorage.getItem("token");
  const toastTimerRef = useRef(null);

  const [statuses, setStatuses] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [sort, setSort] = useState("order");

  const [modalMode, setModalMode] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState("");

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    }),
    [token]
  );

  const handleAuthError = (statusCode) => {
    if (statusCode !== 401) return false;

    localStorage.removeItem("token");
    window.location.href = "/login";
    return true;
  };

  const showToast = (message) => {
    setToast(message);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    let ignore = false;

    const fetchJson = async (url) => {
      const response = await fetch(url, { headers });
      const data = await response.json().catch(() => []);

      if (!response.ok) {
        if (handleAuthError(response.status)) return null;
        throw new Error(data?.message || "Request failed.");
      }

      return data;
    };

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [statusResult, ticketResult] = await Promise.allSettled([
          fetchJson(`${BASE_URL}/statuses`),
          fetchJson(`${BASE_URL}/tickets`),
        ]);

        if (ignore) return;

        if (statusResult.status === "rejected") {
          throw new Error("Failed to load statuses.");
        }

        setStatuses(normalizeArray(statusResult.value));

        if (ticketResult.status === "fulfilled") {
          setTickets(normalizeArray(ticketResult.value));
        }
      } catch {
        if (!ignore) setError("Failed to load status management data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [headers]);

  const statusTicketCount = useCallback(
    (status) => {
      if (typeof status.tickets_count === "number") {
        return status.tickets_count;
      }

      const statusId = String(getStatusId(status) ?? "");
      const statusName = ns(getStatusName(status));

      return tickets.filter((ticket) => {
        const ticketStatusId = ticket.status_id ?? ticket.status?.id;
        const ticketStatusName =
          ticket.status?.status_name ?? ticket.status_name ?? ticket.status;

        if (
          ticketStatusId !== null &&
          ticketStatusId !== undefined &&
          String(ticketStatusId) === statusId
        ) {
          return true;
        }

        return ns(ticketStatusName) === statusName;
      }).length;
    },
    [tickets]
  );

  const statusHistoryCount = (status) => {
    return Number(status.histories_count ?? status.history_count ?? 0);
  };

  const stats = useMemo(() => {
    const total = statuses.length;
    const active = statuses.filter(isStatusActive).length;
    const inactive = total - active;
    const used = statuses.filter((status) => statusTicketCount(status) > 0).length;

    return {
      total,
      active,
      inactive,
      used,
    };
  }, [statuses, statusTicketCount]);

  const filteredStatuses = useMemo(() => {
    const term = search.trim().toLowerCase();

    return [...statuses]
      .filter((status) => {
        const name = getStatusName(status).toLowerCase();
        const description = getStatusDescription(status).toLowerCase();

        if (term && !name.includes(term) && !description.includes(term)) {
          return false;
        }

        if (activeFilter === "active" && !isStatusActive(status)) {
          return false;
        }

        if (activeFilter === "inactive" && isStatusActive(status)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sort === "order") return getStatusOrder(a) - getStatusOrder(b);
        if (sort === "name") return getStatusName(a).localeCompare(getStatusName(b));
        if (sort === "usage") return statusTicketCount(b) - statusTicketCount(a);
        if (sort === "newest") {
          return new Date(b.created_at ?? 0) - new Date(a.created_at ?? 0);
        }

        return 0;
      });
  }, [statuses, search, activeFilter, sort, statusTicketCount]);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingStatus(null);
    setForm({
      ...emptyForm,
      sort_order: statuses.length + 1,
    });
    setFormError("");
  };

  const openEditModal = (status) => {
    setModalMode("edit");
    setEditingStatus(status);
    setForm({
      status_name: getStatusName(status),
      description: getStatusDescription(status),
      color: getStatusColor(status),
      sort_order: getStatusOrder(status),
      is_active: isStatusActive(status),
    });
    setFormError("");
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingStatus(null);
    setForm(emptyForm);
    setFormError("");
    setSaving(false);
  };

  const handleSaveStatus = async () => {
    const name = form.status_name.trim();

    if (!name) {
      setFormError("Status name is required.");
      return;
    }

    const duplicate = statuses.some((status) => {
      const sameName = ns(getStatusName(status)) === ns(name);
      const sameId =
        editingStatus &&
        String(getStatusId(status)) === String(getStatusId(editingStatus));

      return sameName && !sameId;
    });

    if (duplicate) {
      setFormError("A status with this name already exists.");
      return;
    }

    setSaving(true);
    setFormError("");

    const body = {
      status_name: name,
      description: form.description.trim(),
      color: form.color,
      sort_order: Number(form.sort_order) || 1,
      is_active: Boolean(form.is_active),
    };

    const isEdit = modalMode === "edit" && editingStatus;
    const url = isEdit
      ? `${BASE_URL}/statuses/${getStatusId(editingStatus)}`
      : `${BASE_URL}/statuses`;

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
        throw new Error(payload?.message || "Could not save status.");
      }

      const responseStatus =
        payload?.data && !Array.isArray(payload.data)
          ? payload.data
          : payload?.status && typeof payload.status === "object"
          ? payload.status
          : payload;

      const savedStatus =
        responseStatus &&
        (responseStatus.id || responseStatus.status_id || responseStatus.status_name)
          ? responseStatus
          : {
              ...(editingStatus ?? {}),
              ...body,
              id: editingStatus?.id ?? 0,
            };

      if (isEdit) {
        setStatuses((previous) =>
          previous.map((status) =>
            String(getStatusId(status)) === String(getStatusId(editingStatus))
              ? { ...status, ...savedStatus }
              : status
          )
        );
      } else {
        setStatuses((previous) => [...previous, savedStatus]);
      }

      closeModal();
      showToast(isEdit ? "Status updated." : "Status created.");
    } catch (err) {
      setFormError(err.message || "Could not save status.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (status) => {
    const nextActive = !isStatusActive(status);

    const fullBody = {
      status_name: getStatusName(status),
      description: getStatusDescription(status),
      color: getStatusColor(status),
      sort_order: getStatusOrder(status),
      is_active: nextActive,
    };

    try {
      let response = await fetch(`${BASE_URL}/statuses/${getStatusId(status)}`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: nextActive }),
      });

      if (response.status === 405) {
        response = await fetch(`${BASE_URL}/statuses/${getStatusId(status)}`, {
          method: "PUT",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullBody),
        });
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.message || "Could not update status.");
      }

      setStatuses((previous) =>
        previous.map((item) =>
          String(getStatusId(item)) === String(getStatusId(status))
            ? {
                ...item,
                is_active: nextActive,
                active: nextActive,
                status: nextActive ? "active" : "inactive",
              }
            : item
        )
      );

      showToast(nextActive ? "Status activated." : "Status deactivated.");
    } catch (err) {
      setError(err.message || "Could not update status.");
    }
  };

  const handleDeleteStatus = async (status) => {
    const name = getStatusName(status);
    const usage = statusTicketCount(status);
    const historyRefs = statusHistoryCount(status);

    if (usage > 0 || historyRefs > 0) {
      const details = [
        usage > 0 ? `Tickets: ${usage}` : null,
        historyRefs > 0 ? `History: ${historyRefs}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      setError(
        `Cannot delete status while it is referenced by tickets or ticket history. (${details})`
      );
      return;
    }

    const message = `Delete "${name}"? This action cannot be undone.`;

    if (!window.confirm(message)) return;

    try {
      const response = await fetch(`${BASE_URL}/statuses/${getStatusId(status)}`, {
        method: "DELETE",
        headers,
      });

      const payload = await response.json().catch(() => ({}));

      // 409 Conflict is an expected business rule (status is referenced)
      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError(response.status);
          return;
        }

        if (response.status === 409) {
          const message = payload?.message || "Cannot delete status.";
          const ticketRefs = payload?.ticket_references;
          const historyRefs = payload?.history_references;

          const details = [
            typeof ticketRefs === "number" ? `Tickets: ${ticketRefs}` : null,
            typeof historyRefs === "number"
              ? `History: ${historyRefs}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ");

          setError(details ? `${message} (${details})` : message);
          return;
        }

        throw new Error(payload?.message || "Could not delete status.");
      }

      setStatuses((previous) =>
        previous.filter(
          (item) => String(getStatusId(item)) !== String(getStatusId(status))
        )
      );

      showToast("Status deleted.");
    } catch (err) {
      setError(err.message || "Could not delete status.");
    }
  };

  return (
    <div className="admin-page status-management-page sm-page">
      <div className="sm-page-header">
        <div>
          <h1 className="sm-title">Status Management</h1>
          <p className="sm-subtitle">
            Configure ticket statuses, workflow labels, colors, and availability.
          </p>
        </div>

        <button className="sm-btn sm-btn--primary" onClick={openCreateModal}>
          <Icon d={IC.plus} size={15} />
          New Status
        </button>
      </div>

      <section className="sm-stats">
        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-stat-icon--blue">
            <Icon d={IC.status} size={18} />
          </div>
          <div>
            <span>Total Statuses</span>
            <strong>{loading ? "—" : stats.total}</strong>
          </div>
        </div>

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-stat-icon--green">
            <Icon d={IC.check} size={18} />
          </div>
          <div>
            <span>Active</span>
            <strong>{loading ? "—" : stats.active}</strong>
          </div>
        </div>

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-stat-icon--orange">
            <Icon d={IC.eye} size={18} />
          </div>
          <div>
            <span>Used in Tickets</span>
            <strong>{loading ? "—" : stats.used}</strong>
          </div>
        </div>

        <div className="sm-stat-card">
          <div className="sm-stat-icon sm-stat-icon--red">
            <Icon d={IC.warning} size={18} />
          </div>
          <div>
            <span>Inactive</span>
            <strong>{loading ? "—" : stats.inactive}</strong>
          </div>
        </div>
      </section>

      <div className="sm-toolbar">
        <div className="sm-search-wrap">
          <Icon d={IC.search} size={14} />
          <input
            className="sm-search"
            placeholder="Search statuses by name or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="sm-filters">
          <select
            className="sm-select"
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value)}
          >
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            <option value="inactive">Inactive only</option>
          </select>

          <select
            className="sm-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="order">Workflow order</option>
            <option value="name">Name A-Z</option>
            <option value="usage">Most used</option>
            <option value="newest">Newest first</option>
          </select>

          {(search || activeFilter || sort !== "order") && (
            <button
              className="sm-btn sm-btn--light"
              onClick={() => {
                setSearch("");
                setActiveFilter("");
                setSort("order");
              }}
            >
              <Icon d={IC.refresh} size={14} />
              Reset
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="sm-toast">
          <Icon d={IC.check} size={14} />
          {toast}
        </div>
      )}

      {error && (
        <div className="sm-error">
          <Icon d={IC.warning} size={14} />
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <Icon d={IC.x} size={13} />
          </button>
        </div>
      )}

      <div className="sm-card">
        <div className="sm-card-header">
          <div>
            <h2>Ticket Statuses</h2>
            <p>
              {loading
                ? "Loading statuses..."
                : `${filteredStatuses.length} status${
                    filteredStatuses.length !== 1 ? "es" : ""
                  } found`}
            </p>
          </div>

          <Icon d={IC.filter} size={16} />
        </div>

        {loading ? (
          <div className="sm-loading">Loading statuses...</div>
        ) : filteredStatuses.length === 0 ? (
          <div className="sm-empty">
            <div className="sm-empty-icon">
              <Icon d={IC.status} size={30} />
            </div>
            <h3>No statuses found</h3>
            <p>Create a new status or adjust your filters.</p>
            <button className="sm-btn sm-btn--primary" onClick={openCreateModal}>
              <Icon d={IC.plus} size={15} />
              New Status
            </button>
          </div>
        ) : (
          <div className="sm-table-wrap">
            <table className="sm-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Ticket Usage</th>
                  <th>Order</th>
                  <th>Availability</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredStatuses.map((status) => {
                  const usage = statusTicketCount(status);
                  const usagePercent =
                    tickets.length > 0 ? Math.round((usage / tickets.length) * 100) : 0;
                  const active = isStatusActive(status);

                  return (
                    <tr key={getStatusId(status)}>
                      <td>
                        <div className="sm-status-cell">
                          <span
                            className="sm-status-dot"
                            style={{ backgroundColor: getStatusColor(status) }}
                          />
                          <div>
                            <strong>{getStatusName(status)}</strong>
                            <span>{getStatusColor(status)}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="sm-description">
                          {getStatusDescription(status) || "No description provided"}
                        </span>
                      </td>

                      <td>
                        <div className="sm-usage">
                          <div className="sm-usage-top">
                            <span>
                              {usage} ticket{usage !== 1 ? "s" : ""}
                            </span>
                            <strong>{usagePercent}%</strong>
                          </div>
                          <div className="sm-usage-bar">
                            <span
                              style={{
                                width: `${Math.max(usage ? 6 : 0, usagePercent)}%`,
                                backgroundColor: getStatusColor(status),
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="sm-order-pill">#{getStatusOrder(status)}</span>
                      </td>

                      <td>
                        <button
                          className={`sm-active-pill ${
                            active ? "sm-active-pill--on" : "sm-active-pill--off"
                          }`}
                          onClick={() => handleToggleStatus(status)}
                        >
                          {active ? "Active" : "Inactive"}
                        </button>
                      </td>

                      <td className="sm-muted">{formatDate(status.created_at)}</td>

                      <td>
                        <div className="sm-actions">
                          <button
                            className="sm-icon-btn"
                            title="Edit status"
                            onClick={() => openEditModal(status)}
                          >
                            <Icon d={IC.edit} size={14} />
                          </button>

                          <button
                            className={`sm-icon-btn sm-icon-btn--danger${
                              statusTicketCount(status) > 0 || statusHistoryCount(status) > 0
                                ? ' sm-icon-btn--disabled'
                                : ''
                            }`}
                            title={
                              statusTicketCount(status) > 0 || statusHistoryCount(status) > 0
                                ? "Cannot delete status while it is referenced by tickets or ticket history"
                                : "Delete status"
                            }
                            disabled={
                              statusTicketCount(status) > 0 || statusHistoryCount(status) > 0
                            }
                            onClick={() => handleDeleteStatus(status)}
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
          className="sm-modal-overlay"
          onClick={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div className="sm-modal">
            <div className="sm-modal-header">
              <div>
                <h2>{modalMode === "edit" ? "Edit Status" : "New Status"}</h2>
                <p>
                  {modalMode === "edit"
                    ? "Update this workflow status."
                    : "Add a new status to your ticket workflow."}
                </p>
              </div>

              <button className="sm-modal-close" onClick={closeModal}>
                <Icon d={IC.x} size={16} />
              </button>
            </div>

            <div className="sm-modal-body">
              <label className="sm-label">
                Status Name
                <input
                  className="sm-input"
                  value={form.status_name}
                  placeholder="Example: Pending"
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      status_name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="sm-label">
                Description
                <textarea
                  className="sm-textarea"
                  rows={4}
                  value={form.description}
                  placeholder="Explain when this status should be used..."
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <div className="sm-form-grid">
                <label className="sm-label">
                  Workflow Order
                  <input
                    className="sm-input"
                    type="number"
                    min="1"
                    value={form.sort_order}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        sort_order: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="sm-label">
                  Availability
                  <select
                    className="sm-select sm-select--full"
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

              <label className="sm-label">
                Status Color
                <div className="sm-color-row">
                  <input
                    className="sm-color-input"
                    type="color"
                    value={form.color}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        color: event.target.value,
                      }))
                    }
                  />

                  <div className="sm-color-presets">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`sm-color-preset ${
                          form.color.toLowerCase() === color.toLowerCase()
                            ? "active"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            color,
                          }))
                        }
                        aria-label={`Choose ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </label>

              {formError && (
                <div className="sm-modal-error">
                  <Icon d={IC.warning} size={14} />
                  {formError}
                </div>
              )}
            </div>

            <div className="sm-modal-footer">
              <button className="sm-btn sm-btn--ghost" onClick={closeModal}>
                Cancel
              </button>

              <button
                className="sm-btn sm-btn--primary"
                disabled={saving}
                onClick={handleSaveStatus}
              >
                {saving
                  ? "Saving..."
                  : modalMode === "edit"
                  ? "Save Changes"
                  : "Create Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}