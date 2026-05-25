import { useEffect, useRef, useState } from "react";
import "./ServicesSection.css";

const services = [
  {
    id: "helpdesk",
    number: "01",
    title: "Ticket Management",
    tagline: "Submit, track & resolve requests",
    description:
      "Employees across all departments can submit IT support tickets in seconds. Every request gets a unique reference number, a priority level, and a live status from Open to Resolved. No more emailing IT and waiting in the dark.",
    perks: ["5 ticket categories", "4 priority levels", "Full ticket history", "Search & filter inbox"],
    cta: "Explore Ticket Management",
    color: "#d4f265",
    darkColor: "#b8db3f",
  },
  {
    id: "assignment",
    number: "02",
    title: "Assignment & Escalation",
    tagline: "Right agent, right ticket, right now",
    description:
      "IT managers can manually or automatically assign tickets to the most appropriate agent based on category and workload. Escalation paths are built in any ticket can be reassigned or escalated with a full internal comment thread.",
    perks: ["Manual & auto assignment", "Escalation workflow", "Internal notes", "Assignment audit trail"],
    cta: "Explore Workflow",
    color: "#5eead4",
    darkColor: "#2dd4bf",
  },
  {
    id: "dashboard",
    number: "03",
    title: "Dashboard & Reports",
    tagline: "Full visibility for managers",
    description:
      "A real-time manager dashboard with widgets for open tickets, resolution rates, SLA compliance, agent performance, and ticket volume by category. Export monthly reports to PDF or Excel with one click.",
    perks: ["Live dashboard widgets", "SLA tracking", "Agent performance charts", "PDF & Excel export"],
    cta: "Explore Analytics",
    color: "#fb923c",
    darkColor: "#f97316",
  },
  {
    id: "ai",
    number: "04",
    title: "AI-Powered Assistant",
    tagline: "Smarter support, less manual work",
    description:
      "The built-in AI engine automatically categorizes incoming tickets, recommends the right priority level, and drafts troubleshooting replies for agents. Employees can also chat with the AI assistant before opening a ticket to self-resolve common issues.",
    perks: ["Auto ticket categorization", "AI priority suggestion", "Draft reply generation", "Employee chat assistant"],
    cta: "Explore AI Features",
    color: "#c084fc",
    darkColor: "#a855f7",
  },
];

const ServicesSection = () => {
  const sectionRef = useRef(null);
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("service-visible");
          }
        });
      },
      { threshold: 0.08 }
    );

    const animatedElements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
    if (animatedElements) {
      animatedElements.forEach((el) => observer.observe(el));
    }

    return () => observer.disconnect();
  }, []);

  const currentService = services[activeServiceIndex];

  return (
    <section className="services-section" id="services" ref={sectionRef}>
      <div className="services-bg">
        <div 
          className="services-glow services-glow-1" 
          style={{ background: currentService.color }} 
        />
        <div className="services-glow services-glow-2" />
        <div className="services-dots" />
      </div>

      <div className="services-header animate-on-scroll">
        <div className="section-eyebrow">System modules</div>
        <h2 className="section-title">
          One portal.
          <br />
          <span className="section-title-accent" style={{ color: currentService.color }}>
            Every IT need covered.
          </span>
        </h2>
        <p className="section-subtitle">
          The system combines four powerful modules designed to cover every aspect of IT support operations.
        </p>
      </div>

      <div className="services-main animate-on-scroll">
        <div className="services-nav">
          {services.map((service, index) => (
            <button
              key={service.id}
              className={`service-nav-item ${activeServiceIndex === index ? "active" : ""}`}
              style={{ "--service-color": service.color }}
              onClick={() => setActiveServiceIndex(index)}
            >
              <span className="nav-item-number">{service.number}</span>
              <div className="nav-item-text">
                <span className="nav-item-title">{service.title}</span>
                <span className="nav-item-tagline">{service.tagline}</span>
              </div>
              <div className="nav-item-arrow">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path 
                    d="M4 9h10M10 5l4 4-4 4" 
                    stroke="currentColor" 
                    strokeWidth="1.8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
              </div>
              <div className="nav-item-bar" />
            </button>
          ))}
        </div>

        <div className="service-detail" key={currentService.id}>
          <div className="detail-watermark" style={{ color: currentService.color }}>
            {currentService.number}
          </div>

          <div 
            className="detail-tag" 
            style={{ 
              color: currentService.color, 
              borderColor: currentService.color + "44", 
              background: currentService.color + "18" 
            }}
          >
            {currentService.tagline}
          </div>

          <h3 className="detail-title">{currentService.title}</h3>
          <p className="detail-description">{currentService.description}</p>

          <ul className="detail-perks">
            {currentService.perks.map((perk, index) => (
              <li key={index} className="perk-item" style={{ animationDelay: `${index * 0.07}s` }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path 
                    d="M2.5 7l3 3 6-6" 
                    stroke={currentService.color} 
                    strokeWidth="1.8" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  />
                </svg>
                {perk}
              </li>
            ))}
          </ul>

          <a 
            href="#" 
            className="detail-cta" 
            style={{ "--cta-color": currentService.color, "--cta-dark": currentService.darkColor }}
          >
            {currentService.cta}
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
      </div>

      <div className="services-trust animate-on-scroll">
        <div className="trust-label">Available to all departments</div>
        <div className="department-logos">
          {["Human Resources", "Engineering", "Finance", "Computer Science", "Marketing", "Management"].map((dept) => (
            <div key={dept} className="dept-pill">{dept}</div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;