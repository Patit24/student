import React, { useState, useEffect } from 'react';
import { 
  Plus, Package, Trash2, Edit3, Globe, 
  DollarSign, Users, Award, BookOpen, FileText,
  PlusCircle, XCircle, CheckCircle, TrendingUp
} from 'lucide-react';
import { useToast } from './Toast';
import { createCourse, subscribeTutorCourses, deleteCourse } from '../db.service';

export default function TutorCourseManager({ tutorId }) {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const toast = useToast();

  // Course Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Medical');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [tag, setTag] = useState('Top Seller');
  const [curriculum, setCurriculum] = useState([{ title: '', items: [''] }]);

  useEffect(() => {
    return subscribeTutorCourses(tutorId, setCourses);
  }, [tutorId]);

  const addModule = () => setCurriculum([...curriculum, { title: '', items: [''] }]);
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
  const updateMaterial = (mIdx, iIdx, val) => {
    const newCur = [...curriculum];
    newCur[mIdx].items[iIdx] = val;
    setCurriculum(newCur);
  };

  const handleCreate = async () => {
    if (!title || !price) return toast.error("Please fill title and price");
    try {
      await createCourse({
        title,
        category,
        price: Number(price),
        originalPrice: Number(originalPrice || price),
        tag,
        curriculum,
        tutorId,
        tutorName: "Dr. Aryan Sharma", // Replace with real auth name
        students: 0,
        rating: 5.0
      });
      toast.success("Elite Course Published! 🚀");
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
  };

  const resetForm = () => {
    setTitle(''); setPrice(''); setOriginalPrice(''); setCurriculum([{ title: '', items: [''] }]);
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
              <button className="btn-icon" onClick={() => toast.info("Editing coming soon!")}>
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
            
            <div className="grid grid-cols-2 gap-6 mb-8">
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
                  <option value="Foundation">Foundation</option>
                </select>
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
    </div>
  );
}
