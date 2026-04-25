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
    <div className="hp-root" style={{ paddingTop: '8rem', paddingBottom: '8rem', background: '#070b18', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Background Decorative Glows */}
      <div style={{ position: 'absolute', top: '5%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(245,197,24,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '5%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(79,70,229,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="hp-section-head text-center mb-16 animate-reveal">
          <div className="hp-badge" style={{ margin: '0 auto 1.5rem' }}>
            <span>PPR Education Hub</span>
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 7vw, 4.5rem)', fontWeight: 950, letterSpacing: '-2px', lineHeight: 1 }}>
            Elite <span className="hp-yellow">Knowledge</span> Base
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#7a8ba8', maxWidth: '600px', margin: '1.5rem auto' }}>
            Cinematic guides, expert insights, and high-fidelity updates for modern aspirants.
          </p>
        </div>

        {/* Search and Filter Hub */}
        <div className="glass-panel p-8 mb-16 animate-premium" style={{ borderRadius: '32px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex mobile-stack justify-between items-center gap-8">
            <div className="flex gap-3 flex-wrap">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`hp-btn-${selectedCategory === cat ? 'primary' : 'outline'}`}
                  style={{ 
                    padding: '0.6rem 1.5rem', 
                    borderRadius: '99px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    background: selectedCategory === cat ? 'var(--hp-yellow)' : 'transparent'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative" style={{ minWidth: '320px' }}>
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search articles..." 
                className="input-field w-full pl-12"
                style={{ borderRadius: '16px', background: 'rgba(0,0,0,0.2)', height: '54px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-3 mobile-grid-1 gap-10">
            {filteredBlogs.map((blog, i) => (
              <div 
                key={blog.id} 
                className="glass-card overflow-hidden flex-col group animate-reveal" 
                style={{ 
                  animationDelay: `${i * 0.1}s`,
                  borderRadius: '32px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative'
                }}
              >
                {/* Image Container */}
                <div style={{ height: '240px', overflow: 'hidden', position: 'relative' }}>
                  {blog.coverImage ? (
                    <img 
                      src={blog.coverImage} 
                      alt={blog.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s ease' }} 
                      className="group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-indigo-900/20 to-yellow-900/10">
                      <BookOpen size={48} className="opacity-20" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(7,11,24,0.9) 100%)' }} />
                  
                  {/* Category Badge */}
                  <div style={{ 
                    position: 'absolute', top: '20px', left: '20px', 
                    background: 'rgba(245,197,24,0.15)', backdropFilter: 'blur(10px)',
                    padding: '6px 14px', borderRadius: '99px', border: '1px solid rgba(245,197,24,0.3)',
                    fontSize: '0.7rem', fontWeight: 800, color: '#F5C518', textTransform: 'uppercase'
                  }}>
                    {blog.category || 'General'}
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex-col gap-4" style={{ flex: 1, justifyContent: 'space-between' }}>
                  <div className="flex-col gap-4">
                    <div className="flex items-center gap-3 text-xs font-semibold text-muted">
                      <span className="flex items-center gap-1.5"><Calendar size={14} color="var(--hp-yellow)" /> {new Date(blog.createdAt?.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {blog.readTime || '5 min'} read</span>
                    </div>
                    
                    <h3 style={{ 
                      fontSize: '1.5rem', margin: 0, lineHeight: 1.25, fontWeight: 800, color: '#fff',
                      transition: 'color 0.3s ease'
                    }} className="group-hover:text-yellow-500">
                      {blog.title}
                    </h3>
                    
                    <p className="text-muted text-sm line-clamp-3" style={{ margin: 0, lineHeight: 1.6 }}>
                      {blog.excerpt || blog.content?.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <Link to={`/blog/${blog.id}`} className="flex items-center gap-2 text-yellow-500 font-bold text-sm hover:gap-3 transition-all">
                      Read Full Article <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" style={{ 
                  boxShadow: 'inset 0 0 50px rgba(245,197,24,0.05), 0 0 40px rgba(245,197,24,0.1)', borderRadius: '32px'
                }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-32 glass-panel" style={{ borderRadius: '32px' }}>
            <BookOpen size={64} className="text-muted mb-6 opacity-10" />
            <h3 style={{ fontSize: '1.8rem', color: 'var(--hp-yellow)' }}>No Articles Found</h3>
            <p className="text-muted">Adjust your search or filter to explore our knowledge base.</p>
            <button onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }} className="hp-btn-outline mt-8">Reset Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
