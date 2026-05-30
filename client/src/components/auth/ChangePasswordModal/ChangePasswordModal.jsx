import { useEffect, useState, useRef } from "react";
import "./ChangePasswordModal.css";

const ChangePasswordModal = ({ isOpen, onClose, token, onBackToLogin }) => {
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showCurrent, setShowCurrent]           = useState(false);
  const [showNew, setShowNew]                   = useState(false);
  const [showConfirm, setShowConfirm]           = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState("");
  const [success, setSuccess]                   = useState(false);
  const [focusedInput, setFocusedInput]         = useState("");
  const [isVisible, setIsVisible]               = useState(false);
  const backdropRef                             = useRef(null);
  const firstInputRef                           = useRef(null);

  // ── Strength meter ────────────────────────────────────────
  const getStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)               score++;
    if (/[A-Z]/.test(pwd))            score++;
    if (/[0-9]/.test(pwd))            score++;
    if (/[^A-Za-z0-9]/.test(pwd))     score++;
    return score; // 0-4
  };

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  const pwStrength    = getStrength(newPassword);

  // ── Mount animation ───────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      setTimeout(() => firstInputRef.current?.focus(), 300);
    } else {
      setIsVisible(false);
      setError("");
      setSuccess(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  // ── Escape key ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // ── Body scroll lock ──────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleCancel = () => {
    onClose(); // Close change password modal
    if (onBackToLogin) {
      onBackToLogin(); // Reopen login modal
    }
  };

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Frontend validation
    if (!currentPassword)              { setError("Please enter your current password."); return; }
    if (!newPassword)                  { setError("Please enter a new password."); return; }
    if (newPassword.length < 8)        { setError("New password must be at least 8 characters."); return; }
    if (newPassword === currentPassword) { setError("New password must be different from your current password."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Accept":        "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password:          currentPassword,
          new_password:              newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Laravel validation errors come as { errors: { field: [msg] } }
        if (data.errors) {
          const firstError = Object.values(data.errors)[0][0];
          setError(firstError);
        } else {
          setError(data.message || "Something went wrong. Try again.");
        }
        return;
      }

      // Success — show confirmation then close & force re-login
      setSuccess(true);
      setTimeout(() => {
        onClose();
        // Token is now invalidated by backend — redirect to home to re-login
        window.location.href = "/";
      }, 2500);

    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={`cp-overlay ${isVisible ? "cp-overlay--show" : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Change Password"
    >
      <div className={`cp-modal ${isVisible ? "cp-modal--show" : ""}`}>

        {/* Close */}
        <button className="cp-close" onClick={handleCancel} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* ── Header ── */}
        <div className="cp-header">
          <div className="cp-header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h3 className="cp-title">Change Password</h3>
            <p className="cp-subtitle">Update your account password securely.</p>
          </div>
        </div>

        {/* ── Success state ── */}
        {success ? (
          <div className="cp-success">
            <div className="cp-success-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="#10b981" strokeWidth="2" />
                <path d="M9 16l5 5 9-9" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="cp-success-title">Password changed!</h4>
            <p className="cp-success-msg">You'll be redirected to sign in again with your new password.</p>
          </div>
        ) : (
          <form className="cp-form" onSubmit={handleSubmit} noValidate>

            {/* Current password */}
            <div className={`cp-field ${focusedInput === "current" ? "cp-field--focused" : ""} ${currentPassword ? "cp-field--filled" : ""}`}>
              <label className="cp-label" htmlFor="cp-current">Current Password</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="cp-current"
                  ref={firstInputRef}
                  type={showCurrent ? "text" : "password"}
                  className="cp-input"
                  placeholder="Your current password"
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedInput("current")}
                  onBlur={() => setFocusedInput("")}
                  autoComplete="current-password"
                />
                <button type="button" className="cp-eye" onClick={() => setShowCurrent(v => !v)} tabIndex={-1} aria-label="Toggle">
                  {showCurrent
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* New password */}
            <div className={`cp-field ${focusedInput === "new" ? "cp-field--focused" : ""} ${newPassword ? "cp-field--filled" : ""}`}>
              <label className="cp-label" htmlFor="cp-new">New Password</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="cp-new"
                  type={showNew ? "text" : "password"}
                  className="cp-input"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedInput("new")}
                  onBlur={() => setFocusedInput("")}
                  autoComplete="new-password"
                />
                <button type="button" className="cp-eye" onClick={() => setShowNew(v => !v)} tabIndex={-1} aria-label="Toggle">
                  {showNew
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>

              {/* Strength meter */}
              {newPassword && (
                <div className="cp-strength">
                  <div className="cp-strength-bars">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="cp-strength-bar"
                        style={{ background: pwStrength >= level ? strengthColor[pwStrength] : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <span className="cp-strength-label" style={{ color: strengthColor[pwStrength] }}>
                    {strengthLabel[pwStrength]}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className={`cp-field ${focusedInput === "confirm" ? "cp-field--focused" : ""} ${confirmPassword ? "cp-field--filled" : ""}`}>
              <label className="cp-label" htmlFor="cp-confirm">Confirm New Password</label>
              <div className="cp-input-wrap">
                <span className="cp-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="cp-confirm"
                  type={showConfirm ? "text" : "password"}
                  className="cp-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedInput("confirm")}
                  onBlur={() => setFocusedInput("")}
                  autoComplete="new-password"
                />
                <button type="button" className="cp-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label="Toggle">
                  {showConfirm
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword && (
                <p className="cp-match" style={{ color: confirmPassword === newPassword ? "#10b981" : "#ef4444" }}>
                  {confirmPassword === newPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"
                  }
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="cp-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="cp-actions">
              <button type="button" className="cp-btn cp-btn--cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="cp-btn cp-btn--submit" disabled={loading}>
                {loading ? (
                  <><span className="cp-spinner" /> Updating...</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <rect x="3" y="7" width="9" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    Update Password
                  </>
                )}
              </button>
            </div>

            {/* Security hint */}
            <p className="cp-hint">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M6.5 5.5v3M6.5 4.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              After changing your password, you'll be signed out and redirected to login.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangePasswordModal;