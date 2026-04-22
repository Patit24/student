import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AuthContext';
import { Clock, AlertTriangle, CheckCircle, Send } from 'lucide-react';

export default function TestCenter({ exam, studentId, onFinish }) {
  const { mockSubmissions, setMockSubmissions } = useAppContext();
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const intervalRef = useRef(null);

  // Prevent tab switching / visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert('⚠️ Warning: Do not leave this exam tab! Your submission may be auto-filed.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (submitted) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleSubmit(true); // auto-submit on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [submitted]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleSubmit = (autoSubmit = false) => {
    clearInterval(intervalRef.current);

    // Grade MCQs automatically
    let mcqScore = 0, mcqTotal = 0;
    exam.questions.forEach(q => {
      if (q.type === 'mcq') {
        mcqTotal++;
        if (parseInt(answers[q.id]) === q.correct) mcqScore++;
      }
    });
    const pct = mcqTotal > 0 ? Math.round((mcqScore / mcqTotal) * 100) : null;
    const passed = pct !== null ? pct >= exam.passing_score : null;

    const submission = {
      id: `sub-${Date.now()}`,
      exam_id: exam.id,
      student_id: studentId,
      answers,
      mcq_score: pct,
      passed,
      submitted_at: new Date().toISOString(),
      teacher_feedback: null
    };
    setMockSubmissions(prev => [...prev, submission]);
    setResult({ pct, passed, mcqScore, mcqTotal, autoSubmit });
    setSubmitted(true);
  };

  if (submitted && result) {
    return (
      <div className="glass-panel p-8 animate-fade-in text-center" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        {result.passed !== false ? (
          <CheckCircle size={56} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
        ) : (
          <AlertTriangle size={56} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        )}
        <h2 className="mb-2">{result.autoSubmit ? 'Time Up — Auto Submitted!' : 'Exam Submitted!'}</h2>
        {result.pct !== null ? (
          <>
            <p className="text-muted mb-4">Your MCQ Score: <strong style={{ fontSize: '2rem', color: result.passed ? 'var(--secondary)' : 'var(--danger)' }}>{result.pct}%</strong></p>
            <p style={{ color: result.passed ? 'var(--secondary)' : 'var(--danger)', fontWeight: 600, marginBottom: '1rem' }}>
              {result.passed ? '🎉 Passed!' : '❌ Below passing score'} (Required: {exam.passing_score}%)
            </p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Correct: {result.mcqScore} / {result.mcqTotal} MCQs</p>
          </>
        ) : (
          <p className="text-muted">Short answers submitted for teacher review.</p>
        )}
        <button className="btn btn-primary mt-4" onClick={onFinish}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Sticky Timer Header */}
      <div style={{ position: 'sticky', top: '73px', zIndex: 100, background: 'var(--background)', padding: '1rem 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0 }}>{exam.title}</h3>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>{exam.questions.length} Questions</p>
        </div>
        <div style={{ 
          display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 700, padding: '0.5rem 1.25rem', borderRadius: 'var(--radius)',
          background: timeLeft < 300 ? 'rgba(239,68,68,0.15)' : 'var(--surface)',
          color: timeLeft < 300 ? 'var(--danger)' : 'var(--text)',
          border: `1px solid ${timeLeft < 300 ? 'var(--danger)' : 'var(--border)'}`
        }}>
          <Clock size={20} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-col gap-6 mt-6">
        {exam.questions.map((q, idx) => (
          <div key={q.id} className="glass-panel p-6" style={{ animation: 'fadeIn 0.4s ease' }}>
            <p style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Q{idx + 1} • {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}</span>
              <br />{q.text}
            </p>

            {q.type === 'mcq' && (
              <div className="flex-col gap-2">
                {q.options.map((opt, i) => (
                  <label key={i} className="flex items-center gap-3" style={{ cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: `1px solid ${answers[q.id] == i ? 'var(--primary)' : 'var(--border)'}`, background: answers[q.id] == i ? 'rgba(79,70,229,0.1)' : 'transparent', transition: 'all 0.2s' }}>
                    <input type="radio" name={`q-${q.id}`} value={i} checked={answers[q.id] == i} onChange={() => setAnswers(prev => ({ ...prev, [q.id]: i }))} style={{ accentColor: 'var(--primary)' }} />
                    <span>{String.fromCharCode(65 + i)}. {opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'short' && (
              <textarea
                className="input-field"
                rows={4}
                placeholder="Type your answer here..."
                value={answers[q.id] || ''}
                onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                style={{ resize: 'vertical' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-center mt-8">
        <button className="btn btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 3rem' }} onClick={() => {
          if (window.confirm('Are you sure you want to submit your exam? This cannot be undone.')) handleSubmit();
        }}>
          <Send size={18} /> Submit Exam
        </button>
      </div>
    </div>
  );
}
