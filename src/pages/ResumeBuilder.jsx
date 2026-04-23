import React, { useState, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Briefcase, GraduationCap, 
  Award, Code, BookOpen, Download, Plus, Trash2, Globe, Diamond
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ResumeBuilder.css';

const ResumeBuilder = () => {
  const [formData, setFormData] = useState({
    name: 'PATIT PABAN ROY',
    title: 'WordPress Developer | Responsive Web Design | Client Collaboration | Digital Solutions',
    phone: '9014842370',
    email: 'Patitroy29@gmail.com',
    location: 'Noida',
    profileImage: '',
    summary: 'Results-driven WordPress Developer with proven expertise in designing and developing over 15 responsive websites, driving a 30% increase in client engagement. Skilled in translating client requirements into actionable solutions using WordPress, HTML, CSS, and JavaScript. Strong academic background with MCA and BCA degrees, ensuring broad understanding of full-stack development. Efficient project manager recognized for reducing project timelines by 25% while excelling in collaborative environments.',
    experience: [
      {
        title: 'WordPress Developer and Coordinator',
        company: 'Enqodle',
        dates: '07/2024 - 05/2025',
        location: 'Delhi',
        description: 'A company focused on enhancing digital presence through WordPress solutions\n• Design and develop responsive WordPress websites tailored to client needs\n• Manage calendars, schedule meetings, and oversee project timelines\n• Serve as the communication bridge between teams, departments, and clients'
      },
      {
        title: 'WordPress Developer',
        company: 'Sapco IOT PVT LTD',
        dates: '07/2023 - 01/2024',
        location: 'Kolkata',
        description: 'A company dedicated to IoT solutions and web development\n• Design and develop responsive WordPress websites\n• Improved web solution delivery speed by 60% by collaborating with National clients to define project requirements.'
      },
      {
        title: 'Web Developer',
        company: 'Parentheses Labs',
        dates: '08/2021 - 09/2022',
        location: 'Kolkata',
        description: 'A web development company focused on innovative solutions\n• Design and develop web pages that are visually appealing and highly functional\n• Create responsive designs ensuring compatibility across various devices and browsers\n• Implement and maintain CSS-heavy projects, ensuring best practices and optimal performance'
      }
    ],
    education: [
      {
        degree: 'MCA',
        school: 'Brainware University',
        dates: '08/2022 - 06/2024',
        location: 'Barasat'
      },
      {
        degree: 'BCA',
        school: 'Brainware University',
        dates: '08/2019 - 06/2022',
        location: 'Barasat'
      },
      {
        degree: '12th',
        school: 'Katiahat B.K.A.P Institution',
        dates: '06/2015 - 06/2015',
        location: 'Katiahat, West Bengal'
      },
      {
        degree: '10th',
        school: 'Katiahat B.K.A.P Institution',
        dates: '06/2013 - 06/2013',
        location: 'Katiahat, West Bengal'
      }
    ],
    achievements: [
      {
        title: 'Custom Website Development',
        desc: 'Developed 15 custom websites increasing client engagement by 30% within 6 months.'
      },
      {
        title: 'Project Management Efficiency',
        desc: 'Reduced project completion time by 25% through efficient project management.'
      },
      {
        title: 'Team Leadership Success',
        desc: 'Led a 5-member team achieving 100% project delivery on time for a year.'
      },
      {
        title: 'Website Optimization',
        desc: 'Improved website loading speed by 40% using optimized code practices.'
      }
    ],
    skills: [
      'MS-Office', 'CSS', 'HTML', 'JavaScript', 'Microsoft Excel', 
      'Microsoft Power Point', 'SEO', 'Shopify', 'Webflow', 
      'WordPress', 'Website Performance Optimization'
    ],
    training: [
      'Website Developing -'
    ]
  });

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
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
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
        <div className="resume-paper" ref={resumeRef}>
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
    </div>
  );
};

export default ResumeBuilder;
