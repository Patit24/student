import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  MapPin, Star, CheckCircle, GraduationCap, 
  BookOpen, Clock, Calendar, Video, 
  MessageSquare, Phone, Map, Globe,
  Award, Heart, Share2, Play
} from 'lucide-react';
import './TutorProfile.css';

export default function TutorProfile() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { mockTutors, mockReviews, setMockLeads } = useAppContext();
  const toast = useToast();

  const tutor = mockTutors.find(t => t.id === id);
  const reviews = mockReviews.filter(r => r.tutor_id === id);

  const [activeLeadTab, setActiveLeadTab] = useState(searchParams.get('action') === 'demo' ? 'demo' : 'callback');
  
  // Lead Form State
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    class: '',
    message: ''
  });

  if (!tutor) {
    return (
      <div className="container" style={{ padding: '5rem 0', text_align: 'center' }}>
        <h2>Tutor Not Found</h2>
        <button className="btn btn-primary mt-4" onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    const newLead = {
      id: `lead-${Date.now()}`,
      tutor_id: tutor.id,
      student_name: leadForm.name,
      email: leadForm.email,
      phone: leadForm.phone,
      subject: leadForm.subject,
      class: leadForm.class,
      message: leadForm.message,
      type: activeLeadTab,
      status: 'new',
      created_at: new Date().toISOString()
    };
    
    setMockLeads(prev => [...prev, newLead]);
    toast.success(activeLeadTab === 'demo' ? 'Demo class requested! The tutor will contact you shortly.' : 'Call back requested! Expected response within 24 hours.');
    setLeadForm({ name: '', email: '', phone: '', subject: '', class: '', message: '' });
  };

  return (
    <div className="container profile-root animate-fade-in">
      <div className="profile-layout">
        
        {/* Main Content */}
        <div className="profile-main">
          
          <div className="profile-main-card">
            <div className="profile-header-row">
              <img 
                src={tutor.photoURL || tutor.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.name)}&background=random&size=300`} 
                className="profile-avatar" 
                alt={tutor.name} 
              />
              <div className="profile-title-info">
                <div className="profile-badges mb-2">
                  {tutor.is_verified && (
                    <div className="badge-item badge-verified">
                      <CheckCircle size={14} /> Verified Tutor
                    </div>
                  )}
                  <div className="badge-item badge-rating">
                    <Star size={14} fill="#F5C518" /> {tutor.rating} ({tutor.review_count} Reviews)
                  </div>
                </div>
                <h1>{tutor.name}</h1>
                <p className="profile-tagline">
                  {tutor.highest_qualification || tutor.qualifications} · {tutor.experience || 'Experienced'} Tutor
                </p>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={16} /> {tutor.location?.area}, {tutor.location?.city}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Globe size={16} /> {tutor.teaching_mode === 'both' ? 'Online & Home Tuition' : tutor.teaching_mode.charAt(0).toUpperCase() + tutor.teaching_mode.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3><BookOpen size={20} color="var(--primary)" /> About the Tutor</h3>
              <p style={{ lineHeight: '1.7', color: 'var(--text-muted)' }}>{tutor.bio}</p>
            </div>

            <div className="profile-section">
              <h3><Award size={20} color="var(--primary)" /> Academic Details</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Subjects</span>
                  <span className="info-value">{tutor.subjects?.join(', ')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Specialization</span>
                  <span className="info-value">{tutor.specialization || tutor.highest_qualification || tutor.subjects?.[0]}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Experience</span>
                  <span className="info-value">{tutor.experience || 'Not Specified'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Mode</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>{tutor.teaching_mode}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Highest Qualification</span>
                  <span className="info-value">{tutor.highest_qualification || tutor.qualifications}</span>
                </div>
              </div>
            </div>

            {(tutor.intro_video || tutor.intro_video_url) && (
              <div className="profile-section">
                <h3><Video size={20} color="var(--primary)" /> Intro Video</h3>
                <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                  <iframe 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    src={(tutor.intro_video || tutor.intro_video_url).replace('watch?v=', 'embed/').split('&')[0]} 
                    title="Intro Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}

            {tutor.certificates?.length > 0 && (
              <div className="profile-section">
                <h3><Award size={20} color="#F5C518" /> Certificates & Awards</h3>
                <div className="certificates-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                  {tutor.certificates.map((cert, idx) => (
                    <div key={idx} className="cert-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
                      {cert.url && (
                        <div style={{ height: '120px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <img src={cert.url} alt={cert.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div className="p-3">
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{cert.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="profile-section">
              <h3><Star size={20} color="#F5C518" /> Student Reviews</h3>
              <div className="reviews-container">
                {reviews.length > 0 ? (
                  reviews.map(rev => (
                    <div key={rev.id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-name">{rev.student_name}</div>
                        <div className="review-date">{rev.date}</div>
                      </div>
                      <div className="tutor-rating mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? "#F5C518" : "none"} color={i < rev.rating ? "#F5C518" : "#4A5568"} />
                        ))}
                      </div>
                      <p className="review-text">"{rev.comment}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar / Lead Capture */}
        <aside className="profile-sidebar">
          <div className="lead-capture-card">
            <div className="lead-tabs">
              <div 
                className={`lead-tab ${activeLeadTab === 'callback' ? 'active' : ''}`}
                onClick={() => setActiveLeadTab('callback')}
              >
                Request Callback
              </div>
              <div 
                className={`lead-tab ${activeLeadTab === 'demo' ? 'active' : ''}`}
                onClick={() => setActiveLeadTab('demo')}
              >
                Book Free Demo
              </div>
            </div>

            <form className="lead-form" onSubmit={handleLeadSubmit}>
              <div className="input-group">
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Your Name" 
                  required 
                  value={leadForm.name}
                  onChange={(e) => setLeadForm({...leadForm, name: e.target.value})}
                />
              </div>
              <div className="input-group">
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="Email Address" 
                  required 
                  value={leadForm.email}
                  onChange={(e) => setLeadForm({...leadForm, email: e.target.value})}
                />
              </div>
              <div className="input-group">
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="Phone Number" 
                  required 
                  value={leadForm.phone}
                  onChange={(e) => setLeadForm({...leadForm, phone: e.target.value})}
                />
              </div>
              <div className="flex gap-2">
                <select 
                  className="input-field" 
                  style={{ flex: 1 }}
                  required
                  value={leadForm.subject}
                  onChange={(e) => setLeadForm({...leadForm, subject: e.target.value})}
                >
                  <option value="">Subject</option>
                  {tutor.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                  className="input-field" 
                  style={{ flex: 1 }}
                  required
                  value={leadForm.class}
                  onChange={(e) => setLeadForm({...leadForm, class: e.target.value})}
                >
                  <option value="">Class</option>
                  {tutor.classes?.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea 
                className="input-field" 
                placeholder="Any special requirements?" 
                rows="3"
                style={{ resize: 'none' }}
                value={leadForm.message}
                onChange={(e) => setLeadForm({...leadForm, message: e.target.value})}
              ></textarea>
              
              <button type="submit" className="btn btn-primary w-full">
                {activeLeadTab === 'demo' ? 'Confirm Demo Booking' : 'Request a Callback'}
              </button>
            </form>

            <a 
              href={`https://wa.me/91${tutor.phone || '9876543210'}?text=Hi%20${tutor.name},%20I%20found%20your%20profile%20on%20Antigravity%20Tuition%20and%20am%20interested%20in%20classes.`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="whatsapp-cta"
            >
              <MessageSquare size={18} /> Chat on WhatsApp
            </a>

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Response time: <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Usually within 4 hours</span>
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 mt-6">
            <h4 className="mb-3 flex items-center gap-2"><Map size={18} /> Location</h4>
            <div style={{ 
              width: '100%', 
              height: '150px', 
              background: '#2D3748', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}>
              <Map size={32} style={{ opacity: 0.2 }} />
              <div style={{ position: 'absolute' }}>Map Integration (G-Maps)</div>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              {tutor.location?.area}, {tutor.location?.city} - {tutor.location?.pincode}
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
