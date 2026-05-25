import { useEffect, useRef, useState } from "react";
import "./Footer.css";
import logoImg from "../../../assets/logo2.png";

const QUICK_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Services", href: "#services" },
  { label: "Roles & Access", href: "#roles" },
  { label: "How It Works", href: "#howitworks" },
  { label: "Contact IT", href: "#contact" },
];

const SUPPORT_LINKS = [
  { label: "Submit a Ticket", href: "#" },
  { label: "Track My Ticket", href: "#" },
  { label: "Knowledge Base", href: "#" },
  { label: "FAQs", href: "#" },
  { label: "IT Chat Assistant", href: "#" },
];

const CONTACT_INFO = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 6l6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "tickora@gmail.com",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 3.5A1.5 1.5 0 014.5 2h.879a1 1 0 01.934.647l.8 2.133a1 1 0 01-.23 1.05L5.5 6.5s.9 2 4 4l.67-1.383a1 1 0 011.05-.23l2.133.8A1 1 0 0114 10.62v.88A1.5 1.5 0 0112.5 13C6.701 13 3 8.299 3 3.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
    label: "+961 1 234 567 (Ext. 101)",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    label: "Mon – Fri, 8:00 AM – 6:00 PM",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2C5.79 2 4 3.79 4 6c0 3.25 4 8 4 8s4-4.75 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    label: "IT Office Floor 2, Block B",
  },
];

const Footer = ({ onLoginClick }) => {
  const sectionRef = useRef(null);
  const [currentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.08 }
    );
    
    sectionRef.current?.querySelectorAll(".animate-on-scroll").forEach((element) => {
      observer.observe(element);
    });
    
    return () => observer.disconnect();
  }, []);

  const handleNavigation = (event, href) => {
    event.preventDefault();
    const targetElement = document.querySelector(href);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="footer" id="contact" ref={sectionRef}>
      <div className="footer-background">
        <div className="background-blob background-blob-first" />
        <div className="background-blob background-blob-second" />
        <div className="background-grid" />
        <div className="background-top-border" />
      </div>

      <div className="footer-content">

        <div className="brand-column animate-on-scroll">
          <img src={logoImg} alt="Company Logo" className="brand-logo"/>

          <p className="brand-description">
            The official IT support portal for employees.
            Submit tickets, track resolutions, and get help all in one place.
          </p>

          <div className="status-card">
            <div className="status-row">
              <span className="status-dot status-dot-green" />
              <span className="status-text">Portal online</span>
            </div>
            <div className="status-row">
              <span className="status-dot status-dot-green" />
              <span className="status-text">AI assistant active</span>
            </div>
            <div className="status-row">
              <span className="status-dot status-dot-yellow" />
              <span className="status-text">Scheduled maintenance: Sun 2 AM</span>
            </div>
          </div>
        </div>

        <div className="links-column animate-on-scroll" style={{ transitionDelay: "0.1s" }}>
          <h4 className="column-title">Quick Links</h4>
          <ul className="links-list">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="footer-link"
                  onClick={(e) => handleNavigation(e, link.href)}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="links-column animate-on-scroll" style={{ transitionDelay: "0.18s" }}>
          <h4 className="column-title">IT Support</h4>
          <ul className="links-list">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="footer-link">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="links-column animate-on-scroll" style={{ transitionDelay: "0.26s" }}>
          <h4 className="column-title">Contact IT</h4>
          <ul className="contact-list">
            {CONTACT_INFO.map((item, index) => (
              <li key={index} className="contact-item">
                <span className="contact-icon">{item.icon}</span>
                <span className="contact-label">{item.label}</span>
              </li>
            ))}
          </ul>

          <button className="login-button" onClick={onLoginClick}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M2 13c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Login
          </button>
        </div>
      </div>

      <div className="footer-divider animate-on-scroll" />

      <div className="footer-bottom animate-on-scroll">
        <div className="bottom-left">
          <span className="copyright-text">© {currentYear} Tickora. Internal use only.</span>
          <span className="separator">·</span>
          <span className="version-badge">v1.0.0</span>
        </div>

        <div className="bottom-center">
          <div className="built-by">
            Built by the Development Team
            <span className="heart-icon">♥</span>
          </div>
        </div>

        <div className="bottom-right">
          <a href="#" className="legal-link">Privacy Policy</a>
          <span className="separator">·</span>
          <a href="#" className="legal-link">Terms of Use</a>
          <span className="separator">·</span>
          <a href="#" className="legal-link">Accessibility</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;