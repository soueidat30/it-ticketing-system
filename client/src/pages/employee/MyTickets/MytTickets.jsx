import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Ticket, PlusCircle, BookOpen,
  Megaphone, User, Bell, Settings, MessageCircle,
  ChevronDown, Search, Filter, MoreHorizontal,
  ChevronRight, ChevronLeft, RefreshCw, Trash2
} from "lucide-react";
import { getMyTickets, deleteTicket } from "../../../services/ticketService";

// ── Sidebar ───────────────────────────────────────────────────────────────────
const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",     path: "/employee/dashboard",      active: false },
  { icon: Ticket,          label: "My Tickets",    path: "/employee/my-tickets",     active: true  },
  { icon: PlusCircle,      label: "Create Ticket", path: "/employee/create-ticket",  active: false },
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

// ── Priority Badge ────────────────────────────────────────────────────────────
function PriorityBadge({ label }) {
  const map = {
    "Low":      "bg-green-100 text-green-600",
    "Medium":   "bg-orange-100 text-orange-500",
    "High":     "bg-red-100 text-red-600",
    "Critical": "bg-red-200 text-red-700",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[label] ?? "bg-gray-100 text-gray-500"}`}>
      {label}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ label }) {
  const map = {
    "Open":        "bg-blue-100 text-blue-600",
    "In Progress": "bg-purple-100 text-purple-600",
    "Pending":     "bg-orange-100 text-orange-500",
    "Resolved":    "bg-green-100 text-green-600",
    "Closed":      "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[label] ?? "bg-gray-100 text-gray-500"}`}>
      {label}
    </span>
  );
}

const tabs = ["All", "Open", "In Progress", "Pending", "Resolved", "Closed"];
const ITEMS_PER_PAGE = 8;

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [activeTab, setActiveTab]   = useState("All");
  const [search, setSearch]         = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId]     = useState(null);
  const [deleting, setDeleting]     = useState(false);
  const token = localStorage.getItem("token");

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyTickets(token);
      setTickets(data);
    } catch (err) {
      setError("Failed to load tickets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); }, []);

  // Filter by tab and search
  const filtered = tickets.filter((t) => {
    const statusName = t.status?.status_name || "";
    const matchTab   = activeTab === "All" || statusName === activeTab;
    const matchSearch = !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.ticket_number.toLowerCase().includes(search.toLowerCase()) ||
      (t.category?.category_name || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleTabChange = (tab) => { setActiveTab(tab); setCurrentPage(1); };
  const handleSearch    = (val)  => { setSearch(val);   setCurrentPage(1); };

  const handleDelete = async (id) => {
    setDeleting(true);
    try {
      await deleteTicket(token, id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      setDeleteId(null);
    } catch (err) {
      setError("Failed to delete ticket.");
    } finally {
      setDeleting(false);
    }
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins < 60)   return `${mins}m ago`;
    if (hours < 24)  return `${hours}h ago`;
    if (days < 7)    return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">My Tickets</h1>
            <p className="text-xs text-gray-400">View and manage your support requests</p>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-56">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="bg-transparent text-sm text-gray-600 placeholder-gray-400 outline-none flex-1"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <button
            onClick={fetchTickets}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => navigate("/employee/create-ticket")}
            className="flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            New Ticket
          </button>
        </header>

        <div className="flex-1 overflow-auto p-6">

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Table Card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex items-center px-5 border-b border-gray-100 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`text-sm px-3 py-3 font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activeTab === tab
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab}
                  {tab === "All" && (
                    <span className="ml-1.5 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded-full">
                      {tickets.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Loading */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-sm text-gray-400">Loading tickets...</span>
              </div>
            ) : paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <Ticket className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No tickets found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {search ? "Try a different search term" : "Create a new ticket to get started"}
                </p>
                <button
                  onClick={() => navigate("/employee/create-ticket")}
                  className="mt-4 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Create Ticket
                </button>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-400 border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-5 py-3 font-medium">Ticket ID</th>
                    <th className="text-left px-3 py-3 font-medium">Title</th>
                    <th className="text-left px-3 py-3 font-medium">Category</th>
                    <th className="text-left px-3 py-3 font-medium">Priority</th>
                    <th className="text-left px-3 py-3 font-medium">Status</th>
                    <th className="text-left px-3 py-3 font-medium">Created</th>
                    <th className="px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-blue-600 font-medium">{t.ticket_number}</td>
                      <td className="px-3 py-3 text-gray-700 max-w-xs truncate">{t.title}</td>
                      <td className="px-3 py-3 text-gray-500">{t.category?.category_name || "-"}</td>
                      <td className="px-3 py-3"><PriorityBadge label={t.priority?.priority_name || "-"} /></td>
                      <td className="px-3 py-3"><StatusBadge label={t.status?.status_name || "-"} /></td>
                      <td className="px-3 py-3 text-gray-400 text-xs">{formatDate(t.created_at)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 justify-center">
                          {/* Only allow delete if status is Open */}
                          {(t.status?.status_name === "Open") && (
                            <button
                              onClick={() => setDeleteId(t.id)}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Cancel ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {!loading && filtered.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} tickets
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4 mx-auto" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setCurrentPage(n)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                        n === currentPage ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-100"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="w-7 h-7 rounded-lg text-xs text-gray-400 hover:bg-gray-100 transition-colors disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 text-center mb-2">Cancel Ticket?</h3>
            <p className="text-sm text-gray-400 text-center mb-6">
              Are you sure you want to cancel this ticket? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Keep Ticket
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-70"
              >
                {deleting ? "Cancelling..." : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}