import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./AssetDetails.css";

const BASE_URL = "http://127.0.0.1:8000/api";

const Icon = ({ d, size = 16, strokeWidth = 1.8 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  arrowLeft:  "M19 12H5M12 19l-7-7 7-7",
  download:   "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3",
  print:      "M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z",
  warning:    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  close:      "M18 6L6 18M6 6l12 12",
  check:      "M20 6L9 17l-5-5",
  info:       "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  user:       "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  building:   "M3 21h18M5 21V7l8-4v18M19 21V11l-6-4",
  mapPin:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 13a3 3 0 100-6 3 3 0 000 6z",
  tag:        "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  qr:         "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M17 17h3v3h-3z",
  shield:     "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  laptop:     "M2 20h20M4 20V8a2 2 0 012-2h12a2 2 0 012 2v12",
  hash:       "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  calendar:   "M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z M16 2v4M8 2v4M3 10h18",
  clock:      "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  ticket:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  plus:       "M12 5v14M5 12h14",
  refresh:    "M21 2v6h-6 M3 22v-6h6 M20.49 9A9 9 0 005.64 5.64L3 8 M3.51 15A9 9 0 0018.36 18.36L21 16",
  external:   "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3",
};

const QR_SERVER = "https://api.qrserver.com/v1/create-qr-code";
const qrUrlFromValue = (value, size = 300) =>
  `${QR_SERVER}/?size=${size}x${size}&data=${encodeURIComponent(value)}&color=03363d&bgcolor=d4f265&qzone=1`;

export default function AssetDetails() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category_id: "",
    priority_id: "",
    priority: "medium",
  });
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const run = async () => {
      if (!reportOpen) return;
      if (categories.length > 0) return;
      try {
        const res = await fetch(`${BASE_URL}/categories`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json().catch(() => []);
        if (!res.ok) return;
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setCategories(list);
      } catch {
        // ignore
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportOpen]);

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAssetDetails = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/assets/${id}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(t("assetDetails.loadError", "Failed to load asset details or access denied."));
      const data = await res.json();
      const payload = data?.data ?? data?.asset ?? (Array.isArray(data?.assets) ? data.assets[0] : null) ?? data;
      setAsset(payload);
      if (isRefresh) {
        showToast(t("assetDetails.toast.refreshed", "Asset details refreshed."), "success");
      }
    } catch (err) {
      setError(err.message || t("assetDetails.loadErrorGeneric", "Unable to load asset details"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token, t]);

  useEffect(() => {
    const t = setTimeout(() => { void fetchAssetDetails(); }, 0);
    return () => clearTimeout(t);
  }, [fetchAssetDetails]);

  // Localized helpers
  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const formatDateTime = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const daysUntil = (dateStr) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    const today = new Date();
    return Math.ceil((target - today) / 86400000);
  };

  const warrantyStatus = (warrantyExpiry) => {
    const days = daysUntil(warrantyExpiry);
    if (days === null) return null;
    if (days < 0)   return { cls: "expired",  label: t("assetDetails.warrantyExpired", "Expired") };
    if (days <= 30) return { cls: "expiring", label: t("assetDetails.warrantyDaysLeft", "{{n}}d left", { n: days }) };
    return { cls: "valid", label: t("assetDetails.warrantyActive", "Active") };
  };

  const normalizeStatus = (status) => {
    const s = String(status ?? "").toLowerCase();
    if (s === "in_repair" || s === "in repair") return "in_repair";
    if (s === "retired")   return "retired";
    if (s === "assigned")  return "assigned";
    if (s === "unassigned") return "unassigned";
    if (s === "lost")      return "lost";
    return "unassigned";
  };

  // Localized status labels
  const STATUS_LABEL = {
    assigned:  t("assetDetails.statusAssigned",  "Assigned"),
    unassigned: t("assetDetails.statusAvailable", "Available"),
    available: t("assetDetails.statusAvailable", "Available"),
    in_repair: t("assetDetails.statusRepair",    "In Repair"),
    retired:   t("assetDetails.statusRetired",   "Retired"),
    lost:      t("assetDetails.statusLost",      "Lost"),
  };

  const handleDownloadQr = async () => {
    try {
      const assetTag = asset?.asset_tag || asset?.asset_code || "asset";
      const res = await fetch(`${BASE_URL}/assets/${id}/qr/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "image/png" },
      });
      if (!res.ok) throw new Error(t("assetDetails.qrDownloadFailed", "QR download failed"));

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${assetTag}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast(t("assetDetails.toast.qrDownloaded", "QR Code downloaded successfully."), "success");
    } catch {
      // Fallback: direct storage image
      try {
        if (asset?.qr_code_path) {
          const assetTag = asset.asset_tag || asset.asset_code || "asset";
          const directUrl = `http://127.0.0.1:8000/storage/${asset.qr_code_path}`;
          const a = document.createElement("a");
          a.href = directUrl;
          a.download = `${assetTag}-qr.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          showToast(t("assetDetails.toast.qrDownloaded", "QR Code downloaded."), "success");
          return;
        }
      } catch { /* ignore */ }
      showToast(t("assetDetails.toast.qrDownloadFailed", "QR download failed. Please try again."), "error");
    }
  };

  const handlePrintQr = async () => {
    try {
      const win = window.open("", "_blank");
      if (!win) {
        showToast(t("assetDetails.toast.popupBlocked", "Popup blocked. Please allow popups to print."), "error");
        return;
      }
      const res = await fetch(`${BASE_URL}/assets/${id}/qr/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "image/png" },
      });
      if (!res.ok) throw new Error(t("assetDetails.qrPrintFailed", "QR print failed"));

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const assetCode = asset?.asset_code || asset?.asset_tag || "asset";
      const assetTag = asset?.asset_tag || asset?.asset_code || "";
      const assetName = asset?.asset_name || "";
      const meta = `${asset?.manufacturer || asset?.brand || ""} ${asset?.model || ""}`.trim();

      win.document.write(`
        <!doctype html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Asset Label — ${assetCode}</title>
            <style>
              * { box-sizing: border-box; }
              @page { margin: 0; }
              body {
                font-family: -apple-system, "Segoe UI", Arial, sans-serif;
                margin: 0; padding: 32px; background: #fff;
                display: flex; justify-content: center; align-items: center; min-height: 100vh;
              }
              .label {
                width: 320px;
                border: 2px solid #03363d;
                border-radius: 14px;
                padding: 24px;
                text-align: center;
                background: #fff;
              }
              .tag {
                font-weight: 800; font-size: 18px;
                color: #03363d; background: #d4f265;
                padding: 6px 14px; border-radius: 8px;
                display: inline-block; margin-bottom: 10px;
                letter-spacing: 0.04em;
              }
              .name { font-weight: 700; color: #2f3e4e; margin-bottom: 4px; font-size: 15px; }
              .meta { color: #5b6b7e; font-size: 12px; margin-bottom: 14px; }
              .qr-wrap {
                padding: 12px; background: #f6f7f9;
                border-radius: 10px; display: inline-block;
              }
              img { width: 200px; height: 200px; display: block; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="tag">${assetTag}</div>
              <div class="name">${assetName}</div>
              <div class="meta">${meta}</div>
              <div class="qr-wrap"><img id="qr-img" src="${url}" /></div>
            </div>
            <script>
              (function () {
                const img = document.getElementById('qr-img');
                const cleanup = function () {
                  try { URL.revokeObjectURL('${url}'); } catch (e) {}
                };
                const doPrint = function () {
                  try { window.focus(); } catch (e) {}
                  window.print();
                  setTimeout(function () {
                    try { window.close(); } catch (e) {}
                    cleanup();
                  }, 600);
                };
                img.onload = function () { doPrint(); };
                img.onerror = function () { doPrint(); };
                setTimeout(doPrint, 1200);
              })();
            </script>
          </body>
        </html>
      `);
      win.document.close();
    } catch {
      showToast(t("assetDetails.toast.qrPrintFailed", "QR print failed. Please try again."), "error");
    }
  };

  const openReportModal = () => {
    setForm({
      title: "",
      description: "",
      category_id: "",
      priority_id: "",
      priority: "medium",
    });
    setFormErr(null);
    setReportOpen(true);
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormErr(t("assetDetails.reportForm.titleRequired", "Please provide a title for the issue."));
      return;
    }
    const priorityMap = { low: 1, medium: 2, high: 3, urgent: 4 };
    const mappedPriorityId = priorityMap[form.priority] || "";
    const resolved = { ...form, priority_id: form.priority_id || mappedPriorityId };
    if (!resolved.category_id || !resolved.priority_id) {
      setFormErr(t("assetDetails.reportForm.categoryPriorityRequired", "Please select Issue Category and Priority."));
      return;
    }
    setCreating(true);
    setFormErr(null);
    try {
      const res = await fetch(`${BASE_URL}/tickets`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          category_id: resolved.category_id,
          priority_id: resolved.priority_id,
          asset_id: asset.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || t("assetDetails.reportForm.createFailed", "Ticket creation failed"));
      setReportOpen(false);
      showToast(t("assetDetails.toast.reportSubmitted", "Issue report submitted successfully!"), "success");
      fetchAssetDetails(true);
    } catch (e) {
      setFormErr(e.message || t("assetDetails.toast.reportFailed", "Failed to submit ticket."));
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="ad-page ad-loading-state">
        <div className="ad-spinner" />
        <p>{t("assetDetails.loading", "Loading asset details…")}</p>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="ad-page">
        <div className="ad-error-card">
          <div className="ad-error-icon"><Icon d={IC.warning} size={32} /></div>
          <h2>{t("assetDetails.notFound", "Asset Not Found")}</h2>
          <p>{error || t("assetDetails.noAccess", "You do not have access to view this asset.")}</p>
          <Link to="/employee/my-assets" className="ad-btn ad-btn--primary">
            <Icon d={IC.arrowLeft} size={14} />
            {t("assetDetails.returnToAssets", "Return to My Assets")}
          </Link>
        </div>
      </div>
    );
  }

  const assignmentHistory = asset.assignment_history || [];
  const historyForTimeline = [...assignmentHistory].sort((a, b) => {
    const ad = a.assigned_at ? new Date(a.assigned_at).getTime() : 0;
    const bd = b.assigned_at ? new Date(b.assigned_at).getTime() : 0;
    return bd - ad;
  });

  const qrImageUrl = asset.qr_code_url
    ? asset.qr_code_url
    : asset.qr_code_path
      ? `http://127.0.0.1:8000/storage/${asset.qr_code_path}`
      : asset.qr_code_value
        ? qrUrlFromValue(asset.qr_code_value, 300)
        : asset.asset_tag
          ? qrUrlFromValue(`TICKORA:ASSET:${asset.asset_tag}`, 300)
          : null;

  const status = normalizeStatus(asset.status);
  const warranty = warrantyStatus(asset.warranty_expiry);

  const currentAssignee = asset.assigned_user?.name
    ?? asset.assigned_user?.full_name
    ?? asset.employee?.full_name
    ?? asset.assigned_to_name
    ?? null;

  const TABS = [
    { key: "overview", label: t("assetDetails.tabOverview", "Device Information"), icon: IC.laptop },
    { key: "history",  label: t("assetDetails.tabHistory",  "Assignment History"), icon: IC.clock, count: historyForTimeline.length },
    { key: "tickets",  label: t("assetDetails.tabTickets",  "Related Tickets"),    icon: IC.ticket, count: asset.tickets?.length || 0 },
  ];

  return (
    <div className="ad-page">

      {toast && (
        <div className={`ad-toast ad-toast--${toast.type}`}>
          <Icon d={toast.type === "success" ? IC.check : toast.type === "error" ? IC.warning : IC.info} size={15} />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}><Icon d={IC.close} size={13} /></button>
        </div>
      )}

      <div className="ad-topbar">
        <Link to="/employee/my-assets" className="ad-back-link">
          <Icon d={IC.arrowLeft} size={14} />
          {t("assetDetails.backToAssets", "Back to My Assets")}
        </Link>
        <div className="ad-topbar-actions">
          <button className="ad-btn ad-btn--ghost ad-btn--sm" onClick={() => fetchAssetDetails(true)} disabled={refreshing}>
            <Icon d={IC.refresh} size={14} />
            {refreshing ? t("assetDetails.refreshing", "Refreshing…") : t("common.refresh", "Refresh")}
          </button>
          <button className="ad-btn ad-btn--danger ad-btn--sm" onClick={openReportModal}>
            <Icon d={IC.warning} size={14} />
            {t("assetDetails.reportIssue", "Report Issue")}
          </button>
        </div>
      </div>

      <div className="ad-hero">
        <div className="ad-hero-main">
          <div className="ad-hero-tag-row">
            <span className="ad-tag-pill">{asset.asset_tag || asset.asset_code || "N/A"}</span>
            <span className={`ad-status-badge ad-status--${status}`}>
              <span className="ad-status-dot" />
              {STATUS_LABEL[status] || asset.status || t("common.unknown", "Unknown")}
            </span>
            {warranty && (
              <span className={`ad-warranty-pill ad-warranty--${warranty.cls}`}>
                <Icon d={IC.shield} size={12} />
                {t("assetDetails.warrantyLabel", "Warranty: {{label}}", { label: warranty.label })}
              </span>
            )}
          </div>
          <h1 className="ad-hero-title">{asset.asset_name}</h1>
          <div className="ad-hero-meta">
            <span><Icon d={IC.tag} size={13} /> {asset.manufacturer || asset.brand || t("common.unknown", "Generic")}</span>
            {asset.model && <><span className="ad-meta-sep">·</span><span>{asset.model}</span></>}
            {asset.serial_number && <><span className="ad-meta-sep">·</span><span className="ad-mono">SN {asset.serial_number}</span></>}
          </div>
        </div>
      </div>

      <div className="ad-qr-section">
        <div className="ad-section-header">
          <h2><Icon d={IC.qr} size={15} /> {t("assetDetails.qrSectionTitle", "Asset QR Code")}</h2>
          <span className="ad-section-count">{asset.asset_tag || asset.asset_code || "N/A"}</span>
        </div>

        <div className="ad-qr-card">
          <div className="ad-qr-image-wrap">
            <img
              src={qrImageUrl ?? ""}
              alt={`QR for ${asset.asset_tag}`}
              style={qrImageUrl ? undefined : { display: "none" }}
            />
            {!qrImageUrl && !asset?.qr_code_value && (
              <div className="ad-qr-empty ad-qr-empty--lg"><Icon d={IC.qr} size={38} /></div>
            )}
          </div>

          <div className="ad-qr-card-actions">
            <button className="ad-btn ad-btn--ghost" onClick={handleDownloadQr}>
              <Icon d={IC.download} size={14} />
              {t("assetDetails.downloadQR", "Download QR")}
            </button>
          </div>
        </div>
      </div>

      <div className="ad-quick-grid">
        <div className="ad-quick-card">
          <div className="ad-quick-icon ad-quick-icon--blue"><Icon d={IC.user} size={18} /></div>
          <div className="ad-quick-body">
            <div className="ad-quick-label">{t("assetDetails.quickAssignedTo", "Assigned To")}</div>
            <div className="ad-quick-value">{currentAssignee || "—"}</div>
          </div>
        </div>
        <div className="ad-quick-card">
          <div className="ad-quick-icon ad-quick-icon--purple"><Icon d={IC.building} size={18} /></div>
          <div className="ad-quick-body">
            <div className="ad-quick-label">{t("assetDetails.quickDepartment", "Department")}</div>
            <div className="ad-quick-value">{asset.department || asset.employee?.department || "—"}</div>
          </div>
        </div>
        <div className="ad-quick-card">
          <div className="ad-quick-icon ad-quick-icon--green"><Icon d={IC.mapPin} size={18} /></div>
          <div className="ad-quick-body">
            <div className="ad-quick-label">{t("assetDetails.quickLocation", "Location")}</div>
            <div className="ad-quick-value">{asset.location || "—"}</div>
          </div>
        </div>
        <div className="ad-quick-card">
          <div className="ad-quick-icon ad-quick-icon--teal"><Icon d={IC.calendar} size={18} /></div>
          <div className="ad-quick-body">
            <div className="ad-quick-label">{t("assetDetails.quickAssignedDate", "Assigned Date")}</div>
            <div className="ad-quick-value">{formatDate(asset.assigned_at)}</div>
          </div>
        </div>
      </div>

      <div className="ad-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`ad-tab ${activeTab === tab.key ? "ad-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Icon d={tab.icon} size={14} />
            <span>{tab.label}</span>
            {tab.count !== undefined && <span className="ad-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="ad-tab-panel">
          <div className="ad-section-header">
            <h2><Icon d={IC.info} size={15} /> {t("assetDetails.deviceInfoTitle", "Device Information")}</h2>
          </div>
          <div className="ad-info-grid">
            {[
              { icon: IC.laptop,   labelKey: "assetDetails.labelAssetName",  val: asset.asset_name },
              { icon: IC.tag,      labelKey: "assetDetails.labelAssetTag",   val: asset.asset_tag || asset.asset_code, mono: true },
              { icon: IC.hash,     labelKey: "assetDetails.labelSerial",     val: asset.serial_number, mono: true },
              { icon: IC.building, labelKey: "assetDetails.labelBrand",      val: asset.manufacturer || asset.brand },
              { icon: IC.laptop,   labelKey: "assetDetails.labelModel",      val: asset.model },
              { icon: IC.tag,      labelKey: "assetDetails.labelCategory",   val: asset.category?.name || asset.category || asset.type || "—" },
              { icon: IC.mapPin,   labelKey: "assetDetails.labelLocation",   val: asset.location },
              { icon: IC.building, labelKey: "assetDetails.labelDepartment", val: asset.department || asset.employee?.department },
              { icon: IC.user,     labelKey: "assetDetails.labelAssignedTo",val: currentAssignee },
              { icon: IC.calendar, labelKey: "assetDetails.labelAssignedDate",val: formatDate(asset.assigned_at) },
              { icon: IC.calendar, labelKey: "assetDetails.labelPurchaseDate",val: formatDate(asset.purchase_date) },
              { icon: IC.shield,   labelKey: "assetDetails.labelWarranty",   val: formatDate(asset.warranty_expiry), extra: warranty },
            ].map((r) => (
              <div className="ad-info-cell" key={r.labelKey}>
                <div className="ad-info-cell-icon"><Icon d={r.icon} size={15} /></div>
                <div className="ad-info-cell-body">
                  <div className="ad-info-cell-label">{t(r.labelKey, r.labelKey.split(".").pop())}</div>
                  <div className={`ad-info-cell-value ${r.mono ? "ad-mono" : ""}`}>{r.val !== undefined && r.val !== null && r.val !== "" ? r.val : "—"}</div>
                  {r.extra && <div className={`ad-info-cell-extra ad-warranty--${r.extra.cls}`}>{r.extra.label}</div>}
                </div>
              </div>
            ))}
            {asset.notes && (
              <div className="ad-info-cell ad-info-cell--full">
                <div className="ad-info-cell-icon"><Icon d={IC.info} size={15} /></div>
                <div className="ad-info-cell-body">
                  <div className="ad-info-cell-label">{t("assetDetails.labelNotes", "Notes")}</div>
                  <div className="ad-info-cell-value ad-notes-text">{asset.notes}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="ad-tab-panel">
          <div className="ad-section-header">
            <h2><Icon d={IC.clock} size={15} /> {t("assetDetails.historyTitle", "Assignment History")}</h2>
            <span className="ad-section-count">
              {historyForTimeline.length} {t("assetDetails.recordCount", "{{count}} record", { count: historyForTimeline.length })}
            </span>
          </div>
          {historyForTimeline.length > 0 ? (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>{t("assetDetails.colAssignedTo", "Assigned To")}</th>
                    <th>{t("assetDetails.colAssignedDate", "Assigned Date")}</th>
                    <th>{t("assetDetails.colReturnedDate", "Returned Date")}</th>
                    <th>{t("assetDetails.colStatus", "Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {historyForTimeline.map((item, i) => {
                    const returned = !!item.returned_at;
                    return (
                      <tr key={item.id || item.assigned_at || i}>
                        <td>
                          <div className="ad-user-cell">
                            <div className="ad-user-avatar">
                              {(item.assigned_to_name || "?")[0]?.toUpperCase()}
                            </div>
                            <span>{item.assigned_to_name || item.assigned_to || "—"}</span>
                          </div>
                        </td>
                        <td>{formatDateTime(item.assigned_at)}</td>
                        <td>
                          {returned
                            ? formatDateTime(item.returned_at)
                            : <span className="ad-pill ad-pill--success">{t("assetDetails.present", "Present")}</span>}
                        </td>
                        <td>
                          <span className={`ad-pill ad-pill--${returned ? "neutral" : "active"}`}>
                            {item.status || (returned ? t("assetDetails.returned", "Returned") : t("assetDetails.active", "Active"))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ad-empty">
              <div className="ad-empty-icon"><Icon d={IC.clock} size={28} /></div>
              <p>{t("assetDetails.historyEmpty", "No assignment history records found for this asset.")}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "tickets" && (
        <div className="ad-tab-panel">
          <div className="ad-section-header">
            <h2><Icon d={IC.ticket} size={15} /> {t("assetDetails.ticketsTitle", "Related Tickets")}</h2>
            <button className="ad-btn ad-btn--danger ad-btn--sm" onClick={openReportModal}>
              <Icon d={IC.plus} size={13} />
              {t("assetDetails.newReport", "New Report")}
            </button>
          </div>
          {asset.tickets && asset.tickets.length > 0 ? (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>{t("assetDetails.colTicketNum", "Ticket #")}</th>
                    <th>{t("assetDetails.colTitle", "Title")}</th>
                    <th>{t("assetDetails.colPriority", "Priority")}</th>
                    <th>{t("assetDetails.colStatus", "Status")}</th>
                    <th>{t("assetDetails.colCreated", "Created")}</th>
                  </tr>
                </thead>
                <tbody>
                  {asset.tickets.map((tk) => {
                    const priority = String(tk.priority || "medium").toLowerCase();
                    const tStatus = String(tk.status?.status_name ?? tk.status ?? "open").toLowerCase().replace(/\s+/g, "-");
                    return (
                      <tr key={tk.id}>
                        <td className="ad-mono">{tk.ticket_number || `#TK-${tk.id}`}</td>
                        <td className="ad-fw-600">{tk.title}</td>
                        <td>
                          <span className={`ad-pill ad-pill--priority-${priority}`}>
                            {tk.priority || t("agent.priority.medium", "Medium")}
                          </span>
                        </td>
                        <td>
                          <span className={`ad-pill ad-pill--status-${tStatus}`}>
                            {tk.status?.status_name ?? tk.status ?? t("agent.status.open", "Open")}
                          </span>
                        </td>
                        <td className="ad-muted">{formatDate(tk.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="ad-empty">
              <div className="ad-empty-icon"><Icon d={IC.ticket} size={28} /></div>
              <p>{t("assetDetails.ticketsEmpty", "No tickets or issue reports filed for this asset.")}</p>
              <button className="ad-btn ad-btn--primary ad-btn--sm" onClick={openReportModal}>
                <Icon d={IC.plus} size={13} />
                {t("assetDetails.fileFirstReport", "File First Report")}
              </button>
            </div>
          )}
        </div>
      )}

      {reportOpen && (
        <div className="ad-overlay" onClick={() => setReportOpen(false)}>
          <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ad-modal-header">
              <div>
                <div className="ad-modal-title">{t("assetDetails.reportModalTitle", "Report an Issue")}</div>
                <div className="ad-modal-sub">{t("assetDetails.reportModalSub", "A new ticket will be created and linked to this asset")}</div>
              </div>
              <button className="ad-modal-close" onClick={() => setReportOpen(false)}>
                <Icon d={IC.close} size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket}>
              <div className="ad-modal-body">
                {formErr && (
                  <div className="ad-form-error">
                    <Icon d={IC.warning} size={14} /> {formErr}
                  </div>
                )}

                <div className="ad-autofill">
                  <div className="ad-autofill-icon"><Icon d={IC.tag} size={16} /></div>
                  <div className="ad-autofill-body">
                    <div className="ad-autofill-label">{t("assetDetails.targetAsset", "Target Asset")}</div>
                    <div className="ad-autofill-value">
                      <strong>{asset.asset_name}</strong>
                      <span className="ad-autofill-tag">{asset.asset_tag || asset.asset_code}</span>
                    </div>
                  </div>
                </div>

                <div className="ad-form-group">
                  <label className="ad-label">{t("assetDetails.reportForm.titleLabel", "Issue Title")} <span className="ad-req">*</span></label>
                  <input
                    type="text"
                    className="ad-input"
                    placeholder={t("assetDetails.reportForm.titlePh", "e.g., Screen flickering, Battery swelling")}
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div className="ad-form-group">
                  <label className="ad-label">{t("assetDetails.reportForm.priorityLabel", "Priority Level")}</label>
                  <div className="ad-priority-grid">
                    {[
                      { v: "low",    labelKey: "assetDetails.reportForm.priorityLow",      descKey: "assetDetails.reportForm.priorityLowDesc"      },
                      { v: "medium", labelKey: "assetDetails.reportForm.priorityMedium",   descKey: "assetDetails.reportForm.priorityMediumDesc"   },
                      { v: "high",   labelKey: "assetDetails.reportForm.priorityHigh",     descKey: "assetDetails.reportForm.priorityHighDesc"     },
                      { v: "urgent", labelKey: "assetDetails.reportForm.priorityUrgent",   descKey: "assetDetails.reportForm.priorityUrgentDesc"   },
                    ].map(p => (
                      <label key={p.v} className={`ad-priority-option ad-priority-option--${p.v} ${form.priority === p.v ? "is-active" : ""}`}>
                        <input
                          type="radio"
                          name="priority"
                          value={p.v}
                          checked={form.priority === p.v}
                          onChange={() => setForm(f => ({ ...f, priority: p.v }))}
                        />
                        <span className="ad-priority-name">{t(p.labelKey, p.v)}</span>
                        <span className="ad-priority-desc">{t(p.descKey, "")}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="ad-form-group">
                  <label className="ad-label">{t("assetDetails.reportForm.categoryLabel", "Issue Category")} <span className="ad-req">*</span></label>
                  <select
                    className="ad-input"
                    value={form.category_id}
                    onChange={(e) => setForm(f => ({ ...f, category_id: e.target.value }))}
                    disabled={categories.length === 0}
                  >
                    <option value="">{t("assetDetails.reportForm.categoryPh", "Select category")}</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.category_name || c.name || c.category || `Category ${c.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ad-form-group">
                  <label className="ad-label">{t("assetDetails.reportForm.descriptionLabel", "Description of Issue")}</label>
                  <textarea
                    className="ad-input ad-textarea"
                    rows={4}
                    placeholder={t("assetDetails.reportForm.descriptionPh", "Please describe what happened, steps to reproduce, or any damage details...")}
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>

              <div className="ad-modal-footer">
                <button type="button" className="ad-btn ad-btn--ghost" onClick={() => setReportOpen(false)}>
                  {t("common.cancel", "Cancel")}
                </button>
                <button type="submit" className="ad-btn ad-btn--danger" disabled={creating}>
                  {creating ? t("assetDetails.reportForm.submitting", "Submitting…") : t("assetDetails.reportForm.submit", "Submit Ticket")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}