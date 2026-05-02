import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../context/AuthContext';
import { Clock, AlertTriangle, CheckCircle, Send } from 'lucide-react';

export default function TestCenter({ exam, studentId, onFinish }) {
  const { mockSubmissions, setMockSubmissions, isMockMode } = useAppContext();
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(exam.duration_minutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const intervalRef = useRef(null);

  // Stop camera and exit fullscreen on unmount or submit
  const cleanupProctoring = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.log('Fullscreen exit error:', err));
    }
  };

  useEffect(() => {
    return () => cleanupProctoring();
  }, [stream]);

  // Prevent tab switching / visibility change
  useEffect(() => {
    if (!hasAgreed) return;
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
    if (!hasAgreed || submitted) return;
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
    cleanupProctoring();

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
      exam_id: exam.id,
      student_id: studentId,
      answers,
      mcq_score: pct,
      passed,
      submitted_at: new Date().toISOString(),
      teacher_feedback: null
    };

    if (isMockMode) {
      setMockSubmissions(prev => [...prev, { id: `sub-${Date.now()}`, ...submission }]);
    } else {
      import('../db.service').then(m => m.submitExamResult(submission)).catch(console.error);
    }

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

  const handleProceed = async () => {
    try {
      // 1. Request Fullscreen
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // 2. Request Camera
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setStream(mediaStream);
      setHasAgreed(true);
    } catch (err) {
      console.error('Proctoring setup failed:', err);
      alert('You must allow camera access and fullscreen to start the exam.');
    }
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  if (!hasAgreed) {
    return (
      <div className="glass-panel p-8 animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto' }}>
        <div className="text-center mb-6">
          <AlertTriangle size={48} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ margin: 0 }}>Rules & Regulations</h2>
          <p className="text-muted">Please read carefully before proceeding</p>
        </div>
        <ul style={{ lineHeight: '1.8', marginBottom: '2rem', paddingLeft: '1.2rem', color: 'var(--text)' }}>
          <li><strong>Proctored Environment:</strong> Your front camera will be activated. The teacher will monitor your movements.</li>
          <li><strong>Fullscreen Locked:</strong> The exam will open in fullscreen mode. Do not attempt to exit fullscreen.</li>
          <li><strong>No Tab Switching:</strong> Navigating away from the exam tab will trigger a warning and may auto-submit your exam.</li>
          <li><strong>Time Limit:</strong> You have {exam.duration_minutes} minutes. The exam will auto-submit when time is up.</li>
        </ul>
        <div className="flex-col gap-3">
          <button className="btn btn-primary w-full py-3 text-lg font-bold flex items-center justify-center gap-2" onClick={handleProceed}>
            <CheckCircle size={20} /> I Agree, Proceed to Exam
          </button>
          <button className="btn btn-outline w-full" onClick={onFinish}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Proctoring Camera Feed */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, width: '150px', height: '200px', borderRadius: '12px', overflow: 'hidden', border: '3px solid var(--primary)', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', background: '#000' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        <div style={{ position: 'absolute', bottom: '5px', left: '0', right: '0', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '2px', color: '#fff' }}>LIVE PROCTORING</div>
      </div>

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
