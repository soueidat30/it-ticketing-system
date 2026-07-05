import { useEffect, useMemo, useState } from "react";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import "./Reports.css";

const BASE_URL = "http://127.0.0.1:8000/api";

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
  chart: "M3 3v18h18 M7 15l4-4 3 3 6-7",
  ticket:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2",
  clock: "M12 22a10 10 0 100-20 10 10 0 000 20z M12 6v6l4 2",
  users:
    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
  warning:
    "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4 M12 17h.01",
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  print:
    "M6 9V2h12v7 M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2 M6 14h12v8H6z",
  filter: "M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
  refresh: "M21 2v6h-6 M3 22v-6h6 M20.49 9A9 9 0 005.64 5.64L3 8 M3.51 15A9 9 0 0018.36 18.36L21 16",
  check: "M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3",
};

const ns = (s) => String(s ?? "").toLowerCase().replace(/\s+/g, "-");

const pretty = (value) => {
  if (!value) return "—";
  return String(value).replace(/-/g, " ");
};

const dateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffHours = (start, end) => {
  if (!start || !end) return null;
  return Math.max(0, (end.getTime() - start.getTime()) / 36e5);
};

const formatHours = (hours) => {
  if (!Number.isFinite(hours)) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

const monthId = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (date) =>
  date.toLocaleDateString(undefined, { month: "short", year: "numeric" });

const getStatus = (ticket) =>
  ticket.status?.status_name ?? ticket.status_name ?? "Open";

const getPriority = (ticket) =>
  ticket.priority?.priority_name ?? ticket.priority_name ?? "Low";

const getCategory = (ticket) =>
  ticket.category?.category_name ?? ticket.category_name ?? "Uncategorized";

const getRequester = (ticket) =>
  ticket.user?.full_name ?? ticket.user?.username ?? ticket.requester_name ?? "Unknown";

const getAssignee = (ticket) =>
  ticket.assignee?.full_name ?? ticket.assignee?.username ?? null;

const isResolvedTicket = (ticket) => {
  const status = ns(getStatus(ticket));
  return status === "resolved" || status === "closed";
};

const getResolutionDate = (ticket) => {
  return (
    dateOrNull(ticket.resolved_at) ||
    dateOrNull(ticket.closed_at) ||
    dateOrNull(ticket.resolution_date) ||
    (isResolvedTicket(ticket) ? dateOrNull(ticket.updated_at) : null)
  );
};

const SLA_HOURS = {
  critical: 4,
  high: 8,
  medium: 24,
  low: 48,
};

const STATUS_COLORS = {
  open: "#1f73b7",
  "in-progress": "#6b46c1",
  pending: "#d97706",
  resolved: "#0f8b4c",
  closed: "#5f6f73",
};

const PRIORITY_COLORS = {
  critical: "#c72a1c",
  high: "#ea580c",
  medium: "#d97706",
  low: "#1f73b7",
};

const CATEGORY_COLORS = [
  "#1f73b7",
  "#0f8b8d",
  "#0f8b4c",
  "#d97706",
  "#6b46c1",
  "#db2777",
  "#64748b",
];

function BarList({ items }) {
  const max = Math.max(1, ...items.map((item) => item.value));

  if (!items.length) {
    return <div className="rp-mini-empty">No data available</div>;
  }

  return (
    <div className="rp-bar-list">
      {items.map((item) => (
        <div className="rp-bar-row" key={item.label}>
          <div className="rp-bar-row-top">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
          <div className="rp-hbar">
            <span
              className="rp-hbar-fill"
              style={{
                width: `${Math.max(5, (item.value / max) * 100)}%`,
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const token = localStorage.getItem("token");

  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [range, setRange] = useState("30d");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    let ignore = false;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };

    const fetchJson = async (url) => {
      const res = await fetch(url, { headers });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Request failed");
      return data;
    };

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        // Reports needs the full ticket dataset to compute accurate KPIs/charts.
        const ticketData = await fetchJson(`${BASE_URL}/tickets?pageSize=all`);

        const [agentRes, statusRes, priorityRes, categoryRes] =
          await Promise.allSettled([
            fetchJson(`${BASE_URL}/users?role=agent`),
            fetchJson(`${BASE_URL}/statuses`),
            fetchJson(`${BASE_URL}/priorities`),
            fetchJson(`${BASE_URL}/categories`),
          ]);

        if (ignore) return;

        setTickets(Array.isArray(ticketData) ? ticketData : ticketData?.data ?? []);

        if (agentRes.status === "fulfilled") {
          setAgents(Array.isArray(agentRes.value) ? agentRes.value : agentRes.value?.data ?? []);
        }

        if (statusRes.status === "fulfilled") {
          setStatuses(Array.isArray(statusRes.value) ? statusRes.value : []);
        }

        if (priorityRes.status === "fulfilled") {
          setPriorities(Array.isArray(priorityRes.value) ? priorityRes.value : []);
        }

        if (categoryRes.status === "fulfilled") {
          setCategories(Array.isArray(categoryRes.value) ? categoryRes.value : []);
        }
      } catch {
        if (!ignore) setError("Failed to load reports data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();

    return () => {
      ignore = true;
    };
  }, [token]);

  const rangeStart = useMemo(() => {
    if (range === "all") return null;

    const date = new Date();

    if (range === "7d") date.setDate(date.getDate() - 7);
    if (range === "30d") date.setDate(date.getDate() - 30);
    if (range === "quarter") date.setMonth(date.getMonth() - 3);
    if (range === "year") date.setFullYear(date.getFullYear() - 1);

    return date;
  }, [range]);

  const statusOptions = useMemo(() => {
    const map = new Map();

    statuses.forEach((s) => map.set(ns(s.status_name), s.status_name));
    tickets.forEach((t) => map.set(ns(getStatus(t)), getStatus(t)));

    return [...map.entries()]
      .filter(([value]) => value)
      .map(([value, label]) => ({ value, label }));
  }, [statuses, tickets]);

  const priorityOptions = useMemo(() => {
    const map = new Map();

    priorities.forEach((p) => map.set(ns(p.priority_name), p.priority_name));
    tickets.forEach((t) => map.set(ns(getPriority(t)), getPriority(t)));

    return [...map.entries()]
      .filter(([value]) => value)
      .sort((a, b) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return (order[a[0]] ?? 9) - (order[b[0]] ?? 9);
      })
      .map(([value, label]) => ({ value, label }));
  }, [priorities, tickets]);

  const categoryOptions = useMemo(() => {
    const map = new Map();

    categories.forEach((c) => map.set(String(c.id), c.category_name));

    tickets.forEach((t) => {
      const id = String(t.category_id ?? t.category?.id ?? "");
      if (id) map.set(id, getCategory(t));
    });

    return [...map.entries()]
      .filter(([value]) => value)
      .map(([value, label]) => ({ value, label }));
  }, [categories, tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const createdAt = dateOrNull(ticket.created_at);

      if (rangeStart && createdAt && createdAt < rangeStart) return false;

      if (statusFilter && ns(getStatus(ticket)) !== statusFilter) return false;

      if (priorityFilter && ns(getPriority(ticket)) !== priorityFilter) return false;

      const ticketCategoryId = String(ticket.category_id ?? ticket.category?.id ?? "");
      if (categoryFilter && ticketCategoryId !== categoryFilter) return false;

      return true;
    });
  }, [tickets, rangeStart, statusFilter, priorityFilter, categoryFilter]);

  const report = useMemo(() => {
    const total = filteredTickets.length;

    const open = filteredTickets.filter((t) => ns(getStatus(t)) === "open").length;
    const pending = filteredTickets.filter((t) => ns(getStatus(t)) === "pending").length;
    const inProgress = filteredTickets.filter(
      (t) => ns(getStatus(t)) === "in-progress"
    ).length;

    const resolved = filteredTickets.filter(isResolvedTicket).length;
    const critical = filteredTickets.filter(
      (t) => ns(getPriority(t)) === "critical"
    ).length;

    const unassigned = filteredTickets.filter((t) => !t.assigned_to && !t.assignee).length;

    const resolutionHours = filteredTickets
      .map((t) => {
        const start = dateOrNull(t.created_at);
        const end = getResolutionDate(t);
        return diffHours(start, end);
      })
      .filter((value) => Number.isFinite(value));

    const avgResolution =
      resolutionHours.length > 0
        ? resolutionHours.reduce((sum, value) => sum + value, 0) / resolutionHours.length
        : NaN;

    let slaMet = 0;
    let slaBreached = 0;
    let slaAtRisk = 0;

    filteredTickets.forEach((ticket) => {
      const createdAt = dateOrNull(ticket.created_at);
      if (!createdAt) return;

      const priority = ns(getPriority(ticket));
      const limit = SLA_HOURS[priority] ?? 48;
      const end = getResolutionDate(ticket) || new Date();
      const hours = diffHours(createdAt, end);

      if (!Number.isFinite(hours)) return;

      if (hours > limit) {
        slaBreached += 1;
      } else if (isResolvedTicket(ticket)) {
        slaMet += 1;
      } else if (hours > limit * 0.8) {
        slaAtRisk += 1;
      }
    });

    const slaCompliance =
      slaMet + slaBreached > 0 ? Math.round((slaMet / (slaMet + slaBreached)) * 100) : 100;

    return {
      total,
      open,
      pending,
      inProgress,
      resolved,
      critical,
      unassigned,
      avgResolution,
      slaMet,
      slaBreached,
      slaAtRisk,
      slaCompliance,
    };
  }, [filteredTickets]);

  const monthlyData = useMemo(() => {
    const count = range === "year" || range === "all" ? 12 : range === "quarter" ? 4 : 6;

    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - count + 1);

    const map = new Map();

    for (let i = 0; i < count; i += 1) {
      const date = new Date(start);
      date.setMonth(start.getMonth() + i);

      map.set(monthId(date), {
        id: monthId(date),
        label: monthLabel(date),
        created: 0,
        resolved: 0,
      });
    }

    filteredTickets.forEach((ticket) => {
      const createdAt = dateOrNull(ticket.created_at);
      const resolvedAt = getResolutionDate(ticket);

      if (createdAt && map.has(monthId(createdAt))) {
        map.get(monthId(createdAt)).created += 1;
      }

      if (resolvedAt && map.has(monthId(resolvedAt))) {
        map.get(monthId(resolvedAt)).resolved += 1;
      }
    });

    return [...map.values()];
  }, [filteredTickets, range]);

  const statusData = useMemo(() => {
    const map = new Map();

    filteredTickets.forEach((ticket) => {
      const label = pretty(getStatus(ticket));
      const key = ns(label);

      map.set(key, {
        label,
        value: (map.get(key)?.value ?? 0) + 1,
        color: STATUS_COLORS[key] ?? "#64748b",
      });
    });

    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [filteredTickets]);

  const categoryData = useMemo(() => {
    const map = new Map();

    filteredTickets.forEach((ticket) => {
      const label = getCategory(ticket);
      map.set(label, (map.get(label) ?? 0) + 1);
    });

    return [...map.entries()]
      .map(([label, value], index) => ({
        label,
        value,
        color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTickets]);

  const priorityData = useMemo(() => {
    const map = new Map();

    filteredTickets.forEach((ticket) => {
      const label = pretty(getPriority(ticket));
      const key = ns(label);

      map.set(key, {
        label,
        value: (map.get(key)?.value ?? 0) + 1,
        color: PRIORITY_COLORS[key] ?? "#64748b",
      });
    });

    const order = { critical: 0, high: 1, medium: 2, low: 3 };

    return [...map.entries()]
      .sort((a, b) => (order[a[0]] ?? 9) - (order[b[0]] ?? 9))
      .map(([, value]) => value);
  }, [filteredTickets]);

  const agentRows = useMemo(() => {
    const map = new Map();

    agents.forEach((agent) => {
      map.set(String(agent.id), {
        id: String(agent.id),
        name: agent.full_name ?? agent.username ?? `Agent #${agent.id}`,
        total: 0,
        resolved: 0,
        open: 0,
        avgHours: [],
      });
    });

    filteredTickets.forEach((ticket) => {
      const id = String(ticket.assigned_to ?? ticket.assignee?.id ?? "unassigned");

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: getAssignee(ticket) ?? "Unassigned",
          total: 0,
          resolved: 0,
          open: 0,
          avgHours: [],
        });
      }

      const row = map.get(id);
      row.total += 1;

      if (isResolvedTicket(ticket)) row.resolved += 1;
      else row.open += 1;

      const start = dateOrNull(ticket.created_at);
      const end = getResolutionDate(ticket);
      const hours = diffHours(start, end);

      if (Number.isFinite(hours)) row.avgHours.push(hours);
    });

    return [...map.values()]
      .filter((row) => row.total > 0)
      .map((row) => ({
        ...row,
        avg:
          row.avgHours.length > 0
            ? row.avgHours.reduce((sum, value) => sum + value, 0) / row.avgHours.length
            : NaN,
      }))
      .sort((a, b) => b.resolved - a.resolved || b.total - a.total)
      .slice(0, 6);
  }, [agents, filteredTickets]);

  const requesterRows = useMemo(() => {
    const map = new Map();

    filteredTickets.forEach((ticket) => {
      const id = String(ticket.user_id ?? ticket.user?.id ?? getRequester(ticket));

      if (!map.has(id)) {
        map.set(id, {
          id,
          name: getRequester(ticket),
          total: 0,
          open: 0,
          resolved: 0,
        });
      }

      const row = map.get(id);
      row.total += 1;

      if (isResolvedTicket(ticket)) row.resolved += 1;
      else row.open += 1;
    });

    return [...map.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [filteredTickets]);

  const maxMonthly = Math.max(
    1,
    ...monthlyData.map((item) => Math.max(item.created, item.resolved))
  );

  const donutBg = useMemo(() => {
    if (!statusData.length) return "#edf0f2";

    let cursor = 0;

    return statusData
      .map((item) => {
        const pct = report.total > 0 ? (item.value / report.total) * 100 : 0;
        const segment = `${item.color} ${cursor}% ${cursor + pct}%`;
        cursor += pct;
        return segment;
      })
      .join(", ");
  }, [statusData, report.total]);

  const resetFilters = () => {
    setRange("30d");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
  };

  const exportCSV = () => {
    const headers = [
      "Ticket Number",
      "Title",
      "Requester",
      "Assignee",
      "Category",
      "Priority",
      "Status",
      "Created At",
      "Resolution Time",
    ];

    const rows = filteredTickets.map((ticket) => {
      const start = dateOrNull(ticket.created_at);
      const end = getResolutionDate(ticket);
      const hours = diffHours(start, end);

      return [
        ticket.ticket_number ?? `#${ticket.id}`,
        ticket.title ?? "Untitled",
        getRequester(ticket),
        getAssignee(ticket) ?? "Unassigned",
        getCategory(ticket),
        getPriority(ticket),
        getStatus(ticket),
        ticket.created_at ?? "",
        Number.isFinite(hours) ? formatHours(hours) : "",
      ];
    });

    const escapeCsv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const exportPDF = async () => {
    const reportElement = document.querySelector('.rp-page');

    if (!reportElement) {
      console.error('Report container not found');
      return;
    }

    try {
      // Create a clone of the element to style it for print
      const clone = reportElement.cloneNode(true);

      // Create a style element for print-specific styles
      const style = document.createElement('style');
      style.textContent = `
        @page {
          size: A4;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 0;
        }
        .rp-page {
          width: 100%;
          padding: 20px;
          box-sizing: border-box;
        }
        .rp-page-header, .rp-filter-card, .rp-actions {
          display: none !important;
        }
        .rp-grid, .rp-kpis, .rp-card {
          display: block !important;
        }
      `;

      // Append the style to the clone
      clone.appendChild(style);

      // Append the clone to the body temporarily
      document.body.appendChild(clone);

      // Use html2canvas to capture the element
      const canvas = await html2canvas(clone, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Create a new PDF document
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add new pages if content is longer than one page
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`ticket-report-${new Date().toISOString().slice(0, 10)}.pdf`);

      // Remove the clone from the DOM
      document.body.removeChild(clone);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return (
    <div className="rp-page">
      <div className="rp-page-header">
        <div>
          <h1 className="rp-title">Reports</h1>
          <p className="rp-subtitle">
            Monitor ticket volume, resolution time, SLA performance, and agent workload.
          </p>
        </div>

        <div className="rp-actions">
          <button className="rp-btn rp-btn--ghost" onClick={exportPDF}>
            <Icon d={IC.print} size={14} />
            Print / PDF
          </button>

          <button className="rp-btn rp-btn--primary" onClick={exportCSV}>
            <Icon d={IC.download} size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="rp-filter-card">
        <div className="rp-filter-heading">
          <Icon d={IC.filter} size={15} />
          Report filters
        </div>

        <div className="rp-filter-controls">
          <select className="rp-select" value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="quarter">Last quarter</option>
            <option value="year">Last year</option>
            <option value="all">All time</option>
          </select>

          <select
            className="rp-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          <select
            className="rp-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All priorities</option>
            {priorityOptions.map((priority) => (
              <option key={priority.value} value={priority.value}>
                {priority.label}
              </option>
            ))}
          </select>

          <select
            className="rp-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>

          <button className="rp-btn rp-btn--light" onClick={resetFilters}>
            <Icon d={IC.refresh} size={14} />
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div className="rp-error">
          <Icon d={IC.warning} size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="rp-card rp-loading">Loading reports…</div>
      ) : (
        <>
          <section className="rp-kpis">
            <div className="rp-kpi-card">
              <div className="rp-kpi-icon rp-kpi-icon--blue">
                <Icon d={IC.ticket} size={18} />
              </div>
              <div>
                <span>Total Tickets</span>
                <strong>{report.total}</strong>
              </div>
            </div>

            <div className="rp-kpi-card">
              <div className="rp-kpi-icon rp-kpi-icon--green">
                <Icon d={IC.check} size={18} />
              </div>
              <div>
                <span>Resolved / Closed</span>
                <strong>{report.resolved}</strong>
              </div>
            </div>

            <div className="rp-kpi-card">
              <div className="rp-kpi-icon rp-kpi-icon--orange">
                <Icon d={IC.clock} size={18} />
              </div>
              <div>
                <span>Avg. Resolution</span>
                <strong>{formatHours(report.avgResolution)}</strong>
              </div>
            </div>

            <div className="rp-kpi-card">
              <div className="rp-kpi-icon rp-kpi-icon--red">
                <Icon d={IC.warning} size={18} />
              </div>
              <div>
                <span>SLA Compliance</span>
                <strong>{report.slaCompliance}%</strong>
              </div>
            </div>
          </section>

          <section className="rp-grid rp-grid--two">
            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>Monthly Ticket Report</h2>
                  <p>Created vs resolved tickets</p>
                </div>

                <div className="rp-chart-legend">
                  <span>
                    <i className="rp-dot rp-dot--created" />
                    Created
                  </span>
                  <span>
                    <i className="rp-dot rp-dot--resolved" />
                    Resolved
                  </span>
                </div>
              </div>

              <div className="rp-column-chart">
                {monthlyData.map((item) => (
                  <div className="rp-column-group" key={item.id}>
                    <div className="rp-bars">
                      <span
                        className="rp-bar rp-bar--created"
                        style={{
                          height: `${item.created ? Math.max(8, (item.created / maxMonthly) * 100) : 2}%`,
                        }}
                        title={`${item.created} created`}
                      />
                      <span
                        className="rp-bar rp-bar--resolved"
                        style={{
                          height: `${item.resolved ? Math.max(8, (item.resolved / maxMonthly) * 100) : 2}%`,
                        }}
                        title={`${item.resolved} resolved`}
                      />
                    </div>
                    <span className="rp-axis-label">{item.label.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>Status Distribution</h2>
                  <p>Current ticket workflow state</p>
                </div>
              </div>

              <div className="rp-donut-wrap">
                <div
                  className="rp-donut"
                  style={{ background: `conic-gradient(${donutBg})` }}
                >
                  <div className="rp-donut-inner">
                    <strong>{report.total}</strong>
                    <span>tickets</span>
                  </div>
                </div>

                <div className="rp-donut-legend">
                  {statusData.length ? (
                    statusData.map((item) => (
                      <div className="rp-legend-row" key={item.label}>
                        <span>
                          <i style={{ backgroundColor: item.color }} />
                          {item.label}
                        </span>
                        <strong>{item.value}</strong>
                      </div>
                    ))
                  ) : (
                    <div className="rp-mini-empty">No status data</div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rp-grid rp-grid--three">
            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>Tickets by Category</h2>
                  <p>Most common support areas</p>
                </div>
              </div>

              <BarList items={categoryData} />
            </div>

            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>Tickets by Priority</h2>
                  <p>Urgency breakdown</p>
                </div>
              </div>

              <BarList items={priorityData} />
            </div>

            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>SLA Report</h2>
                  <p>Based on priority response targets</p>
                </div>
              </div>

              <div className="rp-sla-score">
                <strong>{report.slaCompliance}%</strong>
                <span>compliance</span>
              </div>

              <div className="rp-sla-progress">
                <span style={{ width: `${report.slaCompliance}%` }} />
              </div>

              <div className="rp-sla-list">
                <div>
                  <span>Met SLA</span>
                  <strong>{report.slaMet}</strong>
                </div>
                <div>
                  <span>At Risk</span>
                  <strong>{report.slaAtRisk}</strong>
                </div>
                <div>
                  <span>Breached</span>
                  <strong>{report.slaBreached}</strong>
                </div>
              </div>
            </div>
          </section>

          <section className="rp-grid rp-grid--two rp-grid--tables">
            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>Agent Performance</h2>
                  <p>Assigned tickets and resolution output</p>
                </div>
                <Icon d={IC.users} size={17} />
              </div>

              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      <th>Total</th>
                      <th>Resolved</th>
                      <th>Open</th>
                      <th>Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentRows.length ? (
                      agentRows.map((agent) => (
                        <tr key={agent.id}>
                          <td>{agent.name}</td>
                          <td>{agent.total}</td>
                          <td>{agent.resolved}</td>
                          <td>{agent.open}</td>
                          <td>{formatHours(agent.avg)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="rp-empty-cell">
                          No agent performance data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rp-card">
              <div className="rp-card-header">
                <div>
                  <h2>Employee Activity</h2>
                  <p>Top requesters by ticket volume</p>
                </div>
              </div>

              <div className="rp-table-wrap">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Total</th>
                      <th>Open</th>
                      <th>Resolved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requesterRows.length ? (
                      requesterRows.map((employee) => (
                        <tr key={employee.id}>
                          <td>{employee.name}</td>
                          <td>{employee.total}</td>
                          <td>{employee.open}</td>
                          <td>{employee.resolved}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="rp-empty-cell">
                          No employee activity data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}