import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../components/Toast';

/**
 * FileUploadVercel — Backend Relay Upload Component
 * Bypasses Firebase Storage CORS by using your Vercel backend as a proxy.
 */
export default function FileUploadVercel({ 
  uid, 
  folder = 'resumes', 
  onUploadSuccess, 
  label = 'Upload Photo',
  className = '' 
}) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const toast = useToast();

  const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:4000';
  const cleanApiUrl = API_URL.replace(/\/$/, "");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    setUploading(true);
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('uid', uid || 'guest');
    formData.append('folder', folder);

    try {
      const response = await fetch(`${cleanApiUrl}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setStatus('success');
      toast.success('Upload complete! ✨');
      
      if (onUploadSuccess) {
        onUploadSuccess(result.url);
      }
    } catch (err) {
      console.error('Relay Upload Error:', err);
      setStatus('error');
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`file-upload-wrapper ${className}`}>
      <label className="upload-trigger" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: '120px',
        border: '2px dashed var(--border)',
        borderRadius: '16px',
        cursor: uploading ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        background: 'rgba(255,255,255,0.02)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <input 
          type="file" 
          onChange={handleFileChange} 
          disabled={uploading} 
          style={{ display: 'none' }}
          accept="image/*,application/pdf"
        />
        
        {status === 'uploading' ? (
          <div className="flex-col items-center gap-2">
            <Loader2 className="animate-spin" size={32} color="var(--primary)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Syncing with Firebase...</span>
          </div>
        ) : status === 'success' ? (
          <div className="flex-col items-center gap-2">
            <CheckCircle2 size={32} color="#10B981" />
            <span style={{ fontSize: '0.8rem', color: '#10B981' }}>Success</span>
          </div>
        ) : status === 'error' ? (
          <div className="flex-col items-center gap-2">
            <AlertCircle size={32} color="#EF4444" />
            <span style={{ fontSize: '0.8rem', color: '#EF4444' }}>Retry Upload</span>
          </div>
        ) : (
          <div className="flex-col items-center gap-2">
            <Camera size={32} color="var(--text-muted)" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{label}</span>
          </div>
        )}
      </label>

      <style>{`
        .upload-trigger:hover {
          border-color: var(--primary);
          background: rgba(79,70,229,0.05);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
