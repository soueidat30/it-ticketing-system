import { useEffect, useRef } from "react";
import "./HeroSection.css";
import employeeImg from "../../assets/employee.png";

const workItems = [
  {
    name: "Ticket",
    rotation: 0,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="4" width="16" height="14" rx="2.5" stroke="#03363d" strokeWidth="1.7" />
        <path d="M7 9h8M7 13h5" stroke="#03363d" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    color: "#d4f265",
  },
  {
    name: "Network",
    rotation: 72,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="7" stroke="#ffffff" strokeWidth="1.7" />
        <path d="M11 4c-2.5 2-4 4.5-4 7s1.5 5 4 7" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M11 4c2.5 2 4 4.5 4 7s-1.5 5-4 7" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M4 11h14" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    color: "#03363d",
  },
  {
    name: "AI",
    rotation: 144,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3v2M11 17v2M3 11h2M17 11h2M5.22 5.22l1.42 1.42M15.36 15.36l1.42 1.42M5.22 16.78l1.42-1.42M15.36 6.64l1.42-1.42" stroke="#8b5cf6" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="11" cy="11" r="3" stroke="#8b5cf6" strokeWidth="1.7" />
      </svg>
    ),
    color: "#f5f0ff",
  },
  {
    name: "Alert",
    rotation: 216,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3C7.5 3 5 6 5 9v5l-1.5 2h15L17 14V9c0-3-2.5-6-6-6z" stroke="#ffffff" strokeWidth="1.7" strokeLinejoin="round" />
        <path d="M9 18a2 2 0 004 0" stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    color: "#fb923c",
  },
  {
    name: "Reports",
    rotation: 288,
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="2.5" stroke="#2dd4bf" strokeWidth="1.7" />
        <path d="M7 15V11M11 15V8M15 15v-3" stroke="#2dd4bf" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
    color: "#f0fdfb",
  },
];

const workRadius = 280;

const HeroSection = ({ onLoginClick }) => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("hero-fade-in");
        });
      },
      { threshold: 0.1 }
    );
    sectionRef.current?.querySelectorAll(".hero-animate").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="hero-wrap" id="hero" ref={sectionRef}>
      <div className="hero-bg-effects">
        <div className="hero-blob-1" />
        <div className="hero-blob-2" />
        <div className="hero-blob-3" />
        <div className="hero-grid" />
      </div>

      <div className="hero-container">
        <div className="hero-content-left">
          <h1 className="hero-animate">
            Your IT issues,
            <br />
            <span className="hero-highlight">handled fast.</span>
            <br />
            <span className="hero-outline">Always.</span>
          </h1>

          <p className="hero-description hero-animate">
            Submit, track, and resolve support requests in one place.
            Your centralized IT Help Desk portal available 24/7 for every department.
          </p>

          <div className="hero-button-group hero-animate">
            <button className="hero-btn-primary" onClick={onLoginClick}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M2.5 14c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              Login
            </button>
          </div>

          <div className="hero-social-proof hero-animate">
            <div className="hero-avatar-stack">
              {["SO", "KK", "SM", "AO"].map((initials, i) => (
                <div key={i} className={`hero-avatar hero-avatar-${i + 1}`}>
                  <span>{initials}</span>
                </div>
              ))}
            </div>
            <p className="hero-proof-text">
              <strong>200+ employees</strong> already using the portal
            </p>
          </div>
        </div>

        <div className="hero-visual hero-animate" aria-hidden="true">
          <div className="hero-work-wrapper">
            <div className="hero-circle-outer" />
            <div className="hero-circle-middle" />
            <div className="hero-circle-inner" />

            <div className="hero-center-avatar">
              <div className="hero-avatar-circle">
                <img src={employeeImg} alt="Employee" />
              </div>
            </div>

            {workItems.map((item, i) => {
              const rad = (item.rotation * Math.PI) / 180;
              const xPos = Math.cos(rad) * workRadius;
              const yPos = Math.sin(rad) * workRadius;
              return (
                <div
                  key={item.name}
                  className="hero-work-item"
                  style={{
                    transform: `translate(${xPos}px, ${yPos}px)`,
                    animationDelay: `${i * 0.15}s`,
                    "--float-delay": `${i * 0.6}s`,
                  }}
                  title={item.name}
                >
                  <div
                    className="hero-work-icon"
                    style={{ background: item.color }}
                  >
                    {item.icon}
                  </div>
                  <span className="hero-work-label">{item.name}</span>
                </div>
              );
            })}

            <div className="hero-sparkle hero-sparkle-1">✦</div>
            <div className="hero-sparkle hero-sparkle-2">✦</div>
            <div className="hero-sparkle hero-sparkle-3">✦</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;