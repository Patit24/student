import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { 
  User, Briefcase, Award, Heart, Layout, Download, 
  Crown, Save, Trash2, Plus, ArrowLeft, ArrowRight,
  Phone, Mail, MapPin, Globe, CheckCircle, Lock, Camera, Printer
} from 'lucide-react';
import { rtdb, storage } from '../firebase';
import { ref, set, push, onValue } from 'firebase/database';
import FileUploadVercel from '../components/FileUploadVercel';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const cleanApiUrl = API_BASE_URL.replace(/\/$/, "");

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// --- TEMPLATES ---
const ResumePreview = ({ data, templateId }) => {
  const { 
    personal = {}, 
    experience = [], 
    education = [], 
    skills = [], 
    hobbies = [] 
  } = data;

  const getTemplateStyle = () => {
    switch(templateId) {
      case 'premium-executive': return 'premium-executive';
      case 'premium-creative': return 'premium-creative';
      case 'free-minimal': return 'free-minimal';
      case 'free-modern': return 'free-modern';
      default: return 'free-minimal';
    }
  };

  return (
    <div className={`resume-paper ${getTemplateStyle()}`} id="resume-to-print">
      {/* Dynamic Template Rendering based on templateId */}
      {templateId.startsWith('premium') ? (
        <div className="resume-grid">
          <div className="resume-sidebar">
            {personal.photo && <img src={personal.photo} className="resume-photo" alt="Profile" />}
            <section className="resume-section">
              <h3>Contact</h3>
              <p><Mail size={12}/> {personal.email}</p>
              <p><Phone size={12}/> {personal.phone}</p>
              <p><MapPin size={12}/> {personal.address}</p>
            </section>
            <section className="resume-section">
              <h3>Skills</h3>
              <div className="skill-tags">
                {skills.map((s, i) => <span key={i}>{s}</span>)}
              </div>
            </section>
          </div>
          <div className="resume-main">
            <header className="resume-header">
              <h1>{personal.name}</h1>
              <p className="resume-tagline">{personal.tagline || 'Professional'}</p>
            </header>
            <section className="resume-section">
              <h3>Work Experience</h3>
              {experience.map((exp, i) => (
                <div key={i} className="resume-item">
                  <h4>{exp.title}</h4>
                  <p className="item-meta">{exp.company} | {exp.duration}</p>
                  <p>{exp.description}</p>
                </div>
              ))}
            </section>
            <section className="resume-section">
              <h3>Education</h3>
              {education.map((edu, i) => (
                <div key={i} className="resume-item">
                  <h4>{edu.degree}</h4>
                  <p className="item-meta">{edu.school} | {edu.year}</p>
                </div>
              ))}
            </section>
          </div>
        </div>
      ) : (
        <div className="resume-standard">
          <header className="resume-header text-center">
            <h1>{personal.name}</h1>
            <div className="flex justify-center gap-4 text-muted" style={{ fontSize: '0.8rem' }}>
              <span>{personal.email}</span>
              <span>{personal.phone}</span>
              <span>{personal.address}</span>
            </div>
          </header>
          <hr />
          <section className="resume-section">
            <h3>Experience</h3>
            {experience.map((exp, i) => (
              <div key={i} className="resume-item">
                <div className="flex justify-between">
                  <h4>{exp.title} @ {exp.company}</h4>
                  <span>{exp.duration}</span>
                </div>
                <p>{exp.description}</p>
              </div>
            ))}
          </section>
          <section className="resume-section">
            <h3>Skills</h3>
            <p>{skills.join(' · ')}</p>
          </section>
        </div>
      )}
    </div>
  );
};

export default function ResumeBuilder() {
  const { currentUser } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templateId, setTemplateId] = useState('free-minimal');
  const [isPremiumPaid, setIsPremiumPaid] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [resumeData, setResumeData] = useState({
    personal: { name: '', email: '', phone: '', address: '', tagline: '', photo: '' },
    experience: [{ title: '', company: '', duration: '', description: '' }],
    education: [{ degree: '', school: '', year: '' }],
    skills: [''],
    hobbies: ['']
  });

  // Load existing resume from Realtime DB
  useEffect(() => {
    if (currentUser) {
      const resumeRef = ref(rtdb, `user_resumes/${currentUser.uid}`);
      onValue(resumeRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setResumeData(data.resume || resumeData);
          setIsPremiumPaid(data.payment_status === 'success');
        }
      });
    }
  }, [currentUser]);

  const handleInputChange = (section, field, value, index = null) => {
    setResumeData(prev => {
      const newData = { ...prev };
      if (index !== null) {
        newData[section][index][field] = value;
      } else if (field === null) { // For simple arrays like skills
        newData[section][index] = value;
      } else {
        newData[section][field] = value;
      }
      return newData;
    });
  };

  const handleArrayUpdate = (section, index, value) => {
    setResumeData(prev => {
      const newData = { ...prev };
      newData[section][index] = value;
      return newData;
    });
  };

  const addItem = (section, template) => {
    setResumeData(prev => ({
      ...prev,
      [section]: [...prev[section], template]
    }));
  };

  const removeItem = (section, index) => {
    if (resumeData[section].length > 1) {
      setResumeData(prev => ({
        ...prev,
        [section]: prev[section].filter((_, i) => i !== index)
      }));
    }
  };

  const handleSave = async () => {
    if (!currentUser) return toast.error('Please login to save');
    try {
      await set(ref(rtdb, `user_resumes/${currentUser.uid}`), {
        resume: resumeData,
        updated_at: new Date().toISOString(),
        payment_status: isPremiumPaid ? 'success' : 'pending'
      });
      toast.success('Resume Saved! ✅');
    } catch (err) {
      toast.error('Failed to save');
    }
  };

  const handlePayment = async () => {
    if (!currentUser) return toast.error('Please login to continue');
    
    const sdkLoaded = await loadRazorpay();
    if (!sdkLoaded) return toast.error('Razorpay failed to load');

    try {
      const res = await fetch(`${cleanApiUrl}/api/resume/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUser.uid }),
      });

      if (!res.ok) throw new Error('Could not create order');
      const orderData = await res.json();

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: 'INR',
        name: 'Antigravity Resume Builder',
        description: 'Unlock Premium Templates',
        order_id: orderData.order_id,
        handler: async function (response) {
          toast.success('Payment Received! Unlocking theme...');
          setIsPremiumPaid(true);
          // Realtime Database will also be updated by webhook
          await set(ref(rtdb, `user_resumes/${currentUser.uid}/payment_status`), 'success');
        },
        prefill: {
          name: currentUser.name || '',
          email: currentUser.email || '',
        },
        theme: { color: '#4F70E5' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(`Payment error: ${err.message}`);
    }
  };

  const handleExport = () => {
    if (templateId.startsWith('premium') && !isPremiumPaid) {
      return toast.error('Please unlock premium to export this theme');
    }
    window.print();
  };

  return (
    <div className="resume-builder-page">
      <div className="container" style={{ display: 'flex', gap: '2rem', height: 'calc(100vh - 100px)', padding: '2rem' }}>
        
        {/* Editor Sidebar */}
        <div className="glass-panel editor-panel no-print" style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="flex items-center gap-2">
              {step === 1 && <User size={24} />}
              {step === 2 && <Briefcase size={24} />}
              {step === 3 && <Award size={24} />}
              {step === 4 && <Heart size={24} />}
              {step === 5 && <Layout size={24} />}
              Step {step}/5
            </h2>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={handleSave}>
              <Save size={16} /> Save Progress
            </button>
          </div>

          {step === 1 && (
            <div className="animate-fade-in">
              <h3>Personal Details</h3>
              <div className="flex-col gap-4 mt-4">
                <div className="mb-4">
                  <FileUploadVercel 
                    uid={currentUser?.uid} 
                    folder="resumes" 
                    onUploadSuccess={(url) => setResumeData(prev => ({ ...prev, personal: { ...prev.personal, photo: url } }))}
                    label="Upload Profile Photo"
                  />
                  {resumeData.personal.photo && (
                    <div className="mt-2 text-center">
                      <img src={resumeData.personal.photo} alt="Preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
                    </div>
                  )}
                </div>
                <input type="text" className="input-field" placeholder="Full Name" value={resumeData.personal.name} onChange={e => handleInputChange('personal', 'name', e.target.value)} />
                <input type="email" className="input-field" placeholder="Email Address" value={resumeData.personal.email} onChange={e => handleInputChange('personal', 'email', e.target.value)} />
                <input type="tel" className="input-field" placeholder="Phone Number" value={resumeData.personal.phone} onChange={e => handleInputChange('personal', 'phone', e.target.value)} />
                <input type="text" className="input-field" placeholder="Address / Location" value={resumeData.personal.address} onChange={e => handleInputChange('personal', 'address', e.target.value)} />
                <input type="text" className="input-field" placeholder="Tagline (e.g. Full Stack Developer)" value={resumeData.personal.tagline} onChange={e => handleInputChange('personal', 'tagline', e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in">
              <h3>Experience</h3>
              {resumeData.experience.map((exp, i) => (
                <div key={i} className="glass-panel p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Job #{i+1}</span>
                    <button className="text-danger" onClick={() => removeItem('experience', i)}><Trash2 size={16}/></button>
                  </div>
                  <input type="text" className="input-field mb-2" placeholder="Title" value={exp.title} onChange={e => handleInputChange('experience', 'title', e.target.value, i)} />
                  <input type="text" className="input-field mb-2" placeholder="Company" value={exp.company} onChange={e => handleInputChange('experience', 'company', e.target.value, i)} />
                  <input type="text" className="input-field mb-2" placeholder="Duration (e.g. 2021 - Present)" value={exp.duration} onChange={e => handleInputChange('experience', 'duration', e.target.value, i)} />
                  <textarea className="input-field" placeholder="Description" rows={3} value={exp.description} onChange={e => handleInputChange('experience', 'description', e.target.value, i)} />
                </div>
              ))}
              <button className="btn btn-outline w-full" onClick={() => addItem('experience', { title: '', company: '', duration: '', description: '' })}>
                <Plus size={16}/> Add Experience
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in">
              <h3>Education</h3>
              {resumeData.education.map((edu, i) => (
                <div key={i} className="glass-panel p-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted">Degree #{i+1}</span>
                    <button className="text-danger" onClick={() => removeItem('education', i)}><Trash2 size={16}/></button>
                  </div>
                  <input type="text" className="input-field mb-2" placeholder="Degree" value={edu.degree} onChange={e => handleInputChange('education', 'degree', e.target.value, i)} />
                  <input type="text" className="input-field mb-2" placeholder="School/University" value={edu.school} onChange={e => handleInputChange('education', 'school', e.target.value, i)} />
                  <input type="text" className="input-field mb-2" placeholder="Year" value={edu.year} onChange={e => handleInputChange('education', 'year', e.target.value, i)} />
                </div>
              ))}
              <button className="btn btn-outline w-full" onClick={() => addItem('education', { degree: '', school: '', year: '' })}>
                <Plus size={16}/> Add Education
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in">
              <h3>Skills & Hobbies</h3>
              <div className="mb-6">
                <label className="text-muted" style={{ fontSize: '0.8rem' }}>Skills (comma separated)</label>
                <input 
                  type="text" 
                  className="input-field mt-1" 
                  placeholder="React, Python, Figma..." 
                  value={resumeData.skills.join(', ')} 
                  onChange={e => setResumeData(prev => ({ ...prev, skills: e.target.value.split(',').map(s => s.trim()) }))}
                />
              </div>
              <div>
                <label className="text-muted" style={{ fontSize: '0.8rem' }}>Hobbies (comma separated)</label>
                <input 
                  type="text" 
                  className="input-field mt-1" 
                  placeholder="Coding, Reading, Traveling..." 
                  value={resumeData.hobbies.join(', ')} 
                  onChange={e => setResumeData(prev => ({ ...prev, hobbies: e.target.value.split(',').map(h => h.trim()) }))}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in">
              <h3>Select Template</h3>
              <div className="template-grid mt-4">
                {[
                  { id: 'free-minimal', name: 'Minimalist', type: 'free' },
                  { id: 'free-modern', name: 'Modern Light', type: 'free' },
                  { id: 'premium-executive', name: 'Executive Pro', type: 'premium' },
                  { id: 'premium-creative', name: 'Creative Bold', type: 'premium' },
                ].map(tmp => (
                  <button 
                    key={tmp.id}
                    className={`template-card ${templateId === tmp.id ? 'active' : ''}`}
                    onClick={() => setTemplateId(tmp.id)}
                  >
                    <div className="template-thumbnail" />
                    <div className="template-info">
                      <span>{tmp.name}</span>
                      {tmp.type === 'premium' && <Crown size={12} color="#F5C518" />}
                    </div>
                  </button>
                ))}
              </div>

              {templateId.startsWith('premium') && !isPremiumPaid && (
                <div className="premium-lock-banner mt-6">
                  <div className="flex items-center gap-3">
                    <Lock size={20} color="#F5C518" />
                    <div>
                      <p style={{ fontWeight: 700, margin: 0 }}>Premium Theme Locked</p>
                      <p style={{ fontSize: '0.75rem', margin: 0 }}>One-time payment of ₹49 to unlock PDF export for this theme.</p>
                    </div>
                  </div>
                  <button className="btn btn-primary mt-4 w-full" onClick={handlePayment}>Unlock Theme (₹49)</button>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            {step > 1 && (
              <button className="btn btn-outline flex-1" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16}/> Back
              </button>
            )}
            {step < 5 ? (
              <button className="btn btn-primary flex-1" onClick={() => setStep(step + 1)}>
                Next <ArrowRight size={16}/>
              </button>
            ) : (
              <button className="btn btn-secondary flex-1" onClick={handleExport}>
                <Printer size={16}/> {templateId.startsWith('premium') && !isPremiumPaid ? 'Locked' : 'Print / Save PDF'}
              </button>
            )}
          </div>
        </div>

        {/* Live Preview Window */}
        <div className="preview-panel no-print" style={{ flex: 1.5, background: '#F8FAFC', borderRadius: 'var(--radius)', overflowY: 'auto', padding: '2rem' }}>
          <div className="preview-header mb-4 flex justify-between items-center">
            <span className="badge">LIVE PREVIEW</span>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>A4 Standard Format</span>
          </div>
          <ResumePreview data={resumeData} templateId={templateId} />
        </div>

      </div>

      <style>{`
        .resume-builder-page {
          background: #07090F;
          min-height: calc(100vh - 73px);
        }
        .photo-upload-box {
          width: 60px; height: 60px;
          border: 2px dashed var(--border);
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; overflow: hidden;
        }
        .photo-upload-box img { width: 100%; height: 100%; object-fit: cover; }
        
        .template-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .template-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.5rem;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
        }
        .template-card.active { border-color: var(--primary); background: rgba(79,70,229,0.1); }
        .template-thumbnail { height: 100px; background: #FFF; border-radius: 8px; margin-bottom: 0.5rem; }
        .template-info { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 600; }
        
        .premium-lock-banner {
          background: rgba(245,197,24,0.05);
          border: 1px solid rgba(245,197,24,0.2);
          border-radius: 16px;
          padding: 1.5rem;
        }

        /* --- RESUME STYLES --- */
        .resume-paper {
          background: white;
          width: 210mm;
          min-height: 297mm;
          padding: 15mm;
          margin: 0 auto;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          color: #333;
          font-family: 'Inter', sans-serif;
          transform: scale(0.65);
          transform-origin: top center;
        }

        .resume-header h1 { font-size: 2rem; font-weight: 800; color: #111; margin-bottom: 0.2rem; }
        .resume-tagline { font-size: 1rem; color: var(--primary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
        
        .resume-section h3 { 
          font-size: 1.1rem; 
          text-transform: uppercase; 
          letter-spacing: 0.1em; 
          color: #666; 
          border-bottom: 2px solid #EEE;
          padding-bottom: 0.5rem;
          margin: 1.5rem 0 1rem;
        }

        .resume-item { margin-bottom: 1.2rem; }
        .resume-item h4 { font-size: 1rem; font-weight: 700; margin-bottom: 0.2rem; }
        .item-meta { font-size: 0.85rem; color: #888; margin-bottom: 0.4rem; }
        .resume-item p { font-size: 0.9rem; line-height: 1.5; color: #444; }

        /* Premium Executive Layout */
        .premium-executive .resume-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; }
        .premium-executive .resume-sidebar { background: #F8FAFC; margin: -15mm 0 -15mm -15mm; padding: 15mm; border-right: 1px solid #E2E8F0; }
        .premium-executive .resume-photo { width: 100%; border-radius: 12px; margin-bottom: 1.5rem; }
        .skill-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .skill-tags span { background: #E2E8F0; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; }

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0; padding: 0; }
          .resume-paper { transform: none !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; }
          .resume-builder-page { background: white !important; }
          .container { display: block !important; height: auto !important; padding: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
}
