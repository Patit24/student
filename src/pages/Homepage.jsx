import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Zap, Shield, Play, Users, Star,
  ChevronRight, MonitorPlay, Brain, Lock, CheckCircle, Search, MapPin, FileText, CheckSquare,
  Monitor, Globe, Activity
} from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import { subscribeGlobalAssets, markAssetPurchased } from '../db.service';
import { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
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
  const toast = useToast();
  const { currentUser, purchasedAssets, isMockMode } = useAppContext();
  const [heroRef, heroVis] = useReveal();
  const [bentoRef, bentoVis] = useReveal();
  const [demoRef, demoVis] = useReveal();
  const [statsRef, statsVis] = useReveal();

  const [globalAssets, setGlobalAssets] = useState([]);

  useEffect(() => {
    if (isMockMode) {
      setGlobalAssets([
        { id: 'ga1', title: 'Calculus Guide', name: 'calculus_notes.pdf', class_name: '12th', subject: 'Maths', is_free: true, price: 0, downloads: '1.2k', url: '#' },
        { id: 'ga2', title: 'Physics Formula Sheet', name: 'formulas_final.pdf', class_name: '11th', subject: 'Physics', is_free: false, price: 99, downloads: '850', url: '#' },
        { id: 'ga3', title: 'Organic Chemistry', name: 'chem_tricks.pdf', class_name: '12th', subject: 'Chemistry', is_free: false, price: 149, downloads: '2.1k', url: '#' },
      ]);
      return;
    }
    return subscribeGlobalAssets(setGlobalAssets);
  }, [isMockMode]);

  // ── Auto-Download Logic ──
  useEffect(() => {
    if (currentUser && globalAssets.length > 0) {
      const pendingDownloadId = localStorage.getItem('pending_download_id');
      if (pendingDownloadId) {
        const asset = globalAssets.find(a => a.id === pendingDownloadId);
        const isGlobalFree = asset?.is_free || asset?.price === 0 || asset?.uploader === 'Super Admin';

        if (asset && isGlobalFree) {
          localStorage.removeItem('pending_download_id');
          toast.success(`Success! Starting download: ${asset.title}`);
          setTimeout(() => {
            if (asset.url && asset.url !== '#') window.open(asset.url, '_blank');
          }, 1000);
        } else if (asset) {
          // If it was a paid asset, we just keep it in storage or redirect to pay
          localStorage.removeItem('pending_download_id');
          toast.info(`Please complete payment for ${asset.title}`);
        }
      }
    }
  }, [currentUser, globalAssets]);

  const handleAssetAction = async (asset) => {
    if (!currentUser) {
      localStorage.setItem('pending_download_id', asset.id);
      navigate('/signup');
      return;
    }

    // Logic for downloading/buying (Super Admin materials are ALWAYS free)
    const isGlobalFree = asset.is_free || asset.price === 0 || asset.uploader === 'Super Admin';
    
    if (isGlobalFree) {
      toast.success(`Starting download: ${asset.title}`);
      if (asset.url && asset.url !== '#') window.open(asset.url, '_blank');
    } else {
      const upiId = "yourname@upi";
      const upiUrl = `upi://pay?pa=${upiId}&pn=PPREducation&am=${asset.price}&cu=INR&tn=Payment for ${asset.title}`;
      window.location.href = upiUrl;
    }
  };

  return (
    <div className="hp-root">
      <Navbar />

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
          <div className={`hp-bento-card hp-bento-lg ${bentoVis ? 'hp-reveal-left' : 'hp-hidden-left'}`} style={{ animationDelay: '0.1s' }}>
            <div className="hp-card-icon-row">
              <Shield size={22} color="var(--hp-yellow)" />
              <span className="hp-card-num">01</span>
            </div>
            <h3>Secure Verification</h3>
            <p>Every tutor and student is verified via phone OTP before accessing the platform.</p>
            <OTPAnimation />
          </div>
          <div className={`hp-bento-card ${bentoVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ animationDelay: '0.25s' }}>
            <div className="hp-card-icon-row">
              <Brain size={22} color="var(--hp-yellow)" />
              <span className="hp-card-num">02</span>
            </div>
            <h3>AI Exam Engine</h3>
            <p>Upload any PDF or Excel sheet. Our AI instantly generates a full MCQ exam.</p>
            <ExamAnimation />
          </div>
          <div className={`hp-bento-card ${bentoVis ? 'hp-reveal-right' : 'hp-hidden-right'}`} style={{ animationDelay: '0.4s' }}>
            <div className="hp-card-icon-row">
              <Lock size={22} color="var(--hp-yellow)" />
              <span className="hp-card-num">03</span>
            </div>
            <h3>Fee Guard System</h3>
            <p>Students are automatically blocked from classes the moment fees are overdue.</p>
            <FeeAnimation />
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
              ].map((msg, i) => (
                <div key={i} className="hp-chat-msg">
                  <span className="hp-chat-user">{msg.u}</span>
                  <span className="hp-chat-text">{msg.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SPECIALIZED PATH EXPLORER ── */}
      <section className="hp-section" style={{ padding: '8rem 0', background: '#ffffff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div className="hp-badge" style={{ margin: '0 auto 1.5rem', background: 'rgba(245,197,24,0.1)', color: '#F5C518' }}><span>8K SPECIALIZED PATHS</span></div>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#1a1a1a' }}>Choose Your <span style={{ color: '#F5C518' }}>Aspirant Hub</span></h2>
            <p style={{ color: '#666', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>Permanent, resource-rich sanctuaries tailored for India's toughest exams.</p>
          </div>

          <div className="grid gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
            
            {/* NEET MEDICAL PATH CARD */}
            <div className="path-card-neet animate-premium" style={{ 
              background: '#FFFFF0', // Ivory
              border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: '32px',
              padding: '3.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '500px'
            }}>
              {/* DNA Watermark */}
              <div style={{ 
                position: 'absolute', top: '-10%', right: '-10%', opacity: 0.05, 
                fontSize: '15rem', color: '#F5C518', pointerEvents: 'none', transform: 'rotate(-15deg)' 
              }}>🧬</div>
              
              <div className="hp-badge" style={{ background: '#F5C518', color: '#000', marginLeft: 0, width: 'fit-content', fontWeight: 800 }}>
                MEDICAL ASPIRANT
              </div>
              
              <h3 style={{ fontSize: '2.5rem', color: '#333', marginTop: '2rem', marginBottom: '1rem' }}>NEET Sanctuary</h3>
              <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.6, flex: 1 }}>
                Master biology and chemistry with our specialized bio-focused mock tests and curated last-minute suggestions.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="glass-glow-btn"
                  style={{ 
                    flex: 1, padding: '1.2rem', borderRadius: '16px', background: 'rgba(245,197,24,0.1)', 
                    border: '1px solid #F5C518', color: '#333', fontWeight: 700, fontSize: '1rem' 
                  }}
                >
                  Enter Hub
                </button>
                <button 
                  className="glass-glow-btn"
                  style={{ 
                    flex: 1, padding: '1.2rem', borderRadius: '16px', background: 'white', 
                    border: '1px solid #ddd', color: '#333', fontWeight: 700, fontSize: '1rem' 
                  }}
                >
                  View Mocks
                </button>
              </div>
            </div>

            {/* JEE ENGINEERING PATH CARD */}
            <div className="path-card-jee animate-premium" style={{ 
              background: '#FFFFFF', // Bright White
              border: '1px solid rgba(245,197,24,0.3)',
              borderRadius: '32px',
              padding: '3.5rem',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '500px'
            }}>
              {/* Technical Grid Watermark */}
              <div style={{ 
                position: 'absolute', inset: 0, opacity: 0.03, 
                backgroundImage: 'radial-gradient(#F5C518 0.5px, transparent 0.5px)', backgroundSize: '20px 20px',
                pointerEvents: 'none'
              }} />
              
              <div className="hp-badge" style={{ background: '#F5C518', color: '#000', marginLeft: 0, width: 'fit-content', fontWeight: 800 }}>
                ENGINEERING ASPIRANT
              </div>
              
              <h3 style={{ fontSize: '2.5rem', color: '#333', marginTop: '2rem', marginBottom: '1rem' }}>JEE Command</h3>
              <p style={{ color: '#555', fontSize: '1.1rem', lineHeight: 1.6, flex: 1 }}>
                Precision tools for physics, math, and chemistry. Weekly engineering mocks designed by top-tier JEE faculty.
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                <button 
                  onClick={() => navigate('/signup')} 
                  className="glass-glow-btn"
                  style={{ 
                    flex: 1, padding: '1.2rem', borderRadius: '16px', background: 'rgba(245,197,24,0.1)', 
                    border: '1px solid #F5C518', color: '#333', fontWeight: 700, fontSize: '1rem' 
                  }}
                >
                  Enter Hub
                </button>
                <button 
                  className="glass-glow-btn"
                  style={{ 
                    flex: 1, padding: '1.2rem', borderRadius: '16px', background: 'white', 
                    border: '1px solid #ddd', color: '#333', fontWeight: 700, fontSize: '1rem' 
                  }}
                >
                  View Mocks
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── PUBLIC/GLOBAL LIBRARY ── */}
      <section className="hp-section" style={{ background: '#0a0f1c', padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div className="hp-section-head">
            <h2>Global <span className="hp-yellow">Public Library</span></h2>
            <p>Free resources available for all aspirants.</p>
          </div>
          
          <div className="grid gap-6 mt-12" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {globalAssets.filter(a => !a.category || a.category === 'general').map((asset) => (
              <div key={asset.id} className="glass-card p-6" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                <div style={{ background: 'rgba(245,197,24,0.1)', padding: '0.8rem', borderRadius: '14px', width: 'fit-content', marginBottom: '1.5rem' }}>
                  <Globe size={24} color="#F5C518" />
                </div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{asset.title}</h4>
                <button onClick={() => handleAssetAction(asset)} className="hp-btn-primary" style={{ width: '100%', borderRadius: '12px' }}>Download</button>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ── FINAL CTA ── */}
      <section className="hp-final-cta">
        <div className="hp-final-inner">
          <h2>Ready to Achieve Your<br /><span className="hp-yellow">Dream Rank?</span></h2>
          <p>Join thousands of aspirants already using the most advanced education platform in India.</p>
          <div className="hp-cta-row" style={{ justifyContent: 'center' }}>
            <Link to="/signup" className="hp-btn-primary" id="final-cta-signup">
              <Zap size={18} /> Start Free Today
              <ChevronRight size={18} />
            </Link>
            <Link to="/about" className="hp-btn-outline" id="final-cta-about">Learn About Us</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
