import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTicket.css";
import { createTicket, getCategories, getPriorities } from "../../../services/ticketService";

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category_id: "", priority_id: "", description: "" });
  const [errors, setErrors]         = useState({});
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [apiError, setApiError]     = useState("");
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [ticketRef, setTicketRef]   = useState("");
  const [attachments, setAttachments] = useState([]);
  const [fileError, setFileError]   = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prios] = await Promise.all([getCategories(token), getPriorities(token)]);
        setCategories(cats.map(c => ({ id: c.id, name: c.category_name })));
        setPriorities(prios.map(p => ({ id: p.id, name: p.priority_name })));
      } catch {
        setApiError("Failed to load form data. Please refresh.");
      }
    };
    fetchData();
  }, [token]);

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())                    e.title       = "Title is required";
    if (!form.category_id)                     e.category_id = "Please select a category";
    if (!form.priority_id)                     e.priority_id = "Please select a priority";
    if (!form.description.trim())              e.description = "Description is required";
    if (form.description.trim().length < 10)   e.description = "At least 10 characters required";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setApiError("");

    try {
      const data = await createTicket(token, {
        title: form.title,
        description: form.description,
        category_id: form.category_id,
        priority_id: form.priority_id,
      });

      const createdTicketId = data?.ticket?.id ?? data?.id;
      const createdTicketNumber = data?.ticket?.ticket_number;

      if (attachments.length > 0) {
        if (!createdTicketId) {
          setApiError("Ticket was created, but attachments could not be uploaded (missing ticket id)." );
        } else {
          const BASE_URL = "http://127.0.0.1:8000/api";

          for (const file of attachments) {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(`${BASE_URL}/employee/tickets/${createdTicketId}/attachments`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              body: formData,
            });

            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body?.message || `Failed to upload attachment: ${file.name}`);
            }
          }

          setAttachments([]);
          setFileError("");
        }
      }

      setTicketRef(createdTicketNumber || "TKT-" + Math.floor(1000 + Math.random() * 9000));
      setSubmitted(true);
    } catch (err) {
      setApiError(err?.response?.data?.message || err.message || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ title: "", category_id: "", priority_id: "", description: "" });
    setErrors({}); setSubmitted(false); setApiError(""); setAttachments([]); setFileError("");
  };

  // ── File validation ──
  const handleFile = (e) => {
    const incoming = Array.from(e.target.files);
    setFileError("");

    // Check max file count BEFORE adding
    const availableSlots = MAX_FILES - attachments.length;
    if (availableSlots <= 0) {
      setFileError(`You can only attach up to ${MAX_FILES} files.`);
      e.target.value = "";
      return;
    }

    const accepted = [];
    const rejected = [];

    incoming.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} — unsupported file type`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`${file.name} — exceeds ${MAX_FILE_SIZE_MB}MB`);
        return;
      }
      accepted.push(file);
    });

    // Trim accepted to remaining slots
    const toAdd = accepted.slice(0, availableSlots);
    if (accepted.length > availableSlots) {
      rejected.push(`Only ${availableSlots} more file(s) could be added (max ${MAX_FILES} total)`);
    }

    if (rejected.length > 0) {
      setFileError(rejected.join(" · "));
    }

    if (toAdd.length > 0) {
      setAttachments(prev => [...prev, ...toAdd]);
    }

    e.target.value = ""; // allow re-selecting same file later
  };

  const removeFile = (i) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== i));
    setFileError("");
  };

  const selectedPriority = priorities.find(p => String(p.id) === String(form.priority_id));
  const remainingSlots = MAX_FILES - attachments.length;

  // ── Success ──
  if (submitted) {
    return (
      <div className="ct-success">
        <div className="ct-success__icon">
          <i className="ti ti-circle-check" />
        </div>
        <h2 className="ct-success__title">Ticket Submitted!</h2>
        <p className="ct-success__text">
          Your support request has been received. Our IT team will get back to you shortly.
        </p>
        <div className="ct-success__ref">
          <span className="ct-success__ref-label">Ticket Reference</span>
          <span className="ct-success__ref-num">{ticketRef}</span>
        </div>
        <div className="ct-success__actions">
          <button className="ct-btn ct-btn--outline" onClick={handleReset}>Create Another</button>
          <button className="ct-btn ct-btn--primary" onClick={() => navigate("/employee/my-tickets")}>View My Tickets</button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="ct-page">

      <div className="ct-page__header">
        <div>
          <h1 className="ct-page__title">Create New Ticket</h1>
          <p className="ct-page__subtitle">Submit a new IT support request</p>
        </div>
      </div>

      {apiError && (
        <div className="ct-api-error">
          <i className="ti ti-alert-circle" />
          {apiError}
        </div>
      )}

      <div className="ct-grid">

        {/* Main Form */}
        <div className="ct-card">
          <div className="ct-card__header">
            <h2 className="ct-card__title">Ticket Information</h2>
          </div>
          <div className="ct-card__body">

            {/* Title */}
            <div className={`ct-field ${errors.title ? "ct-field--error" : ""}`}>
              <label className="ct-label">Title <span className="ct-required">*</span></label>
              <input
                type="text"
                className="ct-input"
                placeholder="e.g. Cannot connect to VPN"
                value={form.title}
                onChange={update("title")}
              />
              {errors.title && <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.title}</span>}
            </div>

            {/* Category + Priority */}
            <div className="ct-row">
              <div className={`ct-field ${errors.category_id ? "ct-field--error" : ""}`}>
                <label className="ct-label">Category <span className="ct-required">*</span></label>
                <div className="ct-select-wrap">
                  <select className="ct-select" value={form.category_id} onChange={update("category_id")}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <i className="ti ti-chevron-down ct-select-icon" />
                </div>
                {errors.category_id && <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.category_id}</span>}
              </div>

              <div className={`ct-field ${errors.priority_id ? "ct-field--error" : ""}`}>
                <label className="ct-label">Priority <span className="ct-required">*</span></label>
                <div className="ct-select-wrap">
                  <select className="ct-select" value={form.priority_id} onChange={update("priority_id")}>
                    <option value="">Select Priority</option>
                    {priorities.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <i className="ti ti-chevron-down ct-select-icon" />
                </div>
                {errors.priority_id && <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.priority_id}</span>}
              </div>
            </div>

            {/* Priority preview */}
            {selectedPriority && (
              <div className="ct-priority-preview">
                Selected priority:
                <span className={`priority-badge priority-badge--${selectedPriority.name.toLowerCase()}`}>
                  {selectedPriority.name}
                </span>
              </div>
            )}

            {/* Description */}
            <div className={`ct-field ${errors.description ? "ct-field--error" : ""}`}>
              <label className="ct-label">Description <span className="ct-required">*</span></label>
              <textarea
                className="ct-textarea"
                rows={5}
                placeholder="Describe your issue in detail. Include error messages, steps to reproduce, and what you've tried..."
                value={form.description}
                onChange={update("description")}
              />
              <div className="ct-desc-footer">
                {errors.description
                  ? <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.description}</span>
                  : <span />
                }
                <span className="ct-char-count">{form.description.length} chars</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right column */}
        <div className="ct-right-col">

          {/* Attachments */}
          <div className="ct-card">
            <div className="ct-card__header">
              <h2 className="ct-card__title">
                Attachments <span className="ct-optional">(optional)</span>
              </h2>
            </div>
            <div className="ct-card__body">

              {remainingSlots > 0 ? (
                <label className="ct-upload">
                  <i className="ti ti-paperclip ct-upload__icon" />
                  <span className="ct-upload__text">Click to attach files</span>
                  <span className="ct-upload__sub">
                    PNG, JPG, PDF — up to {MAX_FILE_SIZE_MB}MB each · {remainingSlots} of {MAX_FILES} slots left
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="ct-upload__input"
                    onChange={handleFile}
                  />
                </label>
              ) : (
                <div className="ct-upload ct-upload--disabled">
                  <i className="ti ti-lock ct-upload__icon" />
                  <span className="ct-upload__text">Maximum {MAX_FILES} files reached</span>
                  <span className="ct-upload__sub">Remove a file to add another</span>
                </div>
              )}

              {fileError && (
                <div className="ct-file-error">
                  <i className="ti ti-alert-circle" />
                  {fileError}
                </div>
              )}

              {attachments.length > 0 && (
                <div className="ct-file-list">
                  {attachments.map((f, i) => (
                    <div key={i} className="ct-file-item">
                      <i className="ti ti-file" />
                      <span className="ct-file-name">{f.name}</span>
                      <span className="ct-file-size">({(f.size/1024/1024).toFixed(2)} MB)</span>
                      <button className="ct-file-remove" onClick={() => removeFile(i)}>
                        <i className="ti ti-x" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="ct-tips">
            <div className="ct-tips__icon"><i className="ti ti-info-circle" /></div>
            <div>
              <p className="ct-tips__title">Tips for faster resolution</p>
              <ul className="ct-tips__list">
                <li>Be specific about the issue and when it started</li>
                <li>Include any error messages you see</li>
                <li>Mention what you've already tried</li>
                <li>Attach screenshots if possible</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="ct-actions">
            <button className="ct-btn ct-btn--ghost" onClick={handleReset}>Clear Form</button>
            <button
              className="ct-btn ct-btn--primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <><span className="ct-spinner" /> Submitting...</>
                : <><i className="ti ti-send" /> Submit Ticket</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}