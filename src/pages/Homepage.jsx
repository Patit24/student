import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Zap, Shield, Play, Users, Star,
  ChevronRight, MonitorPlay, Brain, Lock, CheckCircle, Search, MapPin, FileText
} from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import { subscribeGlobalAssets, markAssetPurchased } from '../db.service';
import './Homepage.css';

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── OTP animation ── */
function OTPAnimation() {
  const digits = ['3', '8', '1', '4', '9', '2'];
  const [active, setActive] = useState(-1);
  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      setActive(i);
      i++;
      if (i >= digits.length) { i = 0; setTimeout(() => setActive(-1), 400); }
    }, 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hp-otp-wrap">
      <div className="hp-phone-frame">
        <div className="hp-phone-screen">
          <p className="hp-otp-label">Your OTP Code</p>
          <div className="hp-otp-digits">
            {digits.map((d, i) => (
              <span key={i} className={`hp-otp-box ${active === i ? 'hp-otp-active' : active > i ? 'hp-otp-done' : ''}`}>{d}</span>
            ))}
          </div>
          <p className="hp-otp-sub">Expires in 05:00</p>
        </div>
      </div>
    </div>
  );
}

/* ── AI Exam animation ── */
function ExamAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 3), 1400);
    return () => clearInterval(t);
  }, []);
  const questions = ['What is Newton\'s 2nd Law?', 'Define Ohm\'s Law.', 'Explain Bernoulli\'s principle.'];
  return (
    <div className="hp-exam-wrap">
      <div className={`hp-pdf-icon ${step > 0 ? 'hp-pdf-shrink' : ''}`}>
        <div className="hp-pdf-rect">
          <span>PDF</span>
        </div>
      </div>
      {step > 0 && (
        <div className="hp-mcq-card">
          <span className="hp-mcq-badge">AI Generated</span>
          <p className="hp-mcq-q">{questions[step - 1]}</p>
          <div className="hp-mcq-opts">
            {['A', 'B', 'C', 'D'].map(o => (
              <div key={o} className={`hp-mcq-opt ${o === 'B' ? 'hp-mcq-correct' : ''}`}>{o}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Fee Guard animation ── */
function FeeAnimation() {
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setPaid(p => !p), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hp-fee-wrap">
      <div className={`hp-fee-icon ${paid ? 'hp-fee-paid' : 'hp-fee-locked'}`}>
        {paid ? <CheckCircle size={40} /> : <Lock size={40} />}
      </div>
      <p className="hp-fee-label">{paid ? '✅ Access Granted' : '🔒 Payment Required'}</p>
    </div>
  );
}

/* ── Live Now scroller ── */
const LIVE_CLASSES = [
  { subject: 'Calculus III', tutor: 'Dr. Sharma', viewers: 142, level: 'Advanced' },
  { subject: 'Organic Chemistry', tutor: 'Prof. Sen', viewers: 89, level: 'JEE Prep' },
  { subject: 'Data Structures', tutor: 'Rohit Kumar', viewers: 215, level: 'CS Core' },
  { subject: 'Physics – Mechanics', tutor: 'Dr. Mishra', viewers: 67, level: 'NEET' },
  { subject: 'Linear Algebra', tutor: 'Ananya Roy', viewers: 103, level: 'B.Tech' },
];

/* ══════════════════════════════════════════
   Main Component
══════════════════════════════════════════ */
export default function Homepage() {
  const navigate = useNavigate();
  const { currentUser, purchasedAssets, isMockMode } = useAppContext();
  const [heroRef, heroVis] = useReveal();
  const [bentoRef, bentoVis] = useReveal();
  const [demoRef, demoVis] = useReveal();
  const [statsRef, statsVis] = useReveal();

  const [globalAssets, setGlobalAssets] = useState([]);

  useEffect(() => {
    if (isMockMode) {
      setGlobalAssets([
        { id: 'ga1', title: 'Calculus Guide', class_name: '12th', subject: 'Maths', is_free: true, price: 0, downloads: '1.2k', file_url: '#' },
        { id: 'ga2', title: 'Physics Formula Sheet', class_name: '11th', subject: 'Physics', is_free: false, price: 99, downloads: '850', file_url: '#' },
        { id: 'ga3', title: 'Organic Chemistry', class_name: '12th', subject: 'Chemistry', is_free: false, price: 149, downloads: '2.1k', file_url: '#' },
      ]);
      return;
    }
    return subscribeGlobalAssets(setGlobalAssets);
  }, [isMockMode]);

  const handleAssetAction = async (asset) => {
    if (!currentUser) {
      navigate('/signup');
      return;
    }
    const isPurchased = purchasedAssets?.includes(asset.id);
    if (asset.is_free || isPurchased) {
      alert(`Starting download for: ${asset.title}`);
      if (asset.file_url !== '#') window.open(asset.file_url, '_blank');
    } else {
      const upiId = "yourname@upi";
      const upiUrl = `upi://pay?pa=${upiId}&pn=Antigravity&am=${asset.price}&cu=INR&tn=Payment for ${asset.title}`;
      window.location.href = upiUrl;
      if (window.confirm(`Simulate payment of ₹${asset.price} for ${asset.title}?`)) {
        try {
          await markAssetPurchased(currentUser.uid, asset.id);
          alert('Purchase successful!');
        } catch (err) {
          alert('Failed: ' + err.message);
        }
      }
    }
  };

  return (
    <div className="hp-root">

      {/* ── HERO ── */}
      <section className="hp-hero" ref={heroRef}>
        <div className={`hp-hero-content ${heroVis ? 'hp-reveal-left' : 'hp-hidden-left'}`}>
          <div className="hp-badge">
            <span className="hp-live-dot" />
            <span>Live Classes Running Now</span>
          </div>
          <h1 className="hp-headline">
            Your Global<br />
            <span className="hp-yellow">Coaching Center,</span><br />
            Simplified.
          </h1>
          <p className="hp-sub">
            One platform for unlimited tutors. Live streaming, AI‑powered exams,
            and automated fee management — all in one place.
          </p>
          <div className="hp-cta-row">
            <Link to="/signup?role=tutor" id="cta-tutor" className="hp-btn-primary">
              <Zap size={18} /> Get Started as a Tutor
            </Link>
            <Link to="/search" id="cta-search" className="hp-btn-outline" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <Search size={18} /> Find Tutors Near You
            </Link>
          </div>

          {/* Quick Search Widget */}
          <div className="hp-search-widget animate-fade-in" style={{ 
            marginTop: '2.5rem', 
            background: 'rgba(255,255,255,0.03)', 
            padding: '1.25rem', 
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: '600px'
          }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={14} color="#F5C518" /> QUICK DISCOVERY
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Subject (e.g. Math)" 
                style={{ flex: 1, minWidth: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', color: 'white', outline: 'none' }}
              />
              <input 
                type="text" 
                placeholder="Area or Pincode" 
                style={{ flex: 1, minWidth: '150px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: '8px', color: 'white', outline: 'none' }}
              />
              <button 
                onClick={() => navigate('/search')}
                className="hp-btn-primary" 
                style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', width: '100%' }}
              >
                Search Tutors
              </button>
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>Popular:</span>
              <Link to="/search?q=Physics" style={{ color: '#F5C518', textDecoration: 'none' }}>Physics</Link>
              <Link to="/search?q=Chemistry" style={{ color: '#F5C518', textDecoration: 'none' }}>Chemistry</Link>
              <Link to="/search?q=Mathematics" style={{ color: '#F5C518', textDecoration: 'none' }}>Math</Link>
              <Link to="/search?q=Biology" style={{ color: '#F5C518', textDecoration: 'none' }}>Biology</Link>
            </div>
          </div>
          <div className="hp-trust-row">
            {['500+ Tutors', '12K+ Students', '4.9★ Rating'].map(t => (
              <span key={t} className="hp-trust-pill">{t}</span>
            ))}
          </div>
        </div>

        <div className={`hp-hero-right ${heroVis ? 'hp-reveal-right' : 'hp-hidden-right'}`}>
          <div className="hp-dashboard-float">
            <div className="hp-dash-header">
              <BookOpen size={20} color="var(--hp-yellow)" />
              <span>Live Dashboard</span>
              <span className="hp-live-badge">LIVE</span>
            </div>
            <div className="hp-live-list">
              {LIVE_CLASSES.map((c, i) => (
                <div key={i} className="hp-live-item" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="hp-live-dot-sm" />
                  <div className="hp-live-info">
                    <strong>{c.subject}</strong>
                    <span>{c.tutor} · {c.level}</span>
                  </div>
                  <div className="hp-viewer-badge">
                    <MonitorPlay size={12} /> {c.viewers}
                  </div>
                </div>
              ))}
            </div>
            <div className="hp-dash-footer">
              <Play size={14} /> Streaming at 1080p · Low latency
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="hp-stats-bar" ref={statsRef}>
        {[
          { n: '500+', l: 'Active Tutors' },
          { n: '12,000+', l: 'Students Enrolled' },
          { n: '98%', l: 'Uptime SLA' },
          { n: '50+', l: 'Subjects Covered' },
        ].map(({ n, l }, i) => (
          <div key={i} className={`hp-stat ${statsVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ animationDelay: `${i * 0.15}s` }}>
            <span className="hp-stat-n">{n}</span>
            <span className="hp-stat-l">{l}</span>
          </div>
        ))}
      </section>

      {/* ── HOW IT WORKS BENTO ── */}
      <section className="hp-section" ref={bentoRef}>
        <div className={`hp-section-head ${bentoVis ? 'hp-reveal-up' : 'hp-hidden-up'}`}>
          <h2>How It <span className="hp-yellow">Works</span></h2>
          <p>Three intelligent systems working together seamlessly</p>
        </div>
        <div className="hp-bento">
          {/* Card 1 */}
          <div className={`hp-bento-card hp-bento-lg ${bentoVis ? 'hp-reveal-left' : 'hp-hidden-left'}`} style={{ animationDelay: '0.1s' }}>
            <div className="hp-card-icon-row">
              <Shield size={22} color="var(--hp-yellow)" />
              <span className="hp-card-num">01</span>
            </div>
            <h3>Secure Verification</h3>
            <p>Every tutor and student is verified via phone OTP before accessing the platform.</p>
            <OTPAnimation />
          </div>

          {/* Card 2 */}
          <div className={`hp-bento-card ${bentoVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ animationDelay: '0.25s' }}>
            <div className="hp-card-icon-row">
              <Brain size={22} color="var(--hp-yellow)" />
              <span className="hp-card-num">02</span>
            </div>
            <h3>AI Exam Engine</h3>
            <p>Upload any PDF or Excel sheet. Our AI instantly generates a full MCQ exam.</p>
            <ExamAnimation />
          </div>

          {/* Card 3 */}
          <div className={`hp-bento-card ${bentoVis ? 'hp-reveal-right' : 'hp-hidden-right'}`} style={{ animationDelay: '0.4s' }}>
            <div className="hp-card-icon-row">
              <Lock size={22} color="var(--hp-yellow)" />
              <span className="hp-card-num">03</span>
            </div>
            <h3>Fee Guard System</h3>
            <p>Students are automatically blocked from classes the moment fees are overdue.</p>
            <FeeAnimation />
          </div>

          {/* Card 4 - New Resume Builder */}
          <div className={`hp-bento-card hp-bento-lg ${bentoVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ animationDelay: '0.5s', background: 'linear-gradient(135deg, rgba(79,70,229,0.1) 0%, rgba(0,0,0,0) 100%)' }}>
            <div className="hp-card-icon-row">
              <CheckSquare size={22} color="#F5C518" />
              <span className="hp-card-num">04</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <h3>Smart Examination System</h3>
                <p>Automated test generation from your study materials. AI-powered progress tracking and performance analytics for every student.</p>
                <div className="hp-btn-primary mt-4" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', width: 'fit-content', opacity: 0.8, cursor: 'default' }}>
                  Integrated Classroom Feature
                </div>
              </div>
              <div className="exam-preview-mini no-print" style={{ 
                background: 'rgba(255,255,255,0.03)', width: '140px', height: '180px', borderRadius: '8px', padding: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transform: 'rotate(5deg) translateY(-10px)',
                border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ height: '12px', background: 'rgba(245,197,24,0.3)', borderRadius: '2px' }} />
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }} />
                <div style={{ flex: 1 }} />
                <div style={{ height: '24px', background: '#F5C518', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 800, color: '#000' }}>START TEST</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO ── */}
      <section className="hp-section hp-demo-section" ref={demoRef}>
        <div className={`hp-section-head ${demoVis ? 'hp-reveal-up' : 'hp-hidden-up'}`}>
          <h2>See It <span className="hp-yellow">Live</span></h2>
          <p>A real classroom experience — right in your browser</p>
        </div>
        <div className={`hp-demo-wrap ${demoVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ animationDelay: '0.2s' }}>
          <div className="hp-video-player">
            <div className="hp-video-screen">
              <div className="hp-video-overlay">
                <div className="hp-play-btn"><Play size={32} /></div>
                <div className="hp-video-label">Live: JEE Advanced Mathematics</div>
              </div>
              <div className="hp-screen-share-bar">
                <span className="hp-ss-toggle">🖥 Screen Share: ON</span>
                <span className="hp-rec-dot" />
                <span>REC 00:42:17</span>
              </div>
            </div>
            <div className="hp-video-controls">
              <span>▶ 128 watching</span>
              <span className="hp-quality">HD 1080p</span>
              <span>⚡ 0.3s latency</span>
            </div>
          </div>
          <div className="hp-chat-sidebar">
            <div className="hp-chat-header">
              <span>Live Chat</span>
              <span className="hp-online-dot" />
            </div>
            <div className="hp-chat-msgs">
              {[
                { u: 'Riya', m: '∫(x²+2x)dx = x³/3 + x²', t: '14:22' },
                { u: 'Arjun', m: 'Can you explain F=ma again?', t: '14:23' },
                { u: 'Priya', m: 'E=mc² is mind-blowing 🚀', t: '14:23' },
                { u: 'Dev', m: 'Σ(i=1 to n) i = n(n+1)/2', t: '14:24' },
                { u: 'Nisha', m: 'Thank you Sir! 🙏', t: '14:24' },
              ].map((msg, i) => (
                <div key={i} className="hp-chat-msg">
                  <span className="hp-chat-user">{msg.u}</span>
                  <span className="hp-chat-text">{msg.m}</span>
                  <span className="hp-chat-time">{msg.t}</span>
                </div>
              ))}
            </div>
            <div className="hp-chat-input-row">
              <input type="text" placeholder="Type a message…" className="hp-chat-input" />
              <button className="hp-send-btn">➤</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── PUBLIC LIBRARY (Common Man Benefit) ── */}
      <section className="hp-section" style={{ background: 'rgba(255,255,255,0.02)', padding: '5rem 2rem' }}>
        <div className="container">
          <div className="hp-section-head">
            <h2>Free Study <span className="hp-yellow">Library</span></h2>
            <p>High-quality resources provided by Antigravity Admin for all guest users.</p>
          </div>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
            gap: '1.5rem', 
            marginTop: '3rem' 
          }}>
            {globalAssets.map((asset) => {
              const isPurchased = purchasedAssets?.includes(asset.id);
              return (
                <div key={asset.id} className="hp-bento-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                  <div style={{ 
                    position: 'absolute', top: '0.75rem', right: '0.75rem', 
                    fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                    background: asset.is_free ? 'rgba(16,185,129,0.2)' : isPurchased ? 'rgba(79,70,229,0.2)' : 'rgba(245,197,24,0.2)',
                    color: asset.is_free ? '#10B981' : isPurchased ? '#4F46E5' : '#F5C518'
                  }}>
                    {asset.is_free ? 'FREE' : isPurchased ? 'OWNED' : `₹${asset.price}`}
                  </div>
                  <div style={{ background: 'rgba(245,197,24,0.1)', padding: '0.75rem', borderRadius: '12px', width: 'fit-content' }}>
                    <FileText size={24} color="#F5C518" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{asset.title}</h4>
                    <p style={{ fontSize: '0.8rem' }}>{asset.class_name} · {asset.subject}</p>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{asset.downloads || '0'} downloads</span>
                    <button 
                      onClick={() => handleAssetAction(asset)}
                      className="hp-btn-outline" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'white', cursor: 'pointer' }}
                    >
                      {asset.is_free || isPurchased ? 'Download' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              * Teacher specific materials are private and only visible to enrolled students.
            </p>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="hp-final-cta">
        <div className="hp-final-inner">
          <h2>Ready to Build Your<br /><span className="hp-yellow">Coaching Empire?</span></h2>
          <p>Join 500+ tutors already streaming on the most advanced education platform in India.</p>
          <div className="hp-cta-row" style={{ justifyContent: 'center' }}>
            <Link to="/signup" className="hp-btn-primary" id="final-cta-signup">
              <Zap size={18} /> Start Free Today
              <ChevronRight size={18} />
            </Link>
            <Link to="/about" className="hp-btn-outline" id="final-cta-about">Learn About Us</Link>
          </div>
        </div>
      </section>

    </div>
  );
}
