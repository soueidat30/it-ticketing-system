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
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  checkSm: "M20 6L9 17l-5-5",
  back: "M19 12H5 M12 19l-7-7 7-7",
  fix: "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
  guide:
    "M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z",
  escalate: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  replace:
    "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  attach:
    "M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48",
  star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  info: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  ticket:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  home: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
};

const RESOLUTION_TYPES = [
  {
    key: "fix",
    label: "Issue Fixed",
    desc: "Root cause identified and resolved",
    icon: "fix",
    bg: "#dcfce7",
    color: "#15803d",
  },
  {
    key: "guide",
    label: "User Guided",
    desc: "User trained / walked through solution",
    icon: "guide",
    bg: "#dbeafe",
    color: "#1d4ed8",
  },
  {
    key: "escalate",
    label: "Escalated",
    desc: "Escalated to senior team / vendor",
    icon: "escalate",
    bg: "#ffedd5",
    color: "#c2410c",
  },
  {
    key: "replace",
    label: "Replaced",
    desc: "Hardware / software was replaced",
    icon: "replace",
    bg: "#ede9fe",
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

const PriorityBadge = ({ p }) => (
  <span className={`agent-badge agent-badge--${p}`}>{p}</span>
);

const StatusBadge = ({ s }) => (
  <span className={`agent-badge agent-badge--${s}`}>{String(s).replace("-", " ")}</span>
);

const BASE_URL = "http://127.0.0.1:8000/api";

export default function ResolveTicket() {
  const navigate = useNavigate();
  const location = useLocation();

  const token = useMemo(() => localStorage.getItem("token"), []);

  const ticketId = location?.state?.ticketId;

  const [ticket, setTicket] = useState(null);

  const [resType, setResType] = useState("");
  const [solution, setSolution] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [timeSpent, setTimeSpent] = useState("");
  const [timeUnit, setTimeUnit] = useState("minutes");
  const [rating, setRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [checks, setChecks] = useState(Array(CHECKLIST_ITEMS.length).fill(false));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const allChecked = checks.every(Boolean);
  const canResolve = resType && solution.trim().length >= 20 && allChecked;




  const toggleCheck = (i) =>
    setChecks((prev) => {
      const n = [...prev];
      n[i] = !n[i];
      return n;
    });

  useEffect(() => {
    let alive = true;

    const fetchTicket = async () => {
      try {
        if (!ticketId) return;

        const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error(`Failed to load ticket (${res.status})`);

        const data = await res.json();
        if (!alive) return;
        setTicket(data);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "Failed to load ticket.");
      }
    };

    fetchTicket();

    return () => {
      alive = false;
    };
  }, [ticketId, token]);

  const historyEvents = useMemo(() => {
    if (!ticket?.history) return [];
    // ticket.history items from API are most likely TicketStatusHistory with status info.
    return [...ticket.history]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((h) => ({
        event: h.status?.status_name ? `Status changed to ${h.status.status_name}` : "Status changed",
        time: h.created_at ? new Date(h.created_at).toLocaleString() : "",
        type: h.status?.status_name ? String(h.status.status_name).toLowerCase().replace(/\s+/g, "-") : "update",
        note: h.note,
      }));
  }, [ticket]);

  const handleResolve = async () => {
    if (!canResolve) {
      setError(
        "Please complete all checklist items, select a resolution type, and provide a solution description (min 20 chars)."
      );
      return;
    }

    setError("");
    setSubmitting(true);

    try {
    const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/resolve`, {

        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          resolution_type: resType,
          solution,
          root_cause: rootCause,
          time_spent: timeSpent ? Number(timeSpent) : null,
          time_unit: timeUnit,
          internal_notes: notes,
          rating,
          notify_user: true,
          notify_manager: false,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Resolve failed (${res.status})`);

      setSuccess(true);
      if (data?.ticket) setTicket(data.ticket);
    } catch (e) {
      setError(e?.message || "Failed to resolve ticket.");
    } finally {
      setSubmitting(false);
    }
  };

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

      {!ticket && !success && (
        <div className="ct-api-error" style={{ margin: 16 }}>
          {error || "Loading ticket..."}
        </div>
      )}

      {ticket && (
        <div className="rt-layout">
          <div>
            <div className="rt-summary-card">
              <div className="rt-summary-top">
                <span className="rt-summary-id">#{ticket.ticket_number || ticket.id || "N/A"}</span>
                <div className="rt-summary-badges">
                  <PriorityBadge p={ticket.priority?.priority_name || ticket.priority || "low"} />
                  <StatusBadge s={ticket.status?.status_name ?? ticket.status} />
                </div>
              </div>
              <div className="rt-summary-title">{ticket.title || ticket.subject || "Untitled Ticket"}</div>
              <div className="rt-summary-desc">{ticket.description || ticket.desc || "No description provided."}</div>
            </div>

            <div className="rt-form-card">
              <div className="rt-form-header">
                <div className="rt-form-header-icon">
                  <Icon d={IC.check} />
                </div>
                <div>
                  <div className="rt-form-header-title">Resolution Details</div>
                  <div className="rt-form-header-sub">Complete all fields before marking as resolved</div>
                </div>
              </div>

              <div className="rt-form-body">
                <div className="rt-field">
                  <label className="rt-label">
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
                    onChange={(e) => setSolution(e.target.value)}
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
                    onChange={(e) => setRootCause(e.target.value)}
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
                      onChange={(e) => setTimeSpent(e.target.value)}
                    />
                    <select className="rt-select" value={timeUnit} onChange={(e) => setTimeUnit(e.target.value)}>
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
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="rt-field">
                  <label className="rt-label">Self-Rate Your Resolution Quality</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: 24,
                          padding: "2px 4px",
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
                        {[
                          "Poor",
                          "Fair",
                          "Good",
                          "Very Good",
                          "Excellent",
                        ][rating - 1]}

                      </span>
                    )}
                  </div>
                </div>

                <div className="rt-field">
                  <label className="rt-label">
                    Resolution Checklist <span className="rt-label-required">*</span>
                    {allChecked && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          background: "#dcfce7",
                          color: "#15803d",
                          padding: "1px 8px",
                          borderRadius: 10,
                          fontWeight: 700,
                        }}
                      >
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
                        <div className="rt-check-box">{checks[i] && <Icon d={IC.checkSm} size={11} />}</div>
                        <span className="rt-check-label">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      borderRadius: "var(--radius-sm)",
                      color: "#b91c1c",
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    {error}
                  </div>
                )}
              </div>

              <div className="rt-form-actions">
                <button className="agent-btn agent-btn--ghost" onClick={() => navigate("/agent/assigned-tickets")}>Cancel</button>
                <button className="rt-btn-resolve" onClick={handleResolve} disabled={submitting || !canResolve || success}>



                  {submitting ? (
                    <>
                      <svg
                        style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
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
              <div className="rt-info-header">Ticket Timeline</div>
              <div className="rt-timeline">
                {(historyEvents.length ? historyEvents : []).map((ev, i) => (
                  <div className="rt-timeline-item" key={i}>
                    <div className="rt-timeline-line-col">
                      <div className={`rt-timeline-dot rt-timeline-dot--${ev.type || "update"}`} />
                      <div className="rt-timeline-connector" />
                    </div>
                    <div className="rt-timeline-content">
                      <div className="rt-timeline-event">{ev.event}</div>
                      <div className="rt-timeline-time">{ev.time}</div>
                      {ev.note ? <div className="rt-timeline-time" style={{ opacity: 0.85 }}>“{ev.note}”</div> : null}
                    </div>
                  </div>
                ))}
                {!historyEvents.length && (
                  <div style={{ fontSize: 12, color: "var(--agent-muted)", padding: 10 }}>
                    No timeline events yet.
                  </div>
                )}
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
                  <div
                    key={i}
                    style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--agent-muted)", lineHeight: 1.5 }}
                  >
                    <span style={{ color: "var(--agent-accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
                    {tip}
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

