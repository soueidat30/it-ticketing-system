import { useState, useEffect } from "react";
import "./EmployeeProfile.css";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";

const BASE = "http://127.0.0.1:8000/api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const tmr = setTimeout(onClose, 3200);
    return () => clearTimeout(tmr);
  }, [onClose]);

  return (
    <div className={`eprf-toast eprf-toast--${type}`}>
      <i className={`ti ${type === "success" ? "ti-circle-check" : "ti-alert-circle"}`} />
      <span>{message}</span>
    </div>
  );
}

export default function EmployeeProfile() {
  const token = localStorage.getItem("token");
  const { t } = useLanguage();

  const [user, setUser] = useState(() =>
    JSON.parse(localStorage.getItem("user") || "{}")
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [pwForm, setPwForm] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  // ── load fresh profile from server ──────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`${BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
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

  const initials = (user.full_name || "E")
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

      if (!res.ok)
        throw new Error(data?.message || t("profile.toast.couldNotSave", "Could not save changes."));

      const updated = { ...user, ...form };

      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));

      setToast({
        type: "success",
        message: t("profile.toast.profileUpdated", "Profile updated."),
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || t("profile.toast.somethingWrong", "Something went wrong."),
      });
    } finally {
      setSaving(false);
    }
  };

  // ── change password ─────────────────────────────────────────────────────
  const changePassword = async (e) => {
    e.preventDefault();

    if (pwForm.next.length < 8) {
      setToast({
        type: "error",
        message: t("profile.toast.passwordTooShort", "New password must be at least 8 characters."),
      });
      return;
    }

    if (pwForm.next !== pwForm.confirm) {
      setToast({
        type: "error",
        message: t("profile.toast.passwordMismatch", "New password and confirmation do not match."),
      });
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

      if (!res.ok)
        throw new Error(
          data?.message || t("profile.toast.couldNotChangePassword", "Could not change password.")
        );

      setPwForm({
        current: "",
        next: "",
        confirm: "",
      });

      setToast({
        type: "success",
        message: t("profile.toast.passwordChanged", "Password changed."),
      });
    } catch (err) {
      setToast({
        type: "error",
        message: err.message || t("profile.toast.somethingWrong", "Something went wrong."),
      });
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="eprf-loading">
        <i className="ti ti-loader eprf-spin" />
        <span>{t("profile.loading", "Loading profile...")}</span>
      </div>
    );
  }

  return (
    <div className="eprf-page">

      {/* ── HEADER ── */}
      <div className="eprf-header">
        <div>
          <h1 className="eprf-header__title">
            {t("profile.title", "Profile")}
          </h1>
          <p className="eprf-header__sub">
            {t("profile.subtitle", "Manage your account details and security")}
          </p>
        </div>
      </div>

      <div className="eprf-grid">

        {/* ── LEFT: identity card ── */}
        <div className="eprf-card eprf-identity">
          <div className="eprf-avatar">{initials}</div>

          <h2 className="eprf-identity__name">
            {user.full_name || t("profile.employee", "Employee")}
          </h2>

          <span className="eprf-dept-badge">
            {user.department || t("profile.staff", "Staff")}
          </span>

          <div className="eprf-identity__meta">

            <div className="eprf-identity__row">
              <i className="ti ti-mail" />
              <span>{user.email || "—"}</span>
            </div>

            {user.phone && (
              <div className="eprf-identity__row">
                <i className="ti ti-phone" />
                <span>{user.phone}</span>
              </div>
            )}

            {user.created_at && (
              <div className="eprf-identity__row">
                <i className="ti ti-calendar" />
                <span>
                  {t("profile.joined", "Joined")}{" "}
                  {new Date(user.created_at).toLocaleDateString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT: editable forms ── */}
        <div className="eprf-forms">

          {/* personal info */}
          <form className="eprf-card" onSubmit={saveProfile}>

            <div className="eprf-card__header">
              <h2 className="eprf-card__title">
                {t("profile.personal.title", "Personal Information")}
              </h2>

              <span className="eprf-card__sub">
                {t("profile.personal.subtitle", "Update your name and contact details")}
              </span>
            </div>

            <div className="eprf-card__body">

              <div className="eprf-field-row">

                <div className="eprf-field">
                  <label htmlFor="full_name">
                    {t("profile.fullName", "Full Name")}
                  </label>

                  <input
                    id="full_name"
                    type="text"
                    value={form.full_name}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder={t("profile.placeholders.fullName", "Your full name")}
                    required
                  />
                </div>

                <div className="eprf-field">
                  <label htmlFor="email">
                    {t("profile.email", "Email Address")}
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        email: e.target.value,
                      }))
                    }
                    placeholder={t("profile.placeholders.email", "you@company.com")}
                    required
                  />
                </div>

              </div>

              <div className="eprf-field-row">

                <div className="eprf-field">
                  <label htmlFor="phone">
                    {t("profile.phone", "Phone Number")}
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        phone: e.target.value,
                      }))
                    }
                    placeholder={t("profile.placeholders.phone", "Optional")}
                  />
                </div>

                <div className="eprf-field">
                  <label>
                    {t("profile.department", "Department")}
                  </label>

                  <input
                    type="text"
                    value={user.department || t("profile.staff", "Staff")}
                    disabled
                  />
                </div>

              </div>

            </div>

            <div className="eprf-card__footer">
              <button
                type="submit"
                className="eprf-btn eprf-btn--primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="ti ti-loader eprf-spin" />
                    {" "}
                    {t("profile.buttons.saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <i className="ti ti-check" />
                    {" "}
                    {t("profile.buttons.save", "Save Changes")}
                  </>
                )}
              </button>
            </div>

          </form>
              {/* security */}
          <form className="eprf-card" onSubmit={changePassword}>
            <div className="eprf-card__header">
              <h2 className="eprf-card__title">
                {t("profile.security.title", "Security")}
              </h2>
              <span className="eprf-card__sub">
                {t("profile.security.subtitle", "Change your password")}
              </span>
            </div>

            <div className="eprf-card__body">
              <div className="eprf-field">
                <label htmlFor="current_pw">
                  {t("profile.currentPassword", "Current Password")}
                </label>
                <input
                  id="current_pw"
                  type="password"
                  value={pwForm.current}
                  onChange={(e) =>
                    setPwForm((f) => ({
                      ...f,
                      current: e.target.value,
                    }))
                  }
                  placeholder={t("profile.placeholders.password", "••••••••")}
                  required
                />
              </div>

              <div className="eprf-field-row">
                <div className="eprf-field">
                  <label htmlFor="new_pw">
                    {t("profile.newPassword", "New Password")}
                  </label>
                  <input
                    id="new_pw"
                    type="password"
                    value={pwForm.next}
                    onChange={(e) =>
                      setPwForm((f) => ({
                        ...f,
                        next: e.target.value,
                      }))
                    }
                    placeholder={t("profile.placeholders.newPassword", "At least 8 characters")}
                    required
                  />
                </div>

                <div className="eprf-field">
                  <label htmlFor="confirm_pw">
                    {t("profile.confirmPassword", "Confirm New Password")}
                  </label>
                  <input
                    id="confirm_pw"
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) =>
                      setPwForm((f) => ({
                        ...f,
                        confirm: e.target.value,
                      }))
                    }
                    placeholder={t("profile.placeholders.confirmPassword", "Repeat new password")}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="eprf-card__footer">
              <button
                type="submit"
                className="eprf-btn eprf-btn--ghost"
                disabled={changingPw}
              >
                {changingPw ? (
                  <>
                    <i className="ti ti-loader eprf-spin" />
                    {" "}
                    {t("profile.buttons.updating", "Updating...")}
                  </>
                ) : (
                  <>
                    <i className="ti ti-lock" />
                    {" "}
                    {t("profile.buttons.updatePassword", "Update Password")}
                  </>
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