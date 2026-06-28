import { useEffect, useState, useRef } from "react";
import { getAllTickets } from "../../../services/ticketService";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./Report.css";

const BASE = "http://127.0.0.1:8000/api";

// ── helpers ───────────────────────────────────────────────────────────────────
const statusName   = (t) => t.status?.status_name    || "Unknown";
const priorityName = (t) => t.priority?.priority_name || "Unknown";
const categoryName = (t) => t.category?.category_name || "Other";
const employeeName = (t) => t.user?.full_name          || "—";

const PRIORITY_COLORS = { Low: "#22c55e", Medium: "#f59e0b", High: "#ef4444", Critical: "#7c3aed" };
const STATUS_COLORS   = { Open: "#3b82f6", "In Progress": "#f97316", Pending: "#8b5cf6", Resolved: "#10b981", Closed: "#6b7280" };
const CAT_PALETTE     = ["#6366f1","#0ea5e9","#f59e0b","#ef4444","#10b981","#8b5cf6","#f97316","#06b6d4"];

function fmt(n) { return n < 10 ? `0${n}` : `${n}`; }

function getMonthLabel(dateStr) {
  const d = new Date(dateStr);
  return `${fmt(d.getMonth()+1)}/${d.getFullYear().toString().slice(2)}`;
}

// ── export table builders ──────────────────────────────────────────────────────
const EXPORT_COLUMNS = ["Ticket #", "Title", "Employee", "Category", "Priority", "Status", "Created", "Resolved"];

function buildExportRows(tickets) {
  return tickets.map(t => [
    t.ticket_number || "",
    t.title || "",
    employeeName(t),
    categoryName(t),
    priorityName(t),
    statusName(t),
    t.created_at ? new Date(t.created_at).toLocaleDateString("en-GB") : "",
    t.resolved_at ? new Date(t.resolved_at).toLocaleDateString("en-GB") : "",
  ]);
}

// ── stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, delta, sub }) {
  return (
    <div className={`rpt-stat rpt-stat--${color}`}>
      <div className="rpt-stat__icon"><i className={`ti ${icon}`}/></div>
      <div className="rpt-stat__body">
        <span className="rpt-stat__value">{value}</span>
        <span className="rpt-stat__label">{label}</span>
        {delta !== undefined && (
          <span className={`rpt-stat__delta ${delta >= 0 ? "rpt-stat__delta--up" : "rpt-stat__delta--dn"}`}>
            <i className={`ti ${delta >= 0 ? "ti-trending-up" : "ti-trending-down"}`}/>
            {delta >= 0 ? "+" : ""}{delta}% vs last month
          </span>
        )}
        {sub && <span className="rpt-stat__sub">{sub}</span>}
      </div>
    </div>
  );
}

// ── custom tooltip ────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rpt-tooltip">
      <p className="rpt-tooltip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="rpt-tooltip__row">
          <span>{p.name}:</span> <b>{p.value}</b>
        </p>
      ))}
    </div>
  );
}

// ── export dropdown ────────────────────────────────────────────────────────────
function ExportMenu({ onExport, exporting }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (format) => {
    setOpen(false);
    onExport(format);
  };

  return (
    <div className="rpt-export-menu" ref={ref}>
      <button className="rpt-export-btn" onClick={() => setOpen(o => !o)} disabled={exporting}>
        <i className={`ti ${exporting ? "ti-loader rpt-spin" : "ti-download"}`}/>
        Export
        <i className="ti ti-chevron-down rpt-export-btn__chevron"/>
      </button>
      {open && (
        <div className="rpt-export-dropdown">
          <button className="rpt-export-option" onClick={() => choose("csv")}>
            <i className="ti ti-file-text"/> CSV
          </button>
          <button className="rpt-export-option" onClick={() => choose("xlsx")}>
            <i className="ti ti-table"/> Excel (.xlsx)
          </button>
          <button className="rpt-export-option" onClick={() => choose("pdf")}>
            <i className="ti ti-file-type-pdf"/> PDF
          </button>
        </div>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────
export default function Report() {
  const [tickets,  setTickets]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [range,    setRange]    = useState("all"); // all | 30 | 90
  const [exporting,setExporting]= useState(false);
  const token = localStorage.getItem("token"); // but define OUTSIDE component state changes


  useEffect(() => {  if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${BASE}/tickets`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        const data = await res.json();
        setTickets(Array.isArray(data) ? data : data?.data || []);
      } catch { setTickets([]); }
      finally  { setLoading(false); }
    })();
  }, [token]);

  // filter by date range
  const filtered = tickets.filter(t => {
    if (range === "all") return true;
    const days = parseInt(range);
    return (Date.now() - new Date(t.created_at)) / 86400000 <= days;
  });

  // ── derived stats ──────────────────────────────────────────────────────────
  const total     = filtered.length;
  const open      = filtered.filter(t => statusName(t).toLowerCase() === "open").length;
  const resolved  = filtered.filter(t => ["resolved","closed"].includes(statusName(t).toLowerCase())).length;
  const critical  = filtered.filter(t => priorityName(t).toLowerCase() === "critical").length;
  const avgRes    = resolved > 0
    ? Math.round(filtered.filter(t => t.resolved_at).reduce((s,t) => {
        return s + (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000;
      }, 0) / resolved)
    : null;

  // monthly trend (last 6 months)
  const monthlyMap = {};
  filtered.forEach(t => {
    const m = getMonthLabel(t.created_at);
    if (!monthlyMap[m]) monthlyMap[m] = { month: m, Created: 0, Resolved: 0 };
    monthlyMap[m].Created++;
    if (["resolved","closed"].includes(statusName(t).toLowerCase())) monthlyMap[m].Resolved++;
  });
  const monthlyData = Object.values(monthlyMap).slice(-6);

  // priority breakdown
  const priorityData = Object.entries(
    filtered.reduce((a,t) => { const p=priorityName(t); a[p]=(a[p]||0)+1; return a; }, {})
  ).map(([name,value]) => ({ name, value }));

  // status breakdown
  const statusData = Object.entries(
    filtered.reduce((a,t) => { const s=statusName(t); a[s]=(a[s]||0)+1; return a; }, {})
  ).map(([name,value]) => ({ name, value }));

  // category bar chart
  const categoryData = Object.entries(
    filtered.reduce((a,t) => { const c=categoryName(t); a[c]=(a[c]||0)+1; return a; }, {})
  ).map(([name,count]) => ({ name, count })).sort((a,b)=>b.count-a.count);

  // top employees by ticket count
  const empMap = {};
  filtered.forEach(t => {
    const n = employeeName(t);
    empMap[n] = (empMap[n]||0)+1;
  });
  const topEmployees = Object.entries(empMap).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const resolutionRate = total > 0 ? Math.round((resolved/total)*100) : 0;
  const filenameBase = `tickora-report-${new Date().toISOString().slice(0,10)}`;

  // ── export: CSV ──────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const rows = [EXPORT_COLUMNS, ...buildExportRows(filtered)];
    const csv = rows
      .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filenameBase}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ── export: Excel ────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = [EXPORT_COLUMNS, ...buildExportRows(filtered)];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 12 }, { wch: 32 }, { wch: 20 }, { wch: 14 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    XLSX.writeFile(workbook, `${filenameBase}.xlsx`);
  };

  // ── export: PDF ──────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(16);
    doc.text("Tickora — Ticket Report", 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(
      `Generated ${new Date().toLocaleDateString("en-GB")} · ${range === "all" ? "All time" : `Last ${range} days`} · ${total} tickets · ${resolutionRate}% resolved`,
      14, 22
    );

    autoTable(doc, {
      startY: 28,
      head: [EXPORT_COLUMNS],
      body: buildExportRows(filtered),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    });

    doc.save(`${filenameBase}.pdf`);
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === "csv") exportCSV();
      else if (format === "xlsx") exportExcel();
      else if (format === "pdf") exportPDF();
    } finally {
      setTimeout(() => setExporting(false), 500);
    }
  };

  if (loading) return (
    <div className="rpt-page-loading">
      <i className="ti ti-loader rpt-spin"/>
      <span>Loading reports…</span>
    </div>
  );

  return (
    <div className="rpt-page">

      {/* ── HEADER ── */}
      <div className="rpt-header">
        <div>
          <h1 className="rpt-header__title">Reports</h1>
          <p className="rpt-header__sub">Track team performance and ticket trends</p>
        </div>
        <div className="rpt-header__actions">
          <div className="rpt-range-tabs">
            {[["all","All time"],["90","90 days"],["30","30 days"]].map(([v,l]) => (
              <button
                key={v}
                className={`rpt-range-tab ${range===v?"rpt-range-tab--active":""}`}
                onClick={() => setRange(v)}
              >{l}</button>
            ))}
          </div>
          <ExportMenu onExport={handleExport} exporting={exporting} />
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="rpt-stats">
        <StatCard label="Total Tickets"    value={total}    icon="ti-ticket"        color="indigo" sub={`${range==="all"?"All time":range+" days"}`}/>
        <StatCard label="Open"             value={open}     icon="ti-folder-open"   color="blue"   sub={`${total?Math.round(open/total*100):0}% of total`}/>
        <StatCard label="Resolved"         value={resolved} icon="ti-circle-check"  color="green"  sub={`${resolutionRate}% resolution rate`}/>
        <StatCard label="Critical"         value={critical} icon="ti-alert-triangle"color="red"    sub={critical>0?"Needs attention":"All clear"}/>
        {avgRes !== null && (
          <StatCard label="Avg. Resolution" value={`${avgRes}h`} icon="ti-clock" color="purple" sub="Average time to resolve"/>
        )}
      </div>

      {/* ── RESOLUTION RATE BAR ── */}
      <div className="rpt-card rpt-resolution">
        <div className="rpt-resolution__left">
          <span className="rpt-resolution__label">Resolution rate</span>
          <span className="rpt-resolution__value">{resolutionRate}%</span>
        </div>
        <div className="rpt-resolution__track">
          <div
            className="rpt-resolution__fill"
            style={{ width: `${resolutionRate}%` }}
          />
        </div>
        <span className="rpt-resolution__sub">{resolved} of {total} tickets resolved</span>
      </div>

      {/* ── CHARTS ROW 1: trend + category ── */}
      <div className="rpt-charts-row">

        <div className="rpt-card rpt-card--chart">
          <div className="rpt-card__header">
            <h2 className="rpt-card__title">Ticket Volume</h2>
            <span className="rpt-card__sub">Created vs Resolved by month</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: 12 }}/>
              <Area type="monotone" dataKey="Created"  stroke="#6366f1" fill="url(#gCreated)"  strokeWidth={2}/>
              <Area type="monotone" dataKey="Resolved" stroke="#10b981" fill="url(#gResolved)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rpt-card rpt-card--chart">
          <div className="rpt-card__header">
            <h2 className="rpt-card__title">By Category</h2>
            <span className="rpt-card__sub">Ticket count per type</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }}/>
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="count" radius={[6,6,0,0]}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CAT_PALETTE[i % CAT_PALETTE.length]}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CHARTS ROW 2: priority pie + status pie + top employees ── */}
      <div className="rpt-charts-row rpt-charts-row--3">

        <div className="rpt-card rpt-card--chart">
          <div className="rpt-card__header">
            <h2 className="rpt-card__title">By Priority</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={priorityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {priorityData.map((d, i) => (
                  <Cell key={i} fill={PRIORITY_COLORS[d.name] || CAT_PALETTE[i]}/>
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rpt-card rpt-card--chart">
          <div className="rpt-card__header">
            <h2 className="rpt-card__title">By Status</h2>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {statusData.map((d, i) => (
                  <Cell key={i} fill={STATUS_COLORS[d.name] || CAT_PALETTE[i]}/>
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize: 11 }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rpt-card">
          <div className="rpt-card__header">
            <h2 className="rpt-card__title">Top Reporters</h2>
            <span className="rpt-card__sub">By ticket count</span>
          </div>
          <div className="rpt-top-list">
            {topEmployees.length === 0 ? (
              <p className="rpt-empty-text">No data yet</p>
            ) : topEmployees.map(([name, count], i) => (
              <div key={name} className="rpt-top-row">
                <span className="rpt-top-rank">{i+1}</span>
                <div className="rpt-top-avatar">{name[0]?.toUpperCase()}</div>
                <span className="rpt-top-name">{name}</span>
                <div className="rpt-top-bar-wrap">
                  <div
                    className="rpt-top-bar"
                    style={{ width: `${Math.round((count/topEmployees[0][1])*100)}%` }}
                  />
                </div>
                <span className="rpt-top-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}