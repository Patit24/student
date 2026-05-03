import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, Send, CreditCard, Check, User, DollarSign } from 'lucide-react';

const Card = ({ title, amount, color, icon: Icon }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(amount);
    if (start === end) {
      setDisplayValue(end);
      return;
    }
    
    let totalMiliseconds = 1500;
    let step = Math.ceil(end / 100);
    
    let timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(start);
      }
    }, 15);
    
    return () => clearInterval(timer);
  }, [amount]);

  return (
    <div className="glass-panel p-6 animate-fade-in" style={{ 
      flex: 1, 
      minWidth: '280px', 
      borderLeft: `4px solid ${color}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      background: 'rgba(255, 255, 255, 0.02)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '-10px', 
        right: '-10px', 
        width: '100px', 
        height: '100px', 
        background: `${color}05`, 
        borderRadius: '50%',
        filter: 'blur(30px)'
      }} />
      
      <div className="flex justify-between items-center">
        <div style={{ background: `${color}15`, padding: '0.75rem', borderRadius: '12px' }}>
          <Icon size={24} color={color} />
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue Track</span>
      </div>
      <div>
        <h2 style={{ fontSize: '2.2rem', margin: 0, color: '#F0F4FF', fontWeight: 800 }}>₹{displayValue.toLocaleString()}</h2>
        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{title}</p>
      </div>
    </div>
  );
};

export default function FinancialAnalytics({ myStudents }) {
  const now = new Date();
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth()+1).padStart(2,'0')}`;
  const salaryMonthLabel = prevMonthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // "May payment is for April salary"
  // So we track how many students have paid for the PREVIOUS month
  const salaryPaid = myStudents.filter(s => {
    const history = s.payment_history || {};
    return history[prevMonthKey] === 'paid';
  });

  const salaryUnpaid = myStudents.filter(s => {
    const history = s.payment_history || {};
    return history[prevMonthKey] !== 'paid';
  });

  const totalReceived = salaryPaid.reduce((acc, s) => acc + (s.monthly_fee || 2500), 0);
  const totalPending = salaryUnpaid.reduce((acc, s) => acc + (s.monthly_fee || 2500), 0);
  const expectedTotal = totalReceived + totalPending;

  const handleSendReminder = (student) => {
    const message = `Hi ${student.name}, this is a friendly reminder for your tuition fee payment of ₹${student.monthly_fee || 2500}. Kindly clear it at the earliest.`;
    window.open(`https://wa.me/91${student.phone || '9876543210'}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0.5rem 0' }}>
      {/* Bento Grid Analytics */}
      <div className="flex gap-6 mb-8" style={{ flexWrap: 'wrap' }}>
        <Card title={`Collected for ${salaryMonthLabel}`} amount={totalReceived} color="#22C55E" icon={TrendingUp} />
        <Card title={`Dues for ${salaryMonthLabel}`} amount={totalPending} color="#F59E0B" icon={Clock} />
        <Card title={`Total Target (${salaryMonthLabel})`} amount={expectedTotal} color="#6366F1" icon={Target} />
      </div>

      {/* Student Payment Roster */}
      <div className="glass-panel p-8" style={{ background: 'rgba(255, 255, 255, 0.01)' }}>
        <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="flex items-center gap-2"><DollarSign size={22} color="var(--primary)"/> Payment Roster</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.2rem' }}>Detailed breakdown of student fee collection.</p>
          </div>
          <div className="flex gap-2">
             <span style={{ fontSize: '0.75rem', background: 'rgba(34,197,94,0.08)', color: '#22C55E', padding: '0.3rem 0.8rem', borderRadius: '1rem', border: '1px solid rgba(34,197,94,0.2)', fontWeight: 600 }}>
               {salaryPaid.length} Paid for {salaryMonthLabel}
             </span>
             <span style={{ fontSize: '0.75rem', background: 'rgba(245,158,11,0.08)', color: '#F59E0B', padding: '0.3rem 0.8rem', borderRadius: '1rem', border: '1px solid rgba(245,158,11,0.2)', fontWeight: 600 }}>
               {salaryUnpaid.length} Pending for {salaryMonthLabel}
             </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '1rem' }}>Student Details</th>
                <th style={{ padding: '1rem' }}>Fee Amount</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Method</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Management</th>
              </tr>
            </thead>
            <tbody>
              {myStudents.map(s => {
                const history = s.payment_history || {};
                const isPaid = history[prevMonthKey] === 'paid';
                return (
                  <tr key={s.id} className="hover-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '1.2rem 1rem' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '10px', 
                          background: isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 800, 
                          color: isPaid ? '#22C55E' : '#818CF8',
                          fontSize: '0.9rem'
                        }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, color: '#F0F4FF', fontSize: '0.95rem' }}>{s.name}</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.phone || 'No contact'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}><strong style={{ color: '#F0F4FF', fontSize: '1rem' }}>₹{(s.monthly_fee || 2500).toLocaleString()}</strong></td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.7rem', 
                        padding: '0.3rem 0.75rem', 
                        borderRadius: '999px',
                        background: isPaid ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: isPaid ? '#22C55E' : '#F59E0B',
                        border: `1px solid ${isPaid ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                        fontWeight: 700
                      }}>
                        {isPaid ? <Check size={12}/> : <Clock size={12}/>}
                        {isPaid ? 'PAID' : 'PENDING'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {isPaid ? (s.payment_method === 'cash' ? 'Cash' : 'Online') : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      {!isPaid ? (
                        <button 
                          onClick={() => handleSendReminder(s)}
                          className="btn btn-outline" 
                          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderColor: '#F59E0B', color: '#F59E0B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                          <Send size={14}/> Send Reminder
                        </button>
                      ) : (
                        <div style={{ color: '#22C55E', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <div style={{ width: '8px', height: '8px', background: '#22C55E', borderRadius: '50%' }} />
                          Settled
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
