import React, { useState, useEffect } from 'react';
import { Trash2, Video, FileVideo, Loader2, Plus, Play, Zap } from 'lucide-react';
import { uploadFileToStorage, addEducationalVideo, subscribeEducationalVideos, deleteEducationalVideo } from '../../db.service';
import { useToast } from '../Toast';

export default function EducationalVideoManager() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const toast = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    sourceType: 'youtube', // 'youtube' or 'upload'
    videoUrl: '',
    thumbnailUrl: '',
    category: 'General'
  });

  useEffect(() => {
    const unsub = subscribeEducationalVideos(setVideos);
    return () => unsub();
  }, []);

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    try {
      const url = await uploadFileToStorage(file, `edu_videos/${field}`, (pct) => setUploadProgress(pct));
      setForm(prev => ({ ...prev, [field]: url }));
      toast.success(`${field === 'thumbnailUrl' ? 'Thumbnail' : 'Video'} uploaded!`);
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.thumbnailUrl) {
      toast.error('Title and Thumbnail are required');
      return;
    }
    if (form.sourceType === 'youtube' && !form.videoUrl) {
      toast.error('YouTube URL is required');
      return;
    }
    if (form.sourceType === 'upload' && !form.videoUrl) {
      toast.error('Video file is required');
      return;
    }

    setIsLoading(true);
    try {
      await addEducationalVideo(form);
      toast.success('Educational video published! 🎬');
      setForm({
        title: '',
        description: '',
        sourceType: 'youtube',
        videoUrl: '',
        thumbnailUrl: '',
        category: 'General'
      });
    } catch (err) {
      toast.error('Failed to publish video');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteEducationalVideo(id);
        toast.success('Video removed');
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  return (
    <div className="animate-premium">
      <div className="glass-card p-8 mb-8" style={{ border: '1px solid rgba(245,197,24,0.2)' }}>
        <h3 className="mb-6 flex items-center gap-3 text-xl font-black italic tracking-tighter">
          <Video size={24} color="var(--admin-accent)" /> PUBLISH EDUCATIONAL CONTENT
        </h3>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-6">
            <div className="input-group">
              <label className="input-label">Content Title</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Masterclass: Physics for NEET 2026"
                value={form.title}
                onChange={e => setForm({...form, title: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea 
                className="input-field" 
                style={{ height: '120px', resize: 'none' }}
                placeholder="Detailed explanation of the video content..."
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label className="input-label">Category</label>
                <select 
                  className="input-field"
                  value={form.category}
                  onChange={e => setForm({...form, category: e.target.value})}
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Source Type</label>
                <div className="flex gap-2">
                  <button 
                    type="button"
                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${form.sourceType === 'youtube' ? 'bg-[rgba(245,197,24,0.1)] border-[var(--admin-accent)] text-[var(--admin-accent)]' : 'border-white/10 text-white/40'}`}
                    onClick={() => setForm({...form, sourceType: 'youtube'})}
                  >
                    <Play size={16} /> YouTube
                  </button>
                  <button 
                    type="button"
                    className={`flex-1 py-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${form.sourceType === 'upload' ? 'bg-[rgba(245,197,24,0.1)] border-[var(--admin-accent)] text-[var(--admin-accent)]' : 'border-white/10 text-white/40'}`}
                    onClick={() => setForm({...form, sourceType: 'upload'})}
                  >
                    <FileVideo size={16} /> Upload
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="input-group">
              <label className="input-label">Thumbnail (16:9 Recommended)</label>
              <div className="thumbnail-upload-zone relative h-48 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 overflow-hidden bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer">
                {form.thumbnailUrl ? (
                  <>
                    <img src={form.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-500"
                      onClick={() => setForm({...form, thumbnailUrl: ''})}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleFileUpload(e, 'thumbnailUrl')} />
                    <Plus size={32} className="text-white/20" />
                    <span className="text-sm text-white/40">Drop thumbnail here</span>
                  </>
                )}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">{form.sourceType === 'youtube' ? 'YouTube Link' : 'Video File'}</label>
              {form.sourceType === 'youtube' ? (
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="https://youtube.com/watch?v=..."
                  value={form.videoUrl}
                  onChange={e => setForm({...form, videoUrl: e.target.value})}
                />
              ) : (
                <div className="h-14 relative rounded-xl border border-white/10 flex items-center px-4 bg-white/[0.02]">
                  {form.videoUrl ? (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm truncate max-w-[200px]">{form.videoUrl}</span>
                      <button type="button" onClick={() => setForm({...form, videoUrl: ''})} className="text-red-400 hover:text-red-300"><Trash2 size={16}/></button>
                    </div>
                  ) : (
                    <>
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="video/*" onChange={e => handleFileUpload(e, 'videoUrl')} />
                      <FileVideo size={18} className="mr-3 text-[var(--admin-accent)]" />
                      <span className="text-sm text-white/40">Choose video file...</span>
                    </>
                  )}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading || isUploading}
              className="btn-premium w-full mt-auto py-5 flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              PUBLISH VIDEO NOW
            </button>
          </div>
        </form>

        {isUploading && (
          <div className="mt-8">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[var(--admin-accent)] transition-all duration-300"
                style={{ width: `${uploadProgress}%`, boxShadow: '0 0 15px var(--admin-accent)' }}
              />
            </div>
            <p className="text-center text-xs mt-2 text-white/40 font-mono tracking-widest uppercase">
              UPLOADING ASSETS • {uploadProgress}% COMPLETE
            </p>
          </div>
        )}
      </div>

      <div className="glass-card p-8">
        <h3 className="mb-8 text-lg font-bold text-white/80 uppercase tracking-widest">Library Content ({videos.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map(video => (
            <div key={video.id} className="video-admin-card group relative rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden hover:border-[var(--admin-accent)] transition-all">
              <div className="aspect-video relative overflow-hidden">
                <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="p-3 rounded-full bg-[var(--admin-accent)] text-black">
                     <Play fill="currentColor" size={24} />
                   </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-white/80 font-bold uppercase tracking-wider">
                  {video.category}
                </div>
                {video.sourceType === 'youtube' && (
                  <div className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white shadow-lg">
                    <Play size={14} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold truncate mb-1">{video.title}</h4>
                <p className="text-xs text-white/40 line-clamp-2 h-8">{video.description}</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                  <span className="text-[10px] text-white/20 font-mono">{new Date(video.created_at?.toDate()).toLocaleDateString()}</span>
                  <button 
                    onClick={() => handleDelete(video.id)}
                    className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
              <Video className="mx-auto mb-4 text-white/10" size={48} />
              <p className="text-white/20 font-medium">Your educational library is currently empty.</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .video-admin-card {
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .video-admin-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -15px rgba(245,197,24,0.1);
        }
      `}} />
    </div>
  );
}
