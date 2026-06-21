import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  check:   "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  checkSm: "M20 6L9 17l-5-5",
  back:    "M19 12H5 M12 19l-7-7 7-7",
  fix:     "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  guide:   "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  escalate:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  replace: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  clock:   "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  ticket:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  home:    "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
  user:    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  tag:     "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
};

const RESOLUTION_TYPES = [
  { key: "fix",      label: "Issue Fixed",  desc: "Root cause identified and resolved",      icon: "fix",      bg: "#dcfce7", color: "#15803d" },
  { key: "guide",    label: "User Guided",  desc: "User trained / walked through solution",  icon: "guide",    bg: "#dbeafe", color: "#1d4ed8" },
  { key: "escalate", label: "Escalated",    desc: "Escalated to senior team / vendor",       icon: "escalate", bg: "#ffedd5", color: "#c2410c" },
  { key: "replace",  label: "Replaced",     desc: "Hardware / software was replaced",        icon: "replace",  bg: "#ede9fe", color: "#6d28d9" },
];

const CHECKLIST_ITEMS = [
  "Issue has been fully reproduced and confirmed",
  "Root cause identified and documented",
  "Solution applied and tested by agent",
  "User confirmed the issue is resolved",
  "Knowledge base article created / updated",
];

const BASE_URL = "http://127.0.0.1:8000/api";

const PriorityBadge = ({ p = "low" }) => {
  const v = String(p ?? "low").toLowerCase();
  return <span className={`agent-badge agent-badge--${v}`}>{v}</span>;
};
const StatusBadge = ({ s = "open" }) => {
  const v = String(s ?? "open").toLowerCase().replace(/\s+/g, "-");
  return <span className={`agent-badge agent-badge--${v}`}>{String(s).replace(/-/g, " ")}</span>;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function ResolveTicket() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const token     = useMemo(() => localStorage.getItem("token"), []);
  const ticketId  = location?.state?.ticketId;

  // ── Data ─────────────────────────────────────────────────
  const [ticket,  setTicket]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Form state ────────────────────────────────────────────
  const [resType,   setResType]   = useState("");
  const [solution,  setSolution]  = useState("");
  const [rootCause, setRootCause] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [timeUnit,  setTimeUnit]  = useState("minutes");
  const [rating,    setRating]    = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [checks,    setChecks]    = useState(Array(CHECKLIST_ITEMS.length).fill(false));
  const [notes,     setNotes]     = useState("");

  // ── Submit state ──────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  // ── Readiness ─────────────────────────────────────────────
  // const allChecked  = checks.every(Boolean);
  const checkedCount = checks.filter(Boolean).length;

  const hasResType  = !!resType;
  const hasSolution = solution.trim().length >= 20;
  // Checklist is optional — agents can check as many or as few as apply.
  const canResolve  = hasResType && hasSolution;

  // How many of the 2 required steps are done (for the progress hint)
  const doneCount   = [hasResType, hasSolution].filter(Boolean).length;

  const toggleCheck = (i) =>
    setChecks((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });

  // ── Fetch ─────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!ticketId) { setError("No ticket selected."); setLoading(false); return; }
      try {
        const res  = await fetch(`${BASE_URL}/agent/tickets/${ticketId}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Failed to load ticket (${res.status})`);
        const data = await res.json();
        if (!alive) return;

        // API returns { ticket, comments, attachments, history } from show()
        // OR a flat ticket object from some other callers — handle both
        const t = data.ticket ?? data;
        setTicket(t);
        setHistory(data.history ?? []);   // already shaped: [{event,actor,time,type,note}]
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load ticket.");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
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
          // Backend expects internal_notes (not internal_notes vs internal_notes spelling mismatch)
          internal_notes:  notes,
          rating,
          notify_user:     true,
          notify_manager:  false,

        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Resolve failed (${res.status})`);
      if (data?.ticket) setTicket(data.ticket);
      setSuccess(true);
    } catch (e) {
      setError(e?.message || "Failed to resolve ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived ticket fields (safe accessors) ────────────────
  const ticketNumber   = ticket?.ticket_number ?? ticket?.id ?? "—";
  const ticketTitle    = ticket?.title         ?? "Untitled Ticket";
  const ticketDesc     = ticket?.description   ?? "No description provided.";
  const requesterName  = ticket?.user?.full_name  ?? ticket?.user?.username ?? "Unknown";
  const requesterDept  = ticket?.user?.department ?? "—";
  const requesterEmail = ticket?.user?.email ?? "—";
  const assigneeName   = ticket?.assignee?.full_name ?? ticket?.assignee?.username ?? "Unassigned";
  const categoryName   = ticket?.category?.category_name ?? "General";
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
        <div><h1 className="agent-page-title">Resolve Ticket</h1>
        <p className="agent-page-subtitle">Loading ticket…</p></div>
      </div>
    </div>
  );

  if (!ticket && !success) return (
    <div className="resolve-ticket">
      <div className="agent-page-header">
        <div><h1 className="agent-page-title">Resolve Ticket</h1>
        <p className="agent-page-subtitle" style={{ color: "var(--agent-danger)" }}>{error || "Ticket not found."}</p></div>
        <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}><Icon d={IC.back} /> Back</button>
      </div>
    </div>
  );

  return (
    <div className="resolve-ticket">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Resolve Ticket</h1>
          <p className="agent-page-subtitle">Document the solution and close this ticket</p>
        </div>
        <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> Back
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
                    <span className="rt-sla-badge">SLA BREACHED</span>
                  )}
                  <PriorityBadge p={priorityName} />
                  <StatusBadge   s={statusName} />
                </div>
              </div>

              <div className="rt-summary-title">{ticketTitle}</div>
              <div className="rt-summary-desc">{ticketDesc}</div>

              <div className="rt-summary-meta">
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Requester</span>
                  <span className="rt-summary-meta-value">
                    <Icon d={IC.user} size={12} /> {requesterName}
                    {requesterDept !== "—" && <span className="rt-summary-dept"> · {requesterDept}</span>}
                  </span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Email</span>
                  <span className="rt-summary-meta-value">{requesterEmail}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Assignee</span>
                  <span className="rt-summary-meta-value">{assigneeName}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Category</span>
                  <span className="rt-summary-meta-value">
                    <Icon d={IC.tag} size={12} /> {categoryName}
                  </span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Created</span>
                  <span className="rt-summary-meta-value">{createdLabel}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Due</span>
                  <span className="rt-summary-meta-value" style={slaBreached ? { color: "var(--agent-danger)", fontWeight: 700 } : {}}>{dueLabel}</span>
                </div>
                <div className="rt-summary-meta-item">
                  <span className="rt-summary-meta-label">Time Open</span>
                  <span className="rt-summary-meta-value">{timeOpen}</span>
                </div>
              </div>
            </div>

            {/* ── Resolution form ── */}
            <div className="rt-form-card">
              <div className="rt-form-header">
                <div className="rt-form-header-icon"><Icon d={IC.check} /></div>
                <div>
                  <div className="rt-form-header-title">Resolution Details</div>
                  <div className="rt-form-header-sub">Complete all steps to unlock the resolve button</div>
                </div>

                {/* Live progress pill */}
                <div className="rt-progress-pill" data-done={doneCount === 2 ? "all" : doneCount}>
                  {doneCount}/2 complete
                </div>
              </div>

              <div className="rt-form-body">

                {/* Step 1 — Resolution type */}
                <div className="rt-field">
                  <label className="rt-label">
                    <span className={`rt-step-num${hasResType ? " done" : ""}`}>
                      {hasResType ? <Icon d={IC.checkSm} size={11} /> : "1"}
                    </span>
                    Resolution Type <span className="rt-label-required">*</span>
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
                    Solution Description <span className="rt-label-required">*</span>
                  </label>
                  <textarea
                    className="rt-textarea"
                    placeholder="Describe exactly what you did to resolve this issue. Be specific — this will be visible to the user and stored in the knowledge base…"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={5}
                  />
                  <div className="rt-char-bar">
                    <div
                      className={`rt-char-bar-fill${hasSolution ? " done" : ""}`}
                      style={{ width: `${Math.min((solution.length / 20) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="rt-hint">
                    {!hasSolution
                      ? `${20 - solution.length} more characters needed`
                      : `✓ ${solution.length} characters — good to go`}
                  </span>
                </div>

                {/* Optional fields */}
                <div className="rt-field">
                  <label className="rt-label">Root Cause Analysis <span className="rt-label-optional">(optional)</span></label>
                  <textarea
                    className="rt-textarea"
                    placeholder="What was the underlying cause of this issue? Recommended for recurring issues."
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="rt-field">
                  <label className="rt-label">Time Spent <span className="rt-label-optional">(optional)</span></label>
                  <div className="rt-time-row">
                    <input
                      type="number"
                      className="rt-input"
                      placeholder="e.g. 45"
                      min={1}
                      value={timeSpent}
                      onChange={(e) => setTimeSpent(e.target.value)}
                    />
                    <select className="rt-select" value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                    </select>
                  </div>
                </div>

                <div className="rt-field">
                  <label className="rt-label">Internal Notes <span className="rt-label-optional">(optional)</span></label>
                  <textarea
                    className="rt-textarea"
                    placeholder="Any internal notes for your team (not visible to the user)…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="rt-field">
                  <label className="rt-label">Self-Rate Your Resolution <span className="rt-label-optional">(optional)</span></label>
                  <div className="rt-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        className="rt-star-btn"
                        style={{ color: s <= (hoverStar || rating) ? "#f59e0b" : "var(--agent-border)" }}
                        onMouseEnter={() => setHoverStar(s)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setRating(s)}
                      >★</button>
                    ))}
                    {rating > 0 && (
                      <span className="rt-star-label">
                        {["Poor","Fair","Good","Very Good","Excellent"][rating - 1]}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rt-field">
                  <label className="rt-label">
                    Resolution Checklist <span className="rt-label-optional">(optional — check what applies)</span>
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
                      <Icon d={IC.warning} size={13} /> Complete these to unlock resolve:
                    </div>
                    <div className="rt-requirements-list">
                      <div className={`rt-req-item${hasResType ? " done" : ""}`}>
                        <span className="rt-req-dot" />
                        Select a resolution type
                      </div>
                      <div className={`rt-req-item${hasSolution ? " done" : ""}`}>
                        <span className="rt-req-dot" />
                        Write a solution (min 20 characters — {solution.length < 20 ? `${20 - solution.length} left` : "✓"})
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
                  Cancel
                </button>
                <button
                  className="rt-btn-resolve"
                  onClick={handleResolve}
                  disabled={submitting || !canResolve || success}
                  title={!canResolve ? "Complete all 3 steps above first" : "Mark this ticket as resolved"}
                >
                  {submitting ? (
                    <>
                      <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }}
                        viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Resolving…
                    </>
                  ) : (
                    <>
                      <Icon d={IC.check} size={16} />
                      Mark as Resolved
                      {!canResolve && <span className="rt-btn-hint">({doneCount}/2 steps done)</span>}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="rt-sidebar">
            <div className="rt-info-card">
              <div className="rt-info-header">Ticket Timeline</div>
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
                  <div className="rt-timeline-empty">No timeline events yet.</div>
                )}
              </div>
            </div>

            <div className="rt-info-card">
              <div className="rt-info-header">💡 Resolution Tips</div>
              <div className="rt-info-body">
                {[
                  "Be specific about what steps resolved the issue.",
                  "Document for the knowledge base so others can self-serve next time.",
                  "Always confirm with the user before closing.",
                  "Log time accurately for SLA reporting.",
                ].map((tip, i) => (
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
            <div className="rt-success-title">Ticket Resolved! 🎉</div>
            <div className="rt-success-desc">
              Ticket <strong>#{ticket.ticket_number ?? ticket.id}</strong> has been successfully resolved and closed.
              The requester will be notified automatically.
            </div>
            <div className="rt-success-id">#{ticket.ticket_number ?? ticket.id} — Resolved</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="agent-btn agent-btn--ghost" onClick={() => navigate("/agent/assigned-tickets")}>
                <Icon d={IC.ticket} /> My Tickets
              </button>
              <button className="agent-btn agent-btn--primary" onClick={() => navigate("/agent/dashboard")}>
                <Icon d={IC.home} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}