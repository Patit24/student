import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Zap, Shield, Play, Users, Star,
  ChevronRight, MonitorPlay, Brain, Lock, CheckCircle, Search, MapPin, FileText, CheckSquare,
  Monitor, Globe, Activity, Plus
} from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import { subscribeGlobalAssets, markAssetPurchased } from '../db.service';
import { useToast } from '../components/Toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import neetWatermark from '../assets/neet_dna_watermark.png';
import jeeWatermark from '../assets/jee_grid_watermark.png';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
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
  const [blogRef, blogVis] = useReveal();

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

  const [latestBlogs, setLatestBlogs] = useState([]);
  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(6));
    const unsub = onSnapshot(q, (snap) => {
      setLatestBlogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

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
      {/* ── HERO ── */}
      <section className="hp-hero" ref={heroRef}>
        <div className="container hp-hero-inner">
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
              {['20+ Teachers', '600+ Students', '5★ Rating'].map(t => (
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
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="hp-stats-bar" ref={statsRef}>
        {[
          { n: '20+', l: 'Active Teachers' },
          { n: '600+', l: 'Students Enrolled' },
          { n: '20+', l: 'Courses Offered' },
          { n: '5★', l: 'Rating' },
        ].map(({ n, l }, i) => (
          <div key={i} className={`hp-stat ${statsVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ animationDelay: `${i * 0.15}s` }}>
            <span className="hp-stat-n">{n}</span>
            <span className="hp-stat-l">{l}</span>
          </div>
        ))}
      </section>

      {/* ── ASPIRANT PATHWAYS ── */}
      <section className="hp-paths">
        <div className="hp-path-grid">
          {/* NEET CARD */}
          <div className="hp-path-card neet animate-premium">
            <img src={neetWatermark} className="hp-path-watermark" alt="DNA Watermark" />
            <div className="hp-path-content">
              <div className="hp-path-badge">Medical Aspirant</div>
              <h2>NEET <span style={{ color: '#F5C518' }}>Aspirant</span></h2>
              <p>Prepare for the most prestigious medical exams with curated study materials and weekly mock tests.</p>
              
              <div className="hp-path-features">
                <div className="hp-path-feature"><CheckCircle size={18} /> Weekly Mock Exams <span className="coming-soon-tag">Coming Soon</span></div>
                <div className="hp-path-feature"><CheckCircle size={18} /> Last Minute Suggestions <span className="coming-soon-tag">Coming Soon</span></div>
                <div className="hp-path-feature"><CheckCircle size={18} /> Continuous Notes <span className="coming-soon-tag">Coming Soon</span></div>
                <div className="hp-path-feature"><CheckCircle size={18} /> Admin-Verified Content</div>
              </div>

              <div className="hp-path-btn-wrap">
                <div className="glass-path-btn">
                  <Zap size={20} /> Join the Medical Path
                </div>
              </div>
            </div>
          </div>

          {/* JEE CARD */}
          <div className="hp-path-card jee animate-premium">
            <img src={jeeWatermark} className="hp-path-watermark" alt="Engineering Watermark" />
            <div className="hp-path-content">
              <div className="hp-path-badge">Engineering Aspirant</div>
              <h2>JEE <span style={{ color: '#F5C518' }}>Aspirant</span></h2>
              <p>Crack JEE Main & Advanced with technical precision and automated exam practice.</p>
              
              <div className="hp-path-features">
                <div className="hp-path-feature"><CheckCircle size={18} /> Weekly Technical Exams <span className="coming-soon-tag">Coming Soon</span></div>
                <div className="hp-path-feature"><CheckCircle size={18} /> JEE Advanced Prep Pack <span className="coming-soon-tag">Coming Soon</span></div>
                <div className="hp-path-feature"><CheckCircle size={18} /> Formula Cheat Sheets <span className="coming-soon-tag">Coming Soon</span></div>
                <div className="hp-path-feature"><CheckCircle size={18} /> AI-Powered Analysis</div>
              </div>

              <div className="hp-path-btn-wrap">
                <div className="glass-path-btn">
                  <Zap size={20} /> Join the Engineering Path
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── RESUME BUILDER SECTION ── */}
      <section className="hp-section" style={{ background: '#080c16', padding: '6rem 2rem' }}>
        <div className="container">
          <div className="hp-section-head">
            <h2>Modern <span className="hp-yellow">Resume Builder</span></h2>
            <p>Stand out with our futuristic 2026-style professional templates.</p>
          </div>
          
          <div className="flex mobile-stack items-center gap-12 mt-12">
            <div className="flex-1">
              <div className="glass-panel p-8 animate-premium" style={{ borderLeft: '4px solid var(--hp-yellow)' }}>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Create a Resume that <span className="hp-yellow">Gets Noticed</span></h3>
                <ul className="flex-col gap-4 mb-8">
                  <li className="flex items-center gap-3"><CheckCircle size={18} color="var(--hp-yellow)" /> 5+ Premium Free-to-Edit Templates</li>
                  <li className="flex items-center gap-3"><CheckCircle size={18} color="var(--hp-yellow)" /> 6+ Modern 2026 Style Elite Designs</li>
                  <li className="flex items-center gap-3"><CheckCircle size={18} color="var(--hp-yellow)" /> AI-Powered Content Optimization</li>
                  <li className="flex items-center gap-3"><CheckCircle size={18} color="var(--hp-yellow)" /> Instant PDF Download in High-Res</li>
                </ul>
                <Link to="/resume-builder" className="hp-btn-primary" style={{ width: 'fit-content' }}>
                  <FileText size={20} /> Build My Resume Now
                </Link>
              </div>
            </div>
            <div className="flex-1 flex gap-4">
              <div className="resume-preview-card" style={{ transform: 'rotate(-5deg) translateY(20px)' }}>
                <div className="preview-label">FREE</div>
                <div className="preview-skeleton" />
              </div>
              <div className="resume-preview-card elite" style={{ transform: 'rotate(5deg)' }}>
                <div className="preview-label">ELITE 2026</div>
                <div className="preview-skeleton gradient" />
              </div>
            </div>
          </div>
        </div>
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

      {/* ── PUBLIC/GLOBAL LIBRARY ── */}
      <section className="hp-section" style={{ background: '#0a0f1c', padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container">
          <div className="hp-section-head">
            <h2>Global <span className="hp-yellow">Public Library</span></h2>
            <p>Free resources available for all aspirants.</p>
          </div>
          
          <div className="grid gap-8 mt-12" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {globalAssets.filter(a => !a.category || a.category === 'general').map((asset) => (
              <div key={asset.id} className="glass-card p-8 animate-premium" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ background: 'rgba(245,197,24,0.1)', padding: '0.8rem', borderRadius: '16px', width: 'fit-content', marginBottom: '1.5rem' }}>
                    <Globe size={28} color="#F5C518" />
                  </div>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.75rem', color: '#fff' }}>{asset.title}</h4>
                  <p style={{ fontSize: '0.95rem', color: '#7a8ba8', lineHeight: 1.6, marginBottom: '2rem' }}>
                    {asset.description || 'Access high-quality study materials and resources curated by top educators.'}
                  </p>
                </div>
                <button 
                  onClick={() => handleAssetAction(asset)} 
                  className="hp-btn-primary" 
                  style={{ width: '100%', borderRadius: '16px', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <FileText size={18} /> Download Resource
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

    {/* ── LATEST BLOGS PREVIEW ── */}
    <section className="hp-section" ref={blogRef} style={{ background: '#070b18', padding: '8rem 2rem', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decorative Glows */}
      <div style={{ position: 'absolute', top: '10%', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(245,197,24,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container">
        <div className={`hp-section-head ${blogVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} style={{ marginBottom: '5rem' }}>
          <h2 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-1px' }}>
            Expert <span className="hp-yellow">Insights</span> & Updates
          </h2>
          <p style={{ fontSize: '1.2rem', color: '#7a8ba8', maxWidth: '600px', margin: '1rem auto' }}>
            Master your exams with high-fidelity guidance from India's top educators.
          </p>
        </div>
        
        <div className="hp-blog-scroller mt-12">
          {latestBlogs.map((blog, i) => (
            <div 
              key={blog.id} 
              className={`glass-card overflow-hidden flex-col group ${blogVis ? 'hp-reveal-up' : 'hp-hidden-up'}`} 
              style={{ 
                animationDelay: `${i * 0.15}s`,
                borderRadius: '32px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                position: 'relative',
                minWidth: '380px',
                maxWidth: '380px',
                scrollSnapAlign: 'start'
              }}
              onClick={() => navigate(`/blog/${blog.id}`)}
            >
              {/* Image Container with Gradient Overlay */}
              <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                {blog.coverImage ? (
                  <img 
                    src={blog.coverImage} 
                    alt="" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      transition: 'transform 0.7s ease'
                    }} 
                    className="group-hover:scale-110"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-indigo-900/20 to-yellow-900/10">
                    <BookOpen size={48} className="opacity-20" />
                  </div>
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(7,11,24,0.9) 100%)' }} />
                
                {/* Category Badge on Image */}
                <div style={{ 
                  position: 'absolute', 
                  top: '20px', 
                  left: '20px', 
                  background: 'rgba(245,197,24,0.15)', 
                  backdropFilter: 'blur(10px)',
                  padding: '6px 14px',
                  borderRadius: '99px',
                  border: '1px solid rgba(245,197,24,0.3)',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#F5C518',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {blog.category}
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 flex-col gap-4" style={{ flex: 1, justifyContent: 'space-between' }}>
                <div className="flex-col gap-4">
                  <div className="flex items-center gap-3 text-xs font-semibold text-muted">
                    <span className="flex items-center gap-1.5"><Activity size={14} color="var(--hp-yellow)" /> {blog.readTime || '5 min read'}</span>
                    <span>•</span>
                    <span>{new Date(blog.createdAt?.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || 'Recent'}</span>
                  </div>
                  
                  <h4 style={{ 
                    fontSize: '1.4rem', 
                    margin: 0, 
                    lineHeight: 1.25, 
                    fontWeight: 800,
                    color: '#fff',
                    transition: 'color 0.3s ease'
                  }} className="group-hover:text-yellow-500">
                    {blog.title}
                  </h4>
                  
                  <p className="text-muted text-sm line-clamp-3" style={{ margin: 0, lineHeight: 1.6 }}>
                    {blog.excerpt || blog.content?.substring(0, 120).replace(/<[^>]*>?/gm, '') + '...'}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-2 text-yellow-500 font-bold text-sm">
                    Keep Reading <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={16} className="opacity-40" />
                  </div>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" style={{ 
                boxShadow: 'inset 0 0 50px rgba(245,197,24,0.05), 0 0 40px rgba(245,197,24,0.1)',
                borderRadius: '32px'
              }} />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Link to="/blogs" className="hp-btn-outline group" style={{ padding: '1rem 2.5rem', borderRadius: '99px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Discover More Articles <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
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
    </div>
  );
}
