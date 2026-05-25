import { useState, useEffect } from "react";
import logoImg from "../../../assets/logo.png";

import "./Header.css";

const navigationItems = [
  { name: "Features", link: "#features" },
  { name: "Services", link: "#services" },
  { name: "Roles", link: "#roles" },
  { name: "Contact", link: "#contact" },
];

const Header = ({ onLoginClick }) => {
  const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState("");

  useEffect(() => {
    const handleWindowScroll = () => {
      setIsHeaderShrunk(window.scrollY > 40);
    };
    
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleWindowScroll);
  }, []);

  useEffect(() => {
    const sectionTargets = navigationItems.map((item) => item.link.substring(1));
    
    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNavItem(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    
    sectionTargets.forEach((target) => {
      const sectionElement = document.getElementById(target);
      if (sectionElement) scrollObserver.observe(sectionElement);
    });
    
    return () => scrollObserver.disconnect();
  }, []);

  const handleNavLinkClick = (event, targetLink) => {
    event.preventDefault();
    
    const targetElement = document.querySelector(targetLink);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header
        className={`main-header ${isHeaderShrunk ? "main-header--compact" : ""}`}
      >
        <div className="main-headercontainer">
          <a href="/" className="logo" aria-label="Homepage">
            <div className="logo-image">
              <img
                src={logoImg}
                alt="Company Logo"
                className="logo-image__img"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextElementSibling.style.display = "flex";
                }}
              />
              <div className="logo-fallback" style={{ display: "none" }}>
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <rect width="28" height="28" rx="8" fill="#d4f265" />
                  <path d="M7 14l5 5 9-9" stroke="#03363d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </a>

          <nav className="common-nav" aria-label="Main navigation">
            {navigationItems.map((item) => (
              <a
                key={item.link}
                href={item.link}
                className={`common-nav__item ${
                  activeNavItem === item.link.substring(1) ? "common-nav__item--active" : ""
                }`}
                onClick={(e) => handleNavLinkClick(e, item.link)}
              >
                {item.name}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="login-button"
              onClick={onLoginClick}
              aria-label="Open login panel"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M2.5 14c0-2.76 2.46-5 5.5-5s5.5 2.24 5.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Login
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="login-button__arrow">
                <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="scroll-progress" id="scroll-progress-bar" />
      </header>

      <ScrollProgressBar />
    </>
  );
};

const ScrollProgressBar = () => {
  useEffect(() => {
    const progressBar = document.getElementById("scroll-progress-bar");
    if (!progressBar) return;
    
    const updateProgressBar = () => {
      const scrollPosition = window.scrollY;
      const totalScrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercentage = totalScrollHeight > 0 ? scrollPosition / totalScrollHeight : 0;
      progressBar.style.transform = `scaleX(${scrollPercentage})`;
    };
    
    window.addEventListener("scroll", updateProgressBar, { passive: true });
    return () => window.removeEventListener("scroll", updateProgressBar);
  }, []);
  
  return null;
};

export default Header;