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
    <div className="hp-root" style={{ background: '#070b18', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Cinematic Hero Header */}
      <section style={{ 
        position: 'relative', 
        paddingTop: '10rem', 
        paddingBottom: '6rem', 
        overflow: 'hidden', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center'
      }}>
        {blog.coverImage && (
          <>
            <img 
              src={blog.coverImage} 
              alt="" 
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} 
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #070b18 0%, transparent 50%, #070b18 100%)' }} />
          </>
        )}
        
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <Link to="/blogs" className="inline-flex items-center gap-2 text-yellow-500 font-bold mb-8 hover:gap-4 transition-all animate-reveal" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <ChevronLeft size={16} /> Back to Insights Hub
          </Link>
          
          <div className="animate-reveal" style={{ animationDelay: '0.1s' }}>
            <div style={{ 
              background: 'rgba(245,197,24,0.1)', backdropFilter: 'blur(10px)', 
              padding: '6px 18px', borderRadius: '99px', border: '1px solid rgba(245,197,24,0.3)',
              width: 'fit-content', margin: '0 auto 1.5rem', color: '#F5C518', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
            }}>
              {blog.category || 'General'}
            </div>
            <h1 style={{ 
              fontSize: 'clamp(2rem, 6vw, 3.5rem)', 
              fontWeight: 950, 
              letterSpacing: '-1.5px', 
              lineHeight: 1.1, 
              margin: '0 auto', 
              maxWidth: '900px',
              color: '#fff' 
            }}>
              {blog.title}
            </h1>
          </div>
        </div>

        {/* Decorative Background Glows */}
        <div style={{ position: 'absolute', top: '10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(245,197,24,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      </section>

      <div className="container" style={{ position: 'relative', zIndex: 20, paddingBottom: '10rem' }}>
        <div className="flex mobile-stack gap-12 items-start">
          {/* Main Content Area */}
          <div className="flex-1" style={{ maxWidth: '850px', width: '100%' }}>
            <div className="glass-panel p-10 md:p-16 animate-reveal" style={{ 
              borderRadius: '40px', 
              background: 'rgba(255,255,255,0.01)', 
              border: '1px solid rgba(255,255,255,0.05)', 
              animationDelay: '0.2s' 
            }}>
              <div className="blog-content-container animate-reveal" style={{ animationDelay: '0.2s' }}>
                <style>
                  {`
                    .blog-content-render {
                      font-size: 1.15rem;
                      line-height: 1.9;
                      color: rgba(255,255,255,0.85);
                    }
                    .blog-content-render h1 { font-size: 2.5rem; color: #fff; margin-bottom: 2rem; margin-top: 3rem; font-weight: 900; letter-spacing: -1px; }
                    .blog-content-render h2 { font-size: 2rem; color: #fff; margin-bottom: 1.5rem; margin-top: 2.5rem; font-weight: 850; letter-spacing: -0.5px; }
                    .blog-content-render h3 { font-size: 1.6rem; color: #fff; margin-bottom: 1.2rem; margin-top: 2rem; font-weight: 800; }
                    .blog-content-render p { margin-bottom: 1.8rem; }
                    .blog-content-render ul, .blog-content-render ol { margin-bottom: 2rem; padding-left: 1.5rem; }
                    .blog-content-render li { margin-bottom: 0.8rem; }
                    .blog-content-render strong { color: #fff; font-weight: 700; }
                    .blog-content-render a { color: #F5C518; text-decoration: underline; font-weight: 600; }
                    .blog-content-render blockquote { 
                      border-left: 4px solid #F5C518; 
                      padding-left: 2rem; 
                      margin: 3rem 0; 
                      font-style: italic; 
                      color: rgba(255,255,255,0.9);
                      font-size: 1.3rem;
                    }
                  `}
                </style>
                <div 
                  className="blog-content-render"
                  dangerouslySetInnerHTML={{ __html: blog.content }} 
                />
              </div>

              <div className="flex items-center justify-between mt-16 pt-12 mobile-stack gap-8" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
                <Link to="/blogs" className="hp-btn-primary" style={{ padding: '0.8rem 1.8rem', borderRadius: '14px', fontSize: '0.9rem' }}>
                  Explore More Articles
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Metadata */}
          <div style={{ width: '320px', position: 'sticky', top: '100px' }} className="mobile-hidden">
            <div className="flex-col gap-6">
              <div className="glass-panel p-8 animate-reveal" style={{ borderRadius: '32px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', animationDelay: '0.3s' }}>
                <h5 className="text-muted text-xs uppercase tracking-widest font-bold mb-6">Article Info</h5>
                <div className="flex-col gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                      <User size={18} color="var(--hp-yellow)" />
                    </div>
                    <div className="flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Author</span>
                      <strong className="text-sm">PPR Admin</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Calendar size={18} className="text-muted" />
                    </div>
                    <div className="flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Published</span>
                      <strong className="text-sm">{new Date(blog.createdAt?.seconds * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                      <Clock size={18} className="text-muted" />
                    </div>
                    <div className="flex-col">
                      <span className="text-[10px] uppercase tracking-wider text-muted font-bold">Read Time</span>
                      <strong className="text-sm">{blog.readTime || '5 min read'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-8 mt-6 animate-reveal" style={{ borderRadius: '32px', background: 'rgba(245,197,24,0.02)', border: '1px solid rgba(245,197,24,0.1)', animationDelay: '0.4s' }}>
                <h5 className="hp-yellow text-[10px] uppercase tracking-widest font-black mb-3">Aspirant Pathway</h5>
                <p className="text-xs text-muted leading-relaxed mb-6">Master NEET & JEE with elite guidance. Get started with our automated systems today.</p>
                <Link to="/signup" className="hp-btn-primary w-full text-center" style={{ fontSize: '0.75rem', padding: '0.7rem' }}>Join the Elite</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
