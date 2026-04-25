import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, User, Clock, ChevronRight, BookOpen, Tag } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import './AboutPage.css'; // Reusing some base styles or will create Blogs.css

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const blogData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBlogs(blogData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = ['All', 'Education', 'Exam Tips', 'Career', 'Tech', 'Student Life'];

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         blog.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div className="hp-section-head text-center mb-12">
        <h1 style={{ fontSize: '3rem', fontWeight: 900 }}>Educational <span className="hp-yellow">Insights</span></h1>
        <p className="text-muted">Master your subjects with our latest guides and tips.</p>
      </div>

      {/* Search and Filter */}
      <div className="flex mobile-stack justify-between items-center gap-6 mb-12 glass-panel p-6">
        <div className="flex gap-4 flex-wrap">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`hp-btn-${selectedCategory === cat ? 'primary' : 'outline'}`}
              style={{ padding: '0.5rem 1.2rem', borderRadius: '99px', fontSize: '0.8rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative" style={{ width: '300px' }}>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input 
            type="text" 
            placeholder="Search blogs..." 
            className="input-field w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
        </div>
      ) : filteredBlogs.length > 0 ? (
        <div className="grid grid-cols-3 mobile-grid-1 gap-8">
          {filteredBlogs.map((blog) => (
            <div key={blog.id} className="glass-panel overflow-hidden flex-col animate-premium">
              {blog.coverImage && (
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <img src={blog.coverImage} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="p-6 flex-col gap-3">
                <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold uppercase tracking-widest">
                  <Tag size={12} /> {blog.category || 'General'}
                </div>
                <h3 style={{ fontSize: '1.4rem', margin: 0, lineHeight: 1.3 }}>{blog.title}</h3>
                <div className="flex items-center gap-4 text-xs text-muted">
                  <div className="flex items-center gap-1"><Calendar size={12} /> {new Date(blog.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                  <div className="flex items-center gap-1"><Clock size={12} /> {blog.readTime || '5 min'}</div>
                </div>
                <p className="text-muted text-sm line-clamp-3">
                  {blog.excerpt || blog.content?.substring(0, 150) + '...'}
                </p>
                <Link to={`/blog/${blog.id}`} className="flex items-center gap-2 text-yellow-500 font-bold text-sm mt-4 hover:gap-4 transition-all">
                  Read Article <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-20 glass-panel">
          <BookOpen size={48} className="text-muted mb-4 opacity-20" />
          <h3>No blogs found matching your search.</h3>
        </div>
      )}
    </div>
  );
}
