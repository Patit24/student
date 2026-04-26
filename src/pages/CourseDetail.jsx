import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, Star, ShieldCheck, Clock, Users, 
  BookOpen, FileText, CheckCircle, ArrowRight,
  ShieldAlert, Award, Play, Download, MessageCircle,
  ExternalLink, ChevronDown, ChevronUp, Zap
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { doc, getDoc, collection, onSnapshot, query, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { recordCourseSale, submitCourseExamResult } from '../db.service';
import { useAppContext } from '../context/AuthContext';
import './CourseDetail.css';

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAppContext();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeAccordion, setActiveAccordion] = useState(0);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeExam, setActiveExam] = useState(null); // module for exam
  const [userAnswers, setUserAnswers] = useState({});
  const [examResult, setExamResult] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  // Handle Scroll for Sticky Header
  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // In a real app, fetch from Firestore. For now, we'll use a high-fidelity mock
    // to show off the "NEET Organic Chemistry Masterclass" design.
    const fetchCourse = async () => {
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Course not found");
        }
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load course details");
        setLoading(false);
      }
    };
    fetchCourse();

    // Check enrollment
    if (currentUser) {
      const q = query(collection(db, 'users', currentUser.uid, 'enrolled_courses'));
      const unsub = onSnapshot(q, snap => {
        const enrolled = snap.docs.some(d => d.id === courseId);
        setIsEnrolled(enrolled);
      });
      return unsub;
    }
  }, [courseId, currentUser]);

  const handlePurchase = async () => {
    if (!currentUser) {
      toast.info("Please login to enroll in this course");
      return navigate('/login');
    }

    if (currentUser.role !== 'student') {
      return toast.error("Only student accounts can enroll in courses");
    }

    // Razorpay Integration
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: 'rzp_test_YourKeyHere', // Replace with your key
        amount: course.price * 100, // in paise
        currency: 'INR',
        name: 'PPREducation',
        description: course.title,
        handler: async function(response) {
          try {
            await recordCourseSale(
              currentUser.uid,
              course.id,
              course.price,
              course.tutorId
            );
            toast.success("Enrollment Successful! Welcome to the Elite Masterclass 🚀");
            navigate('/student');
          } catch (err) {
            toast.error("Enrollment error: " + err.message);
          }
        },
        prefill: {
          name: currentUser.name,
          contact: currentUser.phone
        },
        theme: { color: '#FFD700' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };
    document.body.appendChild(script);
  };

  const handleStartExam = (module) => {
    if (!isEnrolled) return toast.info("Please enroll to attend exams!");
    setActiveExam(module);
    setUserAnswers({});
    setExamResult(null);
  };

  const submitExam = async () => {
    let score = 0;
    activeExam.exam.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct) score++;
    });

    const result = {
      score,
      total: activeExam.exam.questions.length,
      percentage: (score / activeExam.exam.questions.length) * 100
    };

    setExamResult(result);

    try {
      await submitCourseExamResult(
        currentUser.uid,
        course.id,
        activeExam.title,
        activeExam.title, // using title as pseudo-id for simplicity
        result
      );
      toast.success("Assessment submitted! 🎓");
    } catch (err) {
      toast.error("Result save error: " + err.message);
    }
  };

  if (loading) return (
    <div className="course-loading">
      <div className="loader-ring"></div>
      <p>Loading Elite Curriculum...</p>
    </div>
  );

  if (!course) return <div className="p-20 text-center">Course not found.</div>;

  return (
    <div className="course-page-root">
      
      {/* Dynamic Sticky Mini Header */}
      <div className={`sticky-nav ${isHeaderSticky ? 'visible' : ''}`}>
        <div className="container flex justify-between items-center h-full">
          <div className="flex items-center gap-4">
            <span className="sticky-title">{course.title}</span>
            <div className="sticky-price-tag">₹{course.price}</div>
          </div>
          <button className="buy-now-btn-sm" onClick={() => navigate('/signup')}>
            Enroll Now <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="course-hero">
        <div className="container">
          <nav className="breadcrumbs animate-reveal">
            <Link to="/">Home</Link> <ChevronRight size={12} />
            <Link to="/courses">{course.category}</Link> <ChevronRight size={12} />
            <span>{course.subject}</span>
          </nav>

          <div className="hero-grid mt-8">
            <div className="hero-content animate-reveal" style={{ animationDelay: '0.1s' }}>
              <div className="hero-badges">
                <span className="badge-top-seller"><Award size={14} /> {course.tag}</span>
                <span className="badge-verified"><ShieldCheck size={14} /> Verified Tutor</span>
              </div>
              
              <h1 className="course-main-title">{course.title}</h1>
              
              <div className="course-meta-row">
                <div className="tutor-mini-profile">
                  <img src={course.tutorAvatar || `https://ui-avatars.com/api/?name=${course.tutorName}&background=FFD700&color=000&bold=true`} alt={course.tutorName} />
                  <div>
                    <span className="tutor-label">Instructor</span>
                    <span className="tutor-name">{course.tutorName} <CheckCircle size={12} className="text-blue-500 inline" /></span>
                  </div>
                </div>
                <div className="meta-divider" />
                <div className="rating-block">
                  <div className="stars">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} fill={s <= (course.rating || 4.9) ? "#FFD700" : "none"} stroke="#FFD700" />)}
                    <span className="rating-val">{course.rating || 4.9}</span>
                  </div>
                  <span className="review-count">({course.reviewCount || 10}+ reviews)</span>
                </div>
                <div className="meta-divider" />
                <div className="social-proof">
                  <Users size={16} /> <span>{(course.sales_count || 0).toLocaleString()}+ Aspirants Joined</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative Background Elements */}
        <div className="hero-bg-accent" />
      </section>

      {/* Main Content & Sticky Sidebar Container */}
      <div className="container main-layout-grid">
        
        {/* Left Column: Course Details */}
        <div className="course-details-column">
          
          {/* Section: Master Grid */}
          <section className="modular-section animate-reveal" style={{ animationDelay: '0.2s' }}>
            <h2 className="section-title">What you will Master</h2>
            <div className="offerings-grid">
              {(course.offerings || [
                { title: "Weekly Mock Exams", desc: "NTA-pattern tests with detailed PDF solutions.", icon: <FileText /> },
                { title: "Last Minute Suggestions", desc: "High-yield topics curated by top tutors.", icon: <Zap /> },
                { title: "Personal Mentorship", desc: "Direct connection to tutor after verification.", icon: <MessageCircle /> }
              ]).map((off, i) => (
                <div key={i} className="offering-card glass-card">
                  <div className="offering-icon">{off.icon}</div>
                  <h3>{off.title}</h3>
                  <p>{off.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Curriculum (Accordion Style) */}
          <section className="modular-section animate-reveal" style={{ animationDelay: '0.3s' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="section-title">Course Content</h2>
              <span className="text-muted text-sm">{course.curriculum.length} Modules • {course.curriculum.reduce((acc, c) => acc + c.items.length, 0)} Materials</span>
            </div>
            
            <div className="curriculum-accordion">
              {course.curriculum.map((module, idx) => (
                <div key={idx} className={`accordion-item ${activeAccordion === idx ? 'active' : ''}`}>
                  <button className="accordion-trigger" onClick={() => setActiveAccordion(activeAccordion === idx ? -1 : idx)}>
                    <div className="flex items-center gap-4">
                      <div className="module-number">0{idx + 1}</div>
                      <span className="module-title">{module.title}</span>
                    </div>
                    {activeAccordion === idx ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                  <div className="accordion-content">
                    {module.items.map((item, i) => (
                      <div key={i} className="content-item">
                        <div className="flex items-center gap-3">
                          <BookOpen size={16} className="text-muted" />
                          <span>{item}</span>
                        </div>
                      </div>
                    ))}
                    <div className="module-actions flex gap-2 mt-4">
                      {module.pdfUrl && (
                        <a 
                          href={isEnrolled ? module.pdfUrl : '#'} 
                          target={isEnrolled ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isEnrolled ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-white/5 border border-white/5 text-muted cursor-not-allowed'}`}
                          onClick={(e) => {
                            if (!isEnrolled) {
                              e.preventDefault();
                              toast.info("Please enroll to download premium study materials! 🔒");
                            }
                          }}
                        >
                          <Download size={14} /> {isEnrolled ? 'Download Study Material' : 'Module PDF Locked'}
                        </a>
                      )}
                      {module.exam && (
                        <button 
                          className="flex-1 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-500 text-xs font-bold hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-2"
                          onClick={() => handleStartExam(module)}
                        >
                          <Zap size={14} /> Attend Module Assessment
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Tutor Bio */}
          <section className="modular-section animate-reveal" style={{ animationDelay: '0.4s' }}>
            <h2 className="section-title">About the Instructor</h2>
            <div className="tutor-bio-card glass-card">
              <div className="flex gap-6 mobile-stack">
                <img src={course.tutorAvatar} className="bio-avatar" alt="" />
                <div>
                  <h3 className="bio-name">{course.tutorName}</h3>
                  <p className="bio-role">{course.tutorRole}</p>
                  <div className="bio-stats">
                    <div className="bio-stat"><strong>4.9</strong> Instructor Rating</div>
                    <div className="bio-stat"><strong>15+</strong> Years Exp.</div>
                    <div className="bio-stat"><strong>50k+</strong> Students Taught</div>
                  </div>
                  <p className="bio-text">
                    Specializing in high-yield Organic Chemistry logic for NEET & JEE. Known for simplifying complex 
                    Reaction Mechanisms into logical flowcharts that ensure zero-error in the actual exam.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Sidebar */}
        <aside className="course-sidebar">
          <div className="sticky-card-wrapper animate-reveal" style={{ animationDelay: '0.2s' }}>
            <div className="enroll-card glass-card">
              <div className="price-section">
                <div className="current-price">₹{course.price}</div>
                <div className="original-price">₹{course.originalPrice}</div>
                <div className="discount-pill">50% OFF</div>
              </div>
              
              <div className="urgency-banner">
                <Clock size={16} /> <span>Offer ends in 12 hours!</span>
              </div>

              <button className="enroll-now-btn" onClick={handlePurchase}>
                Enroll Now <ArrowRight size={20} />
              </button>

              <p className="card-guarantee">
                <ShieldCheck size={14} className="text-green-500" />
                30-Minute Verification Guarantee
              </p>

              <div className="divider" />

              <div className="course-includes">
                <h4 className="includes-title">This course includes:</h4>
                <ul className="includes-list">
                  <li><FileText size={16} /> Full Lifetime Access</li>
                  <li><Download size={16} /> 45+ Downloadable Resources</li>
                  <li><Award size={16} /> Certificate of Completion</li>
                  <li><Zap size={16} /> Direct Tutor Feedback</li>
                </ul>
              </div>

              <div className="admin-promise-box">
                <ShieldAlert size={18} color="#FFD700" />
                <div>
                  <strong>Admin Promise</strong>
                  <p>Your transaction is verified manually by our Super Admin within 30 minutes for 100% security.</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>

      {/* Trust Footer */}
      <footer className="course-footer">
        <div className="container flex-col items-center text-center">
          <div className="pulse-indicator">
            <div className="pulse-dot"></div>
            <span>Super Admin Online: Average Verification 14 mins</span>
          </div>
          <div className="footer-links mt-6">
            <span>© 2026 PPREducation · Antigravity Elite Series</span>
          </div>
        </div>
      </footer>

      {/* Assessment Modal */}
      {activeExam && (
        <div className="verification-overlay animate-reveal" style={{ zIndex: 1100 }}>
          <div className="glass-card verification-card" style={{ maxWidth: '800px', padding: '3rem' }}>
            <button className="close-modal" onClick={() => setActiveExam(null)}><XCircle /></button>
            <h2 className="cinematic-title mb-2">Module Assessment</h2>
            <p className="text-muted mb-8">Subject: <span className="text-yellow-500 font-bold">{activeExam.title}</span></p>

            {!examResult ? (
              <div className="flex-col gap-8 overflow-y-auto pr-2" style={{ maxHeight: '500px' }}>
                {activeExam.exam.questions.map((q, idx) => (
                  <div key={idx} className="glass-panel p-8 bg-white/5 border border-white/10 rounded-2xl">
                    <h3 className="text-lg font-bold mb-6 flex gap-4">
                      <span className="text-yellow-500">Q{idx + 1}.</span> {q.question}
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {q.options.map((opt, oIdx) => (
                        <button 
                          key={oIdx}
                          className={`w-full p-4 rounded-xl text-left transition-all border ${userAnswers[idx] === oIdx ? 'bg-yellow-500 border-yellow-500 text-black font-bold' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                          onClick={() => setUserAnswers({...userAnswers, [idx]: oIdx})}
                        >
                          <span className="opacity-50 mr-3">{String.fromCharCode(65 + oIdx)}.</span> {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button className="hp-btn-primary w-full py-4 mt-4" onClick={submitExam}>
                  Submit Assessment
                </button>
              </div>
            ) : (
              <div className="text-center py-10 animate-premium">
                <div className="w-24 h-24 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
                  <Award className="text-yellow-500" size={48} />
                </div>
                <h3 className="text-3xl font-black mb-2">Result: {examResult.score}/{examResult.total}</h3>
                <p className="text-muted mb-8">You achieved a score of {examResult.percentage}% in this module.</p>
                <div className="flex gap-4">
                  <button className="hp-btn-primary flex-1 py-4" onClick={() => setActiveExam(null)}>Finish & Back to Course</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
