import { useState } from "react";
import "./PriorityManagement.css";

const INITIAL_PRIORITIES = [
  {
    id: 1,
    name: "Critical",
    level: 1,
    color: "#ef4444",
    bgColor: "#fef2f2",
    icon: "ti-flame",
    description: "System-down or business-critical issue requiring immediate response.",
    slaResponse: 30,
    slaResolve: 240,
    autoEscalate: true,
    notifyManager: true,
    active: true,
    ticketCount: 4,
  },
  {
    id: 2,
    name: "High",
    level: 2,
    color: "#f97316",
    bgColor: "#fff7ed",
    icon: "ti-alert-triangle",
    description: "Significant impact on productivity. Response required within 2 hours.",
    slaResponse: 120,
    slaResolve: 480,
    autoEscalate: true,
    notifyManager: false,
    active: true,
    ticketCount: 28,
  },
  {
    id: 3,
    name: "Medium",
    level: 3,
    color: "#eab308",
    bgColor: "#fefce8",
    icon: "ti-alert-circle",
    description: "Moderate impact. Work can continue with workarounds in place.",
    slaResponse: 240,
    slaResolve: 1440,
    autoEscalate: false,
    notifyManager: false,
    active: true,
    ticketCount: 63,
  },
  {
    id: 4,
    name: "Low",
    level: 4,
    color: "#22c55e",
    bgColor: "#f0fdf4",
    icon: "ti-info-circle",
    description: "Minor issue or general request with no immediate impact on operations.",
    slaResponse: 480,
    slaResolve: 4320,
    autoEscalate: false,
    notifyManager: false,
    active: true,
    ticketCount: 47,
  },
  {
    id: 5,
    name: "Planning",
    level: 5,
    color: "#8b5cf6",
    bgColor: "#f5f3ff",
    icon: "ti-calendar",
    description: "Future enhancements, planned changes, or non-urgent improvements.",
    slaResponse: 1440,
    slaResolve: 10080,
    autoEscalate: false,
    notifyManager: false,
    active: false,
    ticketCount: 0,
  },
];

const COLOR_OPTIONS = [
  { hex: "#ef4444", label: "Red"    },
  { hex: "#f97316", label: "Orange" },
  { hex: "#eab308", label: "Yellow" },
  { hex: "#22c55e", label: "Green"  },
  { hex: "#3b82f6", label: "Blue"   },
  { hex: "#8b5cf6", label: "Purple" },
  { hex: "#ec4899", label: "Pink"   },
  { hex: "#06b6d4", label: "Cyan"   },
  { hex: "#64748b", label: "Slate"  },
  { hex: "#03363d", label: "Forest" },
];
const BG_MAP = {
  "#ef4444": "#fef2f2", "#f97316": "#fff7ed", "#eab308": "#fefce8",
  "#22c55e": "#f0fdf4", "#3b82f6": "#eff6ff", "#8b5cf6": "#f5f3ff",
  "#ec4899": "#fdf2f8", "#06b6d4": "#ecfeff", "#64748b": "#f8fafc",
  "#03363d": "#f0f7f7",
};
const ICON_OPTIONS = [
  "ti-flame","ti-alert-triangle","ti-alert-circle","ti-info-circle",
  "ti-calendar","ti-clock","ti-zap","ti-exclamation-mark",
  "ti-arrow-up","ti-arrow-down","ti-star","ti-bookmark",
];

const EMPTY_FORM = {
  name: "", level: 5, color: "#3b82f6", bgColor: "#eff6ff",
  icon: "ti-info-circle", description: "",
  slaResponse: 240, slaResolve: 1440,
  autoEscalate: false, notifyManager: false,
};

function formatMinutes(mins) {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${mins/60}h`;
  return `${Math.round(mins/1440)}d`;
}

export default function PriorityManagement() {
  const [priorities, setPriorities] = useState(INITIAL_PRIORITIES);
  const [showModal, setShowModal] = useState(false);
  const [editingPriority, setEditingPriority] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);
  const [dragItemId, setDragItemId] = useState(null);

  const openCreateModal = () => { 
    setEditingPriority(null); 
    setFormData(EMPTY_FORM); 
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
      notifyManager: priority.notifyManager 
    });
    setShowModal(true);
  };
  
  const saveForm = () => {
    if (!formData.name.trim()) return;
    if (editingPriority) {
      setPriorities(prev => prev.map(p => p.id === editingPriority.id ? { ...p, ...formData } : p));
    } else {
      setPriorities(prev => [...prev, { id: Date.now(), ...formData, active: true, ticketCount: 0 }]);
    }
    setShowModal(false);
  };

  const toggleActive = (id) => setPriorities(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  const deletePriority = (id) => { 
    setPriorities(prev => prev.filter(p => p.id !== id)); 
    setDeleteConfirm(null); 
  };

  const handleDragStart = (e, id) => { 
    setDragItemId(id); 
    e.dataTransfer.effectAllowed = "move"; 
  };
  
  const handleDragOver = (e, id) => { 
    e.preventDefault(); 
    setDragOverId(id); 
  };
  
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (dragItemId === targetId) { 
      setDragItemId(null); 
      setDragOverId(null); 
      return; 
    }
    const sorted = [...priorities];
    const fromIndex = sorted.findIndex(p => p.id === dragItemId);
    const toIndex = sorted.findIndex(p => p.id === targetId);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    const releveled = sorted.map((p, i) => ({ ...p, level: i + 1 }));
    setPriorities(releveled);
    setDragItemId(null);
    setDragOverId(null);
  };

  const sortedPriorities = [...priorities].sort((a, b) => a.level - b.level);
  const totalTickets = priorities.reduce((sum, p) => sum + p.ticketCount, 0);

  return (
    <div className="priority-container">

      <div className="priority-header">
        <div>
          <h1 className="priority-title">Priorities</h1>
          <p className="priority-subtitle">
            {priorities.length} priority levels · Drag rows to reorder
          </p>
        </div>
        <button className="button-primary" onClick={openCreateModal}>
          <i className="ti ti-plus" /> Add Priority
        </button>
      </div>

      <div className="overview-grid">
        {sortedPriorities.filter(p => p.active).map(p => (
          <div key={p.id} className="overview-card" style={{ borderTopColor: p.color }}>
            <div className="overview-icon" style={{ background: p.bgColor, color: p.color }}>
              <i className={`ti ${p.icon}`} />
            </div>
            <div className="overview-content">
              <span className="overview-name" style={{ color: p.color }}>{p.name}</span>
              <div className="overview-sla">
                <span className="sla-badge">
                  <i className="ti ti-bolt" /> {formatMinutes(p.slaResponse)} response
                </span>
                <span className="sla-badge">
                  <i className="ti ti-circle-check" /> {formatMinutes(p.slaResolve)} resolve
                </span>
              </div>
              <div className="progress-wrapper">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: totalTickets > 0 ? `${(p.ticketCount / totalTickets) * 100}%` : "0%",
                      background: p.color,
                    }}
                  />
                </div>
                <span className="ticket-count-badge">{p.ticketCount} tickets</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="card-header">
          <h2 className="card-title">Priority Levels</h2>
          <p className="card-hint">
            <i className="ti ti-grip-vertical" /> Drag to reorder · level 1 = highest
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
              {sortedPriorities.map(p => (
                <tr
                  key={p.id}
                  className={`priority-row ${!p.active ? "priority-row--inactive" : ""} ${dragOverId === p.id ? "priority-row--dragover" : ""}`}
                  draggable
                  onDragStart={e => handleDragStart(e, p.id)}
                  onDragOver={e => handleDragOver(e, p.id)}
                  onDrop={e => handleDrop(e, p.id)}
                  onDragLeave={() => setDragOverId(null)}
                >
                  <td className="drag-handle-cell">
                    <i className="ti ti-grip-vertical drag-handle" />
                  </td>

                  <td>
                    <span className="level-badge" style={{ background: p.bgColor, color: p.color }}>
                      L{p.level}
                    </span>
                  </td>

                  <td>
                    <div className="priority-name-cell">
                      <div className="priority-icon" style={{ background: p.bgColor, color: p.color }}>
                        <i className={`ti ${p.icon}`} />
                      </div>
                      <div className="priority-info">
                        <span className="priority-name-text" style={{ color: p.color }}>{p.name}</span>
                        <span className="priority-description">{p.description}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="sla-cell">
                      <i className="ti ti-bolt sla-icon" style={{ color: p.color }} />
                      <span className="sla-value">{formatMinutes(p.slaResponse)}</span>
                    </div>
                  </td>

                  <td>
                    <div className="sla-cell">
                      <i className="ti ti-circle-check sla-icon" style={{ color: p.color }} />
                      <span className="sla-value">{formatMinutes(p.slaResolve)}</span>
                    </div>
                  </td>

                  <td>
                    {p.autoEscalate
                      ? <span className="yes-badge"><i className="ti ti-check" /> Yes</span>
                      : <span className="no-badge">—</span>}
                  </td>

                  <td>
                    {p.notifyManager
                      ? <span className="yes-badge"><i className="ti ti-check" /> Yes</span>
                      : <span className="no-badge">—</span>}
                  </td>

                  <td>
                    <span className="ticket-count-number">{p.ticketCount}</span>
                  </td>

                  <td>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={p.active} onChange={() => toggleActive(p.id)} />
                      <span className="toggle-track"><span className="toggle-thumb" /></span>
                    </label>
                  </td>

                  <td>
                    <div className="action-buttons">
                      <button className="action-button" title="Edit" onClick={() => openEditModal(p)}>
                        <i className="ti ti-edit" />
                      </button>
                      <button className="action-button action-button--danger" title="Delete" onClick={() => setDeleteConfirm(p)}>
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPriority ? "Edit Priority" : "New Priority"}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}><i className="ti ti-x" /></button>
            </div>

            <div className="modal-body">

              <div className="preview-badge" style={{ background: formData.bgColor, borderColor: formData.color + "33" }}>
                <div className="preview-icon" style={{ background: formData.color + "22", color: formData.color }}>
                  <i className={`ti ${formData.icon}`} />
                </div>
                <span className="preview-name" style={{ color: formData.color }}>
                  {formData.name || "Priority name"}
                </span>
                <span className="preview-sla">
                  {formatMinutes(formData.slaResponse)} response · {formatMinutes(formData.slaResolve)} resolve
                </span>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Priority Name <span className="required">*</span></label>
                  <input className="form-input" value={formData.name}
                    onChange={e => setFormData(f => ({...f, name: e.target.value}))}
                    placeholder="e.g. Critical" />
                </div>
                <div className="form-field">
                  <label className="form-label">Level (1 = highest)</label>
                  <input className="form-input" type="number" min={1} max={10} value={formData.level}
                    onChange={e => setFormData(f => ({...f, level: Number(e.target.value)}))} />
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Description</label>
                <textarea className="form-input textarea" value={formData.description}
                  onChange={e => setFormData(f => ({...f, description: e.target.value}))}
                  placeholder="When should agents apply this priority?" rows={2} />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">SLA Response Time (minutes)</label>
                  <input className="form-input" type="number" min={1} value={formData.slaResponse}
                    onChange={e => setFormData(f => ({...f, slaResponse: Number(e.target.value)}))} />
                  <span className="field-hint">= {formatMinutes(formData.slaResponse)}</span>
                </div>
                <div className="form-field">
                  <label className="form-label">SLA Resolve Time (minutes)</label>
                  <input className="form-input" type="number" min={1} value={formData.slaResolve}
                    onChange={e => setFormData(f => ({...f, slaResolve: Number(e.target.value)}))} />
                  <span className="field-hint">= {formatMinutes(formData.slaResolve)}</span>
                </div>
              </div>

              <div className="form-row">
                <label className="checkbox-row">
                  <input type="checkbox" checked={formData.autoEscalate}
                    onChange={e => setFormData(f => ({...f, autoEscalate: e.target.checked}))} />
                  <div className="checkbox-info">
                    <span className="checkbox-label">Auto-Escalate on SLA Breach</span>
                    <span className="checkbox-desc">Automatically escalate if SLA is exceeded</span>
                  </div>
                </label>
                <label className="checkbox-row">
                  <input type="checkbox" checked={formData.notifyManager}
                    onChange={e => setFormData(f => ({...f, notifyManager: e.target.checked}))} />
                  <div className="checkbox-info">
                    <span className="checkbox-label">Notify Department Manager</span>
                    <span className="checkbox-desc">Send alert to manager when ticket is opened</span>
                  </div>
                </label>
              </div>

              <div className="form-field">
                <label className="form-label">Icon</label>
                <div className="icon-grid">
                  {ICON_OPTIONS.map(ic => (
                    <button key={ic}
                      className={`icon-button ${formData.icon === ic ? "icon-button--active" : ""}`}
                      style={formData.icon === ic ? { background: formData.color + "18", color: formData.color, borderColor: formData.color } : {}}
                      onClick={() => setFormData(f => ({...f, icon: ic}))} title={ic.replace("ti-","")}>
                      <i className={`ti ${ic}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">Color</label>
                <div className="color-grid">
                  {COLOR_OPTIONS.map(c => (
                    <button key={c.hex}
                      className={`color-swatch ${formData.color === c.hex ? "color-swatch--active" : ""}`}
                      style={{ background: c.hex }}
                      onClick={() => setFormData(f => ({...f, color: c.hex, bgColor: BG_MAP[c.hex] ?? "#f3f4f0"}))}
                      title={c.label}>
                      {formData.color === c.hex && <i className="ti ti-check" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="button-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="button-primary" onClick={saveForm} disabled={!formData.name.trim()}>
                {editingPriority ? "Save Changes" : "Create Priority"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">
              <i className="ti ti-alert-triangle" />
            </div>
            <h3 className="confirm-title">Delete "{deleteConfirm.name}"?</h3>
            <p className="confirm-text">
              There are currently {deleteConfirm.ticketCount} tickets using this priority.
              Deleting it is permanent and those tickets will need to be updated manually.
            </p>
            <div className="confirm-actions">
              <button className="button-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="button-danger" onClick={() => deletePriority(deleteConfirm.id)}>
                <i className="ti ti-trash" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}