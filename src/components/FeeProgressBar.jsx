import React, { useMemo } from 'react';

/**
 * FeeProgressBar
 * Shows a visual deadline countdown from 1st → 5th of month.
 * Green (1-4), Orange (5th = last day), Red/locked (6th+).
 */
export default function FeeProgressBar({ paymentStatus, dueDate, balance }) {
  const { day, phase, daysLeft, label, barColor, barPct, bgColor, textColor } = useMemo(() => {
    const today = new Date();
    const day = today.getDate();

    let phase, daysLeft, label, barColor, barPct, bgColor, textColor;

    if (paymentStatus === 'active' || paymentStatus === 'paid') {
      // Already paid this month
      return {
        day, phase: 'paid',
        daysLeft: 0,
        label: '✅ Fees Paid for This Month',
        barColor: '#22C55E', barPct: 100,
        bgColor: 'rgba(34,197,94,0.08)',
        textColor: '#22C55E',
      };
    }

    if (day <= 4) {
      daysLeft = 5 - day;
      phase = 'green';
      label = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to pay fees`;
      barColor = '#22C55E';
      barPct = Math.round((day / 5) * 100);
      bgColor = 'rgba(34,197,94,0.07)';
      textColor = '#22C55E';
    } else if (day === 5) {
      daysLeft = 0;
      phase = 'warning';
      label = '⚠️ Last day to pay — Deadline is TODAY!';
      barColor = '#F59E0B';
      barPct = 95;
      bgColor = 'rgba(245,158,11,0.09)';
      textColor = '#F59E0B';
    } else {
      phase = 'overdue';
      daysLeft = -1;
      label = `Access Restricted — Overdue since the 5th${balance ? ` · ₹${balance?.toLocaleString()} due` : ''}`;
      barColor = '#EF4444';
      barPct = 100;
      bgColor = 'rgba(239,68,68,0.08)';
      textColor = '#EF4444';
    }

    return { day, phase, daysLeft, label, barColor, barPct, bgColor, textColor };
  }, [paymentStatus, balance]);

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${barColor}30`,
      borderRadius: '12px',
      padding: '1rem 1.2rem',
      marginBottom: '1.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: textColor }}>{label}</span>
        {phase !== 'paid' && (
          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
            {phase === 'overdue' ? '🔴 Overdue' : `Day ${day} of month`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${barPct}%`,
          height: '100%',
          background: barColor,
          borderRadius: '999px',
          transition: 'width 0.6s ease',
          boxShadow: `0 0 8px ${barColor}60`,
        }} />
      </div>

      {/* Day markers */}
      {phase !== 'paid' && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
          {[1, 2, 3, 4, '5th\n⚠'].map((d, i) => (
            <span key={i} style={{
              fontSize: '0.6rem',
              color: i + 1 < day ? barColor : '#475569',
              fontWeight: i + 1 === day ? 700 : 400,
            }}>
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
