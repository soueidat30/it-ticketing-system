import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./UpdateStatus.css";

// ── Icon helper ───────────────────────────────────────────────────────────────
const Icon = ({ d, size = 16 }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ width: size, height: size, flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const IC = {
  back:    "M19 12H5 M12 19l-7-7 7-7",
  ticket:  "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  check:   "M20 6L9 17l-5-5",
  arrow:   "M5 12h14 M12 5l7 7-7 7",
  update:  "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  info:    "M12 22a10 10 0 100-20 10 10 0 000 20z M12 16v-4 M12 8h.01",
  resolve: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 12a3 3 0 100-6 3 3 0 000 6z",
  warning: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  spin:    "M21 12a9 9 0 11-6.219-8.56",
};

// ── Static config ─────────────────────────────────────────────────────────────
// Maps the DB status_name (lowercase-normalised) to display config.
const STATUSES = [
  {
    key:   "open",
    label: "Open",
    desc:  "Ticket is awaiting agent pickup or has been re-opened.",
    dot:   "#3b82f6",
    icon:  { bg: "#dbeafe", color: "#1d4ed8",
      path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  },
  {
    key:   "in-progress",
    label: "In Progress",
    desc:  "You are actively working on diagnosing or fixing this issue.",
    dot:   "#8b5cf6",
    icon:  { bg: "#ede9fe", color: "#6d28d9",
      path: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2" },
  },
  {
    key:   "pending",
    label: "Pending",
    desc:  "Waiting on the requester or a third party before proceeding.",
    dot:   "#f59e0b",
    icon:  { bg: "#fef9c3", color: "#854d0e",
      path: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01" },
  },
  {
    key:   "resolved",
    label: "Resolved",
    desc:  "Issue has been fixed. Requester will be asked to confirm.",
    dot:   "#22c55e",
    icon:  { bg: "#dcfce7", color: "#15803d",
      path: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3" },
  },
  {
    key:   "closed",
    label: "Closed",
    desc:  "Ticket is permanently closed. No further action needed.",
    dot:   "#64748b",
    icon:  { bg: "#f1f5f9", color: "#475569",
      path: "M18 6L6 18 M6 6l12 12" },
  },
];

const ALLOWED_FROM = {
  "open":        ["in-progress", "pending", "closed"],
  "in-progress": ["open", "pending", "resolved", "closed"],
  "pending":     ["open", "in-progress", "resolved", "closed"],
  "resolved":    ["open", "closed"],
  "closed":      ["open"],
};

const REASONS = {
  "open":        ["Re-opened by requester", "Re-opened by agent", "Previous resolution failed", "Other"],
  "in-progress": ["Started investigating", "Reproduced the issue", "Working on fix", "Other"],
  "pending":     ["Awaiting requester info", "Awaiting vendor response", "Awaiting hardware", "Scheduled maintenance", "Other"],
  "resolved":    ["Issue fixed", "User guided to solution", "Workaround applied", "Other"],
  "closed":      ["Resolved and confirmed", "Duplicate ticket", "No response from user", "Out of scope", "Other"],
};

const FLOW_STEPS = ["open", "in-progress", "pending", "resolved", "closed"];

const BASE_URL = "http://127.0.0.1:8000/api";

// ── Helpers ───────────────────────────────────────────────────────────────────
const normalizeStatus   = (s) => s?.toLowerCase().replace(" ", "-") ?? "open";
const normalizePriority = (p) => p?.toLowerCase() ?? "low";

const PriorityBadge = ({ p }) => (
  <span className={`agent-badge agent-badge--${normalizePriority(p)}`}>{p}</span>
);
const StatusBadge = ({ s }) => (
  <span className={`agent-badge agent-badge--${normalizeStatus(s)}`}>
    {s?.replace("-", " ")}
  </span>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function UpdateStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const ticketId = location.state?.ticketId; // passed from AssignedTickets / TicketDetails

  // ── Ticket state ──────────────────────────────────────────────────────────
  const [ticket,      setTicket]      = useState(null);
  const [history,     setHistory]     = useState([]);
  const [statuses,    setStatuses]    = useState([]); // [{id, status_name}, ...]
  const [priorities,  setPriorities]  = useState([]); // [{id, priority_name}, ...]
  const [loadingData, setLoadingData] = useState(true);
  const [loadError,   setLoadError]   = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedStatus, setSelectedStatus] = useState("");
  const [reason,         setReason]         = useState("");
  const [customReason,   setCustomReason]   = useState("");
  const [note,           setNote]           = useState("");
  const [priorityId,     setPriorityId]     = useState("");  // id selected in dropdown
  const [notifyUser,     setNotifyUser]     = useState(true);
  const [notifyManager,  setNotifyManager]  = useState(false);

  // ── Submit state ──────────────────────────────────────────────────────────
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [toast,       setToast]       = useState(false);

  const token = localStorage.getItem("token");

  // ── Load ticket + lookups ─────────────────────────────────────────────────
  useEffect(() => {
    if (!ticketId) {
      setLoadError("No ticket selected. Go back and click a ticket first.");
      setLoadingData(false);
      return;
    }
    if (!token) {
      navigate("/", { replace: true });
      return;
    }

    const authHeaders = { Authorization: `Bearer ${token}`, Accept: "application/json" };

    const loadAll = async () => {
      try {
        const [ticketRes, statusesRes, prioritiesRes] = await Promise.all([
          fetch(`${BASE_URL}/agent/tickets/${ticketId}`, { headers: authHeaders }),
          fetch(`${BASE_URL}/statuses`,                  { headers: authHeaders }),
          fetch(`${BASE_URL}/priorities`,                { headers: authHeaders }),
        ]);

        if (ticketRes.status === 401) {
          localStorage.removeItem("token");
          navigate("/", { replace: true });
          return;
        }

        if (!ticketRes.ok) {
          const err = await ticketRes.json();
          setLoadError(err.message || "Failed to load ticket.");
          return;
        }

        const ticketData    = await ticketRes.json();
        const statusesData  = await statusesRes.json();
        const prioritiesData = await prioritiesRes.json();

        const t = ticketData.ticket ?? ticketData;
        setTicket(t);
        // Set priority dropdown default to the current ticket priority
        setPriorityId(String(t.priority_id ?? ""));

        setHistory(ticketData.history ?? []);
        setStatuses(Array.isArray(statusesData) ? statusesData : []);
        setPriorities(Array.isArray(prioritiesData) ? prioritiesData : []);
      } catch (err) {
        console.error(err);
        setLoadError("Unable to load data. Check your connection.");
      } finally {
        setLoadingData(false);
      }
    };

    loadAll();
  }, [ticketId, token, navigate]);

  // Auto-check notify manager when resolving/closing
  useEffect(() => {
    if (selectedStatus === "resolved" || selectedStatus === "closed") {
      setNotifyManager(true);
    }
  }, [selectedStatus]);

  // ── Derived values ────────────────────────────────────────────────────────
  const currentStatusName = normalizeStatus(ticket?.status?.status_name);
  const allowed           = ALLOWED_FROM[currentStatusName] ?? [];
  const reasonList        = selectedStatus ? REASONS[selectedStatus] : [];
  const canSubmit         = selectedStatus && reason &&
                            (reason !== "Other" || customReason.trim());

  // Find the status_id for the selected key by matching status_name
  const selectedStatusId = statuses.find(
    s => normalizeStatus(s.status_name) === selectedStatus
  )?.id;

  const selObj = STATUSES.find(s => s.key === selectedStatus);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit || !selectedStatusId) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const body = {
        status_id: selectedStatusId,
        note:      note.trim() || null,
        reason:    reason === "Other" ? customReason.trim() : reason,
      };

      // Only send priority_id if the agent actually changed it
      if (priorityId && priorityId !== String(ticket?.priority_id)) {
        body.priority_id = Number(priorityId);
      }

      const res = await fetch(`${BASE_URL}/agent/tickets/${ticketId}/status`, {
        method:  "PUT",
        headers: {
          Authorization:  `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept:         "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "Failed to update status.");
        return;
      }

      setToast(true);
      setTimeout(() => {
        setToast(false);
        navigate("/agent/assigned-tickets");
      }, 2200);
    } catch (err) {
      console.error(err);
      setSubmitError("Network error — could not update status.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / error screens ───────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="update-status">
        <div className="agent-page-header">
          <div>
            <h1 className="agent-page-title">Update Ticket Status</h1>
            <p className="agent-page-subtitle">Loading ticket…</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="update-status">
        <div className="agent-page-header">
          <div>
            <h1 className="agent-page-title">Update Ticket Status</h1>
            <p className="agent-page-subtitle" style={{ color: "var(--agent-danger)" }}>{loadError}</p>
          </div>
          <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
            <Icon d={IC.back} /> Back
          </button>
        </div>
      </div>
    );
  }

  // ── Ticket field accessors ────────────────────────────────────────────────
  const ticketNumber   = ticket?.ticket_number ?? ticket?.id ?? "—";
  const ticketTitle    = ticket?.title         ?? "Untitled";
  const requesterName  = ticket?.user?.full_name ?? ticket?.user?.username ?? "Unknown";
  const requesterDept  = ticket?.user?.department ?? "N/A";
  const priorityName   = ticket?.priority?.priority_name ?? "Low";
  const categoryName   = ticket?.category?.category_name ?? "General";
  const assigneeName   = ticket?.assignee?.full_name ?? "Unassigned";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="update-status">

      <div className="agent-page-header">
        <div>
          <h1 className="agent-page-title">Update Ticket Status</h1>
          <p className="agent-page-subtitle">
            Change the workflow status of ticket #{ticketNumber}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
            <Icon d={IC.back} /> Back
          </button>
          <button className="agent-btn agent-btn--ghost"
            onClick={() => navigate("/agent/ticket-details", { state: { ticketId } })}>
            <Icon d={IC.eye} /> View Ticket
          </button>
          <button className="agent-btn agent-btn--accent"
            onClick={() => navigate("/agent/resolve-ticket", { state: { ticketId } })}>
            <Icon d={IC.resolve} /> Resolve
          </button>
        </div>
      </div>

      {/* ── Ticket banner ── */}
      <div className="us-ticket-banner">
        <div className="us-banner-icon"><Icon d={IC.ticket} size={22} /></div>
        <div className="us-banner-info">
          <div className="us-banner-id">#{ticketNumber}</div>
          <div className="us-banner-title">{ticketTitle}</div>
          <div className="us-banner-meta">
            <span className="us-banner-meta-item">{requesterName} · {requesterDept}</span>
            <PriorityBadge p={priorityName} />
            <StatusBadge   s={ticket?.status?.status_name ?? "Open"} />
          </div>
        </div>
      </div>

      {/* ── Transition preview ── */}
      <div className="us-transition-row">
        <span className="us-transition-label">Current</span>
        <StatusBadge s={ticket?.status?.status_name ?? "Open"} />
        <div className="us-transition-arrow"><Icon d={IC.arrow} size={18} /></div>
        <span className="us-transition-label">New</span>
        {selObj
          ? <span className={`agent-badge agent-badge--${selectedStatus}`}>{selObj.label}</span>
          : <span className="us-new-status-preview">Select a status below…</span>
        }
      </div>

      <div className="us-layout">
        <div>

          {/* ── Status selection ── */}
          <div className="us-form-card">
            <div className="us-form-header">
              <Icon d={IC.update} size={16} />
              Select New Status <span style={{ color: "var(--agent-danger)", marginLeft: 2 }}>*</span>
            </div>
            <div style={{ padding: "20px" }}>
              <div className="us-status-grid">
                {STATUSES.map(s => {
                  const isCurrent  = s.key === currentStatusName;
                  const isAllowed  = allowed.includes(s.key);
                  const isSelected = selectedStatus === s.key;

                  return (
                    <button
                      key={s.key}
                      data-status={s.key}
                      className={[
                        "us-status-option",
                        isSelected               ? "selected"     : "",
                        isCurrent || !isAllowed  ? "disabled-opt" : "",
                      ].join(" ").trim()}
                      onClick={() => {
                        if (!isCurrent && isAllowed) {
                          setSelectedStatus(s.key);
                          setReason("");
                          setCustomReason("");
                        }
                      }}
                    >
                      <div className="us-status-check"
                        style={isSelected ? {} : { background: "transparent" }}>
                        {isSelected && <Icon d={IC.check} size={11} />}
                      </div>
                      <div className="us-status-icon"
                        style={{ background: s.icon.bg, color: s.icon.color }}>
                        <Icon d={s.icon.path} size={18} />
                      </div>
                      <div className="us-status-name">{s.label}</div>
                      <div className="us-status-desc">{s.desc}</div>
                      {isCurrent  && <span className="us-current-tag">Current status</span>}
                      {!isCurrent && !isAllowed && <span className="us-current-tag">Not allowed</span>}
                    </button>
                  );
                })}
              </div>

              <div style={{
                marginTop: 12, padding: "9px 14px",
                background: "var(--agent-bg)", borderRadius: "var(--radius-sm)",
                fontSize: 12, color: "var(--agent-muted)",
                display: "flex", gap: 7, alignItems: "flex-start", flexWrap: "wrap",
              }}>
                <Icon d={IC.info} size={13} />
                <span>
                  From <strong style={{ color: "var(--agent-text)" }}>
                    {currentStatusName.replace("-", " ")}
                  </strong>, you can move to:{" "}
                  {allowed.map((a, i) => (
                    <span key={a}>
                      <strong style={{ color: "var(--agent-primary)" }}>
                        {STATUSES.find(s => s.key === a)?.label}
                      </strong>
                      {i < allowed.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </div>

          {/* ── Reason & notes ── */}
          <div className="us-form-card">
            <div className="us-form-header">
              <Icon d={IC.info} size={16} />
              Reason &amp; Notes
            </div>
            <div className="us-form-body">

              <div className="us-field">
                <label className="us-label">
                  Reason for Change <span className="us-label-req">*</span>
                </label>
                <select className="us-select" value={reason}
                  onChange={e => { setReason(e.target.value); setCustomReason(""); }}
                  disabled={!selectedStatus}>
                  <option value="">
                    {selectedStatus ? "Select a reason…" : "Select a status first…"}
                  </option>
                  {reasonList.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {reason === "Other" && (
                <div className="us-field">
                  <label className="us-label">
                    Specify Reason <span className="us-label-req">*</span>
                  </label>
                  <input type="text" className="us-input"
                    placeholder="Describe the reason…"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)} />
                </div>
              )}

              <div className="us-field">
                <label className="us-label">Internal Note</label>
                <textarea className="us-textarea" rows={4}
                  placeholder="Add context for your team (optional, not visible to requester)…"
                  value={note}
                  onChange={e => setNote(e.target.value)} />
                <span className="us-hint">Internal notes are only visible to agents and managers.</span>
              </div>

              {/* ── Priority override — uses real priorities from API ── */}
              <div className="us-field">
                <label className="us-label">Adjust Priority</label>
                <div className="us-priority-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--agent-muted)" }}>Current:</span>
                    <PriorityBadge p={priorityName} />
                  </div>
                  <select className="us-select" value={priorityId}
                    onChange={e => setPriorityId(e.target.value)}>
                    {priorities.map(p => (
                      <option key={p.id} value={String(p.id)}>
                        {p.priority_name}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="us-hint">Leave unchanged if priority hasn't shifted.</span>
              </div>

              <div className="us-field">
                <label className="us-label">Notifications</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label className="us-notify-row">
                    <input type="checkbox" checked={notifyUser}
                      onChange={e => setNotifyUser(e.target.checked)} />
                    <span className="us-notify-label">
                      <strong>Notify requester</strong> — email {requesterName} about this change
                    </span>
                  </label>
                  <label className="us-notify-row">
                    <input type="checkbox" checked={notifyManager}
                      onChange={e => setNotifyManager(e.target.checked)} />
                    <span className="us-notify-label">
                      <strong>Notify manager</strong> — send update to your manager
                    </span>
                  </label>
                </div>
              </div>

              {/* Validation hint */}
              {!canSubmit && selectedStatus && (
                <div style={{
                  padding: "9px 14px", background: "#fffbeb",
                  border: "1px solid #fde68a", borderRadius: "var(--radius-sm)",
                  fontSize: 12.5, color: "#92400e", display: "flex", gap: 7, alignItems: "flex-start",
                }}>
                  <Icon d={IC.warning} size={14} />
                  {!reason
                    ? "Please select a reason for this status change."
                    : reason === "Other" && !customReason.trim()
                    ? "Please specify the reason in the text field above."
                    : "Please fill in all required fields."}
                </div>
              )}

              {/* API error */}
              {submitError && (
                <div style={{
                  padding: "9px 14px", background: "#fee2e2",
                  border: "1px solid #fca5a5", borderRadius: "var(--radius-sm)",
                  fontSize: 12.5, color: "#b91c1c", display: "flex", gap: 7,
                }}>
                  <Icon d={IC.warning} size={14} />
                  {submitError}
                </div>
              )}
            </div>

            <div className="us-form-actions">
              <button className="agent-btn agent-btn--ghost" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button className="us-btn-submit"
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}>
                {submitting ? (
                  <>
                    <svg style={{ animation: "spin 1s linear infinite", width: 16, height: 16 }}
                      viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={IC.spin} />
                    </svg>
                    Updating…
                  </>
                ) : (
                  <><Icon d={IC.update} size={16} /> Update Status</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="us-sidebar">

          <div className="us-side-card">
            <div className="us-side-header">Ticket Info</div>
            <div className="us-side-body">
              {[
                { key: "ID",       val: `#${ticketNumber}` },
                { key: "Priority", val: <PriorityBadge p={priorityName} /> },
                { key: "Status",   val: <StatusBadge s={ticket?.status?.status_name ?? "Open"} /> },
                { key: "Category", val: categoryName },
                { key: "Assignee", val: assigneeName },
              ].map(r => (
                <div className="us-side-row" key={r.key}>
                  <span className="us-side-key">{r.key}</span>
                  <span className="us-side-val">{r.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="us-side-card">
            <div className="us-side-header">Workflow</div>
            <div className="us-flow">
              {FLOW_STEPS.map((step, i) => {
                const s          = STATUSES.find(x => x.key === step);
                const isCurrent  = step === currentStatusName;
                const isSelected = step === selectedStatus;
                return (
                  <div key={step}>
                    <div
                      className={`us-flow-step${isCurrent ? " current" : " possible"}`}
                      style={isSelected
                        ? { background: s.icon.bg + "bb", color: s.icon.color,
                            border: `1.5px solid ${s.dot}55`, fontWeight: 700 }
                        : {}}
                    >
                      <div className="us-flow-dot" style={{ background: s.dot }} />
                      {s.label}
                      {isCurrent && (
                        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700,
                          background: "rgba(3,54,61,0.1)", padding: "1px 6px", borderRadius: 8 }}>
                          NOW
                        </span>
                      )}
                      {isSelected && !isCurrent && (
                        <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700,
                          background: s.icon.bg, color: s.icon.color,
                          padding: "1px 6px", borderRadius: 8 }}>
                          NEW
                        </span>
                      )}
                    </div>
                    {i < FLOW_STEPS.length - 1 && <div className="us-flow-connector" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Real status history from API ── */}
          <div className="us-side-card">
            <div className="us-side-header">Status History</div>
            <div className="us-side-body" style={{ gap: 0 }}>
              {history.length === 0 ? (
                <p style={{ fontSize: 12, color: "var(--agent-muted)" }}>No history yet.</p>
              ) : (
                history.map((h, i) => (
                  <div key={h.id ?? i} style={{
                    padding: "9px 0",
                    borderBottom: i < history.length - 1
                      ? "1px solid var(--agent-border)" : "none",
                  }}>
                    {/* h.event = "Status changed to In Progress" (shaped by controller) */}
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--agent-text)" }}>
                      {h.event}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--agent-muted)", marginTop: 2 }}>
                      {h.actor} · {h.time}
                    </div>
                    {h.note && (
                      <div style={{ fontSize: 11, color: "var(--agent-muted)", marginTop: 2,
                        fontStyle: "italic" }}>
                        "{h.note}"
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="us-side-card">
            <div className="us-side-header">💡 Tips</div>
            <div className="us-side-body" style={{ gap: 8 }}>
              {[
                "Use \"Pending\" when waiting for user info or a vendor reply.",
                "Always add a note when moving to Resolved — it's sent to the user.",
                "Only close after the requester confirms the fix.",
                "Changing priority triggers a manager notification.",
              ].map((tip, i) => (
                <div key={i} style={{ display: "flex", gap: 7, fontSize: 12,
                  color: "var(--agent-muted)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--agent-accent)", fontWeight: 700, flexShrink: 0 }}>→</span>
                  {tip}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Success toast ── */}
      {toast && (
        <div className="us-toast">
          <Icon d={IC.check} size={18} />
          Status updated to{" "}
          <strong style={{ color: "var(--agent-accent)", marginLeft: 4 }}>
            {selObj?.label}
          </strong>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}