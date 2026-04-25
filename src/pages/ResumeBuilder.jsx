import React, { useState, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Award, Code, BookOpen, Download, Plus, Trash2, Globe, Diamond, Layout
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ResumeBuilder.css';

const ResumeBuilder = () => {
  const [formData, setFormData] = useState({
    name: 'YOUR FULL NAME',
    title: 'PROFESSIONAL JOB TITLE',
    phone: '+91 98765 43210',
    email: 'yourname@email.com',
    location: 'City, State',
    profileImage: '',
    summary: 'A short, impactful summary of your professional background, key strengths, and career objectives. Highlight your most relevant achievements and what you bring to the table.',
    experience: [
      {
        title: 'Job Title',
        company: 'Company Name',
        dates: 'MM/YYYY - Present',
        location: 'City, Country',
        description: '• Accomplished X by implementing Y, resulting in Z% improvement.\n• Led a team of N members to deliver project Alpha on time.\n• Optimized workflow efficiency by automating repetitive tasks.'
      }
    ],
    education: [
      {
        degree: 'Your Degree / Qualification',
        school: 'University or Institution Name',
        dates: 'YYYY - YYYY',
        location: 'City, Country'
      }
    ],
    achievements: [
      {
        title: 'Significant Milestone',
        desc: 'Brief description of the achievement and its impact on the organization or your growth.'
      }
    ],
    skills: [
      'Core Skill 1', 'Professional Skill 2', 'Technical Tool 3', 'Soft Skill 4'
    ],
    training: [
      'Relevant Certification or Course'
    ]
  });

  const [selectedTemplate, setSelectedTemplate] = useState('free-1');
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const FREE_TEMPLATES = [
    { id: 'free-1', name: 'Classic Pro', color: '#1a365d' },
    { id: 'free-2', name: 'Modern Clean', color: '#2c7a7b' },
    { id: 'free-3', name: 'Minimalist', color: '#4a5568' },
    { id: 'free-4', name: 'Executive', color: '#2d3748' },
    { id: 'free-5', name: 'Academic', color: '#702459' },
  ];

  const ELITE_TEMPLATES = [
    { id: 'elite-1', name: '2026 Futuristic', color: '#6366f1', isElite: true },
    { id: 'elite-2', name: 'Neon Gradient', color: '#8b5cf6', isElite: true },
    { id: 'elite-3', name: 'Cyber Glass', color: '#ec4899', isElite: true },
    { id: 'elite-4', name: 'Midnight Pro', color: '#0f172a', isElite: true },
    { id: 'elite-5', name: 'Sunrise Bloom', color: '#f59e0b', isElite: true },
    { id: 'elite-6', name: 'Arctic Flow', color: '#0ea5e9', isElite: true },
  ];

  const resumeRef = useRef();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = (type) => {
    const newItems = [...formData[type]];
    if (type === 'experience') newItems.push({ title: '', company: '', dates: '', location: '', description: '' });
    if (type === 'education') newItems.push({ degree: '', school: '', dates: '', location: '' });
    if (type === 'achievements') newItems.push({ title: '', desc: '' });
    if (type === 'skills') newItems.push('');
    if (type === 'training') newItems.push('');
    setFormData({ ...formData, [type]: newItems });
  };

  const removeItem = (type, index) => {
    const newItems = formData[type].filter((_, i) => i !== index);
    setFormData({ ...formData, [type]: newItems });
  };

  const updateItem = (type, index, field, value) => {
    const newItems = [...formData[type]];
    if (typeof newItems[index] === 'string') {
      newItems[index] = value;
    } else {
      newItems[index][field] = value;
    }
    setFormData({ ...formData, [type]: newItems });
  };

  const downloadPDF = async () => {
    const element = resumeRef.current;
    const canvas = await html2canvas(element, { 
      scale: 3, // Increased scale for clearer small text
      useCORS: true,
      logging: false,
      width: element.offsetWidth,
      height: element.offsetHeight
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${formData.name.replace(/\s+/g, '_')}_Resume.pdf`);
  };

  return (
    <div className="resume-builder-container">
      {/* ── EDITOR SIDEBAR ────────────────────────────────────────────────── */}
      <div className="editor-panel">
        <div className="panel-header">
          <h2>Resume Editor</h2>
          <button onClick={downloadPDF} className="download-btn">
            <Download size={18} /> Download PDF
          </button>
        </div>

        {/* Template Selector */}
        <div className="editor-section">
          <h3 className="flex items-center gap-2">
            <Layout size={18} color="var(--primary)" /> Choose Design
          </h3>
          <div className="template-grid">
            <p className="template-group-label">FREE DESIGNS</p>
            <div className="template-row">
              {FREE_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  className={`template-tab ${selectedTemplate === t.id ? 'active' : ''}`}
                  onClick={() => setSelectedTemplate(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
            
            <p className="template-group-label mt-4">ELITE 2026 DESIGNS (₹49)</p>
            <div className="template-row">
              {ELITE_TEMPLATES.map(t => (
                <button 
                  key={t.id} 
                  className={`template-tab elite ${selectedTemplate === t.id ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setShowPremiumModal(true);
                  }}
                >
                  <Diamond size={12} /> {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-section">
          <h3>Basic Info</h3>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Full Name" 
              value={formData.name} 
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Job Title / Headline" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
            <div className="row">
              <input 
                type="text" 
                placeholder="Phone" 
                value={formData.phone} 
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Email" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <input 
              type="text" 
              placeholder="Location" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})}
            />
            <label className="image-upload-label">
              Profile Photo
              <input type="file" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        <div className="editor-section">
          <div className="section-header">
            <h3>Experience</h3>
            <button onClick={() => addItem('experience')} className="add-btn"><Plus size={16} /></button>
          </div>
          {formData.experience.map((exp, i) => (
            <div key={i} className="dynamic-item">
              <input placeholder="Job Title" value={exp.title} onChange={(e) => updateItem('experience', i, 'title', e.target.value)} />
              <input placeholder="Company" value={exp.company} onChange={(e) => updateItem('experience', i, 'company', e.target.value)} />
              <div className="row">
                <input placeholder="Dates" value={exp.dates} onChange={(e) => updateItem('experience', i, 'dates', e.target.value)} />
                <input placeholder="Location" value={exp.location} onChange={(e) => updateItem('experience', i, 'location', e.target.value)} />
              </div>
              <textarea placeholder="Description" value={exp.description} onChange={(e) => updateItem('experience', i, 'description', e.target.value)} />
              <button onClick={() => removeItem('experience', i)} className="remove-btn"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="editor-section">
          <div className="section-header">
            <h3>Education</h3>
            <button onClick={() => addItem('education')} className="add-btn"><Plus size={16} /></button>
          </div>
          {formData.education.map((edu, i) => (
            <div key={i} className="dynamic-item">
              <input placeholder="Degree" value={edu.degree} onChange={(e) => updateItem('education', i, 'degree', e.target.value)} />
              <input placeholder="School/University" value={edu.school} onChange={(e) => updateItem('education', i, 'school', e.target.value)} />
              <div className="row">
                <input placeholder="Dates" value={edu.dates} onChange={(e) => updateItem('education', i, 'dates', e.target.value)} />
                <input placeholder="Location" value={edu.location} onChange={(e) => updateItem('education', i, 'location', e.target.value)} />
              </div>
              <button onClick={() => removeItem('education', i)} className="remove-btn"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="editor-section">
          <h3>Summary</h3>
          <textarea 
            className="summary-textarea"
            value={formData.summary} 
            onChange={(e) => setFormData({...formData, summary: e.target.value})}
          />
        </div>

        <div className="editor-section">
          <div className="section-header">
            <h3>Achievements</h3>
            <button onClick={() => addItem('achievements')} className="add-btn"><Plus size={16} /></button>
          </div>
          {formData.achievements.map((ach, i) => (
            <div key={i} className="dynamic-item">
              <input placeholder="Achievement Title" value={ach.title} onChange={(e) => updateItem('achievements', i, 'title', e.target.value)} />
              <textarea placeholder="Description" value={ach.desc} onChange={(e) => updateItem('achievements', i, 'desc', e.target.value)} />
              <button onClick={() => removeItem('achievements', i)} className="remove-btn"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>

        <div className="editor-section">
          <div className="section-header">
            <h3>Skills</h3>
            <button onClick={() => addItem('skills')} className="add-btn"><Plus size={16} /></button>
          </div>
          <div className="skills-grid">
            {formData.skills.map((skill, i) => (
              <div key={i} className="skill-input">
                <input value={skill} onChange={(e) => updateItem('skills', i, null, e.target.value)} />
                <button onClick={() => removeItem('skills', i)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PREVIEW PANEL ─────────────────────────────────────────────────── */}
      <div className="preview-panel">
        <div className={`resume-paper template-${selectedTemplate}`} ref={resumeRef}>
          {/* Header */}
          <div className="resume-header">
            <div className="header-info">
              <h1>{formData.name}</h1>
              <h2 className="brand-blue">{formData.title}</h2>
              <div className="contact-info">
                <span><Phone size={14} /> {formData.phone}</span>
                <span><Mail size={14} /> {formData.email}</span>
                <span><MapPin size={14} /> {formData.location}</span>
              </div>
            </div>
            {formData.profileImage && (
              <div className="profile-image-container">
                <img src={formData.profileImage} alt="Profile" />
              </div>
            )}
          </div>

          <div className="resume-body">
            {/* Left Column */}
            <div className="column column-left">
              <section>
                <h3 className="section-title">EXPERIENCE</h3>
                {formData.experience.map((exp, i) => (
                  <div key={i} className="resume-item">
                    <h4 className="item-title">{exp.title}</h4>
                    <h5 className="item-subtitle brand-blue">{exp.company}</h5>
                    <div className="item-meta">
                      <span><Briefcase size={12} /> {exp.dates}</span>
                      <span><MapPin size={12} /> {exp.location}</span>
                    </div>
                    <p className="item-desc">{exp.description}</p>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="section-title">EDUCATION</h3>
                {formData.education.map((edu, i) => (
                  <div key={i} className="resume-item">
                    <h4 className="item-title">{edu.degree}</h4>
                    <h5 className="item-subtitle brand-blue">{edu.school}</h5>
                    <div className="item-meta">
                      <span><GraduationCap size={12} /> {edu.dates}</span>
                      <span><MapPin size={12} /> {edu.location}</span>
                    </div>
                  </div>
                ))}
              </section>
            </div>

            {/* Right Column */}
            <div className="column column-right">
              <section>
                <h3 className="section-title">SUMMARY</h3>
                <p className="summary-text">{formData.summary}</p>
              </section>

              <section>
                <h3 className="section-title">KEY ACHIEVEMENTS</h3>
                {formData.achievements.map((ach, i) => (
                  <div key={i} className="achievement-item">
                    <div className="ach-icon"><Diamond size={16} fill="#00A3E0" color="#00A3E0" /></div>
                    <div className="ach-content">
                      <strong>{ach.title}</strong>
                      <p>{ach.desc}</p>
                    </div>
                  </div>
                ))}
              </section>

              <section>
                <h3 className="section-title">SKILLS</h3>
                <div className="skills-container">
                  {formData.skills.map((skill, i) => (
                    <span key={i} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="section-title">TRAINING / COURSES</h3>
                {formData.training.map((t, i) => (
                  <div key={i} className="training-item brand-blue">{t}</div>
                ))}
              </section>
            </div>
          </div>
        </div>
      </div>
      {showPremiumModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel p-8 text-center" style={{ maxWidth: '450px' }}>
            <Diamond size={48} color="#F5C518" className="mb-4" />
            <h2 className="mb-2">Unlock Elite Template</h2>
            <p className="mb-6" style={{ color: 'var(--text-muted)' }}>
              Get this modern 2026 style resume for just <strong>₹49</strong>. Stand out from the crowd with premium gradients and glassmorphism.
            </p>
            <div className="flex-col gap-3">
              <button className="btn btn-primary w-full" onClick={() => window.open('upi://pay?pa=yourname@upi&pn=PPREducation&am=49&cu=INR&tn=Elite Resume Template', '_blank')}>
                Pay ₹49 via UPI
              </button>
              <button className="btn btn-outline w-full" onClick={() => setShowPremiumModal(false)}>
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
