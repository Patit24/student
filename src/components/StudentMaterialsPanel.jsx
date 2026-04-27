import React, { useState, useEffect } from 'react';
import { FileText, Lock, ExternalLink, Loader } from 'lucide-react';
import { subscribeMaterials } from '../db.service';
import { useAppContext } from '../context/AuthContext';

/**
 * StudentMaterialsPanel
 * Shows PDFs uploaded by the tutor for the student's batch.
 * Uses a live Firestore listener filtered by batch_id.
 * If student is overdue, files are locked.
 */
export default function StudentMaterialsPanel({ batchId, isLocked }) {
  const { isMockMode, mockMaterials } = useAppContext();
  const [materials, setMaterials] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!batchId) { setLoading(false); return; }

    if (isMockMode) {
      // Filter mock materials by batch
      const filtered = (mockMaterials || []).filter(m => m.batch_id === batchId);
      setMaterials(filtered);
      setLoading(false);
      return;
    }

    // Real Firebase — live listener
    const unsub = subscribeMaterials(batchId, (items) => {
      // Sort newest first
      const sorted = [...items].sort((a, b) => {
        const ta = a.created_at?.toMillis?.() ?? 0;
        const tb = b.created_at?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setMaterials(sorted);
      setLoading(false);
    });

    return unsub; // cleanup listener on unmount
  }, [batchId, isMockMode, mockMaterials]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#7A8BA8', padding: '1rem' }}>
        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading notes…
      </div>
    );
  }

  if (isLocked) {
    return (
      <div style={{
        textAlign: 'center', padding: '3rem 2rem',
        border: '1px solid rgba(245,197,24,0.2)',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, rgba(245,197,24,0.08) 0%, rgba(245,197,24,0.03) 100%)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', top: '-20px', right: '-20px', 
          width: '100px', height: '100px', 
          background: 'rgba(245,197,24,0.1)', borderRadius: '50%', blur: '40px' 
        }} />
        <div style={{ background: 'rgba(245,197,24,0.2)', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <Lock size={28} color="#F5C518" />
        </div>
        <h4 style={{ color: '#F5C518', marginBottom: '0.5rem', fontWeight: 800, fontSize: '1.1rem' }}>Notes & Materials Locked</h4>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', maxWidth: '300px', margin: '0 auto', lineHeight: 1.5 }}>
          Hi student, your monthly access to <strong>High-Yield Notes</strong> has been suspended due to overdue fees. Clear your dues to instantly unlock.
        </p>
      </div>
    );
  }

  if (!batchId) {
    return <p style={{ color: '#7A8BA8', fontSize: '0.85rem' }}>You are not assigned to a batch yet.</p>;
  }

  if (materials.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#7A8BA8' }}>
        <FileText size={28} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
        <p style={{ fontSize: '0.85rem' }}>No study materials yet. Your tutor will upload them here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {materials.map(m => (
        <a
          key={m.id}
          href={m.file_url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.85rem',
            padding: '0.85rem 1rem',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            textDecoration: 'none',
            transition: 'background 0.15s, border-color 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(245,197,24,0.06)';
            e.currentTarget.style.borderColor = 'rgba(245,197,24,0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          }}
        >
          <FileText size={20} color="#F5C518" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#F0F4FF', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {m.file_name}
            </p>
            <p style={{ fontSize: '0.72rem', color: '#7A8BA8', margin: 0 }}>
              {m.created_at?.toDate
                ? new Date(m.created_at.toDate()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'
              }
            </p>
          </div>
          <ExternalLink size={14} color="#7A8BA8" style={{ flexShrink: 0 }} />
        </a>
      ))}
    </div>
  );
}
