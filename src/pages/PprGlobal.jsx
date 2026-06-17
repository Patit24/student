import React, { useEffect, useState, useRef } from 'react';
import { 
  Zap, Laptop, Globe, Smartphone, Compass, Lightbulb, 
  CheckCircle, ArrowRight, Activity, Award, Heart, MessageSquare, 
  Phone, Mail, ArrowUpRight, Code, Database, Server, Cpu, Play
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './PprGlobal.css';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const PROJECTS = [
  {
    id: 1,
    title: 'Edutrack Academy',
    desc: 'An all-in-one educational platform featuring automated parent portals, batch management, and live session scheduling.',
    category: 'web-app',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
    link: '#'
  },
  {
    id: 2,
    title: 'NexaRetail Hub',
    desc: 'High-performance e-commerce engine with real-time stock levels, smart order splits, and integrated payment pathways.',
    category: 'website',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60',
    link: '#'
  },
  {
    id: 3,
    title: 'Apex Fit App',
    desc: 'Cross-platform mobile application utilizing Flutter to track physical activity, diet plans, and sync with smart wearable APIs.',
    category: 'mobile',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60',
    link: '#'
  },
  {
    id: 4,
    title: 'SaaSFlow Analytics',
    desc: 'Vibrant, glassmorphic analytics dashboard providing process tracking, CRM automation, and live customer feedback metrics.',
    category: 'web-app',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60',
    link: '#'
  },
  {
    id: 5,
    title: 'Vanguard Corporate',
    desc: 'Fully responsive multi-page marketing site for an international financial group built on Next.js.',
    category: 'website',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60',
    link: '#'
  },
  {
    id: 6,
    title: 'Zenith Health Platform',
    desc: 'Patient management dashboard providing HIPAA-compliant storage, telehealth, and online booking pipelines.',
    category: 'web-app',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&auto=format&fit=crop&q=60',
    link: '#'
  }
];

const TESTIMONIALS = [
  {
    quote: "PPR Global revolutionized our manual workflow. Their customized CRM tool saved our administrative team over 20 hours a week and automated our customer feedback loops.",
    author: "Rakesh Singhania",
    title: "Operations Director, Nexa Corp"
  },
  {
    quote: "The team built an outstanding cross-platform application for our fitness community. Their technical capability, transparent timeline, and post-launch support were top-tier.",
    author: "Elena Rostova",
    title: "Founder, Apex Fitness"
  },
  {
    quote: "We needed a premium corporate website that load instantly and ranks globally. PPR Global delivered a Next.js masterpiece that exceeded our board members' expectations.",
    author: "Nishant Malhotra",
    title: "VP of Product, Vanguard Capital"
  }
];

const TECHS = [
  { name: 'React', icon: <Code size={18} /> },
  { name: 'Next.js', icon: <Code size={18} /> },
  { name: 'WordPress', icon: <Globe size={18} /> },
  { name: 'Node.js', icon: <Server size={18} /> },
  { name: 'Laravel', icon: <Server size={18} /> },
  { name: 'Flutter', icon: <Smartphone size={18} /> },
  { name: 'MySQL', icon: <Database size={18} /> },
  { name: 'Firebase', icon: <Database size={18} /> },
  { name: 'AWS Cloud', icon: <Cpu size={18} /> }
];

export default function PprGlobal() {
  const toast = useToast();
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);

  // Form State
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', service: 'website', msg: '' });
  const [submitting, setSubmitting] = useState(false);

  // Live Stats State
  const [stats, setStats] = useState({
    activeStudents: 91,
    activeTutors: 9,
    activeBatches: 36
  });

  // Refs for Animations
  const heroRef = useRef(null);
  const visualRef = useRef(null);
  const statsRef = useRef(null);
  const statVal1 = useRef(null);
  const statVal2 = useRef(null);
  const statVal3 = useRef(null);
  const timelineRef = useRef(null);

  // Filter projects
  const filteredProjects = activeFilter === 'all' 
    ? PROJECTS 
    : PROJECTS.filter(p => p.category === activeFilter);

  // Handle Form Change
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Form Submit
  const handleInquirySubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast.error('Please enter name, email, and phone number.');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Inquiry submitted! Our representative will call you back within 12 hours.');
      
      // Open WhatsApp API dynamic link with pre-filled message as requested
      const text = `Hi PPR Global, I would like to schedule a consultation.\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\nService: ${form.service}\nDetails: ${form.msg}`;
      const encodedText = encodeURIComponent(text);
      window.open(`https://wa.me/919014842370?text=${encodedText}`, '_blank');

      setForm({ name: '', email: '', phone: '', company: '', service: 'website', msg: '' });
    }, 1500);
  };

  useEffect(() => {
    async function fetchRealStats() {
      if (!db) return;
      try {
        const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
        const tutorsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "tutor")));
        const batchesSnap = await getDocs(collection(db, "batches"));
        
        setStats({
          activeStudents: studentsSnap.size || 91,
          activeTutors: tutorsSnap.size || 9,
          activeBatches: batchesSnap.size || 36
        });
      } catch (err) {
        console.warn("Failed to fetch live stats, using mock details:", err);
      }
    }
    fetchRealStats();
  }, []);

  useEffect(() => {
    // 1. Hero Floating Visual Animation
    if (visualRef.current) {
      gsap.to(visualRef.current, {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }

    // 2. Scroll-Triggered Counter Animations for Stats Section
    const countTo = (refElement, endValue, duration) => {
      let obj = { val: 0 };
      gsap.to(obj, {
        val: endValue,
        duration: duration,
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        onUpdate: function () {
          if (refElement.current) {
            refElement.current.innerText = Math.floor(obj.val);
          }
        }
      });
    };

    countTo(statVal1, stats.activeTutors, 2.5);
    countTo(statVal2, stats.activeBatches, 2.8);
    countTo(statVal3, 100, 2);

    // 3. ScrollTrigger Reveals for Service and Process elements
    gsap.utils.toArray('.pprg-reveal-on-scroll').forEach((elem) => {
      gsap.fromTo(elem, {
        opacity: 0,
        y: 40
      }, {
        opacity: 1,
        y: 0,
        duration: 1.2,
        scrollTrigger: {
          trigger: elem,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [stats]);

  return (
    <div className="pprg-body">
      {/* Background Decorators */}
      <div className="pprg-bg-glows">
        <div className="pprg-glow pprg-glow-1"></div>
        <div className="pprg-glow pprg-glow-2"></div>
        <div className="pprg-glow pprg-glow-3"></div>
        <div className="pprg-grid-overlay"></div>
      </div>

      {/* =================================---------
         HERO SECTION
         ========================================= */}
      <section className="pprg-hero" ref={heroRef}>
        <div className="pprg-hero-container">
          <div className="pprg-hero-content">
            <div className="pprg-hero-badge">
              <span className="dot" />
              <span>Next-Gen Software Agency</span>
            </div>
            <h1 className="pprg-hero-title">
              Building Digital <br />
              <span className="pprg-gradient-text">Solutions That Drive</span> <br />
              Business Growth
            </h1>
            <p className="pprg-hero-sub">
              PPR Global helps startups, businesses, educational institutions, and entrepreneurs build modern websites, web applications, and mobile apps that deliver real results.
            </p>
            <div className="pprg-hero-ctas">
              <a href="#contact" className="pprg-btn-primary">
                Schedule a Consultation <ArrowRight size={18} />
              </a>
              <a href="#services" className="pprg-btn-outline">
                View Our Services
              </a>
            </div>
          </div>

          <div className="pprg-hero-visual">
            <div className="pprg-orb" />
            <div className="pprg-hero-mockup" ref={visualRef}>
              {/* Dummy SaaS Dashboard Elements */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem' }}>
                <span style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }} />
                <span style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '50%' }} />
                <span style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%' }} />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', height: '40px', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 10px', color: '#64748b', fontSize: '0.8rem' }}>
                https://ppreducation.com/dashboard
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', height: '120px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', padding: '15px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Active Students</span>
                  <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '5px 0 0' }}>{stats.activeStudents}</p>
                  <span style={{ color: '#10b981', fontSize: '0.7rem' }}>↑ Live Classroom</span>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', height: '120px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '15px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>Active Batches</span>
                  <p style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff', margin: '5px 0 0' }}>{stats.activeBatches}</p>
                  <span style={{ color: '#10b981', fontSize: '0.7rem' }}>NEET & JEE Prep</span>
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', height: '140px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                <span style={{ color: '#64748b', fontSize: '0.8rem' }}>Tutor Network</span>
                <div style={{ background: 'rgba(255,255,255,0.05)', height: '10px', borderRadius: '5px', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--ppr-blue-gradient)', width: `${Math.min(100, (stats.activeTutors / 15) * 100)}%`, height: '100%' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <span>Verified Tutors</span>
                  <span>{stats.activeTutors} Active</span>
                </div>
              </div>
            </div>
            {/* Interactive Badges floating */}
            <div className="pprg-float-badge pprg-fb-1">
              <Laptop size={18} color="#3b82f6" />
              <span>Fullstack Automation</span>
            </div>
            <div className="pprg-float-badge pprg-fb-2">
              <Smartphone size={18} color="#10b981" />
              <span>Mobile-First Hybrid Apps</span>
            </div>
          </div>
        </div>
      </section>

      {/* =================================---------
         ABOUT SECTION
         ========================================= */}
      <section className="pprg-about" id="about">
        <div className="pprg-about-grid">
          <div className="pprg-about-left">
            <div className="pprg-about-card pprg-glass-panel pprg-reveal-on-scroll">
              <h3><Compass size={24} color="#3b82f6" /> Our Vision</h3>
              <p>To empower global brands, startups, and institutions with robust digital solutions, making state-of-the-art websites, custom apps, and automated workflows accessible and easy to deploy.</p>
            </div>
            <div className="pprg-about-card pprg-glass-panel pprg-reveal-on-scroll">
              <h3><Lightbulb size={24} color="#10b981" /> Our Mission</h3>
              <p>We combine creativity, technical strategy, and cutting-edge software stacks to construct modern applications that streamline client operations and drive business conversions.</p>
            </div>
          </div>

          <div className="pprg-about-right pprg-reveal-on-scroll">
            <div className="pprg-section-badge">
              <Zap size={14} /> Who We Are
            </div>
            <h2 className="pprg-section-title">Founded on Innovation and Teamwork</h2>
            <p className="pprg-about-story">
              PPR Global was founded by two passionate technology professionals with a vision to create impactful digital products. We combine creativity, strategy, and technology to help businesses establish a powerful online presence, digitize their offline models, and streamline operations.
            </p>
            
            {/* Statistics Row */}
            <div className="pprg-stats-row" ref={statsRef}>
              <div className="pprg-stat-card">
                <div className="pprg-stat-number"><span ref={statVal1}>0</span>+</div>
                <div className="pprg-stat-label">Expert Tutors</div>
              </div>
              <div className="pprg-stat-card">
                <div className="pprg-stat-number"><span ref={statVal2}>0</span>+</div>
                <div className="pprg-stat-label">Active Batches</div>
              </div>
              <div className="pprg-stat-card">
                <div className="pprg-stat-number"><span ref={statVal3}>0</span>%</div>
                <div className="pprg-stat-label">Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================---------
         SERVICES SECTION
         ========================================= */}
      <section className="pprg-services" id="services">
        <div className="pprg-section-head pprg-reveal-on-scroll">
          <div className="pprg-section-badge">
            <Laptop size={14} /> Capabilities
          </div>
          <h2 className="pprg-section-title">Our Digital Solutions</h2>
          <p className="pprg-section-sub">From custom SaaS modules to clean corporate portfolios, we code it all.</p>
        </div>

        <div className="pprg-services-grid">
          {/* Service 1: Website Development */}
          <div className="pprg-service-card pprg-glass-panel pprg-reveal-on-scroll">
            <div className="pprg-service-icon-bg">
              <Laptop size={24} />
            </div>
            <h3>Website Development</h3>
            <p>Stunning, ultra-fast, and responsive websites that communicate your brand values and convert visitors into loyal clients.</p>
            <ul className="pprg-service-list">
              <li><CheckCircle size={14} color="#3b82f6" /> Corporate Websites</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Business Websites</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Educational Portals</li>
              <li><CheckCircle size={14} color="#3b82f6" /> E-commerce Platforms</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Portfolios & Landing Pages</li>
            </ul>
          </div>

          {/* Service 2: Web Applications */}
          <div className="pprg-service-card pprg-glass-panel pprg-reveal-on-scroll">
            <div className="pprg-service-icon-bg">
              <Globe size={24} />
            </div>
            <h3>Web Applications</h3>
            <p>Complex, highly secure web databases tailored to optimize business operations, customer interactions, and analytics.</p>
            <ul className="pprg-service-list">
              <li><CheckCircle size={14} color="#3b82f6" /> CRM & ERP Systems</li>
              <li><CheckCircle size={14} color="#3b82f6" /> School Management Systems</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Healthcare Booking Dashboards</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Process Automation Engines</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Custom Admin Dashboards</li>
            </ul>
          </div>

          {/* Service 3: Mobile Applications */}
          <div className="pprg-service-card pprg-glass-panel pprg-reveal-on-scroll">
            <div className="pprg-service-icon-bg">
              <Smartphone size={24} />
            </div>
            <h3>Mobile Applications</h3>
            <p>High-fidelity, native-performing iOS and Android apps designed to deliver smooth interactions and offline capabilities.</p>
            <ul className="pprg-service-list">
              <li><CheckCircle size={14} color="#3b82f6" /> Native Android Apps</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Native iOS Solutions</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Flutter Cross-Platform Apps</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Progressive Web Apps (PWAs)</li>
            </ul>
          </div>

          {/* Service 4: UI/UX Design */}
          <div className="pprg-service-card pprg-glass-panel pprg-reveal-on-scroll">
            <div className="pprg-service-icon-bg">
              <Compass size={24} />
            </div>
            <h3>UI/UX Design</h3>
            <p>User-centered wireframing and interactive design layouts that keep users engaged, reducing bounce rates and ensuring ease of use.</p>
            <ul className="pprg-service-list">
              <li><CheckCircle size={14} color="#3b82f6" /> Wireframing & Concept Maps</li>
              <li><CheckCircle size={14} color="#3b82f6" /> High-Fidelity Prototypes</li>
              <li><CheckCircle size={14} color="#3b82f6" /> User Experience (UX) Audits</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Modern Brand Identity & Logos</li>
            </ul>
          </div>

          {/* Service 5: Digital Solutions */}
          <div className="pprg-service-card pprg-glass-panel pprg-reveal-on-scroll">
            <div className="pprg-service-icon-bg">
              <Zap size={24} />
            </div>
            <h3>Digital Solutions</h3>
            <p>Leverage cloud computing, artificial intelligence, and API triggers to eliminate redundant business tasks.</p>
            <ul className="pprg-service-list">
              <li><CheckCircle size={14} color="#3b82f6" /> Workflow Process Automation</li>
              <li><CheckCircle size={14} color="#3b82f6" /> AI & Large Language Model Integrations</li>
              <li><CheckCircle size={14} color="#3b82f6" /> Automatic WhatsApp Notifications</li>
              <li><CheckCircle size={14} color="#3b82f6" /> API Integrations & Database Sync</li>
            </ul>
          </div>
        </div>
      </section>

      {/* =================================---------
         FEATURED PROJECTS (PORTFOLIO WITH FILTER)
         ========================================= */}
      <section className="pprg-portfolio" id="portfolio">
        <div className="pprg-section-head pprg-reveal-on-scroll">
          <div className="pprg-section-badge">
            <Award size={14} /> Portfolio
          </div>
          <h2 className="pprg-section-title">Case Studies & Showcase</h2>
          <p className="pprg-section-sub">Explore client applications designed, coded, and deployed by our experts.</p>
        </div>

        {/* Filter Navigation */}
        <div className="pprg-filter-bar pprg-reveal-on-scroll">
          {['all', 'website', 'web-app', 'mobile'].map(cat => (
            <button 
              key={cat} 
              className={`pprg-filter-btn ${activeFilter === cat ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat === 'all' ? 'All Work' : cat === 'web-app' ? 'Web Applications' : cat === 'website' ? 'Websites' : 'Mobile Apps'}
            </button>
          ))}
        </div>

        {/* Portfolio Cards Grid */}
        <div className="pprg-portfolio-grid">
          {filteredProjects.map(proj => (
            <div key={proj.id} className="pprg-portfolio-card pprg-glass-panel pprg-reveal-on-scroll">
              <div className="pprg-portfolio-img-container">
                <img src={proj.image} alt={proj.title} />
                <div className="pprg-portfolio-overlay">
                  <span className="pprg-portfolio-tag">{proj.category.replace('-', ' ')}</span>
                </div>
              </div>
              <div className="pprg-portfolio-info">
                <h3>{proj.title}</h3>
                <p>{proj.desc}</p>
                <a href={proj.link} className="pprg-portfolio-link">
                  Learn More <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================---------
         DEVELOPMENT PROCESS TIMELINE
         ========================================= */}
      <section className="pprg-process" id="process">
        <div className="pprg-section-head pprg-reveal-on-scroll">
          <div className="pprg-section-badge">
            <Compass size={14} /> Our Method
          </div>
          <h2 className="pprg-section-title">How We Build Products</h2>
          <p className="pprg-section-sub">A structured, collaborative development cycle from concept to live deployment.</p>
        </div>

        <div className="pprg-timeline" ref={timelineRef}>
          {/* Step 1 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">1</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Discovery</h3>
              <p>We analyze your business, requirements, goals, and target audience to define a technical roadmap.</p>
            </div>
            <div className="pprg-timeline-info">Phase One</div>
          </div>

          {/* Step 2 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">2</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Planning</h3>
              <p>We outline application architecture, database schemas, select the software stacks, and set launch timelines.</p>
            </div>
            <div className="pprg-timeline-info">Phase Two</div>
          </div>

          {/* Step 3 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">3</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Design</h3>
              <p>We construct detailed wireframes and high-fidelity, interactive UI mockups on Figma for customer sign-off.</p>
            </div>
            <div className="pprg-timeline-info">Phase Three</div>
          </div>

          {/* Step 4 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">4</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Development</h3>
              <p>Our developers code the frontend and backend using modern software stacks, keeping code clean and semantic.</p>
            </div>
            <div className="pprg-timeline-info">Phase Four</div>
          </div>

          {/* Step 5 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">5</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Testing</h3>
              <p>We perform rigorous manual and automated unit testing to guarantee fast page speed and zero security holes.</p>
            </div>
            <div className="pprg-timeline-info">Phase Five</div>
          </div>

          {/* Step 6 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">6</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Launch</h3>
              <p>We configure production hosting servers, SSL, custom domain domains, and push the application live.</p>
            </div>
            <div className="pprg-timeline-info">Phase Six</div>
          </div>

          {/* Step 7 */}
          <div className="pprg-timeline-item pprg-reveal-on-scroll">
            <div className="pprg-timeline-badge">7</div>
            <div className="pprg-timeline-card pprg-glass-panel">
              <h3>Ongoing Support</h3>
              <p>We provide standard security updates, monthly performance checkups, and scaling adjustments as your database grows.</p>
            </div>
            <div className="pprg-timeline-info">Continuous</div>
          </div>
        </div>
      </section>

      {/* =================================---------
         WHY CHOOSE US SECTION
         ========================================= */}
      <section className="pprg-why" id="why">
        <div className="pprg-section-head pprg-reveal-on-scroll">
          <div className="pprg-section-badge">
            <Activity size={14} /> Value Proposition
          </div>
          <h2 className="pprg-section-title">Why Businesses Partner With Us</h2>
          <p className="pprg-section-sub">We build products tailored to increase metrics, sales, and administrative efficiency.</p>
        </div>

        <div className="pprg-why-grid">
          {[
            { t: 'Experienced Development Team', d: 'Founded by tech professionals with extensive fullstack software architecture experience.', i: <Laptop size={20} /> },
            { t: 'Modern Technology Stack', d: 'We use React, Next.js, Laravel, Node.js, and Flutter to guarantee your apps are secure and load instantly.', i: <Code size={20} /> },
            { t: 'Transparent Communication', d: 'Stay updated at every stage with structured dashboard task listings and direct Slack/WhatsApp channels.', i: <MessageSquare size={20} /> },
            { t: 'Affordable Custom Solutions', d: 'High-quality software architecture custom-built within standard budgets without licensing traps.', i: <Award size={20} /> },
            { t: 'Ongoing Technical Support', d: 'We do not leave after launch. Enjoy dedicated maintenance checkups and version upgrades.', i: <Cpu size={20} /> },
            { t: 'Business-Oriented Approach', d: 'We do not just write code. We study your sales pipeline to design systems that maximize business growth.', i: <Activity size={20} /> }
          ].map((val, idx) => (
            <div key={idx} className="pprg-why-card pprg-glass-panel pprg-reveal-on-scroll">
              <div className="pprg-why-icon-wrap">
                {val.i}
              </div>
              <div className="pprg-why-info">
                <h3>{val.t}</h3>
                <p>{val.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================---------
         TECHNOLOGY STACK MARQUEE
         ========================================= */}
      <section className="pprg-tech">
        <div className="pprg-section-head pprg-reveal-on-scroll" style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Our Technology Ecosystem</h2>
        </div>
        <div className="pprg-marquee">
          <div className="pprg-marquee-inner">
            {/* Displaying double for infinite marquee scrolling effect */}
            {[...TECHS, ...TECHS].map((tech, idx) => (
              <div key={idx} className="pprg-tech-logo">
                {tech.icon}
                <span>{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================================---------
         TESTIMONIALS SECTION
         ========================================= */}
      <section className="pprg-testimonials" id="testimonials">
        <div className="pprg-section-head pprg-reveal-on-scroll">
          <div className="pprg-section-badge">
            <Heart size={14} /> Reviews
          </div>
          <h2 className="pprg-section-title">Client Success Stories</h2>
        </div>

        <div className="pprg-test-slider pprg-glass-panel pprg-reveal-on-scroll">
          <div className="pprg-test-slide">
            <div className="pprg-quote-icon">“</div>
            <p className="pprg-test-quote">{TESTIMONIALS[currentSlide].quote}</p>
            <div className="pprg-test-author">
              <span className="pprg-author-name">{TESTIMONIALS[currentSlide].author}</span>
              <span className="pprg-author-title">{TESTIMONIALS[currentSlide].title}</span>
            </div>
          </div>
        </div>

        <div className="pprg-test-dots">
          {TESTIMONIALS.map((_, idx) => (
            <button 
              key={idx} 
              className={`pprg-test-dot ${currentSlide === idx ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            />
          ))}
        </div>
      </section>

      {/* =================================---------
         CONTACT FORM SECTION
         ========================================= */}
      <section className="pprg-contact" id="contact">
        <div className="pprg-contact-grid">
          <div className="pprg-contact-details pprg-reveal-on-scroll">
            <div className="pprg-section-badge">
              <MessageSquare size={14} /> Get in Touch
            </div>
            <h3>Let's Build Something Amazing Together</h3>
            <p>Have an idea or a requirement? Send us your message or schedule a WhatsApp text conversation directly with our engineers. We respond within 12 hours.</p>
            
            <div className="pprg-contact-methods">
              <a href="https://wa.me/919014842370" target="_blank" rel="noopener noreferrer" className="pprg-contact-item pprg-glass-panel">
                <Phone size={20} color="#10b981" />
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>Chat on WhatsApp</h4>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--ppr-text-slate)', fontSize: '0.8rem' }}>+91 9014842370 (Instant Response)</p>
                </div>
              </a>
              <a href="mailto:info@ppreducation.com" className="pprg-contact-item pprg-glass-panel">
                <Mail size={20} color="#3b82f6" />
                <div>
                  <h4 style={{ margin: 0, fontWeight: 800 }}>Email Direct</h4>
                  <p style={{ margin: '0.2rem 0 0', color: 'var(--ppr-text-slate)', fontSize: '0.8rem' }}>info@ppreducation.com</p>
                </div>
              </a>
            </div>
          </div>

          <div className="pprg-contact-form pprg-glass-panel pprg-reveal-on-scroll">
            <h3>Start Your Project</h3>
            <form onSubmit={handleInquirySubmit} className="pprg-form-grid">
              <div className="pprg-form-group">
                <label>Your Name *</label>
                <input 
                  type="text" 
                  name="name" 
                  className="pprg-form-input" 
                  placeholder="e.g. Rahul Sharma" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="pprg-form-group">
                <label>Email Address *</label>
                <input 
                  type="email" 
                  name="email" 
                  className="pprg-form-input" 
                  placeholder="e.g. rahul@company.com" 
                  value={form.email} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="pprg-form-group">
                <label>Phone Number *</label>
                <input 
                  type="tel" 
                  name="phone" 
                  className="pprg-form-input" 
                  placeholder="e.g. +91 9876543210" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              <div className="pprg-form-group">
                <label>Company / Institution</label>
                <input 
                  type="text" 
                  name="company" 
                  className="pprg-form-input" 
                  placeholder="e.g. Nexa Retail" 
                  value={form.company} 
                  onChange={handleChange} 
                />
              </div>
              <div className="pprg-form-group pprg-full-width">
                <label>Select Required Service</label>
                <select 
                  name="service" 
                  className="pprg-form-input" 
                  style={{ background: '#030712' }}
                  value={form.service} 
                  onChange={handleChange}
                >
                  <option value="website">Website Development</option>
                  <option value="web-app">Web Application (CRM/ERP/Database)</option>
                  <option value="mobile-app">Mobile Application (iOS/Android)</option>
                  <option value="uiux">UI/UX Layout Design</option>
                  <option value="automation">Process Automation & AI Integration</option>
                </select>
              </div>
              <div className="pprg-form-group pprg-full-width">
                <label>Tell Us About Your Project</label>
                <textarea 
                  name="msg" 
                  className="pprg-form-textarea" 
                  placeholder="Briefly describe your requirements or ideas..."
                  value={form.msg} 
                  onChange={handleChange}
                />
              </div>
              <div className="pprg-full-width">
                <button type="submit" className="pprg-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Submitting Form...' : <><Zap size={16} /> Send Inquiry & Connect on WhatsApp</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
