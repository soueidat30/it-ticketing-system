import { useState, useEffect } from "react";
import "./ManagerProfile.css";

const BASE = "http://127.0.0.1:8000/api";

const roleLabel = (role) => {
  const name = typeof role === "object" ? role?.name : role;
  if (!name) return "Manager";
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`prf-toast prf-toast--${type}`}>
      <i className={`ti ${type === "success" ? "ti-circle-check" : "ti-alert-circle"}`} />
      <span>{message}</span>
    </div>
  );
}

export default function Profile() {
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ full_name: "", email: "", phone: "" });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });

  // ── load fresh profile from server ──────────────────────────────────────
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          const u = data?.data || data;
          setUser(u);
          setForm({
            full_name: u.full_name || "",
            email: u.email || "",
            phone: u.phone || "",
          });
          localStorage.setItem("user", JSON.stringify(u));
        }
      } catch {
        // fall back silently to cached localStorage user
        setForm({
          full_name: user.full_name || "",
          email: user.email || "",
          phone: user.phone || "",
        });
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const initials = (user.full_name || "M")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── save profile info ───────────────────────────────────────────────────
  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not save changes.");

      const updated = { ...user, ...form };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      setToast({ type: "success", message: "Profile updated." });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  // ── change password ─────────────────────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault();

    if (pwForm.next.length < 8) {
      setToast({ type: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setToast({ type: "error", message: "New password and confirmation don't match." });
      return;
    }

    setChangingPw(true);
    try {
      const res = await fetch(`${BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          current_password: pwForm.current,
          password: pwForm.next,
          password_confirmation: pwForm.confirm,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not change password.");

      setPwForm({ current: "", next: "", confirm: "" });
      setToast({ type: "success", message: "Password changed." });
    } catch (err) {
      setToast({ type: "error", message: err.message || "Something went wrong." });
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="prf-loading">
        <i className="ti ti-loader prf-spin" />
        <span>Loading profile…</span>
      </div>
    );
  }

  return (
    <div className="prf-page">

      {/* ── HEADER ── */}
      <div className="prf-header">
        <div>
          <h1 className="prf-header__title">Profile</h1>
          <p className="prf-header__sub">Manage your account details and security</p>
        </div>
      </div>

      <div className="prf-grid">

        {/* ── LEFT: identity card ── */}
        <div className="prf-card prf-identity">
          <div className="prf-avatar">{initials}</div>
          <h2 className="prf-identity__name">{user.full_name || "Manager"}</h2>
          <span className="prf-role-badge">{roleLabel(user.role)}</span>

          <div className="prf-identity__meta">
            <div className="prf-identity__row">
              <i className="ti ti-mail" />
              <span>{user.email || "—"}</span>
            </div>
            {user.department?.department_name && (
              <div className="prf-identity__row">
                <i className="ti ti-building" />
                <span>{user.department.department_name}</span>
              </div>
            )}
            {user.created_at && (
              <div className="prf-identity__row">
                <i className="ti ti-calendar" />
                <span>
                  Joined {new Date(user.created_at).toLocaleDateString("en-GB", {
                    month: "long", year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: editable forms ── */}
        <div className="prf-forms">

          {/* personal info */}
          <form className="prf-card" onSubmit={saveProfile}>
            <div className="prf-card__header">
              <h2 className="prf-card__title">Personal information</h2>
              <span className="prf-card__sub">Update your name and contact details</span>
            </div>

            <div className="prf-card__body">
              <div className="prf-field-row">
                <div className="prf-field">
                  <label htmlFor="full_name">Full name</label>
                  <input
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
                <div className="prf-field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>

              <div className="prf-field-row">
                <div className="prf-field">
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="prf-field">
                  <label>Role</label>
                  <input type="text" value={roleLabel(user.role)} disabled />
                </div>
              </div>
            </div>

            <div className="prf-card__footer">
              <button type="submit" className="prf-btn prf-btn--primary" disabled={saving}>
                {saving ? (
                  <><i className="ti ti-loader prf-spin" /> Saving…</>
                ) : (
                  <><i className="ti ti-check" /> Save changes</>
                )}
              </button>
            </div>
          </form>

          {/* security */}
          <form className="prf-card" onSubmit={changePassword}>
            <div className="prf-card__header">
              <h2 className="prf-card__title">Security</h2>
              <span className="prf-card__sub">Change your password</span>
            </div>

            <div className="prf-card__body">
              <div className="prf-field">
                <label htmlFor="current_pw">Current password</label>
                <input
                  id="current_pw"
                  type="password"
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="prf-field-row">
                <div className="prf-field">
                  <label htmlFor="new_pw">New password</label>
                  <input
                    id="new_pw"
                    type="password"
                    value={pwForm.next}
                    onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                    placeholder="At least 8 characters"
                    required
                  />
                </div>
                <div className="prf-field">
                  <label htmlFor="confirm_pw">Confirm new password</label>
                  <input
                    id="confirm_pw"
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="prf-card__footer">
              <button type="submit" className="prf-btn prf-btn--ghost" disabled={changingPw}>
                {changingPw ? (
                  <><i className="ti ti-loader prf-spin" /> Updating…</>
                ) : (
                  <><i className="ti ti-lock" /> Update password</>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}