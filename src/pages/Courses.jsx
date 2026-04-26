import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Users, ArrowRight, Zap, Award, ShieldCheck } from 'lucide-react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './Courses.css';

const MOCK_COURSES = []; // Cleared for real-time data

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'courses'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, snap => {
      setCourses(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return (
    <div className="p-20 text-center animate-pulse">
      <h2 className="text-2xl font-bold text-yellow-500">Syncing Elite Marketplace...</h2>
    </div>
  );

  return (
    <div className="courses-gallery-root">
      {/* Header Section */}
      <section className="gallery-header">
        <div className="container">
          <div className="header-content animate-reveal">
            <div className="badge-elite"><Award size={14} /> Antigravity Elite Series</div>
            <h1>Premium <span className="gold-text">Masterclasses</span></h1>
            <p>Elevate your preparation with high-yield courses curated by the country's top educators.</p>
          </div>
        </div>
      </section>

      {/* Course Grid */}
      <section className="gallery-grid-section">
        <div className="container">
          <div className="courses-grid">
            {courses.map((course, idx) => (
              <Link 
                to={`/course/${course.id}`} 
                key={course.id} 
                className="course-card-premium animate-reveal" 
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="card-image-wrap">
                  <img src={course.image || 'https://images.unsplash.com/photo-1532187875605-2fe3587b1c0d?auto=format&fit=crop&q=80&w=800'} alt={course.title} />
                  <div className="card-tag">{course.tag}</div>
                  <div className="card-overlay">
                    <span className="view-details">Explore Curriculum <ArrowRight size={16} /></span>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`cat-pill ${course.category?.toLowerCase() || 'general'}`}>{course.category}</span>
                    <div className="rating">
                      <Star size={12} fill="#FFD700" stroke="#FFD700" />
                      <span>{course.rating || 4.9}</span>
                    </div>
                  </div>
                  
                  <h3 className="course-title">{course.title}</h3>
                  
                  <div className="tutor-info">
                    <ShieldCheck size={14} className="text-blue-400" />
                    <span>{course.tutorName || 'Elite Faculty'}</span>
                  </div>
                  
                  <div className="card-footer">
                    <div className="price-box">
                      <span className="cur-price">₹{course.price}</span>
                      <span className="old-price">₹{course.originalPrice}</span>
                    </div>
                    <div className="student-count">
                      <Users size={14} />
                      <span>{(course.sales_count || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="gallery-trust">
        <div className="container">
          <div className="glass-panel trust-box flex items-center justify-between mobile-stack gap-8">
            <div className="flex items-center gap-10">
              <div className="trust-icon-wrap"><Zap size={24} color="#FFD700" /></div>
              <div className="text-left">
                <h4 className="font-bold">Instant Learning</h4>
                <p className="text-muted text-sm">Access your materials immediately after verification.</p>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <div className="trust-icon-wrap"><Award size={24} color="#FFD700" /></div>
              <div className="text-left">
                <h4 className="font-bold">Verified Content</h4>
                <p className="text-muted text-sm">Every module is audited for NTA pattern accuracy.</p>
              </div>
            </div>
            <Link to="/signup" className="hp-btn-primary">Get Started Now</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
