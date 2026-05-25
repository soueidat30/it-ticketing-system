import { useEffect, useRef, useState } from "react";
import "./Testimonialssection.css";
const testimonials = [
  {
    id: 1,
    name: "Rania Khalil",
    role: "HR Manager",
    department: "Human Resources",
    avatar: "RK",
    color: "#d4f265",
    quote:
      "Before this system, I was emailing IT and waiting days for a response. Now I submit a ticket, get an instant confirmation, and can track exactly where things stand. It genuinely changed how our department operates.",
    rating: 5,
    tag: "Employee",
  },
  {
    id: 2,
    name: "Tarek Mansour",
    role: "IT Support Lead",
    department: "IT Department",
    avatar: "TM",
    color: "#5eead4",
    quote:
      "The agent dashboard is clean and fast. The AI reply suggestions alone save me 30 minutes a day. Ticket routing is smart I barely have to manually reassign anything anymore.",
    rating: 5,
    tag: "IT Agent",
  },
  {
    id: 3,
    name: "Lena Hadad",
    role: "Operations Director",
    department: "Operations",
    avatar: "LH",
    color: "#fb923c",
    quote:
      "As a manager, the reports module is exactly what I needed. I can see SLA compliance, agent workloads, and ticket trends in one place. Presenting to leadership has never been easier.",
    rating: 5,
    tag: "Manager",
  },
  {
    id: 4,
    name: "Omar Nassar",
    role: "Software Engineer",
    department: "Engineering",
    avatar: "ON",
    color: "#c084fc",
    quote:
      "I love the AI assistant it answered my VPN setup question without me even needing to open a ticket. The whole experience feels modern and well thought out.",
    rating: 5,
    tag: "Employee",
  },
  {
    id: 5,
    name: "Samar Aziz",
    role: "System Administrator",
    department: "IT Department",
    avatar: "SA",
    color: "#d4f265",
    quote:
      "The admin panel gives me everything user management, role assignments, audit logs, system settings. It's secure, well-structured, and doesn't require any technical workarounds.",
    rating: 5,
    tag: "Admin",
  },
  {
    id: 6,
    name: "Jad Frem",
    role: "Finance Analyst",
    department: "Finance",
    avatar: "JF",
    color: "#5eead4",
    quote:
      "I was skeptical at first, but the onboarding was smooth and the interface is intuitive. I submitted my first ticket in under a minute. No training needed.",
    rating: 5,
    tag: "Employee",
  },
];

const Stars = ({ count = 5 }) => (
  <div className="rating-stars">
    {Array.from({ length: count }).map((_, index) => (
      <svg key={index} width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M7 1l1.6 3.4 3.7.5-2.7 2.6.6 3.7L7 9.5l-3.2 1.7.6-3.7L1.7 4.9l3.7-.5z"
          fill="#d4f265"
          stroke="#d4f265"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    ))}
  </div>
);

const TestimonialsSection = () => {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    
    sectionRef.current?.querySelectorAll(".animate-on-scroll").forEach((element) => {
      observer.observe(element);
    });
    
    return () => observer.disconnect();
  }, []);

  const doubledTestimonials = [...testimonials, ...testimonials];

  return (
    <section className="testimonials-section" ref={sectionRef}>
      <div className="testimonials-background">
        <div className="background-gradient" />
        <div className="background-dots" />
      </div>

      <div className="testimonials-header animate-on-scroll">
        <div className="section-eyebrow">From our team</div>
        <h2 className="section-heading">
          Trusted by the people
          <br />
          <span className="heading-accent">who use it every day.</span>
        </h2>
        <p className="section-subheading">
          Real feedback from employees, agents, and managers across the company.
        </p>
      </div>

      <div
        className="testimonials-track-wrapper animate-on-scroll"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="fade-edge fade-edge-left" />
        <div className="fade-edge fade-edge-right" />

        <div
          className={`scrolling-track ${isPaused ? "scrolling-track-paused" : ""}`}
          ref={trackRef}
        >
          {doubledTestimonials.map((testimonial, index) => (
            <div key={`${testimonial.id}-${index}`} className="testimonial-card">
              <div className="card-header">
                <div className="user-avatar" style={{ background: testimonial.color + "22", color: testimonial.color }}>
                  {testimonial.avatar}
                </div>
                <div className="user-info">
                  <span className="user-name">{testimonial.name}</span>
                  <span className="user-role">{testimonial.role}</span>
                  <span className="user-department">{testimonial.department}</span>
                </div>
                <div className="user-tag" style={{ background: testimonial.color + "20", color: testimonial.color }}>
                  {testimonial.tag}
                </div>
              </div>

              <Stars count={testimonial.rating} />

              <p className="testimonial-quote">"{testimonial.quote}"</p>

              <div className="quote-mark" style={{ color: testimonial.color }}>
                <svg width="40" height="32" viewBox="0 0 40 32" fill="none">
                  <path d="M0 32V20C0 8.96 6.72 2.56 20.16 0l2.08 3.84C15.52 5.44 11.84 9.28 11.2 15.36H18V32H0zm22 0V20C22 8.96 28.72 2.56 42.16 0l2.08 3.84C37.52 5.44 33.84 9.28 33.2 15.36H40V32H22z" fill="currentColor" opacity="0.12" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="aggregate-rating animate-on-scroll">
        <div className="aggregate-stars">
          {Array.from({ length: 5 }).map((_, index) => (
            <svg key={index} width="20" height="20" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.6 3.4 3.7.5-2.7 2.6.6 3.7L7 9.5l-3.2 1.7.6-3.7L1.7 4.9l3.7-.5z" fill="#d4f265" stroke="#d4f265" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        <div className="aggregate-score">4.9 / 5.0</div>
        <div className="aggregate-label">Average satisfaction score · 200+ internal reviews</div>
      </div>
    </section>
  );
};

export default TestimonialsSection;