import { useCallback, useEffect, useMemo, useState } from "react";
import "./PriorityManagement.css";
import { authJson } from "../../../services/authFetch";


const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000/api"
).replace(/\/$/, "");

const PRIORITIES_API = `${API_BASE_URL}/admin/admin/priorities`;

const COLOR_OPTIONS = [
  { hex: "#ef4444", label: "Red" },
  { hex: "#f97316", label: "Orange" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#22c55e", label: "Green" },
  { hex: "#3b82f6", label: "Blue" },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#ec4899", label: "Pink" },
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#64748b", label: "Slate" },
  { hex: "#03363d", label: "Forest" },
];

const BG_MAP = {
  "#ef4444": "#fef2f2",
  "#f97316": "#fff7ed",
  "#eab308": "#fefce8",
  "#22c55e": "#f0fdf4",
  "#3b82f6": "#eff6ff",
  "#8b5cf6": "#f5f3ff",
  "#ec4899": "#fdf2f8",
  "#06b6d4": "#ecfeff",
  "#64748b": "#f8fafc",
  "#03363d": "#f0f7f7",
};

const ICON_OPTIONS = [
  "ti-flame",
  "ti-alert-triangle",
  "ti-alert-circle",
  "ti-info-circle",
  "ti-calendar",
  "ti-clock",
  "ti-zap",
  "ti-exclamation-mark",
  "ti-arrow-up",
  "ti-arrow-down",
  "ti-star",
  "ti-bookmark",
];

const EMPTY_FORM = {
  name: "",
  level: 1,
  color: "#3b82f6",
  bgColor: "#eff6ff",
  icon: "ti-info-circle",
  description: "",
  slaResponse: 240,
  slaResolve: 1440,
  autoEscalate: false,
  notifyManager: false,
};

function getAuthToken() {
  return localStorage.getItem("token") || null;
}


async function apiRequest(url, options = {}) {
  const { method = "GET", body, headers = {} } = options;

  if (!body) {
    return authJson(url, {
      method,
      headers,
    });
  }

  return authJson(
    url,
    {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    },
    { retry: true }
  );
}


function toBool(value, fallback = false) {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
  }

  return Boolean(value);
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizePriority(priority = {}) {
  const color = priority.color ?? "#3b82f6";

  return {
    id: priority.id,
    name: priority.name ?? priority.priority_name ?? "",
    level: toNumber(priority.level, 1),
    color,
    bgColor:
      priority.bgColor ??
      priority.bg_color ??
      BG_MAP[color] ??
      "#eff6ff",
    icon: priority.icon ?? "ti-info-circle",
    description: priority.description ?? "",
    slaResponse: toNumber(
      priority.slaResponse ?? priority.sla_response_minutes,
      240
    ),
    slaResolve: toNumber(
      priority.slaResolve ?? priority.sla_resolve_minutes,
      1440
    ),
    autoEscalate: toBool(
      priority.autoEscalate ?? priority.auto_escalate,
      false
    ),
    notifyManager: toBool(
      priority.notifyManager ?? priority.notify_manager,
      false
    ),
    active: toBool(priority.active ?? priority.is_active, true),
    ticketCount: toNumber(
      priority.ticketCount ?? priority.tickets_count,
      0
    ),
  };
}

function priorityFormToPayload(formData, currentPriority = null) {
  const color = formData.color || "#3b82f6";

  return {
    priority_name: String(formData.name || "").trim(),
    level: Math.max(1, toNumber(formData.level, 1)),
    color,
    bg_color: formData.bgColor || BG_MAP[color] || "#eff6ff",
    icon: formData.icon || "ti-info-circle",
    description: String(formData.description || "").trim() || null,
    sla_response_minutes: Math.max(
      1,
      toNumber(formData.slaResponse, 240)
    ),
    sla_resolve_minutes: Math.max(
      1,
      toNumber(formData.slaResolve, 1440)
    ),
    auto_escalate: Boolean(formData.autoEscalate),
    notify_manager: Boolean(formData.notifyManager),
    is_active: currentPriority
      ? Boolean(currentPriority.active)
      : true,
  };
}

function formatMinutes(value) {
  const mins = toNumber(value, 0);

  if (mins <= 0) return "0m";
  if (mins < 60) return `${mins}m`;

  if (mins < 1440) {
    const hours = mins / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
  }

  const days = mins / 1440;
  return `${Number.isInteger(days) ? days : days.toFixed(1)}d`;
}

function ApiErrorMessage({ children, onRetry }) {
  return (
    <div
      style={{
        padding: "12px 14px",
        marginBottom: 16,
        borderRadius: 10,
        background: "#fef2f2",
        color: "#991b1b",
        border: "1px solid #fecaca",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <span>{children}</span>

      {onRetry && (
        <button type="button" className="button-ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export default function PriorityManagement() {
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingPriority, setEditingPriority] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [dragOverId, setDragOverId] = useState(null);
  const [dragItemId, setDragItemId] = useState(null);

  const loadPriorities = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(PRIORITIES_API);

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setPriorities(rows.map(normalizePriority));
    } catch (err) {
      setError(err.message || "Failed to load priorities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPriorities();
  }, [loadPriorities]);

  const sortedPriorities = useMemo(() => {
    return [...priorities].sort((a, b) => {
      const levelSort = a.level - b.level;

      if (levelSort !== 0) return levelSort;

      return a.name.localeCompare(b.name);
    });
  }, [priorities]);

  const totalTickets = useMemo(() => {
    return priorities.reduce((sum, p) => sum + Number(p.ticketCount || 0), 0);
  }, [priorities]);

  const formIsValid = useMemo(() => {
    return (
      String(formData.name || "").trim().length > 0 &&
      toNumber(formData.level, 0) >= 1 &&
      toNumber(formData.slaResponse, 0) >= 1 &&
      toNumber(formData.slaResolve, 0) >= 1
    );
  }, [formData]);

  const openCreateModal = () => {
    const nextLevel =
      priorities.length > 0
        ? Math.max(...priorities.map((p) => toNumber(p.level, 0))) + 1
        : 1;

    setEditingPriority(null);
    setFormData({
      ...EMPTY_FORM,
      level: nextLevel,
    });
    setActionError("");
    setShowModal(true);
  };

  const openEditModal = (priority) => {
    setEditingPriority(priority);

    setFormData({
      name: priority.name,
      level: priority.level,
      color: priority.color,
      bgColor: priority.bgColor,
      icon: priority.icon,
      description: priority.description,
      slaResponse: priority.slaResponse,
      slaResolve: priority.slaResolve,
      autoEscalate: priority.autoEscalate,
      notifyManager: priority.notifyManager,
    });

    setActionError("");
    setShowModal(true);
  };

  const saveForm = async () => {
    if (!formIsValid) {
      setActionError("Please fill all required fields correctly.");
      return;
    }

    setSaving(true);
    setActionError("");

    try {
      const payload = priorityFormToPayload(formData, editingPriority);

      if (editingPriority) {
        await apiRequest(`${PRIORITIES_API}/${editingPriority.id}`, {
          method: "PUT",
          body: payload,
        });
      } else {
        await apiRequest(PRIORITIES_API, {
          method: "POST",
          body: payload,
        });
      }

      setShowModal(false);
      setEditingPriority(null);

      await loadPriorities();
    } catch (err) {
      setActionError(err.message || "Failed to save priority.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    const snapshot = priorities;

    setTogglingId(id);
    setActionError("");

    setPriorities((prev) =>
      prev.map((p) =>
        String(p.id) === String(id)
          ? {
              ...p,
              active: !p.active,
            }
          : p
      )
    );

    try {
      await apiRequest(`${PRIORITIES_API}/${id}/toggle-status`, {
        method: "PATCH",
      });
    } catch (err) {
      setPriorities(snapshot);
      setActionError(err.message || "Failed to update priority status.");
    } finally {
      setTogglingId(null);
    }
  };

  const deletePriority = async () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.ticketCount > 0) {
      setActionError(
        "Cannot delete this priority because tickets are currently using it."
      );
      return;
    }

    setDeleting(true);
    setActionError("");

    try {
      await apiRequest(`${PRIORITIES_API}/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      setPriorities((prev) =>
        prev.filter((p) => String(p.id) !== String(deleteConfirm.id))
      );

      setDeleteConfirm(null);
    } catch (err) {
      setActionError(err.message || "Failed to delete priority.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDragStart = (e, id) => {
    setDragItemId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = async (e, targetId) => {
    e.preventDefault();

    const movedId = dragItemId;

    setDragItemId(null);
    setDragOverId(null);

    if (movedId == null || String(movedId) === String(targetId)) return;

    const current = [...priorities].sort((a, b) => a.level - b.level);

    const fromIndex = current.findIndex(
      (p) => String(p.id) === String(movedId)
    );

    const toIndex = current.findIndex(
      (p) => String(p.id) === String(targetId)
    );

    if (fromIndex < 0 || toIndex < 0) return;

    const snapshot = priorities;
    const next = [...current];

    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    const releveled = next.map((p, i) => ({
      ...p,
      level: i + 1,
    }));

    setPriorities(releveled);
    setReordering(true);
    setActionError("");

    try {
      await apiRequest(`${PRIORITIES_API}/reorder`, {
        method: "POST",
        body: {
          priorities: releveled.map((p) => ({
            id: p.id,
            level: p.level,
          })),
        },
      });
    } catch (err) {
      setPriorities(snapshot);
      setActionError(err.message || "Failed to reorder priorities.");
    } finally {
      setReordering(false);
    }
  };

  return (
    <div className="priority-container">
      <div className="priority-header">
        <div>
          <h1 className="priority-title">Priorities</h1>
          <p className="priority-subtitle">
            {loading
              ? "Loading priorities..."
              : `${priorities.length} priority levels · Drag rows to reorder`}
          </p>
        </div>

        <button
          type="button"
          className="button-primary"
          onClick={openCreateModal}
        >
          <i className="ti ti-plus" /> Add Priority
        </button>
      </div>

      {error && (
        <ApiErrorMessage onRetry={loadPriorities}>{error}</ApiErrorMessage>
      )}

      {actionError && !showModal && !deleteConfirm && (
        <ApiErrorMessage>{actionError}</ApiErrorMessage>
      )}

      <div className="overview-grid">
        {sortedPriorities
          .filter((p) => p.active)
          .map((p) => (
            <div
              key={p.id}
              className="overview-card"
              style={{ borderTopColor: p.color }}
            >
              <div
                className="overview-icon"
                style={{
                  background: p.bgColor,
                  color: p.color,
                }}
              >
                <i className={`ti ${p.icon}`} />
              </div>

              <div className="overview-content">
                <span
                  className="overview-name"
                  style={{ color: p.color }}
                >
                  {p.name}
                </span>

                <div className="overview-sla">
                  <span className="sla-badge">
                    <i className="ti ti-bolt" />{" "}
                    {formatMinutes(p.slaResponse)} response
                  </span>

                  <span className="sla-badge">
                    <i className="ti ti-circle-check" />{" "}
                    {formatMinutes(p.slaResolve)} resolve
                  </span>
                </div>

                <div className="progress-wrapper">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width:
                          totalTickets > 0
                            ? `${(p.ticketCount / totalTickets) * 100}%`
                            : "0%",
                        background: p.color,
                      }}
                    />
                  </div>

                  <span className="ticket-count-badge">
                    {p.ticketCount} tickets
                  </span>
                </div>
              </div>
            </div>
          ))}
      </div>

      <div className="table-card">
        <div className="card-header">
          <h2 className="card-title">Priority Levels</h2>

          <p className="card-hint">
            {reordering ? (
              <>
                <i className="ti ti-loader" /> Saving order...
              </>
            ) : (
              <>
                <i className="ti ti-grip-vertical" /> Drag to reorder · level 1
                = highest
              </>
            )}
          </p>
        </div>

        <div className="table-wrapper">
          <table className="priority-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Level</th>
                <th>Priority</th>
                <th>SLA Response</th>
                <th>SLA Resolve</th>
                <th>Auto-Escalate</th>
                <th>Notify Manager</th>
                <th>Tickets</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    Loading priorities...
                  </td>
                </tr>
              ) : sortedPriorities.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 24,
                    }}
                  >
                    No priorities found.
                  </td>
                </tr>
              ) : (
                sortedPriorities.map((p) => (
                  <tr
                    key={p.id}
                    className={`priority-row ${
                      !p.active ? "priority-row--inactive" : ""
                    } ${
                      String(dragOverId) === String(p.id)
                        ? "priority-row--dragover"
                        : ""
                    }`}
                    draggable={!reordering}
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragOver={(e) => handleDragOver(e, p.id)}
                    onDrop={(e) => handleDrop(e, p.id)}
                    onDragLeave={() => setDragOverId(null)}
                    onDragEnd={() => {
                      setDragItemId(null);
                      setDragOverId(null);
                    }}
                  >
                    <td className="drag-handle-cell">
                      <i className="ti ti-grip-vertical drag-handle" />
                    </td>

                    <td>
                      <span
                        className="level-badge"
                        style={{
                          background: p.bgColor,
                          color: p.color,
                        }}
                      >
                        L{p.level}
                      </span>
                    </td>

                    <td>
                      <div className="priority-name-cell">
                        <div
                          className="priority-icon"
                          style={{
                            background: p.bgColor,
                            color: p.color,
                          }}
                        >
                          <i className={`ti ${p.icon}`} />
                        </div>

                        <div className="priority-info">
                          <span
                            className="priority-name-text"
                            style={{ color: p.color }}
                          >
                            {p.name}
                          </span>

                          <span className="priority-description">
                            {p.description || "No description provided."}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="sla-cell">
                        <i
                          className="ti ti-bolt sla-icon"
                          style={{ color: p.color }}
                        />
                        <span className="sla-value">
                          {formatMinutes(p.slaResponse)}
                        </span>
                      </div>
                    </td>

                    <td>
                      <div className="sla-cell">
                        <i
                          className="ti ti-circle-check sla-icon"
                          style={{ color: p.color }}
                        />
                        <span className="sla-value">
                          {formatMinutes(p.slaResolve)}
                        </span>
                      </div>
                    </td>

                    <td>
                      {p.autoEscalate ? (
                        <span className="yes-badge">
                          <i className="ti ti-check" /> Yes
                        </span>
                      ) : (
                        <span className="no-badge">—</span>
                      )}
                    </td>

                    <td>
                      {p.notifyManager ? (
                        <span className="yes-badge">
                          <i className="ti ti-check" /> Yes
                        </span>
                      ) : (
                        <span className="no-badge">—</span>
                      )}
                    </td>

                    <td>
                      <span className="ticket-count-number">
                        {p.ticketCount}
                      </span>
                    </td>

                    <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={p.active}
                          disabled={String(togglingId) === String(p.id)}
                          onChange={() => toggleActive(p.id)}
                        />
                        <span className="toggle-track">
                          <span className="toggle-thumb" />
                        </span>
                      </label>
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="action-button"
                          title="Edit"
                          onClick={() => openEditModal(p)}
                        >
                          <i className="ti ti-edit" />
                        </button>

                        <button
                          type="button"
                          className="action-button action-button--danger"
                          title="Delete"
                          onClick={() => {
                            setActionError("");
                            setDeleteConfirm(p);
                          }}
                        >
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingPriority ? "Edit Priority" : "New Priority"}
              </h2>

              <button
                type="button"
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div className="modal-body">
              {actionError && <ApiErrorMessage>{actionError}</ApiErrorMessage>}

              <div
                className="preview-badge"
                style={{
                  background: formData.bgColor,
                  borderColor: `${formData.color}33`,
                }}
              >
                <div
                  className="preview-icon"
                  style={{
                    background: `${formData.color}22`,
                    color: formData.color,
                  }}
                >
                  <i className={`ti ${formData.icon}`} />
                </div>

                <span
                  className="preview-name"
                  style={{ color: formData.color }}
                >
                  {String(formData.name || "").trim() || "Priority name"}
                </span>

                <span className="preview-sla">
                  {formatMinutes(formData.slaResponse)} response ·{" "}
                  {formatMinutes(formData.slaResolve)} resolve
                </span>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">
                    Priority Name <span className="required">*</span>
                  </label>

                  <input
                    className="form-input"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Critical"
                  />
                </div>

                <div className="form-field">
                  <label className="form-label">Level 1 = highest</label>

                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    max={100}
                    value={formData.level}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        level: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Description</label>

                <textarea
                  className="form-input textarea"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                  placeholder="When should agents apply this priority?"
                  rows={2}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">
                    SLA Response Time minutes
                  </label>

                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={formData.slaResponse}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        slaResponse: e.target.value,
                      }))
                    }
                  />

                  <span className="field-hint">
                    = {formatMinutes(formData.slaResponse)}
                  </span>
                </div>

                <div className="form-field">
                  <label className="form-label">
                    SLA Resolve Time minutes
                  </label>

                  <input
                    className="form-input"
                    type="number"
                    min={1}
                    value={formData.slaResolve}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        slaResolve: e.target.value,
                      }))
                    }
                  />

                  <span className="field-hint">
                    = {formatMinutes(formData.slaResolve)}
                  </span>
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={formData.autoEscalate}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        autoEscalate: e.target.checked,
                      }))
                    }
                  />

                  <div className="checkbox-info">
                    <span className="checkbox-label">
                      Auto-Escalate on SLA Breach
                    </span>
                    <span className="checkbox-desc">
                      Automatically escalate if SLA is exceeded
                    </span>
                  </div>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={formData.notifyManager}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        notifyManager: e.target.checked,
                      }))
                    }
                  />

                  <div className="checkbox-info">
                    <span className="checkbox-label">
                      Notify Department Manager
                    </span>
                    <span className="checkbox-desc">
                      Send alert to manager when ticket is opened
                    </span>
                  </div>
                </label>
              </div>

              <div className="form-field">
                <label className="form-label">Icon</label>

                <div className="icon-grid">
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      className={`icon-button ${
                        formData.icon === ic ? "icon-button--active" : ""
                      }`}
                      style={
                        formData.icon === ic
                          ? {
                              background: `${formData.color}18`,
                              color: formData.color,
                              borderColor: formData.color,
                            }
                          : {}
                      }
                      onClick={() =>
                        setFormData((f) => ({
                          ...f,
                          icon: ic,
                        }))
                      }
                      title={ic.replace("ti-", "")}
                    >
                      <i className={`ti ${ic}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Color</label>

                <div className="color-grid">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      className={`color-swatch ${
                        formData.color === c.hex
                          ? "color-swatch--active"
                          : ""
                      }`}
                      style={{ background: c.hex }}
                      onClick={() =>
                        setFormData((f) => ({
                          ...f,
                          color: c.hex,
                          bgColor: BG_MAP[c.hex] ?? "#f3f4f6",
                        }))
                      }
                      title={c.label}
                    >
                      {formData.color === c.hex && (
                        <i className="ti ti-check" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="button-ghost"
                onClick={() => setShowModal(false)}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button-primary"
                onClick={saveForm}
                disabled={!formIsValid || saving}
              >
                {saving
                  ? "Saving..."
                  : editingPriority
                    ? "Save Changes"
                    : "Create Priority"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => {
            setDeleteConfirm(null);
            setActionError("");
          }}
        >
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">
              <i className="ti ti-alert-triangle" />
            </div>

            <h3 className="confirm-title">
              Delete "{deleteConfirm.name}"?
            </h3>

            <p className="confirm-text">
              {deleteConfirm.ticketCount > 0 ? (
                <>
                  This priority is currently used by{" "}
                  <strong>{deleteConfirm.ticketCount}</strong>{" "}
                  ticket{deleteConfirm.ticketCount === 1 ? "" : "s"}. Your
                  backend prevents deleting priorities that are being used.
                </>
              ) : (
                <>
                  This priority is not used by any tickets. Deleting it is
                  permanent.
                </>
              )}
            </p>

            {actionError && <ApiErrorMessage>{actionError}</ApiErrorMessage>}

            <div className="confirm-actions">
              <button
                type="button"
                className="button-ghost"
                onClick={() => {
                  setDeleteConfirm(null);
                  setActionError("");
                }}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="button-danger"
                onClick={deletePriority}
                disabled={deleting || deleteConfirm.ticketCount > 0}
              >
                <i className="ti ti-trash" />{" "}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}