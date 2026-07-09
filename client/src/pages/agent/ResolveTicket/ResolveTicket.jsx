import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./ResolveTicket.css";

const Icon = ({ d, size = 16 }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}
  >
    <path d={d} />
  </svg>
);

const IC = {
  check:    "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  checkSm:  "M20 6L9 17l-5-5",
  back:     "M19 12H5 M12 19l-7-7 7-7",
  fix:      "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  guide:    "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  escalate: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  replace:  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  clock:    "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  ticket:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  home:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  user:     "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  tag:      "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  warning:  "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  userPlus:  "M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M8.5 11a4 4 0 100-8 4 4 0 000 8z M20 8v6 M23 11h-6",
  mail:     "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
  clock2:   "M12 6v6l4 2",
  shield:   "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
};

// Localized resolution types — rebuild whenever language changes
const buildResolutionTypes = (t) => [
  { key: "fix",      label: t("agent.resolveTicket.types.fix.label",      "Issue Fixed"),
    desc: t("agent.resolveTicket.types.fix.desc",      "Root cause identified and resolved"),
    icon: "fix",      bg: "#dcfce7", color: "#15803d" },
  { key: "guide",    label: t("agent.resolveTicket.types.guide.label",    "User Guided"),
    desc: t("agent.resolveTicket.types.guide.desc",    "User trained / walked through solution"),
    icon: "guide",    bg: "#dbeafe", color: "#1d4ed8" },
  { key: "escalate", label: t("agent.resolveTicket.types.escalate.label", "Escalated"),
    desc: t("agent.resolveTicket.types.escalate.desc", "Escalated to senior team / vendor"),
    icon: "escalate", bg: "#ffedd5", color: "#c2410c" },
  { key: "replace",  label: t("agent.resolveTicket.types.replace.label",  "Replaced"),
    desc: t("agent.resolveTicket.types.replace.desc",  "Hardware / software was replaced"),
    icon: "replace",  bg: "#ede9fe", color: "#6d28d9" },
];

const BASE_URL = "http://127.0.0.1:8000/api";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const formatCharsLeft = (n) => {
  if (n === 0) return "0 left";
  if (n === 1) return "1 character left";
  return `${n} characters left`;
};

export default function ResolveTicket() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = useMemo(() => localStorage.getItem("token"), []);
  const { t, language } = useLanguage();
  const ticketId  = location?.state?.ticketId;

  // Re-localized config
  const RESOLUTION_TYPES = useMemo(() => buildResolutionTypes(t), [t, language]);

  // Checklist items (localized)
  const CHECKLIST_ITEMS = useMemo(() => [
    t("agent.resolveTicket.checklistItems.0", "Issue has been fully reproduced and confirmed"),
    t("agent.resolveTicket.checklistItems.1", "Root cause identified and documented"),
    t("agent.resolveTicket.checklistItems.2", "Solution applied and tested by agent"),
    t("agent.resolveTicket.checklistItems.3", "User confirmed the issue is resolved"),
    t("agent.resolveTicket.checklistItems.4", "Knowledge base article created / updated"),
  ], [t, language]);

  // Self-rate labels
  const RATING_LABELS = useMemo(() => [
    t("agent.resolveTicket.ratings.0", "Poor"),
    t("agent.resolveTicket.ratings.1", "Fair"),
    t("agent.resolveTicket.ratings.2", "Good"),
    t("agent.resolveTicket.ratings.3", "Very Good"),
    t("agent.resolveTicket.ratings.4", "Excellent"),
  ], [t, language]);

  // Resolution tips
  const TIPS = useMemo(() => [
    t("agent.resolveTicket.tipList.0", "Be specific about what steps resolved the issue."),
    t("agent.resolveTicket.tipList.1", "Document for the knowledge base so others can self-serve next time."),
    t("agent.resolveTicket.tipList.2", "Always confirm with the user before closing."),
    t("agent.resolveTicket.tipList.3", "Log time accurately for SLA reporting."),
  ], [t, language]);

  // ── Data ─────────────────────────────────────────────────
  const [ticket,  setTicket]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── Form state ────────────────────────────────────────────
  const [resType,   setResType]   = useState("");
  const [solution,  setSolution]  = useState("");
  const [rootCause, setRootCause] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [timeUnit,  setTimeUnit]  = useState("minutes");
  const [rating,    setRating]    = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [checks,    setChecks]    = useState([]);
  const [notes,     setNotes]     = useState("");

  // Reset checks when CHECKLIST_ITEMS changes (language switch)
  useEffect(() => {
    setChecks(Array(CHECKLIST_ITEMS.length).fill(false));
  }, [CHECKLIST_ITEMS.length]);

  // ── Submit state ──────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);

  const checkedCount = checks.filter(Boolean).length;
  const hasResType   = !!resType;
  const hasSolution  = solution.trim().length >= 20;
  const canResolve   = hasResType && hasSolution;
  const doneCount    = [hasResType, hasSolution].filter(Boolean).length;

  const charsLeft  = Math.max(0, 20 - solution.length);
  const charsReady = solution.trim().length >= 20;

  const toggleCheck = (i) =>
    setChecks((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!ticketId) {
        setError(t("agent.resolveTicket.noTicketSelected", "No ticket selected."));
        setLoading(false);
        return;
      }
      try {
        const res  = await fetch(`${BASE_URL}/agent/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) throw new Error(t("agent.resolveTicket.loadFailed", "Failed to load ticket."));
        const data = await res.json();
        if (!alive) return;

        const t = data.ticket ?? data;
        setTicket(t);
        setHistory(data.history ?? []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || t("agent.resolveTicket.loadErrorGeneric", "Failed to load ticket."));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId, token]);

  // ── Submit ────────────────────────────────────────────────
  const handleResolve = async () => {
    if (!canResolve) return;
    setError("");
    setSubmitting(true);
    try {
      const res  = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/resolve`, {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          resolution_type: resType,
          solution,
          root_cause:      rootCause,
          time_spent:      timeSpent ? Number(timeSpent) : null,
          time_unit:       timeUnit,
          internal_notes:  notes,
          rating,
          notify_user:     true,
          notify_manager:  false,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || t("agent.resolveTicket.resolveFailed", "Resolve failed"));
      if (data?.ticket) setTicket(data.ticket);
      setSuccess(true);
    } catch (e) {
      setError(e?.message || t("agent.resolveTicket.resolveFailed", "Failed to resolve ticket."));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Priority / Status badges (use t() for labels) ────────
  const PriorityBadge = ({ p = "low" }) => {
    const v = String(p ?? "low").toLowerCase();
    return <span className={`agent-badge agent-badge--${v}`}>{t(`agent.priority.${v}`, p)}</span>;
  };
  const StatusBadge = ({ s = "open" }) => {
    const v = String(s ?? "open").toLowerCase().replace(/\s+/g, "-");
    return (
      <span className={`agent-badge agent-badge--${v}`}>
        {t(`agent.status.${v}`, String(s).replace(/-/g, " "))}
      </span>
    );
  };

  // ── Derived ticket fields ────────────────────────────────
  const ticketNumber   = ticket?.ticket_number ?? ticket?.id ?? "—";
  const ticketTitle    = ticket?.title         ?? t("agent.resolveTicket.untitled", "Untitled Ticket");
  const ticketDesc     = ticket?.description   ?? t("agent.resolveTicket.noDescription", "No description provided.");
  const requesterName  = ticket?.user?.full_name  ?? ticket?.user?.username ?? t("common.unknown", "Unknown");
  const requesterDept  = ticket?.user?.department ?? t("common.na", "N/A");
  const requesterEmail = ticket?.user?.email ?? "—";
  const assigneeName   = ticket?.assignee?.full_name ?? ticket?.assignee?.username ?? t("common.unassigned", "Unassigned");
  const categoryName   = ticket?.category?.category_name ?? t("agent.resolveTicket.general", "General");
  const priorityName   = String(ticket?.priority?.priority_name ?? "low").toLowerCase();
  const statusName     = ticket?.status?.status_name ?? "open";
  const createdLabel   = formatDate(ticket?.created_at);
  const dueLabel       = formatDate(ticket?.due_at);
  const timeOpen       = ticket?.time_open ?? "—";
  const slaBreached    = ticket?.sla_breached ?? false;

  // ── Render ────────────────────────────────────────────────
  if (loading) return (
    <div className="resolve-ticket">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.resolveTicket.title", "Resolve Ticket")}</h1>
          <p className="agent-page-subtitle">{t("agent.resolveTicket.loadingSubtitle", "Loading ticket…")}</p>
        </div>
      </div>
    </div>
  );

  if (!ticket && !success) return (
    <div className="resolve-ticket">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.resolveTicket.title", "Resolve Ticket")}</h1>
          <p className="agent-page-subtitle rt-subtitle-error">{error || t("agent.resolveTicket.notFound", "Ticket not found.")}</p>
        </div>
        <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> {t("common.back", "Back")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="resolve-ticket">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">{t("agent.resolveTicket.title", "Resolve Ticket")}</h1>
          <p className="agent-page-subtitle">
            {t("agent.resolveTicket.subtitle", "Document the solution and close this ticket")}
          </p>
        </div>
        <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> {t("common.back", "Back")}
        </button>
      </div>

      {ticket && (
        <div className="rt-layout">

          {/* ── Left column ── */}
          <div>

            {/* ── Summary card ── */}
            <div className="rt-summary-card">
              <div className="rt-summary-top">
                <span className="rt-summary-id">#{ticketNumber}</span>
                <div className="rt-summary-badges">
                  {slaBreached && (
                    <span className="rt-sla-badge">
                      {t("agent.resolveTicket.slaBreached", "SLA BREACHED")}
                    </span>
                  )}
                  <PriorityBadge p={priorityName} />
                  <StatusBadge   s={statusName} />
                </div>
              </div>

              <div className="rt-summary-title">{ticketTitle}</div>
              <div className="rt-summary-desc">{ticketDesc}</div>

              <div className="rt-summary-meta">
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.requester", "Requester")}</span>
                  <span className="rt-summary-meta-value">
                    <Icon d={IC.user} size={12} /> {requesterName}
                    {requesterDept !== t("common.na", "N/A") && (
                      <span className="rt-summary-dept"> · {requesterDept}</span>
                    )}
                  </span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.email", "Email")}</span>
                  <span className="rt-summary-meta-value rt-meta-truncate">{requesterEmail}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.assignee", "Assignee")}</span>
                  <span className="rt-summary-meta-value">{assigneeName}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.category", "Category")}</span>
                  <span className="rt-summary-meta-value">
                    <Icon d={IC.tag} size={12} /> {categoryName}
                  </span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.created", "Created")}</span>
                  <span className="rt-summary-meta-value">{createdLabel}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.due", "Due")}</span>
                  <span className={`rt-summary-meta-value ${slaBreached ? "rt-meta-danger" : ""}`}>{dueLabel}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">{t("agent.resolveTicket.timeOpen", "Time Open")}</span>
                  <span className="rt-summary-meta-value">{timeOpen}</span>
                </div>
              </div>
            </div>

            {/* ── Resolution form ── */}
            <div className="rt-form-card">
              <div className="rt-form-header">
                <div className="rt-form-header-icon"><Icon d={IC.check} /></div>
                <div>
                  <div className="rt-form-header-title">
                    {t("agent.resolveTicket.formTitle", "Resolution Details")}
                  </div>
                  <div className="rt-form-header-sub">
                    {t("agent.resolveTicket.formSubtitle", "Complete all steps to unlock the resolve button")}
                  </div>
                </div>

                <div className={`rt-progress-pill rt-progress-${doneCount}`}>
                  {t("agent.resolveTicket.complete", "{{done}}/2 complete", { done: doneCount })}
                </div>
              </div>

              <div className="rt-form-body">

                {/* Step 1 — Resolution type */}
                <div className="rt-field">
                  <label className="rt-label">
                    <span className={`rt-step-num${hasResType ? " done" : ""}`}>
                      {hasResType ? <Icon d={IC.checkSm} size={11} /> : "1"}
                    </span>
                    {t("agent.resolveTicket.resolutionType", "Resolution Type")}{" "}
                    <span className="rt-label-required">*</span>
                  </label>
                  <div className="rt-type-grid">
                    {RESOLUTION_TYPES.map((rt) => (
                      <button
                        key={rt.key}
                        className={`rt-type-btn${resType === rt.key ? " selected" : ""}`}
                        onClick={() => setResType(rt.key)}
                      >
                        <div className="rt-type-btn-icon" style={{ background: rt.bg, color: rt.color }}>
                          <Icon d={IC[rt.icon]} />
                        </div>
                        <div className="rt-type-btn-label">{rt.label}</div>
                        <div className="rt-type-btn-desc">{rt.desc}</div>
                        {resType === rt.key && (
                          <div className="rt-type-check"><Icon d={IC.checkSm} size={10} /></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 2 — Solution */}
                <div className="rt-field">
                  <label className="rt-label">
                    <span className={`rt-step-num${hasSolution ? " done" : ""}`}>
                      {hasSolution ? <Icon d={IC.checkSm} size={11} /> : "2"}
                    </span>
                    {t("agent.resolveTicket.solutionDesc", "Solution Description")}{" "}
                    <span className="rt-label-required">*</span>
                  </label>
                  <textarea
                    className="rt-textarea"
                    placeholder={t("agent.resolveTicket.solutionPh", "Describe exactly what you did to resolve this issue. Be specific — this will be visible to the user and stored in the knowledge base…")}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={5}
                  />
                  <div className="rt-char-bar">
                    <div
                      className={`rt-char-bar-fill${charsReady ? " done" : ""}`}
                      style={{ width: `${Math.min((solution.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="rt-hint">
                    {!charsReady
                      ? t("agent.resolveTicket.moreCharsNeeded", "{{count}} more characters needed", { count: charsLeft })
                      : t("agent.resolveTicket.charsGood", "✓ {{count}} characters — good to go", { count: solution.length })}
                  </span>
                </div>

                {/* Optional fields */}
                <div className="rt-field">
                  <label className="rt-label">
                    {t("agent.resolveTicket.rootCause", "Root Cause Analysis")}{" "}
                    <span className="rt-label-optional">
                      {t("agent.resolveTicket.optionalInline", "(optional)")}
                    </span>
                  </label>
                  <textarea
                    className="rt-textarea"
                    placeholder={t("agent.resolveTicket.rootCausePh", "What was the underlying cause of this issue? Recommended for recurring issues.")}
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="rt-field">
                  <label className="rt-label">
                    {t("agent.resolveTicket.timeSpent", "Time Spent")}{" "}
                    <span className="rt-label-optional">
                      {t("agent.resolveTicket.optionalInline", "(optional)")}
                    </span>
                  </label>
                  <div className="rt-time-row">
                    <input
                      type="number"
                      className="rt-input"
                      placeholder={t("agent.resolveTicket.timeSpentPh", "e.g. 45")}
                      min={1}
                      value={timeSpent}
                      onChange={(e) => setTimeSpent(e.target.value)}
                    />
                    <select className="rt-select" value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
                      <option value="minutes">{t("agent.resolveTicket.minutes", "Minutes")}</option>
                      <option value="hours">{t("agent.resolveTicket.hours", "Hours")}</option>
                    </select>
                  </div>
                </div>

                

                <div className="rt-field">
                  <label className="rt-label">
                    {t("agent.resolveTicket.selfRate", "Self-Rate Your Resolution")}{" "}
                    <span className="rt-label-optional">
                      {t("agent.resolveTicket.optionalInline", "(optional)")}
                    </span>
                  </label>
                  <div className="rt-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        className="rt-star-btn"
                        style={{ color: s <= (hoverStar || rating) ? "#f59e0b" : "var(--agent-border)" }}
                        onMouseEnter={() => setHoverStar(s)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setRating(s)}
                        type="button"
                      >★</button>
                    ))}
                    {rating > 0 && (
                      <span className="rt-star-label">{RATING_LABELS[rating - 1]}</span>
                    )}
                  </div>
                </div>

                <div className="rt-field">
                  <label className="rt-label">
                    {t("agent.resolveTicket.checklist", "Resolution Checklist")}{" "}
                    <span className="rt-label-optional">
                      {t("agent.resolveTicket.checklistOptional", "(optional — check what applies)")}
                    </span>
                    <span className="rt-checklist-count">{checkedCount}/{CHECKLIST_ITEMS.length}</span>
                  </label>
                  <div className="rt-checklist">
                    {CHECKLIST_ITEMS.map((item, i) => (
                      <div
                        key={i}
                        className={`rt-check-item${checks[i] ? " checked" : ""}`}
                        onClick={() => toggleCheck(i)}
                      >
                        <div className="rt-check-box">
                          {checks[i] && <Icon d={IC.checkSm} size={11} />}
                        </div>
                        <span className="rt-check-label">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {!canResolve && (
                  <div className="rt-requirements">
                    <div className="rt-requirements-title">
                      <Icon d={IC.warning} size={13} />
                      {t("agent.resolveTicket.completeToUnlock", "Complete these to unlock resolve:")}
                    </div>
                    <div className="rt-requirements-list">
                      <div className={`rt-req-item${hasResType ? " done" : ""}`}>
                        <span className="rt-req-dot" />
                        {t("agent.resolveTicket.selectResolutionType", "Select a resolution type")}
                      </div>
                      <div className={`rt-req-item${hasSolution ? " done" : ""}`}>
                        <span className="rt-req-dot" />
                        {t("agent.resolveTicket.writeSolutionMin", "Write a solution (min 20 characters — {{status}})", {
                          status: charsReady
                            ? t("agent.resolveTicket.done", "✓")
                            : t("agent.resolveTicket.leftChars", "{{count}} left", { count: charsLeft })
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rt-error-box">
                    <Icon d={IC.warning} size={14} /> {error}
                  </div>
                )}
              </div>

              <div className="rt-form-actions">
                <button
                  className="agent-btn agent-btn--ghost"
                  onClick={() => navigate("/agent/assigned-tickets")}
                >
                  {t("agent.resolveTicket.cancel", "Cancel")}
                </button>
                <button
                  className="rt-btn-resolve"
                  onClick={handleResolve}
                  disabled={submitting || !canResolve || success}
                >
                  {submitting ? (
                    <>
                      <svg className="rt-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      {t("agent.resolveTicket.resolving", "Resolving…")}
                    </>
                  ) : (
                    <>
                      <Icon d={IC.check} size={16} />
                      {t("agent.resolveTicket.markResolved", "Mark as Resolved")}
                      {!canResolve && (
                        <span className="rt-btn-hint">
                          ({t("agent.resolveTicket.stepsHint", "({{done}}/2 steps done)", { done: doneCount })})
                        </span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="rt-sidebar">
            <div className="rt-info-card">
              <div className="rt-info-header">
                {t("agent.resolveTicket.timeline", "Ticket Timeline")}
              </div>
              <div className="rt-timeline">
                {history.length > 0 ? history.map((ev, i) => (
                  <div className="rt-timeline-item" key={ev.id ?? i}>
                    <div className="rt-timeline-line-col">
                      <div className={`rt-timeline-dot rt-timeline-dot--${ev.type ?? "status"}`} />
                      {i < history.length - 1 && <div className="rt-timeline-connector" />}
                    </div>
                    <div className="rt-timeline-content">
                      <div className="rt-timeline-event">{ev.event}</div>
                      <div className="rt-timeline-actor">{ev.actor}</div>
                      <div className="rt-timeline-time">{ev.time}</div>
                      {ev.note && <div className="rt-timeline-note">"{ev.note}"</div>}
                    </div>
                  </div>
                )) : (
                  <div className="rt-timeline-empty">
                    {t("agent.resolveTicket.noTimeline", "No timeline events yet.")}
                  </div>
                )}
              </div>
            </div>

            <div className="rt-info-card">
              <div className="rt-info-header">
                {t("agent.resolveTicket.tips", "💡 Resolution Tips")}
              </div>
              <div className="rt-info-body">
                {TIPS.map((tip, i) => (
                  <div key={i} className="rt-tip">
                    <span className="rt-tip-arrow">→</span> {tip}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {success && ticket && (
        <div className="rt-success-overlay">
          <div className="rt-success-modal">
            <div className="rt-success-icon">
              <Icon d={IC.check} size={36} />
            </div>
            <div className="rt-success-title">
              {t("agent.resolveTicket.successTitle", "Ticket Resolved! 🎉")}
            </div>
            <div className="rt-success-desc">
              {t("agent.resolveTicket.successDesc", "Ticket #{{id}} has been successfully resolved and closed. The requester will be notified automatically.", { id: ticket.ticket_number ?? ticket.id })}
            </div>
            <div className="rt-success-id">
              #{ticket.ticket_number ?? ticket.id} — {t("agent.resolveTicket.resolvedTag", "Resolved")}
            </div>
            <div className="rt-success-actions">
              <button className="agent-btn agent-btn--ghost" onClick={() => navigate("/agent/assigned-tickets")}>
                <Icon d={IC.ticket} /> {t("agent.resolveTicket.myTickets", "My Tickets")}
              </button>
              <button className="agent-btn agent-btn--primary" onClick={() => navigate("/agent/dashboard")}>
                <Icon d={IC.home} /> {t("agent.resolveTicket.dashboard", "Dashboard")}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}