import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Star, Users, ArrowRight, Zap, Award, ShieldCheck } from 'lucide-react';
import './Courses.css';

const MOCK_COURSES = [
  {
    id: 'neet-organic-chemistry',
    title: 'NEET Organic Chemistry Masterclass',
    tutor: 'Dr. Aryan Sharma',
    subject: 'Chemistry',
    category: 'Medical',
    price: 1499,
    originalPrice: 2999,
    rating: 4.9,
    students: 1248,
    image: 'https://images.unsplash.com/photo-1532187875605-2fe3587b1c0d?auto=format&fit=crop&q=80&w=800',
    tag: 'Top Seller'
  },
  {
    id: 'jee-physics-visualized',
    title: 'JEE Physics: Electromagnetism Visualized',
    tutor: 'Er. S.K. Singh',
    subject: 'Physics',
    category: 'Engineering',
    price: 1299,
    originalPrice: 2499,
    rating: 4.8,
    students: 850,
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
    tag: 'Trending'
  },
  {
    id: 'neet-biology-bullet',
    title: 'Biology Bullet: Complete Human Physiology',
    tutor: 'Dr. Neha Verma',
    subject: 'Biology',
    category: 'Medical',
    price: 999,
    originalPrice: 1999,
    rating: 4.9,
    students: 2100,
    image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=800',
    tag: 'Elite Choice'
  }
];

export default function Courses() {
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
            {MOCK_COURSES.map((course, idx) => (
              <Link 
                to={`/course/${course.id}`} 
                key={course.id} 
                className="course-card-premium animate-reveal" 
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="card-image-wrap">
                  <img src={course.image} alt={course.title} />
                  <div className="card-tag">{course.tag}</div>
                  <div className="card-overlay">
                    <span className="view-details">Explore Curriculum <ArrowRight size={16} /></span>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="card-meta">
                    <span className={`cat-pill ${course.category.toLowerCase()}`}>{course.category}</span>
                    <div className="rating">
                      <Star size={12} fill="#FFD700" stroke="#FFD700" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="course-title">{course.title}</h3>
                  
                  <div className="tutor-info">
                    <ShieldCheck size={14} className="text-blue-400" />
                    <span>{course.tutor}</span>
                  </div>
                  
                  <div className="card-footer">
                    <div className="price-box">
                      <span className="cur-price">₹{course.price}</span>
                      <span className="old-price">₹{course.originalPrice}</span>
                    </div>
                    <div className="student-count">
                      <Users size={14} />
                      <span>{course.students.toLocaleString()}</span>
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
            <div className="flex items-center gap-6">
              <div className="trust-icon-wrap"><Zap size={24} color="#FFD700" /></div>
              <div className="text-left">
                <h4 className="font-bold">Instant Learning</h4>
                <p className="text-muted text-sm">Access your materials immediately after verification.</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
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
