import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginModal.css";
import { login } from "../../../services/authService";
import logoImg from "../../../assets/logo2.png";

const LoginModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedInput, setFocusedInput] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const backdropRef = useRef(null);
  const usernameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
      setTimeout(() => usernameInputRef.current?.focus(), 300);
    } else {
      setIsVisible(false);
      setError("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => { 
      if (e.key === "Escape") onClose(); 
    };
    
    if (isOpen) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim()) { 
      setError("Please enter your username."); 
      return; 
    }
    
    if (!password) { 
      setError("Please enter your password."); 
      return; 
    }
    
    if (password.length < 5) { 
      setError("Password must be at least 5 characters."); 
      return; 
    }

    try {
      setLoading(true);

      const data = await login(username, password);

      localStorage.setItem(
        "token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      console.log("Login Success");
      console.log(data);
      const role = typeof data.user.role === "object" ? data.user.role.name : data.user.role || "employee";
      if (role === "admin") {
        navigate("/admin/dashboard");
      }
      else if (role === "manager") {
        navigate("/manager/dashboard");
      }
      else if (role === "agent") {
        navigate("/agent/dashboard");
      }
      else {
        navigate("/employee/dashboard");
      }
      onClose();

    } catch (err) {

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to connect to server.");
      }

    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className={`lm-backdrop ${isVisible ? "lm-backdrop--visible" : ""}`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Login"
    >
      <div className={`lm-container ${isVisible ? "lm-container--visible" : ""}`}>

        <button className="lm-close-btn" onClick={onClose} aria-label="Close login">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="lm-brand-panel">
          <div className="lm-brand-panel__bg" />
          <div className="lm-brand-panel__content">
            <div className="lm-brand-logo">
              <img src={logoImg} alt="Logo" className="lm-brand-logo__img" />
            </div>

            <h2 className="lm-brand-title">
              Welcome back<br />to your dashboard.
            </h2>
            <p className="lm-brand-desc">
              Sign in to access your workspace, manage projects, and stay connected with your team.
            </p>

            <div className="lm-deco-ring lm-deco-ring--1" />
            <div className="lm-deco-ring lm-deco-ring--2" />
          </div>
        </div>

        <div className="lm-form-section">
          <div className="lm-form-header">
            <h3 className="lm-form-header__title">Sign in</h3>
            <p className="lm-form-header__subtitle">Welcome back! Please enter your credentials.</p>
          </div>

          <form className="lm-login-form" onSubmit={handleSubmit} noValidate>

            <div className={`lm-field ${focusedInput === "username" ? "lm-field--focused" : ""} ${username ? "lm-field--filled" : ""}`}>
              <label className="lm-label" htmlFor="username-input">Username</label>
              <div className="lm-input-wrapper">
                <span className="lm-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M2.5 14c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="username-input"
                  ref={usernameInputRef}
                  type="text"
                  className="lm-input"
                  placeholder="ahmad"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput("")}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className={`lm-field ${focusedInput === "password" ? "lm-field--focused" : ""} ${password ? "lm-field--filled" : ""}`}>
              <label className="lm-label" htmlFor="password-input">Password</label>
              <div className="lm-input-wrapper">
                <span className="lm-input-icon">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="4" y="7" width="8" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  className="lm-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput("")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lm-toggle-pwd"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="lm-error-msg" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M7 4.5v3M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              className={`lm-submit-btn ${loading ? "lm-submit-btn--loading" : ""}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="lm-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M2.5 14c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          <p className="lm-security-note">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="2" y="5.5" width="9" height="6" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M4.5 5.5V4a2 2 0 114 0v1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            Secure access, your data is protected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;