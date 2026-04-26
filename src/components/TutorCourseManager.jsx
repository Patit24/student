import React, { useState, useEffect } from 'react';
import { 
  Plus, Package, Trash2, Edit3, Globe, 
  DollarSign, Users, Award, BookOpen, FileText,
  PlusCircle, XCircle, CheckCircle, TrendingUp, HelpCircle, Image as ImageIcon,
  Upload, Download
} from 'lucide-react';
import { useToast } from './Toast';
import { createCourse, subscribeTutorCourses, deleteCourse, createCourseExam, uploadFileToStorage, subscribeAllCourses, updateCourse } from '../db.service';

export default function TutorCourseManager({ tutorId, isAdmin = false }) {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  // Course Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [tag, setTag] = useState('Top Seller');
  const [courseImage, setCourseImage] = useState('');
  const [curriculum, setCurriculum] = useState([{ title: '', items: [''], exam: null }]);
  const [activeExamModule, setActiveExamModule] = useState(null); // module index for exam creation
  const [examQuestions, setExamQuestions] = useState([{ question: '', options: ['', '', '', ''], correct: 0 }]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [subject, setSubject] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      return subscribeAllCourses(setCourses);
    }
    return subscribeTutorCourses(tutorId, setCourses);
  }, [tutorId, isAdmin]);

  const addModule = () => setCurriculum([...curriculum, { title: '', items: [''], exam: null }]);
  const updateModuleTitle = (idx, val) => {
    const newCur = [...curriculum];
    newCur[idx].title = val;
    setCurriculum(newCur);
  };
  const addMaterial = (idx) => {
    const newCur = [...curriculum];
    newCur[idx].items.push('');
    setCurriculum(newCur);
  };

  const handleAddExamToModule = (mIdx) => {
    setActiveExamModule(mIdx);
    setExamQuestions([{ question: '', options: ['', '', '', ''], correct: 0 }]);
  };

  const saveExamToModule = () => {
    const newCur = [...curriculum];
    newCur[activeExamModule].exam = { questions: examQuestions };
    setCurriculum(newCur);
    setActiveExamModule(null);
    toast.success("Exam attached to module! 🧠");
  };

  const addQuestion = () => setExamQuestions([...examQuestions, { question: '', options: ['', '', '', ''], correct: 0 }]);
  
  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(l => l.trim());
        const newQuestions = lines.map(line => {
          const [q, o1, o2, o3, o4, correct] = line.split(',');
          return {
            question: q?.trim(),
            options: [o1?.trim(), o2?.trim(), o3?.trim(), o4?.trim()],
            correct: parseInt(correct?.trim()) || 0
          };
        });
        setExamQuestions(newQuestions);
        toast.success(`Parsed ${newQuestions.length} questions successfully! ⚡`);
      } catch (err) {
        toast.error("Format error: Use Question,Option1,Option2,Option3,Option4,CorrectIndex(0-3)");
      }
    };
    reader.readAsText(file);
  };

  const updateQuestion = (qIdx, field, val) => {
    const newQ = [...examQuestions];
    newQ[qIdx][field] = val;
    setExamQuestions(newQ);
  };
  const updateOption = (qIdx, oIdx, val) => {
    const newQ = [...examQuestions];
    newQ[qIdx].options[oIdx] = val;
    setExamQuestions(newQ);
  };
  const updateMaterial = (mIdx, iIdx, val) => {
    const newCur = [...curriculum];
    newCur[mIdx].items[iIdx] = val;
    setCurriculum(newCur);
  };

  const handleCourseImage = async (file) => {
    if (!file) return;
    setIsPublishing(true);
    try {
      const url = await uploadFileToStorage(file, `courses/${tutorId}/covers`, (pct) => console.log(`Image Upload: ${pct}%`));
      setCourseImage(url);
      toast.success("Course cover uploaded! 🖼️");
    } catch (err) {
      toast.error("Image upload failed: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleModulePDF = async (mIdx, file) => {
    if (!file) return;
    setIsPublishing(true);
    try {
      const url = await uploadFileToStorage(file, `courses/${tutorId}/modules`, (pct) => console.log(`PDF Upload: ${pct}%`));
      const newCur = [...curriculum];
      newCur[mIdx].pdfUrl = url;
      newCur[mIdx].pdfName = file.name;
      setCurriculum(newCur);
      toast.success("Module PDF uploaded successfully! 📄");
    } catch (err) {
      toast.error("PDF upload failed: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCreate = async () => {
    if (!title || !price) return toast.error("Please fill title and price");
    setIsPublishing(true);
    try {
      const courseData = {
        title,
        category,
        subject,
        price: Number(price),
        originalPrice: Number(originalPrice || price),
        tag,
        image: courseImage,
        curriculum,
        tutorId,
        tutorName: isAdmin ? "Super Admin" : "Elite Faculty",
        sales_count: 0,
        rating: 5.0,
        reviewCount: 0,
        created_at: new Date().toISOString()
      };

      if (editingId) {
        await updateCourse(editingId, courseData);
        toast.success("Masterclass Updated! 🔄");
      } else {
        await createCourse(courseData);
        toast.success("Elite Course Published! 🚀");
      }
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error("Failed: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleEditInit = (course) => {
    setEditingId(course.id);
    setTitle(course.title);
    setCategory(course.category || 'Medical');
    setSubject(course.subject || '');
    setPrice(course.price);
    setOriginalPrice(course.originalPrice);
    setTag(course.tag || 'Top Seller');
    setCourseImage(course.image || '');
    setCurriculum(course.curriculum || [{ title: '', items: [''], exam: null }]);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setPrice(''); setOriginalPrice(''); setCourseImage(''); setCurriculum([{ title: '', items: [''], exam: null }]);
  };

  const totalEarnings = courses.reduce((acc, c) => acc + (c.total_revenue || 0), 0) * 0.8;

  return (
    <div className="tutor-course-manager">
      <div className="flex justify-between items-center mb-8 mobile-stack gap-6">
        <div>
          <h2 className="text-2xl font-black flex items-center gap-3">
            <Globe size={28} className="text-yellow-500" />
            Marketplace <span className="text-muted">Hub</span>
          </h2>
          <p className="text-sm text-muted">Manage your premium masterclasses and track 80% earnings.</p>
        </div>
        <button className="hp-btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Create Elite Course
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 mobile-grid-1 gap-6 mb-10">
        <div className="glass-panel p-6 border-l-4 border-yellow-500">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">My 80% Earnings</span>
          <div className="text-3xl font-black mt-1">₹{totalEarnings.toLocaleString()}</div>
        </div>
        <div className="glass-panel p-6 border-l-4 border-indigo-500">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">Total Sales</span>
          <div className="text-3xl font-black mt-1">{courses.reduce((acc, c) => acc + (c.sales_count || 0), 0)}</div>
        </div>
        <div className="glass-panel p-6 border-l-4 border-green-500">
          <span className="text-xs font-bold uppercase tracking-widest text-muted">Admin Shares (20%)</span>
          <div className="text-3xl font-black mt-1">₹{(totalEarnings * 0.25).toLocaleString()}</div>
        </div>
      </div>

      {/* Courses List */}
      <div className="flex-col gap-6">
        {courses.map(course => (
          <div key={course.id} className="glass-panel p-6 flex justify-between items-center hover:bg-white/5 transition-all">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                <BookOpen size={28} className="text-yellow-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{course.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted mt-1">
                  <span className="flex items-center gap-1"><Users size={12} /> {course.sales_count} Sales</span>
                  <span className="flex items-center gap-1 font-bold text-white">₹{course.price}</span>
                  <span className="badge-active" style={{ fontSize: '0.6rem' }}>{course.category}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="btn-icon" onClick={() => handleEditInit(course)}>
                <Edit3 size={18} />
              </button>
              <button className="btn-icon delete" onClick={() => deleteCourse(course.id)}>
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="empty-state p-20 glass-panel flex-col items-center opacity-30">
            <Package size={48} className="mb-4" />
            <p>You haven't published any courses yet.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="verification-overlay animate-reveal">
          <div className="glass-card verification-card" style={{ maxWidth: '800px', padding: '3rem' }}>
            <button className="close-modal" onClick={() => setShowModal(false)}><XCircle /></button>
            <h2 className="cinematic-title mb-8">Course Creator</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="flex-col gap-2">
                <label className="text-xs font-bold uppercase">Course Title</label>
                <input 
                  type="text" placeholder="e.g. NEET Biology Masterclass" 
                  className="premium-input w-full"
                  value={title} onChange={e => setTitle(e.target.value)}
                />
              </div>
              <div className="flex-col gap-2">
                <label className="text-xs font-bold uppercase">Category</label>
                <select className="premium-select w-full" value={category} onChange={e => setCategory(e.target.value)}>
                  <option value="Medical">Medical (NEET)</option>
                  <option value="Engineering">Engineering (JEE)</option>
                  <option value="Board">Board Exams</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex-col gap-2">
                <label className="text-xs font-bold uppercase">Subject</label>
                <input type="text" placeholder="e.g. Organic Chemistry" className="premium-input w-full" value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
              <div className="flex-col gap-2">
                <label className="text-xs font-bold uppercase">Course Tag</label>
                <input type="text" placeholder="Top Seller" className="premium-input w-full" value={tag} onChange={e => setTag(e.target.value)} />
              </div>
              <div className="flex-col gap-2">
                <label className="text-xs font-bold uppercase">Market Price (₹)</label>
                <input 
                  type="number" placeholder="999" 
                  className="premium-input w-full"
                  value={price} onChange={e => setPrice(e.target.value)}
                />
              </div>
              <div className="flex-col gap-2">
                <label className="text-xs font-bold uppercase">Original Price (₹)</label>
                <input 
                  type="number" placeholder="1999" 
                  className="premium-input w-full"
                  value={originalPrice} onChange={e => setOriginalPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Course Cover Image */}
            <div className="glass-panel p-6 bg-white/5 border-dashed border-2 border-white/10 rounded-2xl flex-col items-center justify-center text-center gap-4 mb-8">
              {courseImage ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden group">
                  <img src={courseImage} className="w-full h-full object-cover" alt="Course Cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <label htmlFor="course-img" className="text-white cursor-pointer font-bold">Replace Image</label>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <ImageIcon className="text-muted" size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Upload Course Cover Picture</p>
                    <p className="text-[10px] text-muted">Recommended: 1200x800px (JPG/PNG)</p>
                  </div>
                  <label htmlFor="course-img" className="hp-btn-outline py-2 px-6 text-xs cursor-pointer">
                    Select Cover Art
                  </label>
                </>
              )}
              <input type="file" id="course-img" accept="image/*" onChange={(e) => handleCourseImage(e.target.files[0])} hidden />
            </div>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold uppercase">Curriculum Builder</label>
                <button className="text-yellow-500 flex items-center gap-1 text-xs font-bold" onClick={addModule}>
                  <PlusCircle size={14} /> Add Module
                </button>
              </div>
              <div className="flex-col gap-4 overflow-y-auto" style={{ maxHeight: '300px' }}>
                {curriculum.map((mod, mIdx) => (
                  <div key={mIdx} className="glass-panel p-4 bg-white/5 border-white/10">
                    <input 
                      type="text" placeholder={`Module ${mIdx + 1} Title`} 
                      className="premium-input w-full mb-3"
                      value={mod.title} onChange={e => updateModuleTitle(mIdx, e.target.value)}
                    />
                    <div className="flex-col gap-2 pl-6 border-l border-yellow-500/30">
                      {mod.items.map((item, iIdx) => (
                        <input 
                          key={iIdx} type="text" placeholder="Lesson/Resource Title" 
                          className="premium-input w-full" style={{ fontSize: '0.8rem', padding: '0.6rem' }}
                          value={item} onChange={e => updateMaterial(mIdx, iIdx, e.target.value)}
                        />
                      ))}
                      <button className="text-[10px] text-muted flex items-center gap-1 mt-1" onClick={() => addMaterial(mIdx)}>
                        <Plus size={10} /> Add Lesson
                      </button>
                      <button 
                        className={`text-[10px] flex items-center gap-1 mt-2 font-bold ${mod.exam ? 'text-green-500' : 'text-yellow-500'}`}
                        onClick={() => handleAddExamToModule(mIdx)}
                      >
                        <HelpCircle size={10} /> {mod.exam ? 'Edit Exam' : 'Attach MCQ Exam'}
                      </button>
                      
                      <div className="mt-3 pt-2 border-t border-white/5">
                        <input type="file" id={`pdf-${mIdx}`} accept=".pdf" onChange={(e) => handleModulePDF(mIdx, e.target.files[0])} hidden />
                        <label htmlFor={`pdf-${mIdx}`} className={`text-[10px] flex items-center gap-1 cursor-pointer ${mod.pdfUrl ? 'text-green-500' : 'text-blue-400'}`}>
                          <Download size={10} /> {mod.pdfUrl ? `Replace: ${mod.pdfName}` : 'Upload Module PDF (Notes)'}
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="hp-btn-primary w-full py-4 flex items-center justify-center gap-2" onClick={handleCreate}>
              <Globe size={20} /> Publish to Elite Marketplace
            </button>
          </div>
        </div>
      )}

      {/* MCQ Creator Modal */}
      {activeExamModule !== null && (
        <div className="verification-overlay animate-reveal" style={{ zIndex: 1100 }}>
          <div className="glass-card verification-card" style={{ maxWidth: '900px', padding: '3rem' }}>
            <button className="close-modal" onClick={() => setActiveExamModule(null)}><XCircle /></button>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="cinematic-title mb-2">Module Exam Creator</h2>
                <p className="text-muted">Assessment for: <span className="text-yellow-500 font-bold">{curriculum[activeExamModule].title}</span></p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <input type="file" id="bulk-mcq" accept=".csv,.txt" onChange={handleBulkUpload} hidden />
                <label htmlFor="bulk-mcq" className="hp-btn-outline py-2 px-4 text-xs cursor-pointer flex items-center gap-2">
                  <Upload size={14} /> One-Click Bulk Upload
                </label>
                <span className="text-[10px] text-muted">Format: Question,A,B,C,D,CorrectIdx</span>
              </div>
            </div>

            <div className="flex-col gap-6 overflow-y-auto pr-2" style={{ maxHeight: '500px' }}>
              {examQuestions.map((q, qIdx) => (
                <div key={qIdx} className="glass-panel p-6 bg-white/5">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-yellow-500">Question {qIdx + 1}</span>
                  </div>
                  <input 
                    type="text" placeholder="Enter your question here..." 
                    className="premium-input w-full mb-4"
                    value={q.question} onChange={e => updateQuestion(qIdx, 'question', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3">
                        <input 
                          type="radio" name={`correct-${qIdx}`} 
                          checked={q.correct === oIdx}
                          onChange={() => updateQuestion(qIdx, 'correct', oIdx)}
                        />
                        <input 
                          type="text" placeholder={`Option ${oIdx + 1}`} 
                          className="premium-input w-full" style={{ fontSize: '0.8rem', padding: '0.6rem' }}
                          value={opt} onChange={e => updateOption(qIdx, oIdx, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="hp-btn-outline w-full py-3 flex items-center justify-center gap-2" onClick={addQuestion}>
                <PlusCircle size={16} /> Add Another Question
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button className="hp-btn-primary w-full py-4" onClick={saveExamToModule}>
                Save & Attach Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
