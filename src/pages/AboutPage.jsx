import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, Shield, Users, Code2, GraduationCap,
  MapPin, Coffee, ChevronRight, Zap, Globe, Cpu, Star
} from 'lucide-react';
import './AboutPage.css';

function useReveal(delay = 0) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTimeout(() => setVis(true), delay); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [delay]);
  return [ref, vis];
}

const EXPERTISE = [
  {
    icon: <Brain size={28} />,
    title: 'Advanced AI Integration',
    desc: 'Automated parsing for complex engineering PDFs, MCQ generation, and intelligent exam structuring using modern NLP pipelines.',
    tag: 'AI / ML',
  },
  {
    icon: <Shield size={28} />,
    title: 'Secure Infrastructure',
    desc: 'Distributed systems architecture designed for low-latency live streaming with enterprise-grade authentication and payment gating.',
    tag: 'Backend',
  },
  {
    icon: <Users size={28} />,
    title: 'User-Centric Design',
    desc: 'Built ground-up for the Indian student experience — mobile-first, data-light, and accessible to the common man.',
    tag: 'UX / Product',
  },
  {
    icon: <Cpu size={28} />,
    title: 'Real-Time Systems',
    desc: 'WebRTC-based streaming with sub-second latency. Fee lock, OTP gates, and live chat — all synced in real time.',
    tag: 'Systems',
  },
  {
    icon: <Globe size={28} />,
    title: 'Scalable SaaS Platform',
    desc: 'Multi-tenant architecture supporting thousands of concurrent tutors and students with isolated data and billing.',
    tag: 'Cloud',
  },
  {
    icon: <Code2 size={28} />,
    title: 'Full-Stack Mastery',
    desc: 'React, Node, Firebase, Python — the entire stack owned and deployed by a single computer scientist with a vision.',
    tag: 'Dev',
  },
];

const PORTFOLIO = [
  {
    name: 'Antigravity Tuition OS',
    desc: 'AI-powered live streaming platform for tutors & students.',
    status: 'Live',
    color: '#22C55E',
  },
  {
    name: 'Yellow Box Medical',
    desc: 'Community pharmacy & telemedicine consultation portal.',
    status: 'Live',
    color: '#22C55E',
  },
  {
    name: 'NG Pharmacy App',
    desc: 'Cross-platform healthcare app with doctor-patient workflow.',
    status: 'Beta',
    color: '#F5C518',
  },
  {
    name: 'Common Man OS',
    desc: 'A unified government-scheme navigator for rural India.',
    status: 'In Dev',
    color: '#818CF8',
  },
];

export default function AboutPage() {
  const [heroRef, heroVis] = useReveal();
  const [missionRef, missionVis] = useReveal(100);
  const [expertRef, expertVis] = useReveal(100);
  const [portfolioRef, portfolioVis] = useReveal(100);
  const [ctaRef, ctaVis] = useReveal();

  return (
    <div className="ab-root">

      {/* ── HERO ── */}
      <section className="ab-hero" ref={heroRef}>
        <div className={`ab-hero-content ${heroVis ? 'ab-reveal-up' : 'ab-hidden'}`}>
          <div className="ab-tag-pill">
            <GraduationCap size={14} /> Master of Computer Science
          </div>
          <h1 className="ab-headline">
            Innovation with <span className="ab-yellow">Purpose.</span>
          </h1>
          <p className="ab-sub">
            We believe technology shouldn't just be for big corporations — it should solve everyday
            problems for the common man. This platform was born from that mission.
          </p>
        </div>
        <div className="ab-hero-bg-orb ab-orb1" />
        <div className="ab-hero-bg-orb ab-orb2" />
      </section>

      {/* ── VISIONARY ── */}
      <section className="ab-section" ref={missionRef}>
        <div className={`ab-visionary-grid ${missionVis ? 'ab-reveal-left' : 'ab-hidden-left'}`}>
          <div className="ab-avatar-col">
            <div className="ab-avatar-ring">
              <div className="ab-avatar-inner">
                <GraduationCap size={48} color="#F5C518" />
              </div>
            </div>
            <div className="ab-degree-badge">
              <Star size={12} color="#F5C518" />
              <span>M.Sc. Computer Science</span>
            </div>
            <div className="ab-location-badge">
              <MapPin size={12} />
              <Coffee size={12} color="#F5C518" />
              <span>Yellow Box Cafe, India</span>
            </div>
          </div>

          <div className={`ab-vision-text ${missionVis ? 'ab-reveal-right' : 'ab-hidden-right'}`} style={{ animationDelay: '0.2s' }}>
            <div className="ab-section-tag">The Visionary</div>
            <h2>Code with a <span className="ab-yellow">Mission.</span></h2>
            <blockquote className="ab-quote">
              <span className="ab-quote-mark">"</span>
              As a Master of Computer Science, I believe technology shouldn't just be for big
              corporations; it should solve everyday problems for the common man. My journey
              started from the heart of an engineering hub, at the{' '}
              <span className="ab-yellow ab-bold">Yellow Box Cafe</span>, where I saw the need
              for better educational tools firsthand. Students struggling with fees, tutors
              drowning in paperwork, exams delayed for weeks — I decided to build the solution.
              <span className="ab-quote-mark">"</span>
            </blockquote>
            <div className="ab-stats-inline">
              {[
                { n: '5+', l: 'Years Building' },
                { n: '3', l: 'Live Products' },
                { n: '∞', l: 'Drive to Help' },
              ].map(({ n, l }) => (
                <div key={l} className="ab-stat-mini">
                  <span className="ab-stat-n">{n}</span>
                  <span className="ab-stat-l">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TECHNICAL EXPERTISE ── */}
      <section className="ab-section ab-dark-section" ref={expertRef}>
        <div className={`ab-section-head ${expertVis ? 'ab-reveal-up' : 'ab-hidden'}`}>
          <div className="ab-section-tag">Technical Expertise</div>
          <h2>Built on <span className="ab-yellow">Deep Engineering</span></h2>
          <p>Every feature is an engineering decision, not an afterthought.</p>
        </div>
        <div className="ab-expertise-grid">
          {EXPERTISE.map((e, i) => (
            <div
              key={i}
              className={`ab-expertise-card ${expertVis ? 'ab-reveal-up' : 'ab-hidden'}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="ab-card-top">
                <div className="ab-icon-wrap">{e.icon}</div>
                <span className="ab-tag-chip">{e.tag}</span>
              </div>
              <h3>{e.title}</h3>
              <p>{e.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROJECT PORTFOLIO ── */}
      <section className="ab-section" ref={portfolioRef}>
        <div className={`ab-section-head ${portfolioVis ? 'ab-reveal-up' : 'ab-hidden'}`}>
          <div className="ab-section-tag">Project Portfolio</div>
          <h2>Platforms for the <span className="ab-yellow">Common Man</span></h2>
          <p>Every product solves a real problem faced by real people.</p>
        </div>
        <div className="ab-portfolio-list">
          {PORTFOLIO.map((p, i) => (
            <div
              key={i}
              className={`ab-portfolio-card ${portfolioVis ? 'ab-reveal-left' : 'ab-hidden-left'}`}
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="ab-portfolio-left">
                <span className="ab-portfolio-num">0{i + 1}</span>
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.desc}</p>
                </div>
              </div>
              <span className="ab-status-chip" style={{ borderColor: p.color, color: p.color }}>
                <span className="ab-status-dot" style={{ background: p.color }} />
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="ab-cta-section" ref={ctaRef}>
        <div className={`ab-cta-inner ${ctaVis ? 'ab-reveal-up' : 'ab-hidden'}`}>
          <h2>Join a Mission-Driven <span className="ab-yellow">Platform</span></h2>
          <p>Whether you're a tutor building your brand or a student chasing your dream — there's a place for you here.</p>
          <div className="ab-cta-row">
            <Link to="/signup" id="about-cta-tutor" className="ab-btn-primary">
              <Zap size={18} /> Start as a Tutor <ChevronRight size={16} />
            </Link>
            <Link to="/signup" id="about-cta-student" className="ab-btn-outline">
              <Users size={18} /> Join as a Student
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
