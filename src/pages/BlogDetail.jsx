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
    <div className="container" style={{ paddingTop: '8rem', paddingBottom: '8rem', maxWidth: '900px' }}>
      <Link to="/blogs" className="flex items-center gap-2 text-muted hover:text-yellow-500 transition-colors mb-8">
        <ChevronLeft size={20} /> Back to Insights
      </Link>

      <div className="flex-col gap-6 animate-premium">
        <div className="flex items-center gap-2 text-xs text-yellow-500 font-bold uppercase tracking-widest">
          <Tag size={12} /> {blog.category || 'General'}
        </div>
        
        <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, margin: 0 }}>
          {blog.title}
        </h1>

        <div className="flex items-center gap-6 text-sm text-muted glass-panel px-6 py-4" style={{ borderRadius: '16px' }}>
          <div className="flex items-center gap-2"><User size={16} /> By Admin</div>
          <div className="flex items-center gap-2"><Calendar size={16} /> {new Date(blog.createdAt?.seconds * 1000).toLocaleDateString()}</div>
          <div className="flex items-center gap-2"><Clock size={16} /> {blog.readTime || '5 min read'}</div>
        </div>

        {blog.coverImage && (
          <div className="glass-panel p-2" style={{ borderRadius: '24px' }}>
            <img 
              src={blog.coverImage} 
              alt={blog.title} 
              style={{ width: '100%', borderRadius: '16px', display: 'block', maxHeight: '500px', objectFit: 'cover' }} 
            />
          </div>
        )}

        <div className="blog-content mt-8" style={{ fontSize: '1.2rem', lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' }}>
          {blog.content.split('\n').map((para, i) => (
            para.trim() && <p key={i} className="mb-6">{para}</p>
          ))}
        </div>

        <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
          <div className="flex gap-4">
            <button className="hp-btn-outline" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
              <Share2 size={18} /> Share
            </button>
          </div>
          <Link to="/blogs" className="hp-btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '12px' }}>
            More Articles
          </Link>
        </div>
      </div>
    </div>
  );
}
