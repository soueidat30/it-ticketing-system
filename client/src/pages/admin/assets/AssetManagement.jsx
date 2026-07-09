import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AssetManagement.css";

// ── Shared Icon helper ──
const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  plus:     "M12 5v14M5 12h14",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 15a3 3 0 100-6 3 3 0 000 6z",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  qr:       "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M17 17h3v3h-3z",
  assign:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  warning:  "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  close:    "M18 6L6 18M6 6l12 12",
  check:    "M20 6L9 17l-5-5",
  chevronL: "M15 18l-6-6 6-6",
  chevronR: "M9 18l6-6-6-6",
  laptop:   "M2 20h20M4 20V8a2 2 0 012-2h12a2 2 0 012 2v12",
  cpu:      "M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18",
  box:      "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
};

const BASE_URL = "http://127.0.0.1:8000/api";
const QR_API  = "https://api.qrserver.com/v1/create-qr-code";

// ── Asset type enum (per spec: Laptop, Desktop, Printer, Monitor, Phone) ──
const ASSET_TYPES = [
  { label: "Laptop",         value: "laptop"         },
  { label: "Desktop",        value: "desktop"        },
  { label: "Monitor",        value: "monitor"        },
  { label: "Printer",        value: "printer"        },
  { label: "Scanner",        value: "scanner"        },
  { label: "Mobile Phone",   value: "mobile_phone"   },
  { label: "Tablet",         value: "tablet"         },
  { label: "Server",         value: "server"         },
  { label: "Network Device", value: "network_device" },
  { label: "Other",          value: "other"          },
];

// ── Asset status enum (backend values) ──
// "assigned" is auto-computed by the frontend when assigned_to is set
const ASSET_STATUSES = [
  { label: "Unassigned", value: "unassigned" },
  { label: "In Repair",  value: "in_repair"  },
  { label: "Lost",       value: "lost"       },
  { label: "Retired",    value: "retired"    },
  { label: "Disposed",   value: "disposed"   },
];

// ── Departments filter (per spec: IT, HR, Finance) ──
const DEPARTMENTS = ["IT", "HR", "Finance"];

const CONDITIONS = ["New", "Good", "Fair", "Poor"];
const PAGE_SIZE  = 10;

// ── Bucket logic: compute "assigned" / "available" / "repair" / "retired" ──
const computeBucket = (asset) => {
  // "Assigned" means: the asset has an assigned_to user set
  if (asset.assigned_to) return "assigned";
  const s = String(asset.status ?? "").toLowerCase();
  if (s === "in_repair" || s === "in repair") return "repair";
  if (s === "retired" || s === "disposed")    return "retired";
  if (s === "lost")                            return "repair"; // bucket lost with repair
  return "available"; // includes unassigned, etc.
};

const BUCKET_LABEL = {
  all:       "All Assets",
  assigned:  "Assigned",
  available: "Available",
  repair:    "In Repair",
  retired:   "Retired",
};

const BUCKET_CLS = {
  assigned:  "assigned",
  available: "available",
  repair:    "repair",
  retired:   "retired",
};



const qrUrl = (tag, size = 160) =>
  `${QR_API}/?size=${size}x${size}&data=${encodeURIComponent(`TICKORA:ASSET:${tag}`)}&color=03363d&bgcolor=d4f265&qzone=1`;

const EMPTY_FORM = {
  name: "", asset_tag: "", type: "laptop", brand: "", model: "",
  serial_number: "", status: "unassigned", condition: "Good",
  location: "", department: "", assigned_to: "",
      purchase_price: "", warranty_expiry: "", notes: "",

  qr_code_value: "",
  created_by:    "",
  assigned_at:   "",
};

function SortHeader({ col, label, sortKey, sortDir, onSort }) {
  return (
    <th className={`ast-th${sortKey === col ? " ast-th--active" : ""}`} onClick={() => onSort(col)}>
      {label} <span className="ast-sort">{sortKey === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span>
    </th>
  );
}

export default function AssetManagement() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ── Data ──
  const [assets,  setAssets]  = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── Filters / sort / pagination ──
  const [search,        setSearch]        = useState("");
  const [fType,         setFType]         = useState("all");
  const [fStatus,       setFStatus]       = useState("all");
  const [fDepartment,   setFDepartment]   = useState("all");
  const [sortKey,       setSortKey]       = useState("created");
  const [sortDir,       setSortDir]       = useState("desc");
  const [page,          setPage]          = useState(1);

  // ── Modals ──
  const [showForm,   setShowForm]   = useState(false);
  const [editAsset,  setEditAsset]  = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [formErr,    setFormErr]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  const [qrAsset,  setQrAsset]  = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning,    setAssigning]    = useState(false);

  const auth = useCallback(() => ({ Authorization: `Bearer ${token}`, Accept: "application/json" }), [token]);
  const jsonHeaders = useCallback(() => ({ ...auth(), "Content-Type": "application/json" }), [auth]);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets`, { headers: auth() });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Failed to load assets."); return; }
      setAssets(Array.isArray(data.assets ?? data) ? (data.assets ?? data) : []);
    } catch { setError("Network error."); }
    finally   { setLoading(false); }
  }, [auth]);

  const loadUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/users`, { headers: auth() });
      const data = await res.json();
      setUsers(Array.isArray(data.users ?? data) ? (data.users ?? data) : []);
    } catch { /* ignore */ }
  }, [auth]);

  useEffect(() => {
    const id = window.setTimeout(() => { load(); loadUsers(); }, 0);
    return () => window.clearTimeout(id);
  }, [load, loadUsers]);

  // ── Summary counts (per spec: Total / Assigned / Available / In Repair / Retired) ──
  const summary = useMemo(() => {
    const c = { total: assets.length, assigned: 0, available: 0, repair: 0, retired: 0 };
    assets.forEach(a => {
      const b = computeBucket(a);
      if (c[b] !== undefined) c[b] += 1;
    });
    return c;
  }, [assets]);

  // ── Filtered / sorted / paginated ──
  const filtered = useMemo(() => {
    let list = assets;

    // Bucket (status) filter
    if (fStatus !== "all") {
      list = list.filter(a => computeBucket(a) === fStatus);
    }

    // Type filter
    if (fType !== "all") {
      list = list.filter(a => (a.type ?? "").toLowerCase() === fType.toLowerCase());
    }

    // Department filter
    if (fDepartment !== "all") {
      list = list.filter(a => (a.department ?? "").toLowerCase() === fDepartment.toLowerCase());
    }

    // Search by Name / Tag / Serial Number only (per spec)
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(a =>
        (a.asset_tag ?? "").toLowerCase().includes(q) ||
        (a.name      ?? "").toLowerCase().includes(q) ||
        (a.serial_number ?? "").toLowerCase().includes(q)
      );
    }

    const fns = {
      tag:     a => a.asset_tag ?? "",
      name:    a => (a.name ?? "").toLowerCase(),
      type:    a => (a.type ?? "").toLowerCase(),
      status:  a => computeBucket(a),
      created: a => new Date(a.created_at ?? 0).getTime(),
    };
    const fn = fns[sortKey] ?? fns.created;
    return [...list].sort((a, b) => {
      const va = fn(a), vb = fn(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * (sortDir === "asc" ? 1 : -1);
    });
  }, [assets, fType, fStatus, fDepartment, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const rows       = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  // ── Create / Edit ──
  const openCreate = () => {
    const me = JSON.parse(localStorage.getItem("user") || "{}");
    setEditAsset(null);
    setForm({ ...EMPTY_FORM, created_by: String(me.id ?? "") });
    setFormErr(null);
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditAsset(a);

    // Backend enum values are: unassigned|assigned|in_repair|lost|retired|disposed
    // Frontend select expects: unassigned|in_repair|lost|retired|disposed (assigned is auto-computed)
    const backendStatusToFrontend = (s) => {
      const v = String(s ?? "").toLowerCase();
      if (v === "assigned" || v === "in repair" || v === "in_repair") return "in_repair";
      if (v === "unassigned" || v === "available") return "unassigned";
      if (v === "lost") return "lost";
      if (v === "retired") return "retired";
      if (v === "disposed") return "disposed";
      if (v === "in_repair" || v === "in repair") return "in_repair";
      return "unassigned";
    };

    setForm({
      name:           a.name           ?? "",
      asset_tag:      a.asset_tag      ?? "",
      type:           a.type           ?? "laptop",
      brand:          a.brand          ?? "",
      model:          a.model          ?? "",
      serial_number:  a.serial_number  ?? "",
      status:         backendStatusToFrontend(a.status) ?? "unassigned",
      condition:      a.condition      ?? "Good",
      location:       a.location       ?? "",
      department:     a.department     ?? "",
      assigned_to:    String(a.assigned_to ?? ""),
      purchase_date:  a.purchase_date   ? a.purchase_date.slice(0, 10) : "",
      purchase_price: a.purchase_price  ?? "",
      warranty_expiry:a.warranty_expiry ? a.warranty_expiry.slice(0, 10) : "",
      notes:          a.notes          ?? "",
      qr_code_value:  a.qr_code_value  ?? "",
      created_by:     String(a.created_by ?? ""),
      assigned_at:    a.assigned_at    ?? "",
    });
    setFormErr(null);
    setShowForm(true);
  };



  const handleSave = async () => {
    if (!form.name.trim())      { setFormErr("Asset name is required."); return; }
    if (!form.asset_tag.trim()) { setFormErr("Asset tag is required.");  return; }
    if (!form.type)             { setFormErr("Type is required.");        return; }
    setSaving(true); setFormErr(null);
    try {
      const isEdit = !!editAsset;
      const url  = isEdit ? `${BASE_URL}/admin/assets/${editAsset.id}` : `${BASE_URL}/admin/assets`;
      const assignedToRaw = form.assigned_to;
      const assignedToNormalized = (() => {
        // Convert ""/whitespace/undefined -> null.
        if (assignedToRaw === null || assignedToRaw === undefined) return null;
        const s = String(assignedToRaw).trim();
        if (s === "") return null;
        // Reject NaN before it hits Laravel integer validation.
        const n = Number(s);
        return Number.isNaN(n) ? null : n;
      })();

      // Backend auto-resolves status based on assigned_to.
      // Ensure we never send an invalid status string.
      // Also avoid sending fields that don't exist in the DB schema (qr_code_value currently breaks update).
      const payload = {
        ...form,
        assigned_to: assignedToNormalized,
        status: assignedToNormalized ? "assigned" : (form.status || "unassigned"),
      };
      delete payload.qr_code_value;



      const res  = await fetch(url, {
        method:  isEdit ? "PUT" : "POST",
        headers: jsonHeaders(),
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        // Laravel returns { message: 'Validation failed', errors: { field: [msg] } }
        const validationErrors = data?.errors;
        if (validationErrors && typeof validationErrors === "object") {
          const firstField = Object.keys(validationErrors)[0];
          const firstMsg = Array.isArray(validationErrors[firstField])
            ? validationErrors[firstField][0]
            : String(validationErrors[firstField]);
          setFormErr(`Validation failed: ${firstField} ${firstMsg}`);
        } else {
          setFormErr(data.message || "Save failed.");
        }
        return;
      }

      setAssets(prev =>
        isEdit
          ? prev.map(a => a.id === editAsset.id ? data.asset : a)
          : [data.asset, ...prev]
      );
      setShowForm(false);
      flash(isEdit ? `"${data.asset.name}" updated successfully.` : `Asset "${data.asset.name}" created successfully.`);
    } catch { setFormErr("Network error — could not save."); }
    finally  { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets/${deleteTarget.id}`, {
        method: "DELETE", headers: auth(),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Delete failed."); return; }
      setAssets(prev => prev.filter(a => a.id !== deleteTarget.id));
      setDeleteTarget(null);
      flash(`"${deleteTarget.name}" deleted.`);
    } catch { alert("Network error."); }
    finally  { setDeleting(false); }
  };

  const handleAssign = async () => {
    if (!assignTarget) return;
    setAssigning(true);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets/${assignTarget.id}/assign`, {
        method:  "POST",
        headers: jsonHeaders(),
        body:    JSON.stringify({ user_id: assignUserId || null }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Assign failed."); return; }
      setAssets(prev => prev.map(a => a.id === assignTarget.id ? data.asset : a));
      setAssignTarget(null);
      flash(assignUserId ? `Asset assigned successfully.` : "Asset unassigned.");
    } catch { alert("Network error."); }
    finally  { setAssigning(false); }
  };

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const hasFilter = fType !== "all" || fStatus !== "all" || fDepartment !== "all" || search.trim();
  const clearFilters = () => {
    setFType("all"); setFStatus("all"); setFDepartment("all");
    setSearch(""); setPage(1);
  };

  // ── Stat cards (per spec) ──
  const CHIPS = [
    { key: "all",       label: "Total Assets", cls: "total",      count: summary.total     },
    { key: "assigned",  label: "Assigned",     cls: "assigned",   count: summary.assigned  },
    { key: "available", label: "Available",    cls: "available",  count: summary.available },
    { key: "repair",    label: "In Repair",    cls: "repair",     count: summary.repair    },
    { key: "retired",   label: "Retired",      cls: "retired",    count: summary.retired   },
  ];

  return (
    <div className="ast-page">

      {/* Success banner */}
      {successMsg && (
        <div className="ast-success-banner">
          <Icon d={IC.check} size={15} /> {successMsg}
          <button onClick={() => setSuccessMsg(null)}><Icon d={IC.close} size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="ast-header">
        <div>
          <h1 className="ast-title">Asset Management</h1>
          <p className="ast-subtitle">Track, assign, and manage company hardware assets</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={openCreate}>
          <Icon d={IC.plus} size={15} /> New Asset
        </button>
      </div>

      {/* Summary stat cards */}
      {!loading && !error && (
        <div className="ast-summary">
          {CHIPS.map(c => (
            <button key={c.key}
              className={`ast-chip ast-chip--${c.cls}${fStatus === c.key ? " active" : ""}`}
              onClick={() => { setFStatus(c.key); setPage(1); }}>
              <span className="ast-chip-count">{c.count}</span>
              <span className="ast-chip-label">{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="ast-toolbar">
        <div className="ast-search-wrap">
          <Icon d={IC.search} size={14} />
          <input className="ast-search"
            placeholder="Search by name, tag, or serial number…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button className="ast-search-clear" onClick={() => { setSearch(""); setPage(1); }}>
              <Icon d={IC.close} size={12} />
            </button>
          )}
        </div>
        <div className="ast-filters">
          <span className="ast-filter-ico"><Icon d={IC.filter} size={13} /></span>

          {/* Status filter — All Assets / Assigned / Available / Repair / Retired */}
          <select className="ast-select" value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }}>
            {CHIPS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>

          {/* Type filter — Laptop / Desktop / Printer / Monitor / Phone */}
          <select className="ast-select" value={fType} onChange={e => { setFType(e.target.value); setPage(1); }}>
            <option value="all">All Types</option>
            {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {/* Department filter — IT / HR / Finance */}
          <select className="ast-select" value={fDepartment} onChange={e => { setFDepartment(e.target.value); setPage(1); }}>
            <option value="all">All Departments</option>
            {DEPARTMENTS.map(d => <option key={d} value={d.toLowerCase()}>{d}</option>)}
          </select>

          {hasFilter && (
            <button className="ast-clear-btn" onClick={clearFilters}>
              <Icon d={IC.close} size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="ast-card">
        {loading ? (
          <div className="ast-state">Loading assets…</div>
        ) : error ? (
          <div className="ast-state ast-state--error"><Icon d={IC.warning} size={16} /> {error}</div>
        ) : filtered.length === 0 ? (
          <div className="ast-state ast-state--empty">
            <Icon d={IC.box} size={32} />
            <div className="ast-empty-title">No assets found</div>
            <p>Try adjusting your filters, or create the first asset.</p>
            {hasFilter && <button className="ast-clear-btn" style={{ marginTop: 8 }} onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : (
          <>
            <div className="ast-table-wrap">
              <table className="ast-table">
                <thead>
                  <tr>
                    <SortHeader col="tag" label="Tag" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <SortHeader col="name" label="Asset" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <th className="ast-th">Assigned To</th>
                    <SortHeader col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                    <th className="ast-th">Location</th>
                    <th className="ast-th ast-th--actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(a => {
                    const bucket = computeBucket(a);
                    const assigneeName = a.assigned_user?.name ?? a.assigned_user?.full_name ?? null;
                    return (
                      <tr key={a.id} className="ast-row">
                        <td>
                          <span className="ast-tag">{a.asset_tag ?? "—"}</span>
                        </td>
                        <td>
                          <div className="ast-name-cell">
                            <div className="ast-asset-icon">
                              <Icon d={IC.laptop} size={14} />
                            </div>
                            <div>
                              <div className="ast-asset-name">{a.name}</div>
                              <div className="ast-asset-sub">{a.brand} {a.model}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {assigneeName ? (
                            <div className="ast-assignee">
                              <div className="ast-assignee-avatar">{assigneeName[0]?.toUpperCase()}</div>
                              <span>{assigneeName}</span>
                            </div>
                          ) : (
                            <span className="ast-unassigned-text">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`ast-status-badge ast-status-badge--${BUCKET_CLS[bucket] ?? "available"}`}>
                            {BUCKET_LABEL[bucket]}
                          </span>
                        </td>
                        <td className="ast-muted">{a.location || "—"}</td>
                        <td>
                          <div className="ast-row-actions">
                            <button className="ast-icon-btn" title="View details"
                              onClick={() => navigate(`/admin/assets/${a.id}`)}>
                              <Icon d={IC.eye} size={14} />
                            </button>
                            <button className="ast-icon-btn" title="Edit"
                              onClick={() => openEdit(a)}>
                              <Icon d={IC.edit} size={14} />
                            </button>
                            <button className="ast-icon-btn" title="View QR code"
                              onClick={() => setQrAsset(a)}>
                              <Icon d={IC.qr} size={14} />
                            </button>
                            <button className="ast-icon-btn" title="Assign to user"
                              onClick={() => { setAssignTarget(a); setAssignUserId(String(a.assigned_to ?? "")); }}>
                              <Icon d={IC.assign} size={14} />
                            </button>
                            <button className="ast-icon-btn ast-icon-btn--danger" title="Delete"
                              onClick={() => setDeleteTarget(a)}>
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

            <div className="ast-pagination">
              <span className="ast-pg-info">
                {((safePage - 1) * PAGE_SIZE) + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="ast-pg-btns">
                <button className="ast-pg-btn" disabled={safePage <= 1} onClick={() => setPage(p => p - 1)}>
                  <Icon d={IC.chevronL} size={13} />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const p = totalPages <= 7 ? i + 1 : safePage <= 4 ? i + 1 : safePage >= totalPages - 3 ? totalPages - 6 + i : safePage - 3 + i;
                  return (
                    <button key={p} className={`ast-pg-btn${p === safePage ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                  );
                })}
                <button className="ast-pg-btn" disabled={safePage >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <Icon d={IC.chevronR} size={13} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══════ Create / Edit Modal ══════ */}
      {showForm && (
        <div className="ast-overlay" onClick={() => setShowForm(false)}>
          <div className="ast-modal ast-modal--large" onClick={e => e.stopPropagation()}>
            <div className="ast-modal-header">
              <div>
                <div className="ast-modal-title">{editAsset ? "Edit Asset" : "New Asset"}</div>
                <div className="ast-modal-sub">{editAsset ? `Editing ${editAsset.asset_tag}` : "Fill in the asset details below"}</div>
              </div>
              <button className="ast-modal-close" onClick={() => setShowForm(false)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>
            <div className="ast-modal-body">
              {formErr && (
                <div className="ast-form-error"><Icon d={IC.warning} size={14} /> {formErr}</div>
              )}

              {/* Row 1 — Name + Tag */}
              <div className="ast-form-grid">
                <div className="ast-field ast-field--wide">
                  <label className="ast-label">Asset Name <span className="ast-req">*</span></label>
                  <input className="ast-input"
                    placeholder="e.g. Dell Latitude 5440"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="ast-field">
                  <label className="ast-label">Asset Tag</label>
                  <input className="ast-input"
                    placeholder={editAsset ? form.asset_tag : "Auto-generated"}
                    value={editAsset ? form.asset_tag : ""}
                    readOnly={!!editAsset}
                    onChange={e => !editAsset && setForm(f => ({ ...f, asset_tag: e.target.value }))} />
                </div>
              </div>

              {/* Row 2 — Type + Brand + Model */}
              <div className="ast-form-grid ast-form-grid--3">
                <div className="ast-field">
                  <label className="ast-label">Type</label>
                  <select className="ast-select ast-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="ast-field">
                  <label className="ast-label">Brand</label>
                  <input className="ast-input" placeholder="e.g. Dell, HP"
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                </div>
                <div className="ast-field">
                  <label className="ast-label">Model</label>
                  <input className="ast-input" placeholder="e.g. Latitude 5440"
                    value={form.model}
                    onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                </div>
              </div>

              {/* Row 3 — Serial + Status + Condition */}
              <div className="ast-form-grid ast-form-grid--3">
                <div className="ast-field">
                  <label className="ast-label">Serial Number</label>
                  <input className="ast-input" placeholder="e.g. DL5440XYZ"
                    value={form.serial_number}
                    onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
                </div>
                <div className="ast-field">
                  <label className="ast-label">Status</label>
                  <select className="ast-select ast-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {ASSET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="ast-field">
                  <label className="ast-label">Condition</label>
                  <select className="ast-select ast-input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4 — Location + Department */}
              <div className="ast-form-grid">
                <div className="ast-field">
                  <label className="ast-label">Location</label>
                  <input className="ast-input" placeholder="e.g. IT Office, Floor 2"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="ast-field">
                  <label className="ast-label">Department</label>
                  <input className="ast-input" placeholder="e.g. Finance, HR"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                </div>
              </div>

              {/* Row 5 — Financial */}
              <div className="ast-form-grid ast-form-grid--3">
                <div className="ast-field">
                  <label className="ast-label">Purchase Date</label>
                  <input className="ast-input" type="date"
                    value={form.purchase_date}
                    onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
                </div>

                <div className="ast-field">
                  <label className="ast-label">Warranty Expires</label>
                  <input className="ast-input" type="date"
                    value={form.warranty_expiry}
                    onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} />
                </div>
              </div>

              {/* Row 6 — Assign + Notes */}
              <div className="ast-form-grid">
                <div className="ast-field">
                  <label className="ast-label">Assign To</label>
                  <select className="ast-select ast-input" value={form.assigned_to}
                    onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">— Unassigned —</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name ?? u.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="ast-field">
                  <label className="ast-label">Notes</label>
                  <input className="ast-input" placeholder="Any additional notes…"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>

              {/* Row 7 — QR + Audit Info (read-only) */}
              <div className="ast-form-section-label">QR &amp; Audit Info</div>
              <div className="ast-form-grid ast-form-grid--3">
                <div className="ast-field">
                  <label className="ast-label">
                    QR Code Value
                    <span className="ast-label-hint"> — override URL encoded in QR</span>
                  </label>
                  <input className="ast-input"
                    placeholder={editAsset ? (form.qr_code_value || "Auto-set on create") : "Auto-set after save"}
                    value={form.qr_code_value}
                    onChange={e => setForm(f => ({ ...f, qr_code_value: e.target.value }))} />
                </div>
                <div className="ast-field">
                  <label className="ast-label">
                    Created By
                    <span className="ast-label-hint"> — auto</span>
                  </label>
                  <input className="ast-input ast-input--readonly"
                    readOnly
                    value={(() => {
                      if (editAsset) {
                        const creator = users.find(u => String(u.id) === String(form.created_by));
                        return creator ? (creator.name ?? creator.full_name) : (form.created_by || "—");
                      }
                      const me = JSON.parse(localStorage.getItem("user") || "{}");
                      return me.full_name ?? me.username ?? "—";
                    })()}
                    title="Set automatically — not editable" />
                </div>
                <div className="ast-field">
                  <label className="ast-label">
                    Assigned Date
                    <span className="ast-label-hint"> — auto</span>
                  </label>
                  <input className="ast-input ast-input--readonly"
                    readOnly
                    value={form.assigned_at
                      ? new Date(form.assigned_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : form.assigned_to ? "Set on save" : "—"}
                    title="Set automatically when an assignee is chosen" />
                </div>
              </div>
            </div>
            <div className="ast-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editAsset ? "Save Changes" : "Create Asset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {qrAsset && (
        <div className="ast-overlay" onClick={() => setQrAsset(null)}>
          <div className="ast-modal ast-modal--qr" onClick={e => e.stopPropagation()}>
            <div className="ast-modal-header">
              <div>
                <div className="ast-modal-title">QR Code</div>
                <div className="ast-modal-sub">{qrAsset.name} · {qrAsset.asset_tag}</div>
              </div>
              <button className="ast-modal-close" onClick={() => setQrAsset(null)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>
            <div className="ast-qr-body">
              <div className="ast-qr-frame">
                <img src={qrAsset.qr_code_url ?? qrUrl(qrAsset.asset_tag, 220)}
                  alt={`QR code for ${qrAsset.asset_tag}`}
                  width={220} height={220}
                  onError={e => { e.target.src = qrUrl(qrAsset.asset_tag, 220); }} />
              </div>
              <div className="ast-qr-info">
                <div className="ast-qr-tag">{qrAsset.asset_tag}</div>
                <div className="ast-qr-name">{qrAsset.name}</div>
                <div className="ast-qr-type">{qrAsset.type} · {qrAsset.brand} {qrAsset.model}</div>
              </div>
              <div className="ast-qr-actions">
                <a
                  className="adm-btn adm-btn--primary"
                  href={qrAsset.qr_code_url ?? qrUrl(qrAsset.asset_tag, 400)}
                  download={`${qrAsset.asset_tag}-qr.png`}
                  target="_blank" rel="noopener noreferrer"
                >
                  Download QR
                </a>
                <button className="adm-btn adm-btn--ghost"
                  onClick={() => { setQrAsset(null); navigate(`/admin/assets/${qrAsset.id}`); }}>
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assignTarget && (
        <div className="ast-overlay" onClick={() => setAssignTarget(null)}>
          <div className="ast-modal ast-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="ast-modal-header">
              <div>
                <div className="ast-modal-title">Assign Asset</div>
                <div className="ast-modal-sub">{assignTarget.name} · {assignTarget.asset_tag}</div>
              </div>
              <button className="ast-modal-close" onClick={() => setAssignTarget(null)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>
            <div className="ast-modal-body">
              <div className="ast-field">
                <label className="ast-label">Assign to</label>
                <select className="ast-select ast-input" value={assignUserId}
                  onChange={e => setAssignUserId(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name ?? u.full_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="ast-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setAssignTarget(null)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={handleAssign} disabled={assigning}>
                {assigning ? "Saving…" : "Confirm Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <div className="ast-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="ast-modal ast-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="ast-delete-body">
              <div className="ast-delete-icon"><Icon d={IC.trash} size={26} /></div>
              <div className="ast-delete-title">Delete "{deleteTarget.name}"?</div>
              <div className="ast-delete-sub">
                This will permanently remove <strong>{deleteTarget.asset_tag}</strong> and all its history. This cannot be undone.
              </div>
            </div>
            <div className="ast-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="adm-btn adm-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete Asset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}