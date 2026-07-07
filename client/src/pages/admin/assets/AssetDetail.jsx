import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AssetDetail.css";

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  back:     "M19 12H5M12 19l-7-7 7-7",
  edit:     "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:    "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  qr:       "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M17 17h3v3h-3z",
  print:    "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  assign:   "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  check:    "M20 6L9 17l-5-5",
  warning:  "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  close:    "M18 6L6 18M6 6l12 12",
  clock:    "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  ticket:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  mapPin:   "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
  building: "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  dollar:   "M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6",
  hash:     "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  calendar: "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4M8 2v4M3 10h18",
  laptop:   "M2 20h20M4 20V8a2 2 0 012-2h12a2 2 0 012 2v12",
};

const BASE_URL = "http://127.0.0.1:8000/api";
const QR_API   = "https://api.qrserver.com/v1/create-qr-code";

const ASSET_TYPES    = ["Laptop","Desktop","Monitor","Phone","Tablet","Printer","Server","Network Equipment","Headset","Camera","UPS","Other"];
const ASSET_STATUSES = ["Active","Unassigned","In Repair","Retired"];
const CONDITIONS     = ["New","Good","Fair","Damaged"];

const BRANDS = [
  "Apple", "Dell", "HP", "Lenovo", "Asus", "Acer",
  "Microsoft", "Samsung", "LG", "Sony", "Logitech",
  "Cisco", "TP-Link", "Canon", "Epson", "Brother",
  "Razer", "MSI", "Other"
];

const LOCATIONS = [
  "HQ – Floor 1", "HQ – Floor 2", "HQ – Floor 3",
  "Branch Office – Downtown", "Branch Office – North",
  "Remote", "Storage Room", "Data Center",
  "Meeting Room A", "Meeting Room B", "Reception",
  "IT Department", "Other"
];

const DEPARTMENTS = [
  "IT", "Engineering", "HR", "Finance", "Marketing",
  "Sales", "Operations", "Customer Support", "Legal",
  "Administration", "Other"
];

const NOTES_OPTIONS = [
  "Standard issue", "Replacement device", "Loaner unit",
  "Awaiting repair", "Returned to vendor",
  "Reserved for employee onboarding", "High-value item",
  "Warranty registered", "Tagged and catalogued", "Other"
];

const STATUS_CLS = {
  "active": "active", "unassigned": "available", "in repair": "repair", "retired": "retired"
};

// ── Bucket logic (same as AssetManagement) ──
const computeBucket = (asset) => {
  if (asset.assigned_to) return "assigned";
  const s = String(asset.status ?? "").toLowerCase();
  if (s === "in_repair" || s === "in repair") return "repair";
  if (s === "retired" || s === "disposed")    return "retired";
  return "available";
};

const BUCKET_LABEL = {
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

const formatDate = v => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
};
const formatDateShort = v => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};
const formatCurrency = v => v != null && v !== "" ? `$${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

const qrUrl = (tag, size = 240) =>
  `${QR_API}/?size=${size}x${size}&data=${encodeURIComponent(`TICKORA:ASSET:${tag}`)}&color=03363d&bgcolor=d4f265&qzone=1`;

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ── Data ──
  const [asset,   setAsset]   = useState(null);
  const [history, setHistory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(null);

  // ── Edit state ──
  const [editing, setEditing] = useState(false);
  const [form,    setForm]    = useState({});
  const [saving,  setSaving]  = useState(false);
  const [formErr, setFormErr] = useState(null);

  // ── Assign modal ──
  const [showAssign,   setShowAssign]   = useState(false);
  const [assignUserId, setAssignUserId] = useState("");
  const [assigning,    setAssigning]    = useState(false);

  // ── Delete confirm ──
  const [showDelete, setShowDelete] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  // ── Create Ticket ──
  const [showTicket,    setShowTicket]    = useState(false);
  const [ticketForm,    setTicketForm]    = useState({ title: "", description: "", priority: "Medium" });
  const [creatingTicket,setCreatingTicket]= useState(false);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found");
      return { Accept: "application/json" };
    }
    return {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
  }, []);

  const getJsonHeaders = useCallback(() => ({
    ...getAuthHeaders(),
    "Content-Type": "application/json",
  }), [getAuthHeaders]);

  const loadAll = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets/${id}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Asset not found."); return; }
      setAsset(data.asset ?? data);
      setHistory(data.history ?? []);
      setTickets(data.tickets ?? []);
    } catch { setError("Network error."); }
    finally   { setLoading(false); }
  }, [getAuthHeaders, id]);

  const loadUsers = useCallback(async () => {
    try {
      const res  = await fetch(`${BASE_URL}/users`, { headers: getAuthHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data.users ?? data) ? (data.users ?? data) : []);
    } catch { /* ignore */ }
  }, [getAuthHeaders]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      loadAll();
      loadUsers();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadAll, loadUsers]);

  // ── Edit ──
  const openEdit = () => {
    setForm({
      name:           asset.name           ?? "",
      asset_tag:      asset.asset_tag      ?? "",
      type:           asset.type           ?? "Laptop",
      brand:          asset.brand          ?? "",
      model:          asset.model          ?? "",
      serial_number:  asset.serial_number  ?? "",
      status:         asset.status         ?? "Unassigned",
      condition:      asset.condition      ?? "Good",
      location:       asset.location       ?? "",
      department:     asset.department     ?? "",
      assigned_to:    String(asset.assigned_to ?? ""),
      purchase_date:  asset.purchase_date  ? asset.purchase_date.slice(0,10) : "",
      purchase_price: asset.purchase_price ?? "",
      warranty_expiry:asset.warranty_expiry? asset.warranty_expiry.slice(0,10) : "",
      notes:          asset.notes          ?? "",
    });
    setFormErr(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.name.trim())      { setFormErr("Asset Name is required.");      return; }
    if (!form.type)             { setFormErr("Type is required.");             return; }
    if (!form.status)           { setFormErr("Status is required.");           return; }
    if (!form.condition)        { setFormErr("Condition is required.");        return; }
    if (!form.department)       { setFormErr("Department is required.");       return; }
    if (!form.location)         { setFormErr("Location is required.");         return; }

    setSaving(true); setFormErr(null);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets/${id}`, {
        method: "PUT", headers: getJsonHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormErr(data.message || "Save failed."); return; }
      setAsset(data.asset ?? { ...asset, ...form });
      setEditing(false);
      flash("Asset updated successfully.");
    } catch { setFormErr("Network error."); }
    finally  { setSaving(false); }
  };

  // ── Assign ──
  const handleAssign = async () => {
    setAssigning(true);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets/${id}/assign`, {
        method: "POST", headers: getJsonHeaders(),
        body: JSON.stringify({ user_id: assignUserId || null }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Assign failed."); return; }
      setAsset(data.asset ?? { ...asset, assigned_to: assignUserId || null, assigned_user: data.user ?? null });
      setHistory(data.history ?? history);
      setShowAssign(false);
      flash(assignUserId ? "Asset assigned successfully." : "Asset unassigned.");
    } catch { alert("Network error."); }
    finally  { setAssigning(false); }
  };

  // ── Delete ──
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res  = await fetch(`${BASE_URL}/admin/assets/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Delete failed."); setDeleting(false); return; }
      navigate("/admin/assets", { replace: true });
    } catch { alert("Network error."); setDeleting(false); }
  };

  // ── Create Ticket ──
  const openCreateTicket = () => {
    setTicketForm({
      title: `Issue with ${asset.name} (${asset.asset_tag})`,
      description: "",
      priority: "Medium",
    });
    setShowTicket(true);
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.title.trim()) { alert("Ticket title is required."); return; }
    setCreatingTicket(true);
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: getJsonHeaders(),
        body: JSON.stringify({
          ...ticketForm,
          asset_id: asset.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Failed to create ticket."); return; }
      setShowTicket(false);
      flash("Ticket created successfully.");
      if (data.ticket?.id) {
        setTimeout(() => navigate(`/admin/tickets/${data.ticket.id}`), 800);
      }
    } catch { alert("Network error."); }
    finally { setCreatingTicket(false); }
  };

  const flash = msg => { setSuccess(msg); setTimeout(() => setSuccess(null), 4000); };

  // ── Print label ──
  const handlePrint = () => {
    const win = window.open("", "_blank");
    const qr  = qrUrl(asset.asset_tag, 200);
    win.document.write(`
      <html><head><title>Asset Label — ${asset.asset_tag}</title>
      <style>
        body { font-family: 'DM Sans', sans-serif; margin: 0; padding: 20px; background: #fff; }
        .label { display: flex; gap: 20px; align-items: center; border: 2px solid #03363d; border-radius: 12px; padding: 20px; max-width: 380px; }
        .qr img { width: 120px; height: 120px; }
        .info { flex: 1; }
        .tag { font-family: 'Sora', sans-serif; font-size: 18px; font-weight: 700; color: #03363d; background: #d4f265; padding: 4px 10px; border-radius: 6px; display: inline-block; margin-bottom: 8px; }
        .name { font-size: 15px; font-weight: 700; color: #0f2f33; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #607a7e; line-height: 1.5; }
      </style></head><body>
      <div class="label">
        <div class="qr"><img src="${qr}" /></div>
        <div class="info">
          <div class="tag">${asset.asset_tag}</div>
          <div class="name">${asset.name}</div>
          <div class="meta">
            ${asset.brand ? asset.brand + " " : ""}${asset.model ?? ""}<br>
            ${asset.serial_number ? "S/N: " + asset.serial_number : ""}<br>
            ${asset.location ?? ""}
          </div>
        </div>
      </div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `);
    win.document.close();
  };

  // ── Download QR ──
  const handleDownloadQr = async () => {
    try {
      const res = await fetch(`${BASE_URL}/admin/assets/${id}/qr/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement("a");
        a.href     = url;
        a.download = `${asset.asset_tag}-qr.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {}
    // Fallback
    const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(asset.qr_code_value || `TICKORA:ASSET:${asset.asset_tag}`)}&color=03363d&bgcolor=d4f265&qzone=1`;
    const a = document.createElement("a");
    a.href     = fallbackUrl;
    a.download = `${asset.asset_tag}-qr.png`;
    a.target   = "_blank";
    a.rel      = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // ── Warranty status ──
  const warrantyStatus = () => {
    if (!asset?.warranty_expiry) return null;
    const exp  = new Date(asset.warranty_expiry);
    const now  = new Date();
    const days = Math.ceil((exp - now) / 86400000);
    if (days < 0)   return { cls: "expired",  label: "Expired " + formatDateShort(asset.warranty_expiry) };
    if (days < 30)  return { cls: "expiring", label: `Expires in ${days} days` };
    return { cls: "valid", label: `Valid until ${formatDateShort(asset.warranty_expiry)}` };
  };

  // ── Render ──
  if (loading) return (
    <div className="asd-page">
      <div className="asd-loading">
        <div className="asd-spinner" />
        Loading asset…
      </div>
    </div>
  );

  if (error || !asset) return (
    <div className="asd-page">
      <div className="asd-header">
        <button className="adm-btn adm-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> Back
        </button>
      </div>
      <div className="asd-error"><Icon d={IC.warning} size={18} /> {error || "Asset not found."}</div>
    </div>
  );

  const assigneeName = asset.assigned_user?.name ?? asset.assigned_user?.full_name ?? null;
  const warranty     = warrantyStatus();
  const bucket       = computeBucket(asset);

  return (
    <div className="asd-page">

      {success && (
        <div className="asd-success-banner">
          <Icon d={IC.check} size={15} /> {success}
          <button onClick={() => setSuccess(null)}><Icon d={IC.close} size={13} /></button>
        </div>
      )}

      {/* Header */}
      <div className="asd-header">
        <button className="adm-btn adm-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> Back to Assets
        </button>
        <div className="asd-header-actions">
          <button className="adm-btn adm-btn--ghost" onClick={handlePrint} title="Print label">
            <Icon d={IC.print} size={14} /> Print Label
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={() => { setShowAssign(true); setAssignUserId(String(asset.assigned_to ?? "")); }}>
            <Icon d={IC.assign} size={14} /> Assign
          </button>
          <button className="adm-btn adm-btn--ghost" onClick={openEdit}>
            <Icon d={IC.edit} size={14} /> Edit
          </button>
          <button className="adm-btn adm-btn--danger" onClick={() => setShowDelete(true)} title="Delete asset">
            <Icon d={IC.trash} size={14} />
          </button>
        </div>
      </div>

      {/* ══════ HERO — Asset Name + Tag + QR ══════ */}
      <div className="asd-hero">
        <div className="asd-hero-left">
          <span className={`asd-status-badge asd-status-badge--${BUCKET_CLS[bucket] ?? "available"}`}>
            {BUCKET_LABEL[bucket]}
          </span>
          <h1 className="asd-hero-name">{asset.name}</h1>
          <div className="asd-hero-tag">
            <Icon d={IC.tag} size={14} />
            <span>{asset.asset_tag}</span>
          </div>
        </div>
        <div className="asd-hero-right">
          <div className="asd-hero-qr-wrap">
            <img
              src={asset.qr_code_url ?? qrUrl(asset.asset_tag, 200)}
              alt={`QR for ${asset.asset_tag}`}
              className="asd-hero-qr"
              onError={e => { e.target.src = qrUrl(asset.asset_tag, 200); }}
            />
          </div>
        </div>
      </div>

      {/* ══════ Section 1: Asset Information ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">Asset Information</h3>
        <div className="asd-info-grid">
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--blue"><Icon d={IC.tag} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Asset Name</div>
              <div className="asd-info-value">{asset.name || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--blue"><Icon d={IC.hash} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Asset Tag</div>
              <div className="asd-info-value asd-info-value--mono">{asset.asset_tag || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--blue"><Icon d={IC.laptop} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Type</div>
              <div className="asd-info-value">{asset.type || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--gray"><Icon d={IC.building} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Brand</div>
              <div className="asd-info-value">{asset.brand || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--gray"><Icon d={IC.laptop} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Model</div>
              <div className="asd-info-value">{asset.model || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--gray"><Icon d={IC.hash} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Serial Number</div>
              <div className="asd-info-value asd-info-value--mono">{asset.serial_number || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ Section 2: Assignment ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">Assignment</h3>
        <div className="asd-info-grid">
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--blue"><Icon d={IC.user} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Assigned To</div>
              <div className="asd-info-value">{assigneeName || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--purple"><Icon d={IC.building} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Department</div>
              <div className="asd-info-value">{asset.department || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--teal"><Icon d={IC.calendar} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Assigned Date</div>
              <div className="asd-info-value">{asset.assigned_at ? formatDate(asset.assigned_at) : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ Section 3: Status ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">Status</h3>
        <div className="asd-info-grid">
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--green"><Icon d={IC.check} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Status</div>
              <div className="asd-info-value">
                <span className={`asd-status-badge asd-status-badge--${BUCKET_CLS[bucket] ?? "available"}`}>
                  {BUCKET_LABEL[bucket]}
                </span>
              </div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--orange"><Icon d={IC.shield} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Condition</div>
              <div className="asd-info-value">{asset.condition || "—"}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--green"><Icon d={IC.mapPin} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Location</div>
              <div className="asd-info-value">{asset.location || "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ Section 4: Warranty ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">Warranty</h3>
        <div className="asd-info-grid">
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--teal"><Icon d={IC.calendar} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Purchase Date</div>
              <div className="asd-info-value">{formatDate(asset.purchase_date)}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--green"><Icon d={IC.shield} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Warranty Expires</div>
              <div className="asd-info-value">{formatDate(asset.warranty_expiry)}</div>
            </div>
          </div>
          <div className="asd-info-card">
            <div className="asd-info-icon asd-info-icon--purple"><Icon d={IC.dollar} size={18} /></div>
            <div className="asd-info-content">
              <div className="asd-info-label">Purchase Price</div>
              <div className="asd-info-value">{formatCurrency(asset.purchase_price)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════ Section 5: Notes ══════ */}
      {asset.notes && (
        <div className="asd-section">
          <h3 className="asd-section-title">Notes</h3>
          <div className="asd-notes-card">{asset.notes}</div>
        </div>
      )}

      {/* ══════ Section 6: QR Code ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">QR Code</h3>
        <div className="asd-qr-card">
          <div className="asd-qr-image-wrap">
            <img
              src={asset.qr_code_url ?? qrUrl(asset.asset_tag, 300)}
              alt={`QR for ${asset.asset_tag}`}
              className="asd-qr-image"
              onError={e => { e.target.src = qrUrl(asset.asset_tag, 300); }}
            />
          </div>
          <div className="asd-qr-tag-label">{asset.asset_tag}</div>
          <div className="asd-qr-actions">
            <button className="asd-action-btn" onClick={handleDownloadQr}>
              <div className="asd-action-icon asd-action-icon--green">
                <Icon d={IC.download} size={16} />
              </div>
              <span>Download QR</span>
            </button>
            <button className="asd-action-btn" onClick={handlePrint}>
              <div className="asd-action-icon asd-action-icon--purple">
                <Icon d={IC.print} size={16} />
              </div>
              <span>Print QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════ Section 7: Quick Actions ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">Quick Actions</h3>
        <div className="asd-actions">
          <button className="asd-action-btn" onClick={openCreateTicket}>
            <div className="asd-action-icon asd-action-icon--orange">
              <Icon d={IC.ticket} size={18} />
            </div>
            <span>Create Ticket</span>
          </button>
          <button className="asd-action-btn" onClick={() => { setShowAssign(true); setAssignUserId(String(asset.assigned_to ?? "")); }}>
            <div className="asd-action-icon asd-action-icon--blue">
              <Icon d={IC.assign} size={18} />
            </div>
            <span>Reassign</span>
          </button>
        </div>
      </div>

      {/* ══════ Section 8: Ticket History ══════ */}
      <div className="asd-section">
        <h3 className="asd-section-title">
          Ticket History
          <span className="asd-card-count">{tickets.length}</span>
        </h3>
        {tickets.length === 0 ? (
          <div className="asd-empty">
            <Icon d={IC.ticket} size={20} />
            No tickets linked to this asset yet.
          </div>
        ) : (
          <div className="asd-card">
            <div className="asd-ticket-list">
              {tickets.map(t => (
                <div className="asd-ticket-row" key={t.id}>
                  <span className="asd-ticket-tag">{t.ticket_number}</span>
                  <span className="asd-ticket-title">{t.title}</span>
                  <span className={`asd-ticket-status asd-ticket-status--${String(t.status?.status_name ?? "").toLowerCase().replace(/\s+/g,"-")}`}>
                    {t.status?.status_name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History timeline */}
      {history.length > 0 && (
        <div className="asd-section">
          <h3 className="asd-section-title">
            Asset History
            <span className="asd-card-count">{history.length}</span>
          </h3>
          <div className="asd-card">
            <div className="asd-timeline">
              {history.map((h, i) => (
                <div className="asd-timeline-item" key={h.id ?? i}>
                  <div className="asd-timeline-spine">
                    <div className={`asd-timeline-dot asd-timeline-dot--${h.type ?? "update"}`} />
                    {i < history.length - 1 && <div className="asd-timeline-line" />}
                  </div>
                  <div className="asd-timeline-content">
                    <div className="asd-timeline-event">{h.event}</div>
                    <div className="asd-timeline-meta">{h.actor} · {h.time}</div>
                    {h.note && <div className="asd-timeline-note">"{h.note}"</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════ Edit Modal ══════ */}
      {editing && (
        <div className="asd-overlay" onClick={() => setEditing(false)}>
          <div className="asd-modal" onClick={e => e.stopPropagation()}>
            <div className="asd-modal-header">
              <div>
                <div className="asd-modal-title">Edit Asset</div>
                <div className="asd-modal-sub">{asset.asset_tag}</div>
              </div>
              <button className="asd-modal-close" onClick={() => setEditing(false)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>
            <div className="asd-modal-body">
              {formErr && <div className="asd-form-error"><Icon d={IC.warning} size={14} /> {formErr}</div>}

              <div className="asd-form-section-label">Basic Information</div>
              <div className="asd-form-grid">
                <div className="asd-field asd-field--wide">
                  <label className="asd-label">Asset Name <span className="asd-req">*</span></label>
                  <input className="asd-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="asd-field">
                  <label className="asd-label">Asset Tag <span className="asd-req">*</span></label>
                  <input className="asd-input" value={form.asset_tag} onChange={e => setForm(f => ({ ...f, asset_tag: e.target.value }))} />
                </div>
              </div>

              <div className="asd-form-grid asd-form-grid--3">
                <div className="asd-field">
                  <label className="asd-label">Type <span className="asd-req">*</span></label>
                  <select className="asd-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="asd-field">
                  <label className="asd-label">Brand</label>
                  <select className="asd-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}>
                    <option value="">— Select Brand —</option>
                    {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="asd-field">
                  <label className="asd-label">Model</label>
                  <input className="asd-input" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} />
                </div>
              </div>

              <div className="asd-form-grid asd-form-grid--3">
                <div className="asd-field">
                  <label className="asd-label">Serial Number</label>
                  <input className="asd-input" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
                </div>
                <div className="asd-field">
                  <label className="asd-label">Status <span className="asd-req">*</span></label>
                  <select className="asd-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {ASSET_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="asd-field">
                  <label className="asd-label">Condition <span className="asd-req">*</span></label>
                  <select className="asd-input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}>
                    {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="asd-form-section-label">Location & Assignment</div>
              <div className="asd-form-grid">
                <div className="asd-field">
                  <label className="asd-label">Location <span className="asd-req">*</span></label>
                  <select className="asd-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                    <option value="">— Select Location —</option>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="asd-field">
                  <label className="asd-label">Department <span className="asd-req">*</span></label>
                  <select className="asd-input" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    <option value="">— Select Department —</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="asd-form-grid">
                <div className="asd-field">
                  <label className="asd-label">Assigned To <span className="asd-req">*</span></label>
                  <select className="asd-input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">— Unassigned —</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name ?? u.full_name}</option>)}
                  </select>
                </div>
                <div className="asd-field">
                  <label className="asd-label">Notes</label>
                  <select className="asd-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}>
                    <option value="">— Select Note —</option>
                    {NOTES_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="asd-form-section-label">Financial & Warranty</div>
              <div className="asd-form-grid asd-form-grid--3">
                <div className="asd-field">
                  <label className="asd-label">Purchase Date</label>
                  <input className="asd-input" type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} />
                </div>
                <div className="asd-field">
                  <label className="asd-label">Purchase Price ($)</label>
                  <input className="asd-input" type="number" min="0" step="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} />
                </div>
                <div className="asd-field">
                  <label className="asd-label">Warranty Expires</label>
                  <input className="asd-input" type="date" value={form.warranty_expiry} onChange={e => setForm(f => ({ ...f, warranty_expiry: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="asd-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssign && (
        <div className="asd-overlay" onClick={() => setShowAssign(false)}>
          <div className="asd-modal asd-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="asd-modal-header">
              <div>
                <div className="asd-modal-title">Assign Asset</div>
                <div className="asd-modal-sub">{asset.asset_tag} · {asset.name}</div>
              </div>
              <button className="asd-modal-close" onClick={() => setShowAssign(false)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>
            <div className="asd-modal-body">
              <div className="asd-field">
                <label className="asd-label">Assign to</label>
                <select className="asd-input" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name ?? u.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="asd-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={handleAssign} disabled={assigning}>
                {assigning ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showTicket && (
        <div className="asd-overlay" onClick={() => setShowTicket(false)}>
          <div className="asd-modal" onClick={e => e.stopPropagation()}>
            <div className="asd-modal-header">
              <div>
                <div className="asd-modal-title">Create Ticket for Asset</div>
                <div className="asd-modal-sub">{asset.asset_tag} · {asset.name}</div>
              </div>
              <button className="asd-modal-close" onClick={() => setShowTicket(false)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>
            <div className="asd-modal-body">
              <div className="asd-form-grid">
                <div className="asd-field asd-field--wide">
                  <label className="asd-label">Title <span className="asd-req">*</span></label>
                  <input className="asd-input" value={ticketForm.title} onChange={e => setTicketForm(t => ({ ...t, title: e.target.value }))} />
                </div>
                <div className="asd-field">
                  <label className="asd-label">Priority</label>
                  <select className="asd-input" value={ticketForm.priority} onChange={e => setTicketForm(t => ({ ...t, priority: e.target.value }))}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>
              <div className="asd-field" style={{ marginTop: 14 }}>
                <label className="asd-label">Description</label>
                <textarea
                  className="asd-input"
                  rows={4}
                  placeholder="Describe the issue with this asset..."
                  value={ticketForm.description}
                  onChange={e => setTicketForm(t => ({ ...t, description: e.target.value }))}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div className="asd-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowTicket(false)}>Cancel</button>
              <button className="adm-btn adm-btn--primary" onClick={handleCreateTicket} disabled={creatingTicket}>
                {creatingTicket ? "Creating…" : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDelete && (
        <div className="asd-overlay" onClick={() => setShowDelete(false)}>
          <div className="asd-modal asd-modal--sm" onClick={e => e.stopPropagation()}>
            <div className="asd-delete-body">
              <div className="asd-delete-icon"><Icon d={IC.trash} size={26} /></div>
              <div className="asd-delete-title">Delete "{asset.name}"?</div>
              <div className="asd-delete-sub">
                This will permanently remove <strong>{asset.asset_tag}</strong>, all its history, and any linked ticket associations. This cannot be undone.
              </div>
            </div>
            <div className="asd-modal-footer">
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowDelete(false)}>Cancel</button>
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