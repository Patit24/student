import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Edit2, Save, X, Image as ImageIcon, FileText, Upload } from 'lucide-react';
import { useToast } from './Toast';
import FileUploadVercel from './FileUploadVercel';
import { useAppContext } from '../context/AuthContext';

export default function AdminBlogManager() {
  const [blogs, setBlogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const { currentUser } = useAppContext();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Education',
    coverImage: '',
    readTime: '5 min',
    excerpt: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBlogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'blogs', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Blog updated successfully!');
      } else {
        await addDoc(collection(db, 'blogs'), {
          ...formData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast.success('Blog published successfully!');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save blog: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', category: 'Education', coverImage: '', readTime: '5 min', excerpt: '' });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (blog) => {
    setFormData({
      title: blog.title,
      content: blog.content,
      category: blog.category,
      coverImage: blog.coverImage,
      readTime: blog.readTime,
      excerpt: blog.excerpt || ''
    });
    setEditingId(blog.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await deleteDoc(doc(db, 'blogs', id));
        toast.success('Blog deleted successfully');
      } catch (error) {
        toast.error('Error deleting blog');
      }
    }
  };

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 flex items-center gap-2"><FileText size={20} /> Blog Management</h3>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="hp-btn-primary" style={{ padding: '0.6rem 1.2rem' }}>
            <Plus size={18} /> Create New Blog
          </button>
        )}
      </div>

      {isAdding ? (
        <div className="glass-panel p-8 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <h4 className="m-0">{editingId ? 'Edit Blog' : 'Write New Blog'}</h4>
            <button onClick={resetForm} className="btn-link text-muted"><X size={20} /></button>
          </div>
          <form onSubmit={handleSave} className="flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" className="input-field" placeholder="Blog Title" required
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
              <select 
                className="input-field"
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="Education">Education</option>
                <option value="Exam Tips">Exam Tips</option>
                <option value="Career">Career</option>
                <option value="Tech">Tech</option>
                <option value="Student Life">Student Life</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex-col gap-2">
                <label className="text-xs font-bold text-primary uppercase">Blog Cover Image</label>
                <div className="flex gap-4 items-center">
                  {formData.coverImage && (
                    <div style={{ width: '80px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary)' }}>
                      <img src={formData.coverImage} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div className="flex-1">
                    <FileUploadVercel 
                      uid={currentUser?.uid} 
                      folder="blogs" 
                      onUploadSuccess={(url) => setFormData({...formData, coverImage: url})} 
                      label={formData.coverImage ? "Change Cover" : "Upload Cover Image"}
                    />
                  </div>
                </div>
              </div>
              <div className="flex-col gap-2">
                <label className="text-xs font-bold text-primary uppercase">Reading Time</label>
                <input 
                  type="text" className="input-field w-full" placeholder="e.g. 5 min"
                  value={formData.readTime} onChange={e => setFormData({...formData, readTime: e.target.value})}
                />
              </div>
            </div>

            <textarea 
              className="input-field" placeholder="Short Excerpt (shows in list view)" rows="2"
              value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})}
            />

            <div className="flex-col gap-2">
              <label className="text-xs font-bold text-primary uppercase">Blog Content</label>
              <textarea 
                className="input-field" placeholder="Blog Content (HTML Tags Supported for h1, h2, ul, etc.)" rows="12" required
                value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}
              />
              <p className="text-[10px] text-muted-foreground opacity-60">
                <strong>Pro Tip:</strong> You can paste HTML tags like <code>&lt;h1&gt;</code>, <code>&lt;h2&gt;</code>, <code>&lt;ul&gt;</code>, or <code>&lt;strong&gt;</code> for cinematic formatting.
              </p>
            </div>

            <div className="flex gap-4 mt-2">
              <button type="submit" className="hp-btn-primary flex-1">
                <Save size={18} /> {editingId ? 'Update Blog' : 'Publish Blog'}
              </button>
              <button type="button" onClick={resetForm} className="hp-btn-outline flex-1">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {blogs.map(blog => (
            <div key={blog.id} className="glass-panel p-4 flex items-center justify-between gap-6 hover:border-yellow-500/50 transition-all">
              <div className="flex items-center gap-4 flex-1">
                <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
                  {blog.coverImage ? (
                    <img src={blog.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-20"><ImageIcon size={24} /></div>
                  )}
                </div>
                <div>
                  <h4 className="m-0" style={{ fontSize: '1rem' }}>{blog.title}</h4>
                  <p className="text-xs text-muted m-0">{blog.category} · {blog.readTime}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(blog)} className="p-2 hover:text-yellow-500 transition-colors"><Edit2 size={18}/></button>
                <button onClick={() => handleDelete(blog.id)} className="p-2 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && <p className="text-center text-muted p-10 glass-panel">No blogs published yet.</p>}
        </div>
      )}
    </div>
  );
}
