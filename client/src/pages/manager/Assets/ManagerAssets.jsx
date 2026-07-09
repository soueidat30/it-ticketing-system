import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./ManagerAssets.css";

const BASE_URL = "http://127.0.0.1:8000/api";

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  package:  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  ticket:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z",
  filter:   "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  warning:  "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  check:    "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  clock:    "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  eye:      "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  empty:    "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
};

const normalizeStatus = (s) => s?.toLowerCase().replace(/\s+/g, "-") ?? "open";
const normalizePriority = (p) => p?.toLowerCase() ?? "medium";

// Helper to safely extract array from various API response shapes
const extractArray = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.tickets)) return data.tickets;
  return [];
};

export default function ManagerAssets() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { t, language } = useLanguage();

  const [allTickets, setAllTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchAssetTickets = async () => {
      if (!token) return;
      let ticketsList = [];

      try {
        // Attempt 1: Try manager-scoped endpoint first
        try {
          const mgrRes = await fetch(`${BASE_URL}/manager/tickets`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (mgrRes.ok) {
            const mgrData = await mgrRes.json();
            ticketsList = extractArray(mgrData);
          }
        } catch { /* Proceed to Attempt 2 */ }

        // Attempt 2: Fallback to global tickets endpoint
        if (ticketsList.length === 0) {
          const globalRes = await fetch(`${BASE_URL}/tickets`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (!globalRes.ok) throw new Error(t("managerAssets.loadError", "Failed to fetch tickets"));
          const globalData = await globalRes.json();
          ticketsList = extractArray(globalData);
        }

        // Filter tickets that are linked to assets
        const assetTickets = ticketsList.filter(tk => tk.asset_id || tk.asset?.id);
        setAllTickets(assetTickets);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAssetTickets();
  }, [token, t]);

  const assetTickets = useMemo(() => {
    let filtered = allTickets;

    if (statusFilter !== "all") {
      filtered = filtered.filter(t => normalizeStatus(t.status?.status_name) === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.ticket_number?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [allTickets, statusFilter, search]);

  const stats = useMemo(() => {
    const total = allTickets.length;
    const open = allTickets.filter(t => normalizeStatus(t.status?.status_name) === "open").length;
    const inProgress = allTickets.filter(t => normalizeStatus(t.status?.status_name) === "in-progress").length;
    const resolved = allTickets.filter(t => normalizeStatus(t.status?.status_name) === "resolved").length;
    return { total, open, inProgress, resolved };
  }, [allTickets]);

  const formatDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(language === "ar" ? "ar-EG" : undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="ma-page">
        <div className="ma-loading">
          <div className="ma-spinner" />
          <p>{t("managerAssets.loading", "Loading asset issues...")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ma-page">
        <div className="ma-error">
          <Icon d={IC.warning} size={20} />
          <div>
            <strong>{t("managerAssets.errorTitle", "Error loading data")}</strong>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ma-page">
      <div className="ma-header">
        <div>
          <h1 className="ma-title">
            <Icon d={IC.package} size={22} />
            {t("managerAssets.title", "Asset Issues")}
          </h1>
          <p className="ma-subtitle">
            {t("managerAssets.subtitle", "Tickets created from employee asset reports")}
          </p>
        </div>
      </div>

      <div className="ma-stats-grid">
        <div className="ma-stat-card">
          <div className="ma-stat-value">{stats.total}</div>
          <div className="ma-stat-label">{t("managerAssets.statTotal", "Total Issues")}</div>
        </div>
        <div className="ma-stat-card ma-stat--blue">
          <div className="ma-stat-value">{stats.open}</div>
          <div className="ma-stat-label">{t("managerAssets.statOpen", "Open")}</div>
        </div>
        <div className="ma-stat-card ma-stat--purple">
          <div className="ma-stat-value">{stats.inProgress}</div>
          <div className="ma-stat-label">{t("managerAssets.statInProgress", "In Progress")}</div>
        </div>
        <div className="ma-stat-card ma-stat--green">
          <div className="ma-stat-value">{stats.resolved}</div>
          <div className="ma-stat-label">{t("managerAssets.statResolved", "Resolved")}</div>
        </div>
      </div>

      <div className="ma-controls">
        <div className="ma-search-box">
          <Icon d={IC.search} size={15} />
          <input
            type="text"
            placeholder={t("managerAssets.searchPlaceholder", "Search by ticket or issue title...")}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="ma-filter-group">
          <Icon d={IC.filter} size={14} />
          {["all", "open", "in-progress", "resolved", "closed"].map(s => (
            <button
              key={s}
              className={`ma-filter-btn ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" 
                ? t("managerAssets.filterAll", "All") 
                : t(`managerAssets.filter${s.replace(/(^|\-)\w/g, c => c.replace("-", "").toUpperCase())}`, s.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase()))
              }
            </button>
          ))}
        </div>
      </div>

      <div className="ma-table-wrap">
        <table className="ma-table">
          <thead>
            <tr>
              <th>{t("managerAssets.colTicketNum", "Ticket #")}</th>
              <th>{t("managerAssets.colIssueTitle", "Issue Title")}</th>
              <th>{t("managerAssets.colReportedBy", "Reported By")}</th>
              <th>{t("managerAssets.colPriority", "Priority")}</th>
              <th>{t("managerAssets.colStatus", "Status")}</th>
              <th>{t("managerAssets.colCreated", "Created")}</th>
            </tr>
          </thead>
          <tbody>
            {assetTickets.length === 0 ? (
              <tr>
                <td colSpan={6} className="ma-empty">
                  <div className="ma-empty-icon"><Icon d={IC.empty} size={28} /></div>
                  {t("managerAssets.emptyState", "No asset issues found matching your criteria.")}
                </td>
              </tr>
            ) : (
              assetTickets.map(tk => (
                <tr key={tk.id} onClick={() => navigate(`/manager/team-tickets`, { state: { ticketId: tk.id } })} style={{ cursor: "pointer" }}>
                  <td><span className="ma-ticket-id">{tk.ticket_number || `#TK-${tk.id}`}</span></td>
                  <td>{tk.title}</td>
                  <td>
                    <div className="ma-user-cell">
                      <div className="ma-user-avatar">
                        {(tk.user?.full_name || "?")[0]?.toUpperCase()}
                      </div>
                      <span>{tk.user?.full_name || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`ma-pill ma-pill--priority-${normalizePriority(tk.priority?.priority_name)}`}>
                      {tk.priority?.priority_name || t("common.medium", "Medium")}
                    </span>
                  </td>
                  <td>
                    <span className={`ma-pill ma-pill--status-${normalizeStatus(tk.status?.status_name)}`}>
                      {tk.status?.status_name || t("common.open", "Open")}
                    </span>
                  </td>
                  <td className="ma-muted">{formatDate(tk.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}