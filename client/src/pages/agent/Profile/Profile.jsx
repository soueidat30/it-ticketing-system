import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

// ── Icon helper ───────────────────────────────────────────
const Icon = ({ d, size = 15 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  user:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  mail:    "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  dept:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  clock:   "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  lock:    "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
  eyeOff:  "M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94 M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19 M1 1l22 22",
  check:   "M20 6L9 17l-5-5",
  edit:    "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  ticket:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  logout:  "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
};

const BASE_URL = "http://127.0.0.1:8000/api";

const initials = (name = "") =>
  name.split(" ").map(w => w[0] ?? "").join("").slice(0, 2).toUpperCase();

// Password strength scorer
const scorePassword = (pw) => {
  if (!pw) return { score: 0, label: "", cls: "" };
  let s = 0;
  if (pw.length >= 8)  s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label: "",        cls: "",        pct: 0   },
    { label: "Weak",    cls: "weak",    pct: 20  },
    { label: "Fair",    cls: "fair",    pct: 45  },
    { label: "Good",    cls: "good",    pct: 70  },
    { label: "Strong",  cls: "strong",  pct: 90  },
    { label: "Strong",  cls: "strong",  pct: 100 },
  ];
  return map[s] ?? map[0];
};

const formatJoined = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function Profile() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");

  // ── User data ───────────────────────────────────────────
  const [user,      setUser]      = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const [stats,     setStats]     = useState(null);
  const [activity,  setActivity]  = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Edit form state ─────────────────────────────────────
  const [editing,   setEditing]   = useState(false);
  const [form,      setForm]      = useState({ full_name: "", department: "" });
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");

  // ── Password form state ─────────────────────────────────
  const [pwForm,    setPwForm]    = useState({ current: "", next: "", confirm: "" });
  const [pwShow,    setPwShow]    = useState({ current: false, next: false, confirm: false });
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwError,   setPwError]   = useState("");

  // ── Toast ───────────────────────────────────────────────
  const [toast,     setToast]     = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  // ── Fetch stats + activity ──────────────────────────────
  useEffect(() => {
    if (!token) { navigate("/", { replace: true }); return; }

    const role = user.role ?? "employee";

    const loadStats = async () => {
      try {
        // Agent gets assigned/resolved stats from dashboard endpoint
        if (role === "agent" || role === "manager" || role === "admin") {
          const res  = await fetch(`${BASE_URL}/agent/dashboard/stats`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            setStats({
              total:    data.stats?.assigned      ?? 0,
              resolved: data.stats?.resolved_today ?? 0,
              pending:  data.stats?.pending_review ?? 0,
              progress: data.stats?.in_progress    ?? 0,
            });
            // Build simple activity feed from recent tickets
            const recent = data.recent_tickets ?? [];
            setActivity(recent.map(t => ({
              text: `Ticket ${t.ticket_number} — ${t.title}`,
              time: timeAgo(t.updated_at ?? t.created_at),
              type: (t.status?.status_name ?? "open").toLowerCase().replace(/\s+/g, "-"),
            })));
          }
        } else {
          // Employee gets their own ticket counts
          const res = await fetch(`${BASE_URL}/my-tickets`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          });
          if (res.ok) {
            const tickets = await res.json();
            const list    = Array.isArray(tickets) ? tickets : tickets.data ?? [];
            setStats({
              total:    list.length,
              resolved: list.filter(t => t.status?.status_name === "Resolved").length,
              pending:  list.filter(t => t.status?.status_name === "Pending").length,
              open:     list.filter(t => t.status?.status_name === "Open").length,
            });
            setActivity(list.slice(0, 5).map(t => ({
              text: `Ticket ${t.ticket_number} — ${t.title}`,
              time: timeAgo(t.updated_at ?? t.created_at),
              type: (t.status?.status_name ?? "open").toLowerCase().replace(/\s+/g, "-"),
            })));
          }
        }
      } catch (err) {
        console.error("Profile stats error:", err);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [token, user.role, navigate]);

  // Initialise edit form whenever user changes
  useEffect(() => {
    setForm({ full_name: user.full_name ?? "", department: user.department ?? "" });
  }, [user]);

  const strength = useMemo(() => scorePassword(pwForm.next), [pwForm.next]);
  const role     = user.role ?? "employee";

  // ── Save profile ────────────────────────────────────────
  const handleSave = async () => {
    if (!form.full_name.trim()) { setFormError("Full name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const res  = await fetch(`${BASE_URL}/auth/me`, {
        method:  "PUT",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept:         "application/json",
        },
        body: JSON.stringify({
          full_name:  form.full_name.trim(),
          department: form.department.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.message || "Failed to save."); return; }

      const updated = { ...user, full_name: form.full_name.trim(), department: form.department.trim() };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setEditing(false);
      showToast("Profile updated ✓");
    } catch {
      setFormError("Network error — could not save.");
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ─────────────────────────────────────
  const handlePasswordChange = async () => {
    if (!pwForm.current.trim()) { setPwError("Enter your current password."); return; }
    if (pwForm.next.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError("New passwords don't match."); return; }

    setPwSaving(true);
    setPwError("");
    try {
      const res  = await fetch(`${BASE_URL}/auth/change-password`, {
        method:  "POST",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept:         "application/json",
        },
        body: JSON.stringify({
          current_password:      pwForm.current,
          password:              pwForm.next,
          password_confirmation: pwForm.confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.message || "Failed to change password."); return; }

      setPwForm({ current: "", next: "", confirm: "" });
      showToast("Password changed ✓");
    } catch {
      setPwError("Network error — could not change password.");
    } finally {
      setPwSaving(false);
    }
  };

  const togglePw = (field) =>
    setPwShow(prev => ({ ...prev, [field]: !prev[field] }));

  // ── Logout ──────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
    } catch { /* ignore */ }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const statItems = stats
    ? role === "agent" || role === "manager" || role === "admin"
      ? [
          { num: stats.total,    lbl: "Assigned"  },
          { num: stats.progress, lbl: "In Progress" },
          { num: stats.resolved, lbl: "Resolved"  },
          { num: stats.pending,  lbl: "Pending"   },
        ]
      : [
          { num: stats.total,    lbl: "Total"    },
          { num: stats.open,     lbl: "Open"     },
          { num: stats.resolved, lbl: "Resolved" },
          { num: stats.pending,  lbl: "Pending"  },
        ]
    : [];

  // ── Render ──────────────────────────────────────────────
  return (
    <div className="profile-page">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">My Profile</h1>
          <p className="agent-page-subtitle">Manage your account information and security settings.</p>
        </div>
      </div>

      <div className="profile-layout">

        {/* ── Left sidebar ── */}
        <div className="profile-id-card">
          <div className="profile-id-banner" />

          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials(user.full_name ?? user.username ?? "?")}</div>
          </div>

          <div className="profile-id-info">
            <div className="profile-id-name">{user.full_name ?? "—"}</div>
            <div className="profile-id-username">@{user.username ?? "—"}</div>
            <div className="profile-id-role">
              <Icon d={IC.user} size={11} />
              {role.charAt(0).toUpperCase() + role.slice(1)}
            </div>
            {user.department && (
              <div className="profile-id-dept">{user.department}</div>
            )}
            <div className="profile-id-status">
              <span className="profile-id-status-dot" />
              Active
            </div>
          </div>

          <div className="profile-id-divider" />

          <div className="profile-id-meta">
            <div className="profile-id-meta-row">
              <Icon d={IC.mail} />
              <span className="profile-id-meta-val">{user.email ?? "—"}</span>
            </div>
            {user.department && (
              <div className="profile-id-meta-row">
                <Icon d={IC.dept} />
                <span className="profile-id-meta-val">{user.department}</span>
              </div>
            )}
            <div className="profile-id-meta-row">
              <Icon d={IC.clock} />
              <span className="profile-id-meta-val">
                Joined {formatJoined(user.created_at)}
              </span>
            </div>
          </div>

          {/* Stats strip */}
          {!loadingStats && stats && (
            <div className="profile-stats-strip">
              {statItems.map(s => (
                <div className="profile-stat-cell" key={s.lbl}>
                  <div className="profile-stat-num">{s.num}</div>
                  <div className="profile-stat-lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Main content ── */}
        <div className="profile-main">

          {/* Personal information */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-title">Personal Information</span>
              {!editing ? (
                <button className="agent-btn agent-btn--ghost agent-btn--sm"
                  onClick={() => { setEditing(true); setFormError(""); }}>
                  <Icon d={IC.edit} /> Edit
                </button>
              ) : (
                <button className="agent-btn agent-btn--ghost agent-btn--sm"
                  onClick={() => { setEditing(false); setFormError(""); setForm({ full_name: user.full_name ?? "", department: user.department ?? "" }); }}>
                  Cancel
                </button>
              )}
            </div>

            <div className="profile-section-body">
              <div className="profile-field-grid">

                <div className="profile-field">
                  <label className="profile-label">Full Name</label>
                  {editing ? (
                    <input className="profile-input"
                      value={form.full_name}
                      onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Your full name" />
                  ) : (
                    <div className="profile-readonly">{user.full_name || "—"}</div>
                  )}
                </div>

                <div className="profile-field">
                  <label className="profile-label">Username</label>
                  {/* Username is immutable — shown as read-only always */}
                  <div className="profile-readonly" style={{ color: "var(--agent-muted)" }}>
                    @{user.username || "—"}
                  </div>
                  {editing && (
                    <span className="profile-input-hint">Username cannot be changed.</span>
                  )}
                </div>

                <div className="profile-field">
                  <label className="profile-label">Email Address</label>
                  {/* Email is read-only — changing it requires identity verification */}
                  <div className="profile-readonly" style={{ color: "var(--agent-muted)" }}>
                    {user.email || "—"}
                  </div>
                  {editing && (
                    <span className="profile-input-hint">Contact your administrator to update your email.</span>
                  )}
                </div>

                <div className="profile-field">
                  <label className="profile-label">Department</label>
                  {editing ? (
                    <input className="profile-input"
                      value={form.department}
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                      placeholder="e.g. Sales, Engineering" />
                  ) : (
                    <div className="profile-readonly">{user.department || "Not specified"}</div>
                  )}
                </div>

                <div className="profile-field">
                  <label className="profile-label">Role</label>
                  <div className="profile-readonly" style={{ color: "var(--agent-muted)" }}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">Account Status</label>
                  <div className="profile-readonly">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                      Active
                    </span>
                  </div>
                </div>

              </div>

              {formError && (
                <div style={{ marginTop: 14, padding: "9px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
                  {formError}
                </div>
              )}
            </div>

            {editing && (
              <div className="profile-section-footer">
                <button className="agent-btn agent-btn--ghost"
                  onClick={() => { setEditing(false); setFormError(""); }}>
                  Cancel
                </button>
                <button className="agent-btn agent-btn--primary"
                  onClick={handleSave}
                  disabled={saving}>
                  {saving ? "Saving…" : <><Icon d={IC.check} /> Save Changes</>}
                </button>
              </div>
            )}
          </div>

          {/* Change password */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-title">Change Password</span>
            </div>

            <div className="profile-section-body">
              <div className="profile-password-grid">

                <div className="profile-field">
                  <label className="profile-label">Current Password</label>
                  <div className="profile-pw-wrap">
                    <input
                      type={pwShow.current ? "text" : "password"}
                      className="profile-input profile-pw-input"
                      placeholder="Enter current password"
                      value={pwForm.current}
                      onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                    />
                    <button className="profile-pw-toggle" onClick={() => togglePw("current")}>
                      <Icon d={pwShow.current ? IC.eyeOff : IC.eye} />
                    </button>
                  </div>
                </div>

                <div className="profile-field">
                  <label className="profile-label">New Password</label>
                  <div className="profile-pw-wrap">
                    <input
                      type={pwShow.next ? "text" : "password"}
                      className="profile-input profile-pw-input"
                      placeholder="Minimum 8 characters"
                      value={pwForm.next}
                      onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                    />
                    <button className="profile-pw-toggle" onClick={() => togglePw("next")}>
                      <Icon d={pwShow.next ? IC.eyeOff : IC.eye} />
                    </button>
                  </div>
                  {pwForm.next && (
                    <div className="profile-pw-strength">
                      <div className="profile-pw-strength-bar">
                        <div
                          className={`profile-pw-strength-fill profile-pw-strength-fill--${strength.cls}`}
                          style={{ width: `${strength.pct}%` }}
                        />
                      </div>
                      <div className="profile-pw-strength-label">{strength.label}</div>
                    </div>
                  )}
                </div>

                <div className="profile-field">
                  <label className="profile-label">Confirm New Password</label>
                  <div className="profile-pw-wrap">
                    <input
                      type={pwShow.confirm ? "text" : "password"}
                      className="profile-input profile-pw-input"
                      placeholder="Repeat new password"
                      value={pwForm.confirm}
                      onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                    />
                    <button className="profile-pw-toggle" onClick={() => togglePw("confirm")}>
                      <Icon d={pwShow.confirm ? IC.eyeOff : IC.eye} />
                    </button>
                  </div>
                  {pwForm.confirm && pwForm.next && (
                    <span className="profile-input-hint" style={{ color: pwForm.next === pwForm.confirm ? "#15803d" : "#ef4444" }}>
                      {pwForm.next === pwForm.confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
                    </span>
                  )}
                </div>

              </div>

              {pwError && (
                <div style={{ marginTop: 14, padding: "9px 14px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 8, fontSize: 13, color: "#b91c1c" }}>
                  {pwError}
                </div>
              )}
            </div>

            <div className="profile-section-footer">
              <button className="agent-btn agent-btn--primary"
                onClick={handlePasswordChange}
                disabled={pwSaving || !pwForm.current || !pwForm.next || !pwForm.confirm}>
                {pwSaving ? "Updating…" : <><Icon d={IC.lock} /> Update Password</>}
              </button>
            </div>
          </div>

          {/* Recent activity */}
          <div className="profile-section">
            <div className="profile-section-header">
              <span className="profile-section-title">Recent Activity</span>
            </div>
            <div className="profile-section-body" style={{ padding: "0 20px" }}>
              {loadingStats ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--agent-muted)", fontSize: 13 }}>
                  Loading activity…
                </div>
              ) : activity.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--agent-muted)", fontSize: 13 }}>
                  No recent activity yet.
                </div>
              ) : (
                <div className="profile-activity-list">
                  {activity.map((a, i) => (
                    <div className="profile-activity-item" key={i}>
                      <span className={`profile-activity-dot profile-activity-dot--${a.type}`} />
                      <div>
                        <div className="profile-activity-text">{a.text}</div>
                        <div className="profile-activity-time">{a.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className="profile-section profile-danger-zone">
            <div className="profile-section-header">
              <span className="profile-section-title">
                <Icon d={IC.warning} size={14} /> Danger Zone
              </span>
            </div>
            <div className="profile-section-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--agent-text)", marginBottom: 3 }}>
                    Sign out of your account
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--agent-muted)" }}>
                    You'll need to log in again to access the portal.
                  </div>
                </div>
                <button className="agent-btn"
                  style={{ background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca", fontWeight: 700 }}
                  onClick={handleLogout}>
                  <Icon d={IC.logout} /> Sign Out
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="profile-toast">
          <Icon d={IC.check} size={17} /> {toast}
        </div>
      )}
    </div>
  );
}