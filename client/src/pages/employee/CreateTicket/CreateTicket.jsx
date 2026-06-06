import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, PlusCircle, BookOpen,
  Megaphone, User, Bell, Settings, MessageCircle,
  ChevronRight, ChevronDown, AlertCircle, CheckCircle2,
  ArrowLeft, Paperclip, X
} from "lucide-react";
import { createTicket, getCategories, getPriorities } from "../../../services/ticketService";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/employee/dashboard",      active: false },
  { icon: Ticket,          label: "My Tickets",    path: "/employee/my-tickets",     active: false },
  { icon: PlusCircle,      label: "Create Ticket", path: "/employee/create-ticket",  active: true  },
  { icon: BookOpen,        label: "Knowledge Base",path: "/employee/knowledge-base", active: false },
  { icon: Megaphone,       label: "Announcements", path: "/employee/announcements",  active: false },
  { icon: User,            label: "Profile",       path: "/employee/profile",        active: false },
  { icon: Bell,            label: "Notifications", path: "/employee/notifications",  active: false },
  { icon: Settings,        label: "Settings",      path: "/employee/settings",       active: false },
];

function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || '{}');
  return (
    <aside className="w-56 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100 flex justify-center">
        <img src="/src/assets/logo2.png" alt="Tickora Logo" className="h-12 object-contain" />
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ icon: Icon, label, active, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>
      <div className="mx-3 mb-4 p-3 bg-blue-50 rounded-xl text-center">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm">
          <MessageCircle className="w-4 h-4 text-blue-600" />
        </div>
        <p className="text-xs text-gray-500 mb-1">Need immediate help?</p>
        <p className="text-xs font-semibold text-gray-700 mb-2">Contact IT Support</p>
        <button className="w-full text-xs bg-white border border-blue-200 text-blue-600 rounded-lg py-1.5 font-medium hover:bg-blue-600 hover:text-white transition-colors">
          Live Chat
        </button>
      </div>
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            {user?.full_name?.[0] || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">{user?.full_name || "User"}</p>
            <p className="text-xs text-gray-400">Employee</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </aside>
  );
}

function SelectField({ label, value, onChange, options, required, error }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none bg-white border rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors pr-10 ${
            error ? "border-red-300" : "border-gray-200 focus:border-blue-400"
          }`}
        >
          <option value="">Select {label}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

function PriorityBadge({ label }) {
  const map = {
    "Low":      "bg-green-100 text-green-600",
    "Medium":   "bg-orange-100 text-orange-500",
    "High":     "bg-red-100 text-red-600",
    "Critical": "bg-red-200 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[label] ?? "bg-gray-100 text-gray-500"}`}>
      {label}
    </span>
  );
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", category_id: "", priority_id: "", description: "", attachments: [] });
  const [errors, setErrors]         = useState({});
  const [submitted, setSubmitted]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [apiError, setApiError]     = useState("");
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [ticketRef, setTicketRef]   = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prios] = await Promise.all([getCategories(token), getPriorities(token)]);
        setCategories(cats.map(c => ({ id: c.id, name: c.category_name })));
        setPriorities(prios.map(p => ({ id: p.id, name: p.priority_name })));
      } catch (err) {
        setApiError("Failed to load form data. Please refresh the page.");
      }
    };
    fetchData();
  }, [token]);

  const update = (field) => (val) => {
    setForm((f) => ({ ...f, [field]: val }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = "Title is required";
    if (!form.category_id)        e.category_id = "Please select a category";
    if (!form.priority_id)        e.priority_id = "Please select a priority";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.description.trim().length < 10) e.description = "Description must be at least 10 characters";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError("");
    try {
      const data = await createTicket(token, {
        title:       form.title,
        description: form.description,
        category_id: form.category_id,
        priority_id: form.priority_id,
      });
      setTicketRef(data.ticket?.ticket_number || "TKT-" + Math.floor(1000 + Math.random() * 9000));
      setSubmitted(true);
    } catch (err) {
      setApiError(err.response?.data?.message || "Failed to submit ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ title: "", category_id: "", priority_id: "", description: "", attachments: [] });
    setErrors({});
    setSubmitted(false);
    setApiError("");
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((f) => ({ ...f, attachments: [...f.attachments, ...files] }));
  };

  const removeFile = (i) => {
    setForm((f) => ({ ...f, attachments: f.attachments.filter((_, idx) => idx !== i) }));
  };

  const selectedPriority = priorities.find(p => String(p.id) === String(form.priority_id));

  if (submitted) {
    return (
      <div className="flex min-h-screen bg-gray-50 font-sans">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ticket Submitted!</h2>
            <p className="text-gray-400 text-sm mb-4">Your support request has been received. Our IT team will get back to you shortly.</p>
            <div className="bg-blue-50 rounded-xl px-5 py-3 mb-6 inline-block">
              <p className="text-xs text-gray-400 mb-0.5">Ticket Reference</p>
              <p className="text-lg font-bold text-blue-600">{ticketRef}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleReset} className="flex-1 border border-blue-200 text-blue-600 rounded-lg py-2.5 text-sm font-medium hover:bg-blue-50 transition-colors">
                Create Another
              </button>
              <button onClick={() => navigate("/employee/my-tickets")} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 transition-colors">
                View My Tickets
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate("/employee/dashboard")} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-800">Create New Ticket</h1>
            <p className="text-xs text-gray-400">Submit a new IT support request</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-5">

            {apiError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {apiError}
              </div>
            )}

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
              <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3">Ticket Information</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => update("title")(e.target.value)}
                  placeholder="e.g. Cannot connect to VPN"
                  className={`w-full bg-white border rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder-gray-400 ${errors.title ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}
                />
                {errors.title && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.title}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Category" value={form.category_id} onChange={update("category_id")} options={categories} required error={errors.category_id} />
                <SelectField label="Priority"  value={form.priority_id} onChange={update("priority_id")} options={priorities} required error={errors.priority_id} />
              </div>

              {selectedPriority && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  Selected priority: <PriorityBadge label={selectedPriority.name} />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description")(e.target.value)}
                  placeholder="Please describe your issue in detail..."
                  rows={5}
                  className={`w-full bg-white border rounded-lg px-4 py-2.5 text-sm text-gray-700 outline-none transition-colors placeholder-gray-400 resize-none ${errors.description ? "border-red-300" : "border-gray-200 focus:border-blue-400"}`}
                />
                <div className="flex items-center justify-between">
                  {errors.description ? <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.description}</p> : <span />}
                  <p className="text-xs text-gray-400 ml-auto">{form.description.length} characters</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-3 mb-4">Attachments <span className="text-gray-400 font-normal">(optional)</span></h2>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <Paperclip className="w-6 h-6 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 font-medium">Click to attach files</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
              </label>
              {form.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {form.attachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-600">{file.name}</span>
                        <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-1 rounded hover:bg-gray-200 transition-colors">
                        <X className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 flex gap-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">i</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Tips for faster resolution</p>
                <ul className="text-xs text-blue-600 space-y-0.5 list-disc list-inside">
                  <li>Be specific about the issue and when it started</li>
                  <li>Include any error messages you see</li>
                  <li>Mention what you've already tried</li>
                  <li>Attach screenshots if possible</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 pb-8">
              <button onClick={handleReset} className="text-sm text-gray-500 border border-gray-200 rounded-lg px-5 py-2.5 hover:bg-gray-50 transition-colors font-medium">
                Clear Form
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="text-sm bg-blue-600 text-white rounded-lg px-6 py-2.5 hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting...</>
                ) : (
                  <><PlusCircle className="w-4 h-4" />Submit Ticket</>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}