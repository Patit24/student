import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Play, Calendar, User, Share2, ThumbsUp, ChevronRight, Loader2, ArrowLeft, Clock } from 'lucide-react';
import { subscribeEducationalVideos } from '../db.service';

export default function VideoDetail() {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'educational_videos', videoId));
        if (snap.exists()) {
          setVideo({ id: snap.id, ...snap.data() });
        } else {
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();

    const unsub = subscribeEducationalVideos((videos) => {
      setRelatedVideos(videos.filter(v => v.id !== videoId).slice(0, 5));
    });
    return () => unsub();
  }, [videoId, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <Loader2 className="animate-spin text-[var(--accent)]" size={48} />
      </div>
    );
  }

  if (!video) return null;

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : '';
  };

  return (
    <div className="video-detail-root">
      <div className="video-detail-container">
        
        {/* Header Navigation */}
        <div className="video-header-nav">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={20} /> Back
          </button>
          <div className="breadcrumb">
            <span>Library</span>
            <ChevronRight size={14} />
            <span>{video.category}</span>
            <ChevronRight size={14} />
            <span className="current">{video.title}</span>
          </div>
        </div>

        <div className="video-layout-main">
          {/* Left Side: Video Player (65%) */}
          <div className="video-player-section">
            <div className="player-wrapper-3d">
              {video.sourceType === 'youtube' ? (
                <iframe 
                  src={getYouTubeEmbedUrl(video.videoUrl)}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <video controls className="w-full h-full" poster={video.thumbnailUrl}>
                  <source src={video.videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
            
            <div className="video-main-meta glass-card">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h1 className="video-title">{video.title}</h1>
                   <div className="meta-pills">
                     <span className="pill"><Calendar size={14}/> {new Date(video.created_at?.toDate()).toLocaleDateString()}</span>
                     <span className="pill"><Clock size={14}/> {video.duration || 'Full Session'}</span>
                     <span className="pill category">{video.category}</span>
                   </div>
                 </div>
                 <div className="flex gap-3">
                   <button className="action-btn"><ThumbsUp size={18} /> 24</button>
                   <button className="action-btn"><Share2 size={18} /> Share</button>
                 </div>
               </div>
               
               <div className="description-box">
                 <h3>Description</h3>
                 <p>{video.description}</p>
               </div>
            </div>
          </div>

          {/* Right Side: Related & Sidebar (35%) */}
          <div className="video-sidebar-section">
            <div className="sidebar-container glass-card">
              <h3 className="sidebar-title">Recommended Lessons</h3>
              <div className="related-list">
                {relatedVideos.map(rv => (
                  <div key={rv.id} className="related-card" onClick={() => navigate(`/video/${rv.id}`)}>
                    <div className="related-thumb">
                      <img src={rv.thumbnailUrl} alt={rv.title} />
                      <div className="play-overlay"><Play size={16} fill="white"/></div>
                    </div>
                    <div className="related-info">
                      <h4 className="related-title">{rv.title}</h4>
                      <p className="related-meta">{rv.category} • {new Date(rv.created_at?.toDate()).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {relatedVideos.length === 0 && (
                  <p className="empty-msg">No other videos found in this series.</p>
                )}
              </div>

              <div className="instructor-card mt-8">
                 <div className="flex items-center gap-4">
                   <div className="inst-avatar"><User size={24}/></div>
                   <div>
                     <div className="inst-name">PPREducation Admin</div>
                     <div className="inst-tag">Verified Instructor</div>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --accent: #f5c518;
          --bg: #050505;
          --glass: rgba(255, 255, 255, 0.03);
          --border: rgba(255, 255, 255, 0.08);
        }

        .video-detail-root {
          min-height: 100vh;
          background: radial-gradient(circle at top left, #0a0a0a 0%, #050505 100%);
          color: white;
          padding: 2rem;
          font-family: 'Inter', sans-serif;
        }

        .video-detail-container {
          max-width: 1600px;
          margin: 0 auto;
        }

        .video-header-nav {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          background: var(--glass);
          border: 1px solid var(--border);
          padding: 0.6rem 1.2rem;
          border-radius: 12px;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: white;
          color: black;
          transform: translateX(-5px);
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.4);
          font-weight: 500;
        }

        .breadcrumb .current {
          color: var(--accent);
        }

        .video-layout-main {
          display: flex;
          gap: 2.5rem;
        }

        .video-player-section {
          flex: 0 0 65%;
          max-width: 65%;
        }

        .video-sidebar-section {
          flex: 0 0 35%;
          max-width: 35%;
        }

        .player-wrapper-3d {
          width: 100%;
          aspect-ratio: 16/9;
          background: black;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 30px 60px -12px rgba(0,0,0,0.7), 0 18px 36px -18px rgba(245,197,24,0.1);
          border: 1px solid var(--border);
          margin-bottom: 2rem;
          position: relative;
        }

        .player-wrapper-3d iframe,
        .player-wrapper-3d video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .glass-card {
          background: var(--glass);
          backdrop-filter: blur(20px);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2rem;
        }

        .video-title {
          font-size: 2.2rem;
          font-weight: 900;
          margin-bottom: 1rem;
          letter-spacing: -0.03em;
        }

        .meta-pills {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .pill {
          padding: 0.5rem 1rem;
          background: rgba(255,255,255,0.05);
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: rgba(255,255,255,0.6);
        }

        .pill.category {
          background: rgba(245,197,24,0.1);
          color: var(--accent);
          border: 1px solid rgba(245,197,24,0.2);
        }

        .action-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          padding: 0.8rem 1.5rem;
          border-radius: 16px;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.3s;
        }

        .action-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }

        .description-box h3 {
          font-size: 1.1rem;
          font-weight: 800;
          margin-bottom: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.4);
        }

        .description-box p {
          color: rgba(255,255,255,0.7);
          line-height: 1.8;
          font-size: 1rem;
        }

        .sidebar-title {
          font-size: 1.2rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .related-card {
          display: flex;
          gap: 1rem;
          padding: 0.8rem;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s;
          margin-bottom: 0.5rem;
        }

        .related-card:hover {
          background: rgba(255,255,255,0.05);
        }

        .related-thumb {
          flex: 0 0 120px;
          height: 68px;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }

        .related-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .play-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: 0.3s;
        }

        .related-card:hover .play-overlay {
          opacity: 1;
        }

        .related-info {
          flex: 1;
          overflow: hidden;
        }

        .related-title {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 0.3rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .related-meta {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.4);
        }

        .inst-avatar {
          width: 48px;
          height: 48px;
          background: var(--accent);
          color: black;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .inst-name {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .inst-tag {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
        }

        @media (max-width: 1100px) {
          .video-layout-main {
            flex-direction: column;
          }
          .video-player-section, .video-sidebar-section {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
      `}} />
    </div>
  );
}
