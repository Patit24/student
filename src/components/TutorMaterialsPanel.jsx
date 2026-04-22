import React, { useState, useEffect } from 'react';
import { FileText, Upload, Loader, ExternalLink, Trash2 } from 'lucide-react';
import { uploadMaterial, subscribeTutorMaterials } from '../db.service';
import { useToast } from './Toast';
import { useAppContext } from '../context/AuthContext';

/**
 * TutorMaterialsPanel
 * Tutor selects a batch, picks a PDF, uploads it.
 * Live listener shows all uploaded materials with batch labels.
 */
export default function TutorMaterialsPanel({ myBatches }) {
  const { currentUser, isMockMode, mockMaterials, setMockMaterials } = useAppContext();
  const toast = useToast();

  const [selectedBatch, setSelectedBatch] = useState('');
  const [file,          setFile]          = useState(null);
  const [progress,      setProgress]      = useState(0);
  const [uploading,     setUploading]     = useState(false);
  const [materials,     setMaterials]     = useState([]);

  // ── Live listener (real Firebase) ──
  useEffect(() => {
    if (isMockMode || !currentUser?.uid) return;
    const unsub = subscribeTutorMaterials(currentUser.uid, setMaterials);
    return unsub;
  }, [isMockMode, currentUser?.uid]);

  // ── Mock mode: use context state ──
  useEffect(() => {
    if (isMockMode) setMaterials(mockMaterials || []);
  }, [isMockMode, mockMaterials]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !selectedBatch) return;

    const batch = myBatches.find(b => b.id === selectedBatch);
    setUploading(true);
    setProgress(0);

    try {
      if (isMockMode) {
        // Mock: simulate progress
        for (let p = 10; p <= 100; p += 20) {
          await new Promise(r => setTimeout(r, 100));
          setProgress(p);
        }
        const mockDoc = {
          id:         `mat-${Date.now()}`,
          file_name:  file.name,
          file_url:   URL.createObjectURL(file),
          batch_id:   selectedBatch,
          batch_name: batch?.name || '—',
          tutor_id:   currentUser?.uid,
          created_at: new Date().toISOString(),
        };
        setMockMaterials?.(prev => [mockDoc, ...(prev || [])]);
        toast.success(`"${file.name}" uploaded to ${batch?.name}`);
      } else {
        await uploadMaterial(
          file,
          currentUser.uid,
          selectedBatch,
          batch?.name || '',
          setProgress,
        );
        toast.success(`"${file.name}" uploaded to ${batch?.name} ✅`);
      }

      setFile(null);
      setProgress(0);
      // reset file input
      document.getElementById('mat-file-input').value = '';
    } catch (err) {
      console.error(err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const batchLabel = (bId) => myBatches.find(b => b.id === bId)?.name || bId;

  return (
    <div>
      {/* Upload form */}
      <div className="glass-panel p-8" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Upload size={18} /> Upload Study Material
        </h3>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <select
            className="input-field"
            value={selectedBatch}
            onChange={e => setSelectedBatch(e.target.value)}
            required
          >
            <option value="" disabled>Select target batch…</option>
            {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>

          <input
            id="mat-file-input"
            type="file"
            accept="application/pdf,.pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc"
            onChange={e => setFile(e.target.files[0] || null)}
            required
            style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', color: '#94A3B8', fontSize: '0.85rem' }}
          />

          {file && (
            <p style={{ fontSize: '0.78rem', color: '#7A8BA8' }}>
              📄 {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}

          {uploading && (
            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#F5C518', transition: 'width 0.3s ease', borderRadius: '999px' }} />
            </div>
          )}

          <button
            type="submit"
            disabled={uploading || !file || !selectedBatch}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center',
              background: '#F5C518', color: '#07090F',
              border: 'none', borderRadius: '9px',
              padding: '0.75rem', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', opacity: (uploading || !file || !selectedBatch) ? 0.5 : 1,
            }}
          >
            {uploading ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Uploading {progress}%</> : <><Upload size={16} /> Upload to Batch</>}
          </button>
        </form>
      </div>

      {/* Materials list */}
      <div className="glass-panel p-8">
        <h3 style={{ marginBottom: '1rem' }}>Uploaded Materials ({materials.length})</h3>
        {materials.length === 0 ? (
          <p style={{ color: '#7A8BA8', fontSize: '0.85rem' }}>No materials uploaded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {materials.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.75rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px',
              }}>
                <FileText size={18} color="#F5C518" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F0F4FF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.file_name}</p>
                  <p style={{ fontSize: '0.72rem', color: '#7A8BA8', margin: 0 }}>
                    {batchLabel(m.batch_id)} · {m.created_at?.toDate ? new Date(m.created_at.toDate()).toLocaleDateString() : '—'}
                  </p>
                </div>
                <span style={{ fontSize: '0.7rem', background: 'rgba(245,197,24,0.12)', color: '#F5C518', border: '1px solid rgba(245,197,24,0.25)', padding: '0.15rem 0.5rem', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                  {batchLabel(m.batch_id)}
                </span>
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#818CF8', flexShrink: 0 }}
                  title="Open file"
                >
                  <ExternalLink size={15} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
