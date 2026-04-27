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
    // Phase 2: Restricted (5th onwards) — Full Cinematic Lockdown
    return (
      <div style={{
        textAlign: 'center', padding: '4rem 2rem',
        border: '1px solid rgba(245,197,24,0.3)',
        borderRadius: '32px',
        background: 'linear-gradient(135deg, rgba(10,10,10,0.8) 0%, rgba(20,20,20,0.9) 100%)',
        backdropFilter: 'blur(20px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(https://www.transparenttextures.com/patterns/carbon-fibre.png)', opacity: 0.05 }} />
        <div style={{ background: 'linear-gradient(135deg, #F5C518 0%, #D4A706 100%)', width: '72px', height: '72px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', boxShadow: '0 10px 30px rgba(245,197,24,0.3)' }}>
          <Lock size={32} color="#000" />
        </div>
        <h3 style={{ color: '#F5C518', marginBottom: '0.5rem', fontWeight: 900, fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Library Locked</h3>
        <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Tuition Fee Pending</p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', maxWidth: '320px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
          Please transfer the amount to your teacher's account and upload the Transaction ID for 30-minute verification.
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

  // Phase 1: Overdue (1st - 4th) — Show with Watermark
  const isOverdue = !isLocked && materials.length > 0; // In Dashboard we pass isLocked only for Restricted

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', position: 'relative' }}>
      {materials.map(m => (
        <div key={m.id} style={{ position: 'relative' }}>
          <a
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
              filter: isOverdue ? 'sepia(0.2) contrast(0.9)' : 'none'
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
          
          {/* Overdue Watermark Overlay */}
          {isOverdue && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <span style={{ 
                transform: 'rotate(-15deg)', fontSize: '2rem', fontWeight: 900, 
                color: 'rgba(245,197,24,0.15)', whiteSpace: 'nowrap',
                letterSpacing: '10px', textTransform: 'uppercase'
              }}>
                FEE DUE • FEE DUE
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
