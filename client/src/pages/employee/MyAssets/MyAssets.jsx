import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./MyAssets.css";

const BASE_URL = "http://127.0.0.1:8000/api";

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  arrowLeft: "M19 12H5M12 19l-7-7 7-7",
  warning:   "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  ticket:    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  box:       "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  refresh:   "M21 2v6h-6 M3 22v-6h6 M20.49 9A9 9 0 005.64 5.64L3 8 M3.51 15A9 9 0 0018.36 18.36L21 16",
  laptop:    "M2 20h20M4 20V8a2 2 0 012-2h12a2 2 0 012 2v12",
  hash:      "M4 9h16M4 15h16M10 3L8 21M16 3l-2 18",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  external:  "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3",
};

// ── Helpers ──
const computeBucket = (status) => {
  const s = String(status ?? "").toLowerCase();
  if (s === "in_repair" || s === "in repair") return "repair";
  if (s === "retired" || s === "disposed")    return "retired";
  if (s === "lost")                            return "lost";
  if (s === "assigned" || s === "active")     return "assigned";
  return "available";
};

const BUCKET_CLS = {
  assigned:  "ma-status--assigned",
  available: "ma-status--available",
  repair:    "ma-status--repair",
  retired:   "ma-status--retired",
  lost:      "ma-status--lost",
};

const BUCKET_LABEL = {
  assigned:  "Assigned",
  available: "Available",
  repair:    "In Repair",
  retired:   "Retired",
  lost:      "Lost",
};

const formatDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

export default function MyAssets() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/my-assets`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to load assets");
        setAssets(Array.isArray(data.assets) ? data.assets : []);
      } catch (e) {
        setError(e.message || "Unable to load your assets");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="ma-page ma-loading">
        <div className="ma-spinner" />
        <p>Loading your assets…</p>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="ma-page">
        <div className="ma-error">
          <Icon d={IC.warning} size={20} />
          <div>
            <strong>Unable to load assets</strong>
            <p style={{ margin: "4px 0 0" }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ma-page">
      {/* ── Top bar ── */}
      <div className="ma-topbar">
        <div className="ma-title-group">
          <div className="ma-title-icon">
            <Icon d={IC.laptop} size={20} />
          </div>
          <h2 className="ma-title">
            My Assets
            <span className="ma-title-pill">{assets.length}</span>
          </h2>
        </div>
        <span className="ma-count">
          <Icon d={IC.box} size={13} />
          {assets.length === 0
            ? "No assets yet"
            : `${assets.length} assigned ${assets.length === 1 ? "asset" : "assets"}`}
        </span>
      </div>

      {/* ── Empty state ── */}
      {assets.length === 0 ? (
        <div className="ma-card">
          <div className="ma-empty">
            <div className="ma-empty-icon">
              <Icon d={IC.box} size={32} />
            </div>
            <h3 className="ma-empty-title">No assets assigned to you</h3>
            <p className="ma-empty-text">
              When an admin assigns hardware to you, it will show up here.
              You can then scan its QR code or report issues directly.
            </p>
            <Link to="/create-ticket" className="ma-empty-cta">
              <Icon d={IC.ticket} size={14} />
              Report a general issue
            </Link>
          </div>
        </div>
      ) : (
        <div className="ma-card">
          <div className="ma-grid">
            {assets.map((a) => {
              const bucket = computeBucket(a.status);
              return (
                <button
                  key={a.id}
                  className="ma-asset"
onClick={() => navigate(`/employee/my-assets/${a.id}`)}
                  type="button"
                >
                  {/* Top: name + tag */}
                  <div className="ma-asset-top">
                    <div className="ma-asset-id">
                      <div className="ma-asset-name">
                        {a.asset_name ?? a.name ?? "Unnamed Asset"}
                      </div>
                      <div className="ma-asset-sub">
                        {a.brand ? a.brand : "Generic"}
                        {a.model ? ` · ${a.model}` : ""}
                      </div>
                    </div>
                    <span className="ma-asset-tag">
                      {a.asset_tag ?? a.asset_code ?? "—"}
                    </span>
                  </div>

                  {/* Status badge */}
                  <span className={`ma-asset-status ${BUCKET_CLS[bucket] ?? "ma-status--available"}`}>
                    {BUCKET_LABEL[bucket]}
                  </span>

                  {/* Info list */}
                  <div className="ma-asset-info">
                    <div className="ma-asset-info-row">
                      <strong>Serial</strong>
                      <span>{a.serial_number ?? "—"}</span>
                    </div>
                    <div className="ma-asset-info-row">
                      <strong>Warranty</strong>
                      <span>{formatDate(a.warranty_expiry)}</span>
                    </div>
                    <div className="ma-asset-info-row">
                      <strong>Location</strong>
                      <span>{a.location ?? "—"}</span>
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="ma-asset-actions">
                    <span
                      className="ma-action"
                      onClick={(e) => {
                        e.stopPropagation();
navigate(`/employee/my-assets/${a.id}`);
                      }}
                    >
                      <Icon d={IC.external} size={13} />
                      View Details
                    </span>
                    <div className="ma-action-divider" />
                    <span
                      className="ma-action ma-action--danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/create-ticket?asset_id=${a.id}`);
                      }}
                    >
                      <Icon d={IC.warning} size={13} />
                      Report Issue
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}