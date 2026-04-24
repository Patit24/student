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
    <div className="hp-wrapper">
      <Navbar />
      
      {/* ── HERO SECTION ── */}
      <section className="hp-hero" ref={heroRef} style={{ opacity: heroVis ? 1 : 0, transform: heroVis ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s ease-out' }}>
        <div className="container">
          <div className="hp-badge"><span>PPR EDUCATION ECOSYSTEM</span></div>
          <h1>Empowering <span className="hp-yellow">Aspirants</span><br/>With Specialized Hubs</h1>
          <p>Access dedicated resources for NEET and JEE. Mock exams, curated materials, and expert suggestions tailored for your success.</p>
        </div>
      </section>

      {/* ── NEET SPECIALIZED HUB ── */}
      <section className="hp-section" style={{ background: 'linear-gradient(to bottom, #0a0f1c, #051a14)', padding: '6rem 2rem' }}>
        <div className="container">
          <div className="flex justify-between items-center mb-12">
            <div style={{ textAlign: 'left' }}>
              <div className="hp-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', marginLeft: 0 }}><span>MEDICAL STREAM</span></div>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, marginTop: '1rem' }}>NEET <span style={{ color: '#10B981' }}>Aspirant Hub</span></h2>
              <p className="text-muted" style={{ maxWidth: '500px' }}>Your dedicated sanctuary for medical excellence. Weekly mocks and bio-focused materials.</p>
            </div>
            <img src="/assets/neet_icon.png" alt="NEET" style={{ width: '180px', filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.3))' }} />
          </div>

          <div className="grid gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {/* NEET MOCKS */}
            <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '24px' }}>
              <h3 className="flex items-center gap-3 mb-6" style={{ fontSize: '1.2rem', color: '#10B981' }}><Zap size={20} /> Weekly Mock Exams</h3>
              <div className="flex-col gap-4">
                {globalAssets.filter(a => a.category === 'neet' && a.material_type === 'mock').map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{asset.title}</span>
                    <button onClick={() => handleAssetAction(asset)} className="hp-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>Start</button>
                  </div>
                ))}
                {globalAssets.filter(a => a.category === 'neet' && a.material_type === 'mock').length === 0 && <p className="text-muted" style={{ fontSize: '0.8rem' }}>No mocks available yet.</p>}
              </div>
            </div>

            {/* NEET MATERIALS */}
            <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '24px' }}>
              <h3 className="flex items-center gap-3 mb-6" style={{ fontSize: '1.2rem', color: '#10B981' }}><BookOpen size={20} /> Study Materials</h3>
              <div className="flex-col gap-4">
                {globalAssets.filter(a => a.category === 'neet' && a.material_type === 'material').map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{asset.title}</span>
                    <button onClick={() => handleAssetAction(asset)} className="hp-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>View</button>
                  </div>
                ))}
              </div>
            </div>

            {/* NEET SUGGESTIONS */}
            <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '24px' }}>
              <h3 className="flex items-center gap-3 mb-6" style={{ fontSize: '1.2rem', color: '#10B981' }}><Star size={20} /> Last-Min Suggestions</h3>
              <div className="flex-col gap-4">
                {globalAssets.filter(a => a.category === 'neet' && a.material_type === 'suggestion').map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{asset.title}</span>
                    <button onClick={() => handleAssetAction(asset)} className="hp-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>Get</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── JEE SPECIALIZED HUB ── */}
      <section className="hp-section" style={{ background: 'linear-gradient(to bottom, #0a0f1c, #0d0b26)', padding: '6rem 2rem' }}>
        <div className="container">
          <div className="flex flex-row-reverse justify-between items-center mb-12">
            <div style={{ textAlign: 'right' }}>
              <div className="hp-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', marginRight: 0 }}><span>ENGINEERING STREAM</span></div>
              <h2 style={{ fontSize: '3rem', fontWeight: 900, marginTop: '1rem' }}>JEE <span style={{ color: '#6366F1' }}>Aspirant Hub</span></h2>
              <p className="text-muted" style={{ maxWidth: '500px', marginLeft: 'auto' }}>Master physics, math and chemistry. Precision tools for engineering success.</p>
            </div>
            <img src="/assets/jee_icon.png" alt="JEE" style={{ width: '180px', filter: 'drop-shadow(0 0 30px rgba(99,102,241,0.3))' }} />
          </div>

          <div className="grid gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
            {/* JEE MOCKS */}
            <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '24px' }}>
              <h3 className="flex items-center gap-3 mb-6" style={{ fontSize: '1.2rem', color: '#6366F1' }}><Monitor size={20} /> Weekly Mock Exams</h3>
              <div className="flex-col gap-4">
                {globalAssets.filter(a => a.category === 'jee' && a.material_type === 'mock').map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{asset.title}</span>
                    <button onClick={() => handleAssetAction(asset)} className="hp-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>Start</button>
                  </div>
                ))}
              </div>
            </div>

            {/* JEE MATERIALS */}
            <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '24px' }}>
              <h3 className="flex items-center gap-3 mb-6" style={{ fontSize: '1.2rem', color: '#6366F1' }}><BookOpen size={20} /> Study Materials</h3>
              <div className="flex-col gap-4">
                {globalAssets.filter(a => a.category === 'jee' && a.material_type === 'material').map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{asset.title}</span>
                    <button onClick={() => handleAssetAction(asset)} className="hp-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>View</button>
                  </div>
                ))}
              </div>
            </div>

            {/* JEE SUGGESTIONS */}
            <div className="glass-card p-8" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(99,102,241,0.1)', borderRadius: '24px' }}>
              <h3 className="flex items-center gap-3 mb-6" style={{ fontSize: '1.2rem', color: '#6366F1' }}><Zap size={20} /> Last-Min Suggestions</h3>
              <div className="flex-col gap-4">
                {globalAssets.filter(a => a.category === 'jee' && a.material_type === 'suggestion').map(asset => (
                  <div key={asset.id} className="flex justify-between items-center p-4" style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '0.9rem' }}>{asset.title}</span>
                    <button onClick={() => handleAssetAction(asset)} className="hp-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.75rem' }}>Get</button>
                  </div>
                ))}
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
