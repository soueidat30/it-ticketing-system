import { useEffect, useRef, useState } from "react";
import "./Rolessection.css";

const roles = [
  {
    id: "employee",
    title: "Employee",
    tagline: "Submit & track your requests",
    color: "#5eead4",
    darkColor: "#2dd4bf",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="10" r="5" stroke="currentColor" strokeWidth="2" />
        <path d="M5 24c0-4.97 4.03-9 9-9s9 4.03 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    permissions: [
      "Submit new support tickets",
      "Track ticket status in real time",
      "Attach files & screenshots",
      "Reply to agent comments",
      "Access personal ticket history",
      "Use AI assistant before submitting",
    ],
    badge: "Default role",
  },
  {
    id: "agent",
    title: "IT Agent",
    tagline: "Manage, resolve & communicate",
    color: "#d4f265",
    darkColor: "#b8db3f",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
        <path d="M9 12h10M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    permissions: [
      "View & manage assigned tickets",
      "Update ticket status & priority",
      "Add internal notes & comments",
      "Reassign tickets to peers",
      "View agent dashboard",
      "Access AI reply suggestions",
    ],
    badge: "Core team",
  },
  {
    id: "manager",
    title: "Manager",
    tagline: "Oversee teams & analytics",
    color: "#fb923c",
    darkColor: "#f97316",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 20l5-8 5 4 4-6 6 10H4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
    permissions: [
      "Monitor all team tickets",
      "View agent performance charts",
      "Generate & export reports",
      "Set SLA policies",
      "Approve knowledge base articles",
      "Access full analytics dashboard",
    ],
    badge: "Leadership",
  },
  {
    id: "admin",
    title: "Administrator",
    tagline: "Full system control",
    color: "#c084fc",
    darkColor: "#a855f7",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M14 4v3M14 21v3M4 14H7M21 14h3M6.34 6.34l2.12 2.12M19.54 19.54l2.12 2.12M6.34 21.66l2.12-2.12M19.54 8.46l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    permissions: [
      "Full user & role management",
      "Configure ticket categories",
      "Manage system-wide settings",
      "View all audit logs",
      "Monitor system health",
      "Manage integrations & AI config",
    ],
    badge: "Full access",
  },
];

const RolesSection = () => {
  const sectionRef = useRef(null);
  const [activeRole, setActiveRole] = useState(0);

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
    
    sectionRef.current?.querySelectorAll(".animate-on-scroll").forEach((el) => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  const currentRole = roles[activeRole];

  return (
    <section className="roles-section" id="roles" ref={sectionRef}>
      <div className="roles-background">
        <div className="roles-glow" style={{ background: currentRole.color }} />
        <div className="roles-grid-pattern" />
      </div>

      <div className="roles-header animate-on-scroll">
        <div className="section-eyebrow">Access & Permissions</div>
        <h2 className="section-heading">
          Every role,{" "}
          <span className="heading-accent" style={{ color: currentRole.color }}>
            exactly what they need.
          </span>
        </h2>
        <p className="section-subheading">
          The system is built around four distinct roles each with a tailored workspace,
          permissions, and capabilities designed for their responsibilities.
        </p>
      </div>

      <div className="role-tabs animate-on-scroll">
        {roles.map((role, index) => (
          <button
            key={role.id}
            className={`role-tab ${activeRole === index ? "role-tab-active" : ""}`}
            style={{ "--tab-color": role.color }}
            onClick={() => setActiveRole(index)}
          >
            <span className="tab-icon" style={{ color: activeRole === index ? role.color : undefined }}>
              {role.icon}
            </span>
            <span className="tab-name">{role.title}</span>
          </button>
        ))}
      </div>

      <div className="role-detail animate-on-scroll">
        <div className="role-detail-left">
          <div
            className="role-icon-large"
            style={{
              color: currentRole.color,
              borderColor: currentRole.color + "33",
              background: currentRole.color + "12",
            }}
          >
            {currentRole.icon}
          </div>

          <div
            className="role-badge"
            style={{ background: currentRole.color + "20", color: currentRole.darkColor }}
          >
            {currentRole.badge}
          </div>

          <h3 className="role-title">{currentRole.title}</h3>
          <p className="role-tagline">{currentRole.tagline}</p>

          <div className="decorative-ring" style={{ borderColor: currentRole.color + "22" }} />
          <div className="decorative-ring decorative-ring-second" style={{ borderColor: currentRole.color + "11" }} />
        </div>

        <div className="role-detail-right">
          <div className="permissions-title">What this role can do</div>
          <ul className="permissions-list">
            {currentRole.permissions.map((permission, index) => (
              <li
                key={index}
                className="permission-item"
                style={{ animationDelay: `${index * 0.06}s`, "--item-color": currentRole.color }}
              >
                <div
                  className="permission-check"
                  style={{ background: currentRole.color + "20", color: currentRole.darkColor }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {permission}
              </li>
            ))}
          </ul>

          <div className="permissions-footer">
            <div className="permissions-count">
              <span style={{ color: currentRole.color }}>{currentRole.permissions.length}</span>{" "}
              permissions granted
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RolesSection;