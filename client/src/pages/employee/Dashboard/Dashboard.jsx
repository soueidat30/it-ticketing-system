
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo2 from "../../../assets/logo2.png";
import {
  LayoutDashboard, Ticket, PlusCircle, BookOpen,
  Megaphone, User, Bell, Settings, MessageCircle,
  ChevronRight, Filter, MoreHorizontal, X,
  Search, ChevronDown
} from "lucide-react";

// ── Sidebar ──────────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/employee/dashboard",      active: true  },
  { icon: Ticket,          label: "My Tickets",    path: "/employee/my-tickets",     active: false },
  { icon: PlusCircle,      label: "Create Ticket", path: "/employee/create-ticket",  active: false },
  { icon: BookOpen,        label: "Knowledge Base",path: "/employee/knowledge-base", active: false },
  { icon: Megaphone,       label: "Announcements", path: "/employee/announcements",  active: false },
  { icon: User,            label: "Profile",       path: "/employee/profile",        active: false },
  { icon: Bell,            label: "Notifications", path: "/employee/notifications",  active: false },
  { icon: Settings,        label: "Settings",      path: "/employee/settings",       active: false },
];

function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-56 min-h-screen bg-white border-r border-black flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-black flex justify-center">
        <img src={logo2} alt="Tickora Logo" className="h-12 object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ icon: Icon, label, active, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-blue-50 text-blue-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {/* Help Box */}
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

      {/* User */}
      <div className="px-3 pb-4 border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            KL
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-700 truncate">Karen Lopez</p>
            <p className="text-xs text-gray-400">Employee</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </aside>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, count, linkText }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-gray-400 text-xs mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{count}</p>
        <button className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 mt-0.5 transition-colors">
          {linkText} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ── Priority Badge ────────────────────────────────────────────────────────────
function Priority({ level }) {
  const map = {
    High:   "bg-red-100 text-red-600",
    Medium: "bg-orange-100 text-orange-500",
    Low:    "bg-green-100 text-green-600",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[level] ?? "bg-gray-100 text-gray-500"}`}>
      {level}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function Status({ status }) {
  const map = {
    Open:          "bg-blue-100 text-blue-600",
    Pending:       "bg-orange-100 text-orange-500",
    Resolved:      "bg-green-100 text-green-600",
    Closed:        "bg-gray-100 text-gray-500",
    "In Progress": "bg-purple-100 text-purple-600",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ── Donut Chart (pure SVG) ────────────────────────────────────────────────────
function DonutChart({ open, pending, resolved }) {
  const total = open + pending + resolved;
  const r = 36, cx = 50, cy = 50, stroke = 12;
  const circ = 2 * Math.PI * r;

  const segments = [
    { value: open,     color: "#3b82f6", label: "Open",     pct: Math.round((open/total)*100)     },
    { value: pending,  color: "#f97316", label: "Pending",  pct: Math.round((pending/total)*100)  },
    { value: resolved, color: "#22c55e", label: "Resolved", pct: Math.round((resolved/total)*100) },
  ];

  let offset = 0;
  const arcs = segments.map((s) => {
    const dash = (s.value / total) * circ;
    const arc = { ...s, dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-4">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth={stroke} />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${a.dash} ${circ - a.dash}`}
            strokeDashoffset={-a.offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="6" fill="#9ca3af">tickets</text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }} />
            <span className="text-gray-500 w-14">{s.label}</span>
            <span className="text-gray-700 font-semibold">{s.value} ({s.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const tickets = [
  { id: "TK-1024", subject: "Email not working",             category: "Email",   priority: "High",   status: "Open",     updated: "1h ago" },
  { id: "TK-1023", subject: "Password reset request",        category: "Account", priority: "Medium", status: "Pending",  updated: "3h ago" },
  { id: "TK-1022", subject: "VPN connection issue",          category: "Network", priority: "High",   status: "Open",     updated: "5h ago" },
  { id: "TK-1021", subject: "Cannot access shared drive",    category: "Access",  priority: "Low",    status: "Resolved", updated: "1d ago" },
  { id: "TK-1020", subject: "Software installation request", category: "Software",priority: "Medium", status: "Closed",   updated: "2d ago" },
];

const tabs = ["All", "Open", "Pending", "Resolved", "Closed"];

const resources = [
  "How to reset your password",
  "Fix email not receiving issues",
  "VPN connection guide",
  "All help articles",
];

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [showAnnouncement, setShowAnnouncement] = useState(true);

  const filtered = activeTab === "All"
    ? tickets
    : tickets.filter((t) => t.status === activeTab);

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">Welcome back, Karen! 👋</h1>
            <p className="text-xs text-gray-400">Create and monitor your support requests.</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-64">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none flex-1"
              placeholder="Search tickets, knowledge base..."
            />
          </div>
          <button className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6 space-y-5">
          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<Ticket className="w-5 h-5 text-blue-500" />}
              iconBg="bg-blue-50"
              label="Open Tickets"
              count={3}
              linkText="View all open tickets"
            />
            <StatCard
              icon={<div className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center"><div className="w-2 h-2 bg-green-500 rounded-full" /></div>}
              iconBg="bg-green-50"
              label="Resolved Tickets"
              count={12}
              linkText="View resolved tickets"
            />
            <StatCard
              icon={<div className="w-5 h-5 rounded-full border-2 border-orange-400 flex items-center justify-center text-orange-400 text-xs font-bold">!</div>}
              iconBg="bg-orange-50"
              label="Pending Tickets"
              count={2}
              linkText="View pending tickets"
            />
            <StatCard
              icon={<div className="w-5 h-5 text-purple-500 font-bold text-base flex items-center justify-center">≡</div>}
              iconBg="bg-purple-50"
              label="Total Tickets"
              count={17}
              linkText="All time tickets"
            />
          </div>

          {/* Middle Row */}
          <div className="flex gap-4">
            {/* Ticket Table */}
            <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">My Tickets</h2>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                    <Filter className="w-3 h-3" /> Filters
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center px-5 border-b border-gray-100">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-sm px-3 py-2.5 font-medium transition-colors border-b-2 ${
                      activeTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100">
                    <th className="text-left px-5 py-3 font-medium">Ticket ID</th>
                    <th className="text-left px-3 py-3 font-medium">Subject</th>
                    <th className="text-left px-3 py-3 font-medium">Category</th>
                    <th className="text-left px-3 py-3 font-medium">Priority</th>
                    <th className="text-left px-3 py-3 font-medium">Status</th>
                    <th className="text-left px-3 py-3 font-medium">Updated</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/employee/ticket/${t.id}`)}
                    >
                      <td className="px-5 py-3 text-blue-600 font-medium">{t.id}</td>
                      <td className="px-3 py-3 text-gray-700">{t.subject}</td>
                      <td className="px-3 py-3 text-gray-500">{t.category}</td>
                      <td className="px-3 py-3"><Priority level={t.priority} /></td>
                      <td className="px-3 py-3"><Status status={t.status} /></td>
                      <td className="px-3 py-3 text-gray-400 text-xs">{t.updated}</td>
                      <td className="px-3 py-3">
                        <button className="p-1 rounded hover:bg-gray-100 transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">Showing 1 to {filtered.length} of {tickets.length} tickets</p>
                <div className="flex items-center gap-1">
                  <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors">‹</button>
                  {[1,2,3].map(n => (
                    <button key={n} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${n===1 ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-100"}`}>{n}</button>
                  ))}
                  <button className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors">›</button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="w-56 space-y-4 flex-shrink-0">
              {/* Create Ticket CTA */}
              <button
                onClick={() => navigate("/employee/create-ticket")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center gap-3 transition-colors shadow-sm"
              >
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Create New Ticket</p>
                  <p className="text-xs text-blue-200">Need help? Submit a new request</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />
              </button>

              {/* Donut Chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Ticket Status Overview</h3>
                <DonutChart open={3} pending={2} resolved={12} />
              </div>

              {/* Resources */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Helpful Resources</h3>
                <div className="space-y-1">
                  {resources.map((r) => (
                    <button key={r} className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-blue-600 py-1.5 border-b border-gray-50 last:border-0 transition-colors">
                      <span>{r}</span>
                      <ChevronRight className="w-3 h-3 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Announcement Banner */}
          {showAnnouncement && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">System Maintenance</p>
                <p className="text-xs text-gray-400">System maintenance will be on May 25, 2025 from 12:00 AM to 2:00 AM.</p>
              </div>
              <button className="text-xs text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors font-medium">
                View Details
              </button>
              <button onClick={() => setShowAnnouncement(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          )}

          <p className="text-center text-xs text-gray-300">© 2025 Tickora. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}