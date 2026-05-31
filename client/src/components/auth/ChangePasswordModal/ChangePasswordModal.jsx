import { useEffect, useState, useRef } from "react";
import "./ChangePasswordModal.css";

const ChangePasswordModal = ({ isOpen, onClose, token, onBackToLogin }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [activeField, setActiveField] = useState("");
  const backdropRef = useRef(null);

  const getStrength = (password) => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strengthText = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  const currentStrength = getStrength(newPassword);

  useEffect(() => {
    if (!isOpen) return;
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleCancel = () => {
    onClose();
    if (onBackToLogin) {
      onBackToLogin();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("New password must be different from your current password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          new_password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const firstError = Object.values(data.errors)[0][0];
          setError(firstError);
        } else {
          setError(data.message || "Something went wrong. Try again.");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.href = "/";
      }, 2500);

    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={`modal-backdrop ${isOpen ? "visible" : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Change Password"
    >
      <div className={`password-modal ${isOpen ? "visible" : ""}`}>
        <button className="close-btn" onClick={handleCancel} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="modal-header">
          <div className="header-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h3 className="modal-title">Change Password</h3>
            <p className="modal-subtitle">Update your account password securely.</p>
          </div>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="#10b981" strokeWidth="2" />
                <path d="M9 16l5 5 9-9" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h4 className="success-title">Password changed!</h4>
            <p className="success-text">You'll be redirected to sign in again with your new password.</p>
          </div>
        ) : (
          <form className="password-form" onSubmit={handleSubmit} noValidate>

            <div className={`form-field ${activeField === "current" ? "focused" : ""} ${currentPassword ? "has-value" : ""}`}>
              <label className="field-label" htmlFor="current-password">Current Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  className="form-input"
                  placeholder="Your current password"
                  autoFocus
                  value={currentPassword}
                  onChange={(e) => { setCurrentPassword(e.target.value); setError(""); }}
                  onFocus={() => setActiveField("current")}
                  onBlur={() => setActiveField("")}
                  autoComplete="current-password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowCurrent(v => !v)} tabIndex={-1} aria-label="Toggle visibility">
                  {showCurrent
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>
            </div>

            <div className={`form-field ${activeField === "new" ? "focused" : ""} ${newPassword ? "has-value" : ""}`}>
              <label className="field-label" htmlFor="new-password">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="new-password"
                  type={showNew ? "text" : "password"}
                  className="form-input"
                  placeholder="Min. 8 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  onFocus={() => setActiveField("new")}
                  onBlur={() => setActiveField("")}
                  autoComplete="new-password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowNew(v => !v)} tabIndex={-1} aria-label="Toggle visibility">
                  {showNew
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>

              {newPassword && (
                <div className="strength-meter">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className="strength-bar"
                        style={{ background: currentStrength >= level ? strengthColors[currentStrength] : "#e5e7eb" }}
                      />
                    ))}
                  </div>
                  <span className="strength-text" style={{ color: strengthColors[currentStrength] }}>
                    {strengthText[currentStrength]}
                  </span>
                </div>
              )}
            </div>

            <div className={`form-field ${activeField === "confirm" ? "focused" : ""} ${confirmPassword ? "has-value" : ""}`}>
              <label className="field-label" htmlFor="confirm-password">Confirm New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  className="form-input"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  onFocus={() => setActiveField("confirm")}
                  onBlur={() => setActiveField("")}
                  autoComplete="new-password"
                />
                <button type="button" className="toggle-password" onClick={() => setShowConfirm(v => !v)} tabIndex={-1} aria-label="Toggle visibility">
                  {showConfirm
                    ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5"/><circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  }
                </button>
              </div>

              {confirmPassword && (
                <p className="match-status" style={{ color: confirmPassword === newPassword ? "#10b981" : "#ef4444" }}>
                  {confirmPassword === newPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"
                  }
                </p>
              )}
            </div>

            {error && (
              <div className="error-message" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <div className="action-buttons">
              <button type="button" className="btn btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-submit" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Updating...</>
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

            <p className="security-note">
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