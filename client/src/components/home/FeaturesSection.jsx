import { useEffect, useRef, useState } from "react";
import "./FeaturesSection.css";

const featuresData = [
  {
    id: "tickets",
    tag: "Ticket Management",
    title: "Submit and track every request, effortlessly.",
    description:
      "Employees submit support tickets in seconds hardware, software, network, access requests, and more. Every ticket gets a reference number, a priority, and a real-time status so nothing falls through the cracks.",
    stats: [
      { value: "5", label: "Ticket categories" },
      { value: "Real-time", label: "Status tracking" },
    ],
    accent: "#d4f265",
  },
  {
    id: "workflow",
    tag: "Assignment & Workflow",
    title: "Smart routing to the right agent, every time.",
    description:
      "Tickets are automatically or manually routed to the most available IT agent. Managers can escalate, reassign, and leave internal notes and every action is recorded in a full audit trail.",
    stats: [
      { value: "Auto", label: "Ticket routing" },
      { value: "100%", label: "Audit logged" },
    ],
    accent: "#5eead4",
  },
  {
    id: "reporting",
    tag: "Reporting & Analytics",
    title: "Insights that keep your IT team ahead.",
    description:
      "Track ticket volumes, agent performance, resolution times, and SLA compliance all from a single dashboard. Export monthly reports and spot bottlenecks before they become problems.",
    stats: [
      { value: "SLA", label: "Compliance tracking" },
      { value: "Export", label: "Monthly reports" },
    ],
    accent: "#fb923c",
  },
];

const TicketManagementVisual = () => (
  <div className="features-visual-wrap">
    <div className="features-rotating-ring" style={{marginLeft: 70}} />
    <div className="features-rotating-ring"  style={{marginLeft: -70}}/>
    <div className="features-ticket-list">
      {[
        { ref: "#4821", title: "Outlook not opening", cat: "Software", priority: "High", color: "#fb923c" },
        { ref: "#4820", title: "VPN dropping connection", cat: "Network", priority: "Critical", color: "#ef4444" },
        { ref: "#4819", title: "Shared drive access", cat: "Access", priority: "Medium", color: "#f59e0b" },
        { ref: "#4818", title: "Printer offline", cat: "Hardware", priority: "Low", color: "#10b981" },
      ].map((ticket, index) => (
        <div key={index} className="features-ticket-item" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="features-ticket-ref">{ticket.ref}</div>
          <div className="features-ticket-info">
            <div className="features-ticket-title">{ticket.title}</div>
            <div className="features-ticket-category">{ticket.cat}</div>
          </div>
          <span className="features-ticket-priority" style={{ color: ticket.color, background: ticket.color + "18" }}>
            {ticket.priority}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const WorkflowVisual = () => (
  <div className="features-visual-wrap">
    <div className="features-rotating-ring"  style={{marginLeft: -150, marginTop: -50}}/>
    <div className="features-workflow-steps">
      {[
        { icon: "📝", label: "Employee submits ticket", sub: "With category & description" },
        { icon: "⚡", label: "Auto-assigned to agent", sub: "Based on workload & category" },
        { icon: "💬", label: "Agent responds", sub: "Comment thread + status update" },
        { icon: "✅", label: "Ticket resolved & closed", sub: "Audit log recorded" },
      ].map((step, index) => (
        <div key={index} className="features-workflow-step" style={{ animationDelay: `${index * 0.1}s` }}>
          <div className="features-step-icon">{step.icon}</div>
          <div className="features-step-connector" />
          <div className="features-step-text">
            <span className="features-step-label">{step.label}</span>
            <span className="features-step-sub">{step.sub}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ReportingVisual = () => (
  <div className="features-visual-wrap">
    <div className="features-rotating-ring" style={{marginLeft: 70}} />
    <div className="features-rotating-ring"  style={{marginLeft: -70}}/>
    <div className="features-ai-card">
      <div className="features-ai-header">
        <span className="features-ai-pulse" style={{ background: "#fb923c" }} />
        <span className="features-ai-label" style={{ color: "#fb923c" }}>Monthly Overview</span>
      </div>
      <div className="features-ai-input">
        <span className="features-ai-input-text">April 2025 IT Support Report</span>
      </div>
      <div className="features-ai-result">
        <div className="features-ai-row">
          <span className="features-ai-key">Tickets resolved</span>
          <span className="features-ai-value" style={{ color: "#10b981" }}>284 (+12%)</span>
        </div>
        <div className="features-ai-row">
          <span className="features-ai-key">Avg. resolution</span>
          <span className="features-ai-value" style={{ color: "#5eead4" }}>3.2h (-18%)</span>
        </div>
        <div className="features-ai-row">
          <span className="features-ai-key">SLA breaches</span>
          <span className="features-ai-value" style={{ color: "#fb923c" }}>4 this month</span>
        </div>
      </div>
      <div className="features-ai-actions">
        <button className="features-btn-accept" style={{ background: "#fb923c", color: "#fff" }}>Export CSV</button>
        <button className="features-btn-edit">View dashboard</button>
      </div>
    </div>
    <div className="features-ai-badge features-badge-top">📊 SLA tracking</div>
    <div className="features-ai-badge features-badge-bottom">📁 Monthly exports</div>
  </div>
);

const visualComponents = {
  tickets: TicketManagementVisual,
  workflow: WorkflowVisual,
  reporting: ReportingVisual,
};

const gridCards = [
  {
    title: "JWT Authentication",
    desc: "Secure login with role-based access control for every user tier.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    title: "File Attachments",
    desc: "Upload screenshots, logs, and documents directly to any ticket.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    ),
  },
  {
    title: "Notifications",
    desc: "In-app and email alerts triggered on every ticket status update.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Reports & Analytics",
    desc: "SLA tracking, agent performance, and monthly exports at a glance.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

const FeaturesSection = () => {
  const sectionRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("features-visible");
          }
        });
      },
      { threshold: 0.12 }
    );

    const elements = sectionRef.current?.querySelectorAll(".features-animate");
    if (elements) {
      elements.forEach((el) => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);

  const currentFeature = featuresData[activeIndex];
  const CurrentVisual = visualComponents[currentFeature.id];

  return (
    <section className="features-page" id="features" ref={sectionRef}>
      <div className="features-container">
        <div className="features-header features-animate">
          <div className="features-eyebrow">Platform capabilities</div>
          <h2 className="features-title">
            Smarter IT support
            <br />
            <span className="features-title-accent">Simple process</span>
          </h2>
          <p className="features-subtitle">
            Created for modern IT teams to manage requests, track issues, and resolve tickets efficiently.
          </p>
        </div>

        <div className="features-tab-bar features-animate">
          {featuresData.map((feature, index) => (
            <button
              key={feature.id}
              className={`features-tab ${activeIndex === index ? "features-tab-active" : ""}`}
              onClick={() => setActiveIndex(index)}
              style={{ "--tab-accent": feature.accent }}
            >
              {feature.tag}
            </button>
          ))}
        </div>

        <div className="features-detail-panel features-animate">
          <div className="features-detail-content">
            <div
              className="features-detail-tag"
              style={{
                color: currentFeature.accent,
                borderColor: currentFeature.accent + "33",
                background: currentFeature.accent + "14",
              }}
            >
              {currentFeature.tag}
            </div>
            <h3 className="features-detail-title">{currentFeature.title}</h3>
            <p className="features-detail-description">{currentFeature.description}</p>

            <div className="features-stats-wrap">
              {currentFeature.stats.map((stat, idx) => (
                <div key={idx} className="features-stat">
                  <span
                    className="features-stat-number"
                    style={{
                      color: currentFeature.accent === "#d4f265" ? "#03363d" : currentFeature.accent,
                    }}
                  >
                    {stat.value}
                  </span>
                  <span className="features-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>

            <a href="#" className="features-learn-link">
              Learn more
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <div className="features-detail-visual">
            <CurrentVisual />
          </div>
        </div>

        {/* ── Redesigned Grid Cards ── */}
        <div className="features-grid-wrap">
          {gridCards.map((item, idx) => (
            <div
              key={idx}
              className="features-grid-card features-animate"
              style={{ transitionDelay: `${idx * 0.08}s` }}
            >
              <div className="features-card-icon-wrap">
                {item.icon}
              </div>

              <h4 className="features-card-title">
                {item.title}
              </h4>

              <p className="features-card-desc">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
