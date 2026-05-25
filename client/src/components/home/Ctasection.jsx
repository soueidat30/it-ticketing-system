import { useEffect, useRef } from "react";
import "./Ctasection.css";

const CTASection = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    
    sectionRef.current?.querySelectorAll(".animate-on-scroll").forEach((element) => {
      observer.observe(element);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="cta-section" ref={sectionRef}>
      <div className="cta-background">
        <div className="background-blob background-blob-first" />
        <div className="background-blob background-blob-second" />
        <div className="background-grid" />
        <div className="background-noise" />
      </div>

      <div className="cta-content">
        <div className="access-badge animate-on-scroll">
          <span className="badge-dot" />
          Internal Portal Authorized Personnel Only
        </div>

        <h2 className="cta-heading animate-on-scroll">
          Ready to get started?
          <br />
          <span className="heading-outline">Log in to your workspace.</span>
        </h2>

        <p className="cta-subheading animate-on-scroll">
          Access is granted by your system administrator.
          If you're a new employee or experiencing login issues,
          contact the IT department directly.
        </p>

        <div className="cta-buttons animate-on-scroll">
          <button className="button-primary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="3" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 7v4M7 9h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Sign In to Portal
          </button>
          <button className="button-secondary">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 2a5 5 0 100 10A5 5 0 009 2zM3.5 16c0-2.5 2.46-4.5 5.5-4.5s5.5 2 5.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Contact IT Support
          </button>
        </div>
      </div>

      <div className="floating-cards animate-on-scroll" aria-hidden="true">
        <div className="info-card info-card-first">
          <div className="card-row">
            <div className="user-avatar-small" style={{ background: "#d4f265", color: "#03363d" }}>TM</div>
            <div>
              <div className="user-name-small">Tarek Mansour</div>
              <div className="user-role-small">IT Support Agent</div>
            </div>
            <div className="status-dot" />
          </div>
          <div className="ticket-stat">
            <span className="stat-number">14</span>
            <span className="stat-label">Open tickets today</span>
          </div>
        </div>

        <div className="info-card info-card-second">
          <div className="ticket-tag">🎫 Ticket #4821</div>
          <div className="ticket-title">VPN connection dropping</div>
          <div className="ticket-chips">
            <span className="priority-chip" style={{ background: "#fb923c22", color: "#fb923c" }}>High</span>
            <span className="status-chip" style={{ background: "#5eead422", color: "#2dd4bf" }}>In Progress</span>
          </div>
        </div>

        <div className="info-card info-card-third">
          <div className="metric-label">Response time</div>
          <div className="metric-value" style={{ color: "#d4f265" }}>42s</div>
          <div className="metric-trend">↓ 18% vs last week</div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;