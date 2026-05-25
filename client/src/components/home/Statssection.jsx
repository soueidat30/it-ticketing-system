import { useEffect, useRef, useState } from "react";
import "./Statssection.css";

const stats = [
  {
    value: 12847,
    suffix: "+",
    label: "Tickets Resolved",
    sublabel: "Since system launch",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 11l5 5L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: "#d4f265",
  },
  {
    value: 42,
    suffix: "s",
    label: "Avg. First Response",
    sublabel: "Across all priorities",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
        <path d="M11 7v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    color: "#5eead4",
  },
  {
    value: 98,
    suffix: "%",
    label: "SLA Compliance",
    sublabel: "This quarter",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3l2.5 5.5L19 9.5l-4 4 1 5.5L11 16l-5 3 1-5.5-4-4 5.5-1z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
    color: "#fb923c",
  },
  {
    value: 24,
    suffix: "/7",
    label: "IT Agents Online",
    sublabel: "Always available",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M3 19c0-3.3 2.7-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16" cy="15" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="15" r="1" fill="currentColor" />
      </svg>
    ),
    color: "#c084fc",
  },
];

function useCountUp(targetNumber, animationDuration = 1800, shouldStart = false) {
  const [currentCount, setCurrentCount] = useState(0);
  
  useEffect(() => {
    if (!shouldStart) return;
    
    let startTime = null;
    
    const animateNumbers = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = Math.min((timestamp - startTime) / animationDuration, 1);
      const easeOut = 1 - Math.pow(1 - elapsed, 3);
      setCurrentCount(Math.floor(easeOut * targetNumber));
      
      if (elapsed < 1) {
        requestAnimationFrame(animateNumbers);
      }
    };
    
    requestAnimationFrame(animateNumbers);
  }, [shouldStart, targetNumber, animationDuration]);
  
  return currentCount;
}

const StatCard = ({ statData, cardIndex, animationTriggered }) => {
  const animatedCount = useCountUp(statData.value, 1600 + cardIndex * 100, animationTriggered);
  
  return (
    <div
      className="stat-card"
      style={{ "--card-accent": statData.color, animationDelay: `${cardIndex * 0.1}s` }}
    >
      <div className="stat-card-top">
        <div className="stat-icon" style={{ color: statData.color }}>
          {statData.icon}
        </div>
        <div className="stat-glow" style={{ background: statData.color }} />
      </div>
      
      <div className="stat-value-wrapper">
        <span className="stat-number">{animatedCount.toLocaleString()}</span>
        <span className="stat-suffix" style={{ color: statData.color }}>{statData.suffix}</span>
      </div>
      
      <div className="stat-label">{statData.label}</div>
      <div className="stat-sublabel">{statData.sublabel}</div>
    </div>
  );
};

const StatsSection = () => {
  const sectionRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldAnimate(true);
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-section" ref={sectionRef}>
      <div className="stats-background">
        <div className="stats-pattern" />
      </div>
      
      <div className="stats-container">
        <div className="stats-header">
          <span className="stats-eyebrow">By the numbers</span>
          <h2 className="stats-heading">
            Our system, <span className="stats-heading-accent">proven in the field.</span>
          </h2>
        </div>
        
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard 
              key={stat.label} 
              statData={stat} 
              cardIndex={index} 
              animationTriggered={shouldAnimate} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;