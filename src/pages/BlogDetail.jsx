import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Calendar, Clock, ChevronLeft, User, Share2, Tag } from 'lucide-react';

export default function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      const docRef = doc(db, 'blogs', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setBlog({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    fetchBlog();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container py-20 text-center">
        <h1>Article not found</h1>
        <Link to="/blogs" className="hp-btn-primary mt-6">Back to Blogs</Link>
      </div>
    );
  }

  return (
    <div className="hp-root" style={{ background: '#070b18', minHeight: '100vh', position: 'relative' }}>
      {/* Cinematic Hero Header */}
      <section style={{ position: 'relative', height: '70vh', minHeight: '500px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {blog.coverImage && (
          <>
            <img 
              src={blog.coverImage} 
              alt="" 
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(7,11,24,0.4) 0%, #070b18 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, transparent 0%, #070b18 100%)' }} />
          </>
        )}
        
        <div className="container" style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
          <Link to="/blogs" className="inline-flex items-center gap-2 text-yellow-500 font-bold mb-8 hover:gap-4 transition-all animate-reveal" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <ChevronLeft size={18} /> Back to Insights Hub
          </Link>
          
          <div className="animate-reveal" style={{ animationDelay: '0.1s' }}>
            <div style={{ 
              background: 'rgba(245,197,24,0.1)', backdropFilter: 'blur(10px)', 
              padding: '8px 20px', borderRadius: '99px', border: '1px solid rgba(245,197,24,0.3)',
              width: 'fit-content', margin: '0 auto 2rem', color: '#F5C518', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase'
            }}>
              {blog.category || 'General'}
            </div>
            <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: 950, letterSpacing: '-2px', lineHeight: 1, margin: 0, color: '#fff' }}>
              {blog.title}
            </h1>
          </div>
        </div>

        {/* Decorative Background Glows */}
        <div style={{ position: 'absolute', top: '20%', left: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(245,197,24,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '0', right: '-10%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </section>

      <div className="container" style={{ position: 'relative', zIndex: 20, marginTop: '-15vh', paddingBottom: '10rem' }}>
        <div className="flex mobile-stack gap-12">
          {/* Main Content Area */}
          <div className="flex-1">
            <div className="glass-panel p-12 animate-reveal" style={{ borderRadius: '40px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', animationDelay: '0.2s' }}>
              <div className="blog-content" style={{ fontSize: '1.25rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.2px' }}>
                {blog.content.split('\n').map((para, i) => (
                  para.trim() && <p key={i} className="mb-8" style={{ fontWeight: 400 }}>{para}</p>
                ))}
              </div>

              <div className="flex items-center justify-between mt-16 pt-12" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-4">
                  <span className="text-muted text-sm">Share this article:</span>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <button key={i} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-yellow-500 hover:text-black transition-all">
                        <Share2 size={16} />
                      </button>
                    ))}
                  </div>
                </div>
                <Link to="/blogs" className="hp-btn-primary" style={{ padding: '1rem 2rem', borderRadius: '16px' }}>
                  Explore More Articles
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Metadata */}
          <div style={{ width: '300px' }} className="mobile-hidden">
            <div className="sticky top-24 flex-col gap-6">
              <div className="glass-panel p-8 animate-reveal" style={{ borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', animationDelay: '0.3s' }}>
                <h5 className="text-muted text-xs uppercase tracking-widest font-bold mb-6">Article Info</h5>
                <div className="flex-col gap-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <User size={20} color="var(--hp-yellow)" />
                    </div>
                    <div className="flex-col">
                      <span className="text-xs text-muted">Author</span>
                      <strong className="text-sm">PPR Admin</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Calendar size={20} className="text-muted" />
                    </div>
                    <div className="flex-col">
                      <span className="text-xs text-muted">Published</span>
                      <strong className="text-sm">{new Date(blog.createdAt?.seconds * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Clock size={20} className="text-muted" />
                    </div>
                    <div className="flex-col">
                      <span className="text-xs text-muted">Read Time</span>
                      <strong className="text-sm">{blog.readTime || '5 min read'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 mt-6 animate-reveal" style={{ borderRadius: '32px', background: 'rgba(245,197,24,0.02)', border: '1px solid rgba(245,197,24,0.1)', animationDelay: '0.4s' }}>
                <h5 className="hp-yellow text-xs uppercase tracking-widest font-bold mb-4">Aspirant Pathway</h5>
                <p className="text-xs text-muted leading-relaxed mb-6">Master NEET & JEE with elite guidance. Get started with our automated systems today.</p>
                <Link to="/signup" className="hp-btn-primary w-full text-center" style={{ fontSize: '0.8rem', padding: '0.8rem' }}>Join the Elite</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
