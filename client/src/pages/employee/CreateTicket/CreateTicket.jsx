import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/RoleScopedLanguageContext";
import "./CreateTicket.css";
import { createTicket, getCategories, getPriorities } from "../../../services/ticketService";

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
const BASE_URL = "http://127.0.0.1:8000/api";

export default function CreateTicket() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const token = localStorage.getItem("token");

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

  // AI suggestion state
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiError, setAiError]         = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiApplied, setAiApplied]     = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prios] = await Promise.all([getCategories(token), getPriorities(token)]);
        setCategories(cats.map(c => ({ id: c.id, name: c.category_name })));
        setPriorities(prios.map(p => ({ id: p.id, name: p.priority_name })));
      } catch {
        setApiError(t("createTicket.apiErrorLoadForm", "Failed to load form data. Please refresh."));
      }
    };
    fetchData();
  }, [token, t]);

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())                    e.title       = t("createTicket.errTitleRequired",     "Title is required");
    if (!form.category_id)                     e.category_id = t("createTicket.errCategoryRequired", "Please select a category");
    if (!form.priority_id)                     e.priority_id = t("createTicket.errPriorityRequired", "Please select a priority");
    if (!form.description.trim())              e.description = t("createTicket.errDescriptionRequired","Description is required");
    if (form.description.trim().length < 10)   e.description = t("createTicket.errDescriptionTooShort","At least 10 characters required");
    return e;
  };

  const canSuggest = form.title.trim().length > 0 && form.description.trim().length >= 10;

  const requestAiSuggestion = async () => {
    if (!canSuggest || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    setAiSuggestion(null);
    setAiApplied(false);

    try {
      const res = await fetch(`${BASE_URL}/ai/suggest-ticket-fields`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || t("createTicket.aiErrGeneric", "Could not get a suggestion."));

      setAiSuggestion(data);
    } catch (err) {
      setAiError(err.message || t("createTicket.aiErrGeneric", "AI suggestion failed. Please choose manually."));
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    const matchedCategory = categories.find(c => c.name.toLowerCase() === aiSuggestion.category.toLowerCase());
    const matchedPriority = priorities.find(p => p.name.toLowerCase() === aiSuggestion.priority.toLowerCase());

    setForm(f => ({
      ...f,
      category_id: matchedCategory ? String(matchedCategory.id) : f.category_id,
      priority_id: matchedPriority ? String(matchedPriority.id) : f.priority_id,
    }));
    setErrors(er => ({ ...er, category_id: "", priority_id: "" }));
    setAiApplied(true);
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
          setApiError(t("createTicket.errUploadMissingId", "Ticket was created, but attachments could not be uploaded (missing ticket id)."));
        } else {
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
              throw new Error(body?.message || t("createTicket.errUploadFailed", "Failed to upload attachment: {{name}}", { name: file.name }));
            }
          }
          setAttachments([]);
          setFileError("");
        }
      }

      setTicketRef(createdTicketNumber || "TKT-" + Math.floor(1000 + Math.random() * 9000));
      setSubmitted(true);
    } catch (err) {
      setApiError(err?.response?.data?.message || err.message || t("createTicket.errSubmitFailed", "Failed to submit. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ title: "", category_id: "", priority_id: "", description: "" });
    setErrors({}); setSubmitted(false); setApiError(""); setAttachments([]); setFileError("");
    setAiSuggestion(null); setAiError(""); setAiApplied(false);
  };

  const handleFile = (e) => {
    const incoming = Array.from(e.target.files);
    setFileError("");

    const availableSlots = MAX_FILES - attachments.length;
    if (availableSlots <= 0) {
      setFileError(t("createTicket.errMaxFiles", "You can only attach up to {{n}} files.", { n: MAX_FILES }));
      e.target.value = "";
      return;
    }

    const accepted = [];
    const rejected = [];

    incoming.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} — ${t("createTicket.errUnsupportedType", "unsupported file type")}`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        rejected.push(`${file.name} — ${t("createTicket.errExceedsSize", "exceeds {{n}}MB", { n: MAX_FILE_SIZE_MB })}`);
        return;
      }
      accepted.push(file);
    });

    const toAdd = accepted.slice(0, availableSlots);
    if (accepted.length > availableSlots) {
      rejected.push(t("createTicket.errOnlyAddMore", "Only {{n}} more file(s) could be added (max {{max}} total)", {
        n: availableSlots, max: MAX_FILES
      }));
    }

    if (rejected.length > 0) {
      setFileError(rejected.join(" · "));
    }

    if (toAdd.length > 0) {
      setAttachments(prev => [...prev, ...toAdd]);
    }

    e.target.value = "";
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
        <h2 className="ct-success__title">{t("createTicket.successTitle", "Ticket Submitted!")}</h2>
        <p className="ct-success__text">
          {t("createTicket.successText", "Your support request has been received. Our IT team will get back to you shortly.")}
        </p>
        <div className="ct-success__ref">
          <span className="ct-success__ref-label">{t("createTicket.successRefLabel", "Ticket Reference")}</span>
          <span className="ct-success__ref-num">{ticketRef}</span>
        </div>
        <div className="ct-success__actions">
          <button className="ct-btn ct-btn--outline" onClick={handleReset}>
            {t("createTicket.createAnother", "Create Another")}
          </button>
          <button className="ct-btn ct-btn--primary" onClick={() => navigate("/employee/my-tickets")}>
            {t("createTicket.viewMyTickets", "View My Tickets")}
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="ct-page">

      <div className="ct-page__header">
        <div>
          <h1 className="ct-page__title">{t("createTicket.title", "Create New Ticket")}</h1>
          <p className="ct-page__subtitle">{t("createTicket.subtitle", "Submit a new IT support request")}</p>
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
            <h2 className="ct-card__title">{t("createTicket.sectionTitle", "Ticket Information")}</h2>
          </div>
          <div className="ct-card__body">

            {/* Title */}
            <div className={`ct-field ${errors.title ? "ct-field--error" : ""}`}>
              <label className="ct-label">
                {t("createTicket.titleLabel", "Title")} <span className="ct-required">*</span>
              </label>
              <input
                type="text"
                className="ct-input"
                placeholder={t("createTicket.titlePh", "e.g. Cannot connect to VPN")}
                value={form.title}
                onChange={update("title")}
              />
              {errors.title && <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.title}</span>}
            </div>

            {/* Description */}
            <div className={`ct-field ${errors.description ? "ct-field--error" : ""}`}>
              <label className="ct-label">
                {t("createTicket.descriptionLabel", "Description")} <span className="ct-required">*</span>
              </label>
              <textarea
                className="ct-textarea"
                rows={5}
                placeholder={t("createTicket.descriptionPh", "Describe your issue in detail. Include error messages, steps to reproduce, and what you've tried...")}
                value={form.description}
                onChange={update("description")}
              />
              <div className="ct-desc-footer">
                {errors.description
                  ? <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.description}</span>
                  : <span />
                }
                <span className="ct-char-count">{t("createTicket.charCount", "{{n}} chars", { n: form.description.length })}</span>
              </div>
            </div>

            {/* AI suggestion panel */}
            <div className="ct-ai-box">
              <div className="ct-ai-box__header">
                <span className="ct-ai-box__title">
                  <i className="ti ti-sparkles" /> {t("createTicket.aiTitle", "AI category & priority suggestion")}
                </span>
                <button
                  type="button"
                  className="ct-ai-box__btn"
                  onClick={requestAiSuggestion}
                  disabled={!canSuggest || aiLoading}
                  title={!canSuggest ? t("createTicket.aiBtnHint", "Add a title and at least 10 characters of description first") : ""}
                >
                  {aiLoading
                    ? <><span className="ct-spinner" /> {t("createTicket.aiThinking", "Thinking…")}</>
                    : <><i className="ti ti-wand" /> {t("createTicket.aiSuggest", "Suggest")}</>
                  }
                </button>
              </div>

              {aiError && (
                <div className="ct-ai-box__error">
                  <i className="ti ti-alert-circle" /> {aiError}
                </div>
              )}

              {aiSuggestion && (
                <div className="ct-ai-box__result">
                  <div className="ct-ai-box__pills">
                    <span className="ct-ai-pill">
                      <i className="ti ti-folder" /> {aiSuggestion.category}
                    </span>
                    <span className="ct-ai-pill">
                      <i className="ti ti-flag" /> {aiSuggestion.priority}
                    </span>
                  </div>
                  {aiSuggestion.reasoning && (
                    <p className="ct-ai-box__reasoning">{aiSuggestion.reasoning}</p>
                  )}
                  <button
                    type="button"
                    className={`ct-ai-box__apply ${aiApplied ? "ct-ai-box__apply--done" : ""}`}
                    onClick={applyAiSuggestion}
                    disabled={aiApplied}
                  >
                    {aiApplied
                      ? <><i className="ti ti-check" /> {t("createTicket.aiApplied", "Applied")}</>
                      : t("createTicket.aiUseSuggestion", "Use this suggestion")
                    }
                  </button>
                </div>
              )}

              {!aiSuggestion && !aiError && !aiLoading && (
                <p className="ct-ai-box__hint">
                  {t("createTicket.aiHint", "Fill in the title and description, then let AI suggest a category and priority for you.")}
                </p>
              )}
            </div>

            {/* Category + Priority */}
            <div className="ct-row">
              <div className={`ct-field ${errors.category_id ? "ct-field--error" : ""}`}>
                <label className="ct-label">
                  {t("createTicket.categoryLabel", "Category")} <span className="ct-required">*</span>
                </label>
                <div className="ct-select-wrap">
                  <select className="ct-select" value={form.category_id} onChange={update("category_id")}>
                    <option value="">{t("createTicket.categoryPh", "Select Category")}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <i className="ti ti-chevron-down ct-select-icon" />
                </div>
                {errors.category_id && <span className="ct-error-msg"><i className="ti ti-alert-circle" />{errors.category_id}</span>}
              </div>

              <div className={`ct-field ${errors.priority_id ? "ct-field--error" : ""}`}>
                <label className="ct-label">
                  {t("createTicket.priorityLabel", "Priority")} <span className="ct-required">*</span>
                </label>
                <div className="ct-select-wrap">
                  <select className="ct-select" value={form.priority_id} onChange={update("priority_id")}>
                    <option value="">{t("createTicket.priorityPh", "Select Priority")}</option>
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
                {t("createTicket.selectedPriority", "Selected priority:")}
                <span className={`priority-badge priority-badge--${selectedPriority.name.toLowerCase()}`}>
                  {selectedPriority.name}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Right column */}
        <div className="ct-right-col">

          {/* Attachments */}
          <div className="ct-card">
            <div className="ct-card__header">
              <h2 className="ct-card__title">
                {t("createTicket.attachmentsTitle", "Attachments")} <span className="ct-optional">{t("createTicket.optional", "(optional)")}</span>
              </h2>
            </div>
            <div className="ct-card__body">

              {remainingSlots > 0 ? (
                <label className="ct-upload">
                  <i className="ti ti-paperclip ct-upload__icon" />
                  <span className="ct-upload__text">{t("createTicket.uploadText", "Click to attach files")}</span>
                  <span className="ct-upload__sub">
                    {t("createTicket.uploadSub", "PNG, JPG, PDF — up to {{n}}MB each · {{rem}} of {{max}} slots left", {
                      n: MAX_FILE_SIZE_MB, rem: remainingSlots, max: MAX_FILES
                    })}
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
                  <span className="ct-upload__text">{t("createTicket.uploadMaxReached", "Maximum {{n}} files reached", { n: MAX_FILES })}</span>
                  <span className="ct-upload__sub">{t("createTicket.uploadRemoveFirst", "Remove a file to add another")}</span>
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
                      <span className="ct-file-size">({(Math.round((f.size / 1024 / 1024) * 10) / 10).toFixed(1)} MB)</span>


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
              <p className="ct-tips__title">{t("createTicket.tipsTitle", "Tips for faster resolution")}</p>
              <ul className="ct-tips__list">
                <li>{t("createTicket.tip1", "Be specific about the issue and when it started")}</li>
                <li>{t("createTicket.tip2", "Include any error messages you see")}</li>
                <li>{t("createTicket.tip3", "Mention what you've already tried")}</li>
                <li>{t("createTicket.tip4", "Attach screenshots if possible")}</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="ct-actions">
            <button className="ct-btn ct-btn--ghost" onClick={handleReset}>
              {t("createTicket.clearForm", "Clear Form")}
            </button>
            <button
              className="ct-btn ct-btn--primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading
                ? <><span className="ct-spinner" /> {t("createTicket.submitting", "Submitting...")}</>
                : <><i className="ti ti-send" /> {t("createTicket.submitTicket", "Submit Ticket")}</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}