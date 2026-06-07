import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ResolveTicket.css";

const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
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
  attach:   "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  star:     "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  info:     "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  ticket:   "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  home:     "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
};

const MOCK_TICKET = {
  id:        "TK-1038",
  subject:   "Cannot access VPN from home",
  desc:      "Employee unable to connect to company VPN. Cisco AnyConnect shows an authentication error (Error 401) every time they try to connect since last Friday after the password policy update.",
  requester: "Omar Fares",
  dept:      "Sales",
  priority:  "critical",
  status:    "in-progress",
  category:  "Network",
  created:   "Jun 04, 2026 — 09:14",
  assigned:  "Jun 04, 2026 — 10:30",
  sla:       "Breached by 2h",
  timeOpen:  "2 days, 4 hours",
};

const RESOLUTION_TYPES = [
  {
    key:   "fix",
    label: "Issue Fixed",
    desc:  "Root cause identified and resolved",
    icon:  "fix",
    bg:    "#dcfce7",
    color: "#15803d",
  },
  {
    key:   "guide",
    label: "User Guided",
    desc:  "User trained / walked through solution",
    icon:  "guide",
    bg:    "#dbeafe",
    color: "#1d4ed8",
  },
  {
    key:   "escalate",
    label: "Escalated",
    desc:  "Escalated to senior team / vendor",
    icon:  "escalate",
    bg:    "#ffedd5",
    color: "#c2410c",
  },
  {
    key:   "replace",
    label: "Replaced",
    desc:  "Hardware / software was replaced",
    icon:  "replace",
    bg:    "#ede9fe",
    color: "#6d28d9",
  },
];

const CHECKLIST_ITEMS = [
  "Issue has been fully reproduced and confirmed",
  "Root cause identified and documented",
  "Solution applied and tested by agent",
  "User confirmed the issue is resolved",
  "Knowledge base article created / updated",
];

const TIMELINE = [
  { event: "Ticket created by Omar Fares",    time: "Jun 04 — 09:14", type: "open"      },
  { event: "Assigned to you by Manager Ali",  time: "Jun 04 — 10:30", type: "assigned"  },
  { event: "Status changed to In Progress",   time: "Jun 04 — 11:00", type: "progress"  },
  { event: "Pending — awaiting user reply",   time: "Jun 05 — 14:00", type: "pending"   },
  { event: "Resolving now",                   time: "Now",            type: "resolving" },
];

const PriorityBadge = ({ p }) => (
  <span className={`agent-badge agent-badge--${p}`}>{p}</span>
);
const StatusBadge = ({ s }) => (
  <span className={`agent-badge agent-badge--${s}`}>{s.replace("-", " ")}</span>
);

export default function ResolveTicket() {
  const navigate = useNavigate();
  const location = useLocation();

  const ticket = MOCK_TICKET;

  const [resType,    setResType]    = useState("");
  const [solution,   setSolution]   = useState("");
  const [rootCause,  setRootCause]  = useState("");
  const [timeSpent,  setTimeSpent]  = useState("");
  const [timeUnit,   setTimeUnit]   = useState("minutes");
  const [rating,     setRating]     = useState(0);
  const [hoverStar,  setHoverStar]  = useState(0);
  const [checks,     setChecks]     = useState(Array(CHECKLIST_ITEMS.length).fill(false));
  const [notes,      setNotes]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState("");

  const allChecked   = checks.every(Boolean);
  const canResolve   = resType && solution.trim().length >= 20 && allChecked;

  const toggleCheck = (i) =>
    setChecks(prev => { const n = [...prev]; n[i] = !n[i]; return n; });

  const handleResolve = async () => {
    if (!canResolve) {
      setError("Please complete all checklist items, select a resolution type, and provide a solution description (min 20 chars).");
      return;
    }
    setError("");
    setSubmitting(true);

    await new Promise(r => setTimeout(r, 1400)); // simulate network
    setSubmitting(false);
    setSuccess(true);
  };

  return (
    <div className="resolve-ticket">
      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Resolve Ticket</h1>
          <p className="agent-page-subtitle">
            Document the solution and close this ticket
          </p>
        </div>
        <button className="agent-btn agent-btn--ghost"
          onClick={() => navigate(-1)}>
          <Icon d={IC.back} /> Back
        </button>
      </div>

      <div className="rt-layout">
        <div>
          <div className="rt-summary-card">
            <div className="rt-summary-top">
              <span className="rt-summary-id">#{ticket.id}</span>
              <div className="rt-summary-badges">
                <PriorityBadge p={ticket.priority} />
                <StatusBadge s={ticket.status} />
              </div>
            </div>
            <div className="rt-summary-title">{ticket.subject}</div>
            <div className="rt-summary-desc">{ticket.desc}</div>
            <div className="rt-summary-meta">
              {[
                { label: "Requester", value: ticket.requester },
                { label: "Department", value: ticket.dept     },
                { label: "Category",  value: ticket.category  },
                { label: "Time Open", value: ticket.timeOpen  },
                { label: "SLA",       value: ticket.sla,
                  style: { color: "#fca5a5" }                 },
              ].map(m => (
                <div className="rt-summary-meta-item" key={m.label}>
                  <span className="rt-summary-meta-label">{m.label}</span>
                  <span className="rt-summary-meta-value" style={m.style}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rt-form-card">
            <div className="rt-form-header">
              <div className="rt-form-header-icon">
                <Icon d={IC.check} />
              </div>
              <div>
                <div className="rt-form-header-title">Resolution Details</div>
                <div className="rt-form-header-sub">
                  Complete all fields before marking as resolved
                </div>
              </div>
            </div>

            <div className="rt-form-body">

              <div className="rt-field">
                <label className="rt-label">
                  Resolution Type <span className="rt-label-required">*</span>
                </label>
                <div className="rt-type-grid">
                  {RESOLUTION_TYPES.map(rt => (
                    <button
                      key={rt.key}
                      className={`rt-type-btn${resType === rt.key ? " selected" : ""}`}
                      onClick={() => setResType(rt.key)}
                    >
                      <div className="rt-type-btn-icon"
                        style={{ background: rt.bg, color: rt.color }}>
                        <Icon d={IC[rt.icon]} />
                      </div>
                      <div className="rt-type-btn-label">{rt.label}</div>
                      <div className="rt-type-btn-desc">{rt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rt-field">
                <label className="rt-label">
                  Solution Description <span className="rt-label-required">*</span>
                </label>
                <textarea
                  className="rt-textarea"
                  placeholder="Describe exactly what you did to resolve this issue. Be specific — this will be visible to the user and stored in the knowledge base…"
                  value={solution}
                  onChange={e => setSolution(e.target.value)}
                  rows={5}
                />
                <span className="rt-hint">
                  {solution.length < 20
                    ? `Minimum 20 characters (${20 - solution.length} more needed)`
                    : `✓ ${solution.length} characters`}
                </span>
              </div>

              <div className="rt-field">
                <label className="rt-label">Root Cause Analysis</label>
                <textarea
                  className="rt-textarea"
                  placeholder="What was the underlying cause of this issue? (optional but recommended for recurring issues)"
                  value={rootCause}
                  onChange={e => setRootCause(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="rt-field">
                <label className="rt-label">Time Spent on Resolution</label>
                <div className="rt-time-row">
                  <input
                    type="number"
                    className="rt-input"
                    placeholder="e.g. 45"
                    min={1}
                    value={timeSpent}
                    onChange={e => setTimeSpent(e.target.value)}
                  />
                  <select
                    className="rt-select"
                    value={timeUnit}
                    onChange={e => setTimeUnit(e.target.value)}
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>

              <div className="rt-field">
                <label className="rt-label">Internal Notes</label>
                <textarea
                  className="rt-textarea"
                  placeholder="Any internal notes for your team (not visible to the user)…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="rt-field">
                <label className="rt-label">Self-Rate Your Resolution Quality</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontSize: 24, padding: "2px 4px",
                        color: s <= (hoverStar || rating) ? "#f59e0b" : "var(--agent-border)",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={() => setHoverStar(s)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => setRating(s)}
                    >
                      ★
                    </button>
                  ))}
                  {rating > 0 && (
                    <span style={{ fontSize: 12, color: "var(--agent-muted)", alignSelf: "center", marginLeft: 4 }}>
                      {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][rating]}
                    </span>
                  )}
                </div>
              </div>

              <div className="rt-field">
                <label className="rt-label">
                  Resolution Checklist <span className="rt-label-required">*</span>
                  {allChecked && (
                    <span style={{ marginLeft: 8, fontSize: 11, background: "#dcfce7",
                      color: "#15803d", padding: "1px 8px", borderRadius: 10, fontWeight: 700 }}>
                      All complete ✓
                    </span>
                  )}
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

              {error && (
                <div style={{
                  padding: "10px 14px", background: "#fee2e2", border: "1px solid #fca5a5",
                  borderRadius: "var(--radius-sm)", color: "#b91c1c", fontSize: 13, fontWeight: 500,
                }}>
                  {error}
                </div>
              )}
            </div>

            <div className="rt-form-actions">
              <button className="agent-btn agent-btn--ghost"
                onClick={() => navigate("/agent/assigned-tickets")}>
                Cancel
              </button>
              <button
                className="rt-btn-resolve"
                onClick={handleResolve}
                disabled={submitting || !canResolve}
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
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="rt-sidebar">

          <div className="rt-info-card">
            <div className="rt-info-header">Ticket Information</div>
            <div className="rt-info-body">
              {[
                { key: "Ticket ID",    val: `#${ticket.id}` },
                { key: "Category",     val: ticket.category  },
                { key: "Priority",     val: <PriorityBadge p={ticket.priority} /> },
                { key: "Status",       val: <StatusBadge s={ticket.status} /> },
                { key: "Created",      val: ticket.created   },
                { key: "Assigned",     val: ticket.assigned  },
                { key: "Time Open",    val: ticket.timeOpen  },
                { key: "SLA Status",
                  val: <span style={{ color: "var(--agent-danger)", fontWeight: 700 }}>{ticket.sla}</span> },
              ].map(r => (
                <div className="rt-info-row" key={r.key}>
                  <span className="rt-info-key">{r.key}</span>
                  <span className="rt-info-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rt-info-card">
            <div className="rt-info-header">Checklist Progress</div>
            <div className="rt-info-body">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: "var(--agent-muted)" }}>
                  {checks.filter(Boolean).length} of {CHECKLIST_ITEMS.length} complete
                </span>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 15, fontWeight: 700,
                  color: allChecked ? "var(--agent-success)" : "var(--agent-text)" }}>
                  {Math.round((checks.filter(Boolean).length / CHECKLIST_ITEMS.length) * 100)}%
                </span>
              </div>
              <div style={{ height: 6, background: "var(--agent-bg)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: allChecked ? "var(--agent-success)" : "var(--agent-primary)",
                  width: `${(checks.filter(Boolean).length / CHECKLIST_ITEMS.length) * 100}%`,
                  transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>
              {!allChecked && (
                <p style={{ fontSize: 11.5, color: "var(--agent-muted)", marginTop: 8 }}>
                  Complete all checklist items before resolving.
                </p>
              )}
              {allChecked && (
                <p style={{ fontSize: 11.5, color: "var(--agent-success)", marginTop: 8, fontWeight: 600 }}>
                  ✓ All items checked — ready to resolve!
                </p>
              )}
            </div>
          </div>

          <div className="rt-info-card">
            <div className="rt-info-header">Ticket Timeline</div>
            <div className="rt-timeline">
              {TIMELINE.map((ev, i) => (
                <div className="rt-timeline-item" key={i}>
                  <div className="rt-timeline-line-col">
                    <div className={`rt-timeline-dot rt-timeline-dot--${ev.type}`} />
                    <div className="rt-timeline-connector" />
                  </div>
                  <div className="rt-timeline-content">
                    <div className="rt-timeline-event">{ev.event}</div>
                    <div className="rt-timeline-time">{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rt-info-card">
            <div className="rt-info-header">💡 Resolution Tips</div>
            <div className="rt-info-body" style={{ gap: 8 }}>
              {[
                "Be specific about what steps resolved the issue.",
                "Document for the knowledge base so others can self-serve next time.",
                "Always confirm with the user before closing.",
                "Log time accurately for SLA reporting.",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--agent-muted)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--agent-accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {success && (
        <div className="rt-success-overlay">
          <div className="rt-success-modal">
            <div className="rt-success-icon">
              <Icon d={IC.check} size={36} />
            </div>
            <div className="rt-success-title">Ticket Resolved! 🎉</div>
            <div className="rt-success-desc">
              Ticket <strong>#{ticket.id}</strong> has been successfully resolved and closed.
              The requester will be notified automatically.
            </div>
            <div className="rt-success-id">#{ticket.id} — Resolved</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="agent-btn agent-btn--ghost"
                onClick={() => navigate("/agent/assigned-tickets")}>
                <Icon d={IC.ticket} /> My Tickets
              </button>
              <button className="agent-btn agent-btn--primary"
                onClick={() => navigate("/agent/dashboard")}>
                <Icon d={IC.home} /> Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}