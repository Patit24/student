import React, { useState } from 'react';
import {
  Users, Edit3, ArrowRightLeft, AlertTriangle, CheckCircle,
  Trash2, Phone, Mail, X, Save, ChevronRight, Search, MessageCircle, Calendar,
} from 'lucide-react';
import { useAppContext } from '../context/AuthContext';
import { useToast } from './Toast';
import { db } from '../firebase';
import { doc, updateDoc, deleteField } from 'firebase/firestore';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const STATUS_STYLES = {
  active:  { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', border: 'rgba(34,197,94,0.3)',  label: '✓ Active'  },
  paid:    { bg: 'rgba(34,197,94,0.12)',  color: '#22C55E', border: 'rgba(34,197,94,0.3)',  label: '✓ Paid'    },
  overdue: { bg: 'rgba(239,68,68,0.12)',  color: '#EF4444', border: 'rgba(239,68,68,0.3)',  label: '⚠ Overdue' },
  unpaid:  { bg: 'rgba(245,197,24,0.12)', color: '#F5C518', border: 'rgba(245,197,24,0.3)', label: '◉ Unpaid'  },
  default: { bg: 'rgba(245,197,24,0.12)', color: '#F5C518', border: 'rgba(245,197,24,0.3)', label: '— Unknown' },
};
function statusStyle(s) { return STATUS_STYLES[s] || STATUS_STYLES.default; }

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getMonthRange(admissionDate) {
  const start = admissionDate ? new Date(admissionDate) : new Date(new Date().getFullYear(), 0, 1);
  const now = new Date();
  const months = [];
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= now) {
    months.push({ key: `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}`, label: `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}` });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

const inputStyle = {
  width: '100%', padding: '0.6rem 0.9rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '8px', color: '#F0F4FF',
  fontSize: '0.88rem', outline: 'none',
  boxSizing: 'border-box',
};
const labelStyle = {
  fontSize: '0.72rem', color: '#7A8BA8',
  textTransform: 'uppercase', letterSpacing: '0.05em',
  marginBottom: '0.3rem', display: 'block',
};
const actionBtn = (color = '#F0F4FF') => ({
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  width: '100%', padding: '0.65rem 1rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: '9px', color, fontSize: '0.85rem',
  fontWeight: 600, cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.18s',
});

/* ── WhatsApp Reminder ───────────────────────────────────────────────────── */
function sendWhatsAppReminder(student, tutorName, monthLabel) {
  const phone = (student.phone || '').replace(/\D/g, '');
  const num = phone.startsWith('91') ? phone : `91${phone}`;
  const msg = `Hi ${student.name}, this is a reminder from ${tutorName} regarding your tuition fees for *${monthLabel}*. Currently, it is marked as *Unpaid* in the PPR Education portal. Please clear the dues to avoid Batch Library restriction. — PPR Education`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ── Monthly Payment Grid ────────────────────────────────────────────────── */
function PaymentHistoryGrid({ student, tutorName }) {
  const { setMockStudents, isMockMode } = useAppContext();
  const toast = useToast();
  const months = getMonthRange(student.admission_date);
  const history = student.payment_history || {};

  async function toggleMonth(monthKey, currentStatus) {
    const newStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const newHistory = { ...history, [monthKey]: newStatus };
    
    // Update overdue status based on payment history
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const hasOverdue = Object.entries(newHistory).some(([k, v]) => v !== 'paid' && k < currentMonthKey);
    const overallStatus = hasOverdue ? 'overdue' : (newHistory[currentMonthKey] === 'paid' ? 'paid' : 'unpaid');

    const payload = { payment_history: newHistory, payment_status: overallStatus };
    setMockStudents(prev => prev.map(s => s.id === student.id ? { ...s, ...payload } : s));
    if (!isMockMode && db) {
      try { await updateDoc(doc(db, 'users', student.id), payload); }
      catch (e) { console.error(e); }
    }
    toast.success(`${MONTH_NAMES[parseInt(monthKey.split('-')[1]) - 1]} marked as ${newStatus}`);
  }

  return (
    <div>
      <p style={{ ...labelStyle, marginBottom: '0.7rem', fontSize: '0.78rem', color: '#94A3B8' }}>📅 PAYMENT HISTORY</p>
      <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', WebkitOverflowScrolling: 'touch' }}>
        {months.map(m => {
          const status = history[m.key] || 'unpaid';
          const isPaid = status === 'paid';
          return (
            <div key={m.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem', flexShrink: 0, minWidth: '60px' }}>
              <span style={{ fontSize: '0.65rem', color: '#7A8BA8', fontWeight: 600 }}>{m.label}</span>
              <button
                onClick={() => toggleMonth(m.key, status)}
                style={{
                  width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: isPaid ? 'flex-end' : 'flex-start',
                  padding: '0 3px', transition: 'all 0.3s',
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: isPaid ? '#22C55E' : '#EF4444',
                  transition: 'all 0.3s', boxShadow: `0 2px 8px ${isPaid ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                }} />
              </button>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: isPaid ? '#22C55E' : '#EF4444' }}>
                {isPaid ? 'Paid' : 'Unpaid'}
              </span>
              {!isPaid && (
                <button
                  onClick={() => sendWhatsAppReminder(student, tutorName, m.label)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.1rem', color: '#25D366' }}
                  title="Send WhatsApp Reminder"
                >
                  <MessageCircle size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Drawer ──────────────────────────────────────────────────────────────── */
function StudentDrawer({ student, batches, onClose, tutorName }) {
  const { updatePaymentStatus, setMockStudents, isMockMode } = useAppContext();
  const toast = useToast();

  const [name,       setName]       = useState(student.name);
  const [phone,      setPhone]      = useState(student.phone || '');
  const [monthlyFee, setMonthlyFee] = useState(student.monthly_fee || 2500);
  const [batchId,    setBatchId]    = useState(student.batch_id || '');
  const [saving,     setSaving]     = useState(false);

  /* write helper */
  async function firestoreUpdate(payload) {
    if (!isMockMode && db) {
      await updateDoc(doc(db, 'users', student.id), payload);
    }
    setMockStudents(prev =>
      prev.map(s => s.id === student.id ? { ...s, ...payload } : s)
    );
  }

  async function handleSaveInfo() {
    setSaving(true);
    try {
      await firestoreUpdate({ name, phone, monthly_fee: Number(monthlyFee) });
      toast.success(`${name}'s info updated ✅`);
    } catch (e) { toast.error(e.message); }
    setSaving(false);
  }

  async function handleChangeBatch() {
    if (!batchId || batchId === student.batch_id) return;
    try {
      await firestoreUpdate({ batch_id: batchId });
      toast.success(`Moved to ${batches.find(b => b.id === batchId)?.name} ✅`);
    } catch (e) { toast.error(e.message); }
  }

  async function handleMarkOverdue() {
    try {
      await firestoreUpdate({ payment_status: 'overdue', outstanding_balance: Number(monthlyFee), paid_at: null });
      toast.success(`${student.name} marked Overdue`);
    } catch (e) { toast.error(e.message); }
  }

  async function handleMarkPaid(method) {
    try {
      await updatePaymentStatus(student.id, method);
      toast.success(`${student.name} marked Paid (${method}) ✅`);
    } catch (e) { toast.error(e.message); }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${student.name} from your roster?`)) return;
    try {
      if (!isMockMode && db) {
        await updateDoc(doc(db, 'users', student.id), { tutorId: '', batch_id: '' });
      }
      setMockStudents(prev => prev.filter(s => s.id !== student.id));
      toast.success(`${student.name} removed`);
      onClose();
    } catch (e) { toast.error(e.message); }
  }

  const st = statusStyle(student.payment_status);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '100%', maxWidth: '440px', zIndex: 9001, background: '#0D1425', borderLeft: '1px solid rgba(255,255,255,0.08)', overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ color: '#F0F4FF', margin: 0 }}>{student.name}</h2>
            <p style={{ color: '#7A8BA8', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>{student.email}</p>
            {student.admission_date && (
              <p style={{ color: '#F5C518', fontSize: '0.72rem', margin: '0.3rem 0 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={12} /> Admitted: {new Date(student.admission_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7A8BA8', cursor: 'pointer', padding: '0.25rem' }}><X size={20} /></button>
        </div>

        {/* Status badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.8rem', borderRadius: '999px', background: st.bg, border: `1px solid ${st.border}`, color: st.color, fontSize: '0.8rem', fontWeight: 700, width: 'fit-content' }}>
          {st.label}
          {student.outstanding_balance > 0 && ` · ₹${student.outstanding_balance?.toLocaleString()} due`}
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: 0 }} />

        {/* ── Monthly Payment History Grid ── */}
        <PaymentHistoryGrid student={student} tutorName={tutorName} />

        <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: 0 }} />

        {/* ── Edit Basic Info ── */}
        <div>
          <p style={{ ...labelStyle, marginBottom: '0.7rem', fontSize: '0.78rem', color: '#94A3B8' }}>✏️ EDIT STUDENT INFO</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label style={labelStyle}>Phone Number</label><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" /></div>
            <div><label style={labelStyle}>Monthly Fee (₹)</label><input style={inputStyle} type="number" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} min="0" /></div>
            <button onClick={handleSaveInfo} disabled={saving} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.65rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: '#A5B4FC', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
              <Save size={15} /> {saving ? 'Saving…' : 'Save Info'}
            </button>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: 0 }} />

        {/* ── Change Batch ── */}
        <div>
          <p style={{ ...labelStyle, marginBottom: '0.7rem', fontSize: '0.78rem', color: '#94A3B8' }}>🔄 CHANGE BATCH</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <select value={batchId} onChange={e => setBatchId(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
              <option value="">Select batch…</option>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}{b.id === student.batch_id ? ' (current)' : ''}</option>)}
            </select>
            <button onClick={handleChangeBatch} disabled={!batchId || batchId === student.batch_id} style={{ padding: '0.65rem 1rem', background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.3)', color: '#F5C518', borderRadius: '9px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', flexShrink: 0, opacity: (!batchId || batchId === student.batch_id) ? 0.4 : 1 }}>
              <ArrowRightLeft size={15} />
            </button>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: 0 }} />

        {/* ── Payment Actions ── */}
        <div>
          <p style={{ ...labelStyle, marginBottom: '0.7rem', fontSize: '0.78rem', color: '#94A3B8' }}>💰 QUICK PAYMENT</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button style={actionBtn('#22C55E')} onClick={() => handleMarkPaid('cash')}><CheckCircle size={16} /> Mark Paid — Cash</button>
            <button style={actionBtn('#818CF8')} onClick={() => handleMarkPaid('digital')}><CheckCircle size={16} /> Mark Paid — Digital / UPI</button>
            <button style={actionBtn('#EF4444')} onClick={handleMarkOverdue}><AlertTriangle size={16} /> Mark as Overdue</button>
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: 0 }} />

        {/* ── Quick Contact ── */}
        <div>
          <p style={{ ...labelStyle, marginBottom: '0.7rem', fontSize: '0.78rem', color: '#94A3B8' }}>📢 QUICK CONTACT</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {student.phone && (
              <a href={`tel:${student.phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', borderRadius: '9px', fontWeight: 600, fontSize: '0.82rem', textDecoration: 'none' }}>
                <Phone size={14} /> Call
              </a>
            )}
            {student.phone && (
              <button onClick={() => sendWhatsAppReminder(student, tutorName, 'this month')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.25)', color: '#25D366', borderRadius: '9px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                <MessageCircle size={14} /> WhatsApp
              </button>
            )}
          </div>
        </div>

        <hr style={{ borderColor: 'rgba(255,255,255,0.07)', margin: 0 }} />

        <button style={actionBtn('#EF4444')} onClick={handleRemove}><Trash2 size={15} /> Remove from Roster</button>
      </div>
    </>
  );
}

/* ── Main Panel ──────────────────────────────────────────────────────────── */
export default function StudentManagePanel({ myStudents, myBatches, tutorName }) {
  const [search,   setSearch]   = useState('');
  const [filterB,  setFilterB]  = useState('');
  const [filterP,  setFilterP]  = useState('');
  const [selected, setSelected] = useState(null);

  const filtered = myStudents.filter(s => {
    const q = search.toLowerCase();
    const matchQ = !q || s.name?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q) || s.phone?.includes(q);
    const matchB = !filterB || s.batch_id === filterB;
    const matchP = !filterP || s.payment_status === filterP;
    return matchQ && matchB && matchP;
  });

  return (
    <div>
      {/* ── Filters bar ── */}
      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#7A8BA8' }} />
          <input style={{ ...inputStyle, paddingLeft: '2.2rem' }} placeholder="Search name, email, phone…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...inputStyle, flex: 1, minWidth: '130px' }} value={filterB} onChange={e => setFilterB(e.target.value)}>
          <option value="">All Batches</option>
          {myBatches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select style={{ ...inputStyle, flex: 1, minWidth: '130px' }} value={filterP} onChange={e => setFilterP(e.target.value)}>
          <option value="">All Payments</option>
          <option value="paid">Paid</option>
          <option value="active">Active</option>
          <option value="unpaid">Unpaid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* ── Count badges ── */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { label: `Total ${filtered.length}`,  color: '#94A3B8', bg: 'rgba(148,163,184,0.1)' },
          { label: `✓ Paid ${myStudents.filter(s=>s.payment_status==='active'||s.payment_status==='paid').length}`, color: '#22C55E', bg: 'rgba(34,197,94,0.08)' },
          { label: `◉ Unpaid ${myStudents.filter(s=>s.payment_status==='unpaid').length}`, color: '#F5C518', bg: 'rgba(245,197,24,0.08)' },
          { label: `⚠ Overdue ${myStudents.filter(s=>s.payment_status==='overdue').length}`, color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
        ].map(b => (
          <span key={b.label} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.7rem', borderRadius: '999px', color: b.color, background: b.bg }}>{b.label}</span>
        ))}
      </div>

      {/* ── Student Cards ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7A8BA8' }}>
          <Users size={32} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
          <p>No students match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(s => {
            const st = statusStyle(s.payment_status);
            const batchName = myBatches.find(b => b.id === s.batch_id)?.name || '—';
            return (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  padding: '0.9rem 1rem',
                  background: s.payment_status === 'overdue' ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${s.payment_status === 'overdue' ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: '12px', cursor: 'pointer', transition: 'all 0.18s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = s.payment_status === 'overdue' ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.03)'}
              >
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0, background: s.payment_status === 'overdue' ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: s.payment_status === 'overdue' ? '#EF4444' : '#818CF8' }}>
                  {s.name?.charAt(0)?.toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: '#F0F4FF', margin: 0, fontSize: '0.9rem' }}>{s.name}</p>
                  <p style={{ fontSize: '0.72rem', color: '#7A8BA8', margin: 0 }}>{s.phone || s.email} · {batchName}</p>
                </div>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', flexShrink: 0, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{st.label}</span>
                <ChevronRight size={16} color="#7A8BA8" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {selected && <StudentDrawer student={selected} batches={myBatches} onClose={() => setSelected(null)} tutorName={tutorName} />}
    </div>
  );
}
