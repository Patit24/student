import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, Download, Clock, Trophy, ChevronRight, ChevronLeft,
  Cpu, Zap, Atom, Brain, Play, CheckCircle, XCircle, Timer, ArrowLeft, Settings,
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './NeetAspirant.css'; /* shared CSS */

const SUBJECT_ICONS = { Mathematics: Cpu, Physics: Zap, Chemistry: Atom, General: Brain };

export default function JeeAspirant() {
  const [activeTab, setActiveTab] = useState('materials');
  const [quizState, setQuizState] = useState('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(600);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  // Firestore data
  const [materials, setMaterials] = useState([]);
  const [exams, setExams] = useState([]);
  const [pastExams, setPastExams] = useState([]); // Will hook up to real results later

  useEffect(() => {
    const qMat = query(collection(db, 'aspirant_materials'), where('stream', '==', 'jee'), orderBy('created_at', 'desc'));
    const unsubMat = onSnapshot(qMat, snap => setMaterials(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const qExam = query(collection(db, 'aspirant_exams'), where('stream', '==', 'jee'), orderBy('created_at', 'desc'));
    const unsubExam = onSnapshot(qExam, snap => setExams(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubMat(); unsubExam(); };
  }, []);

  const activeExam = selectedExam || exams[0];
  const questions = activeExam?.questions || [];

  useEffect(() => {
    if (quizState !== 'active') return;
    if (timer <= 0) { finishQuiz(); return; }
    const t = setInterval(() => setTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [quizState, timer]);

  const startQuiz = () => {
    setQuizState('active'); setCurrentQ(0); setAnswers({}); setTimer(600); setShowAnswer(false);
  };

  const selectOption = (idx) => { if (!showAnswer) setAnswers(prev => ({ ...prev, [currentQ]: idx })); };
  const nextQ = () => { if (currentQ < questions.length - 1) { setCurrentQ(c => c + 1); setShowAnswer(false); } };
  const prevQ = () => { if (currentQ > 0) { setCurrentQ(c => c - 1); setShowAnswer(false); } };
  const finishQuiz = useCallback(() => { setQuizState('results'); }, []);

  const score = Object.entries(answers).filter(([qi, ai]) => questions[qi]?.correct === ai).length;
  const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const tabs = [
    { id: 'materials', label: 'Study Materials', icon: BookOpen },
    { id: 'exam', label: 'Mock Exam', icon: Brain },
    { id: 'results', label: 'Past Results', icon: Trophy },
  ];

  return (
    <div className="asp-root asp-jee">
      {/* ── Hero ── */}
      <section className="asp-hero">
        <div className="asp-hero-badge"><Cpu size={14} /> JEE 2026</div>
        <h1>Engineer Your <span>Future</span></h1>
        <p>Master Physics, Chemistry & Mathematics with precision-crafted materials and weekly mock tests for JEE Main & Advanced.</p>
        <div className="asp-hero-stats">
          <div className="asp-hero-stat"><strong>300</strong><span>Max Marks</span></div>
          <div className="asp-hero-stat"><strong>90</strong><span>Questions</span></div>
          <div className="asp-hero-stat"><strong>3:00</strong><span>Hours</span></div>
          <div className="asp-hero-stat"><strong>150+</strong><span>Materials</span></div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="asp-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`asp-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.id); if (t.id !== 'exam') setQuizState('idle'); }}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      <div className="asp-content">
        {/* ── Materials ── */}
        {activeTab === 'materials' && (
          <div className="asp-materials-grid" style={{ animation: 'fadeInUp 0.5s ease' }}>
            {materials.length === 0 && <p style={{ color: '#7A8BA8', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>No materials available yet.</p>}
            {materials.map(m => {
              const Icon = SUBJECT_ICONS[m.subject] || Brain;
              return (
                <div key={m.id} className="asp-mat-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                    <div className="asp-mat-icon"><Icon size={22} color="var(--asp-accent)" /></div>
                    <div style={{ flex: 1 }}>
                      <p className="asp-mat-title">{m.title}</p>
                      <p className="asp-mat-meta">Class {m.class_name}</p>
                    </div>
                  </div>
                  <div className="asp-mat-tags">
                    <span className="asp-mat-tag subject">{m.subject}</span>
                    <span className="asp-mat-tag">PDF</span>
                  </div>
                  <button className="asp-dl-btn" onClick={() => window.open(m.url, '_blank')}><Download size={16} /> Download PDF</button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Exam ── */}
        {activeTab === 'exam' && quizState === 'idle' && (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            <div className="asp-exam-hero">
              <div className="asp-exam-info">
                <h3>📋 {activeExam?.title || 'Weekly Mock Test'}</h3>
                <p>Test your JEE preparation with this mock exam.</p>
                <div className="asp-exam-meta">
                  <span><Clock size={14} /> Duration: <strong>{activeExam ? Math.round(activeExam.duration / 60) : 10} min</strong></span>
                  <span><FileText size={14} /> Questions: <strong>{questions.length} MCQs</strong></span>
                  <span><Trophy size={14} /> Max Score: <strong>100</strong></span>
                </div>
                <button className="asp-start-btn" onClick={startQuiz} disabled={questions.length === 0}>
                  <Play size={18} /> Start Mock Exam
                </button>
              </div>
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📊 Previous Mock Exams</h4>
            {exams.length > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {exams.map(e => (
                  <button key={e.id} onClick={() => setSelectedExam(e)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: `1px solid ${activeExam?.id === e.id ? 'var(--asp-accent)' : 'rgba(255,255,255,0.1)'}`, background: activeExam?.id === e.id ? 'var(--asp-badge-bg)' : 'transparent', color: activeExam?.id === e.id ? 'var(--asp-accent)' : '#94A3B8', cursor: 'pointer' }}>
                    {e.title}
                  </button>
                ))}
              </div>
            )}
            <div className="asp-past-grid">
              {pastExams.map(e => {
                const p = Math.round((e.score / e.total) * 100);
                const cls = p >= 80 ? 'high' : p >= 50 ? 'mid' : 'low';
                const color = p >= 80 ? '#22C55E' : p >= 50 ? '#F5C518' : '#EF4444';
                return (
                  <div key={e.id} className="asp-past-card">
                    <div className="asp-past-header">
                      <div>
                        <p className="asp-past-title">{e.title}</p>
                        <p className="asp-past-date">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`asp-score-badge ${cls}`}>{e.score}/{e.total}</span>
                    </div>
                    <div className="asp-progress-bar">
                      <div className="asp-progress-fill" style={{ width: `${p}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Active Quiz ── */}
        {activeTab === 'exam' && quizState === 'active' && (
          <div className="asp-quiz-container" style={{ animation: 'fadeInUp 0.4s ease' }}>
            <div className="asp-quiz-header">
              <span className="asp-quiz-progress">Question {currentQ + 1} of {questions.length}</span>
              <div className="asp-quiz-timer"><Timer size={16} /> {formatTime(timer)}</div>
            </div>
            {questions.length > 0 && (
              <div className="asp-question-card">
                <div className="asp-question-num">Question {currentQ + 1}</div>
                <div className="asp-question-text">{questions[currentQ].question}</div>
                <div className="asp-options">
                  {questions[currentQ].options.map((opt, i) => {
                    const selected = answers[currentQ] === i;
                    const correct = questions[currentQ].correct === i;
                  let cls = '';
                  if (showAnswer) { cls = correct ? 'correct' : (selected ? 'wrong' : ''); }
                  else if (selected) { cls = 'selected'; }
                  return (
                    <div key={i} className={`asp-option ${cls}`} onClick={() => selectOption(i)}>
                      <div className="asp-option-letter">{String.fromCharCode(65 + i)}</div>
                      <span>{opt}</span>
                      {showAnswer && correct && <CheckCircle size={18} color="#22C55E" style={{ marginLeft: 'auto' }} />}
                      {showAnswer && selected && !correct && <XCircle size={18} color="#EF4444" style={{ marginLeft: 'auto' }} />}
                    </div>
                  );
                })}
              </div>
            </div>
            )}
            <div className="asp-quiz-nav">
              <button className="asp-nav-btn" onClick={prevQ} disabled={currentQ === 0}><ChevronLeft size={16} /> Previous</button>
              <button className="asp-nav-btn" onClick={() => setShowAnswer(!showAnswer)} style={{ color: 'var(--asp-accent)' }}>
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
              {currentQ === questions.length - 1 ? (
                <button className="asp-nav-btn submit" onClick={finishQuiz}>Submit Exam</button>
              ) : (
                <button className="asp-nav-btn" onClick={nextQ}>Next <ChevronRight size={16} /></button>
              )}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {activeTab === 'exam' && quizState === 'results' && (
          <div className="asp-results" style={{ animation: 'fadeInUp 0.5s ease' }}>
            <Trophy size={48} color="var(--asp-accent)" />
            <h2>Exam Complete!</h2>
            <div className="asp-results-score">{pct}%</div>
            <p style={{ color: '#94A3B8', margin: '0.5rem 0 0' }}>{score} out of {questions.length} correct</p>
            <div className="asp-results-breakdown">
              <div className="asp-results-item"><strong style={{ color: '#22C55E' }}>{score}</strong><span>Correct</span></div>
              <div className="asp-results-item"><strong style={{ color: '#EF4444' }}>{questions.length - score - (questions.length - Object.keys(answers).length)}</strong><span>Wrong</span></div>
              <div className="asp-results-item"><strong style={{ color: '#F5C518' }}>{questions.length - Object.keys(answers).length}</strong><span>Skipped</span></div>
              <div className="asp-results-item"><strong style={{ color: 'var(--asp-accent)' }}>{formatTime(600 - timer)}</strong><span>Time Taken</span></div>
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="asp-start-btn" onClick={startQuiz}><Play size={16} /> Retake Exam</button>
              <button className="asp-nav-btn" onClick={() => setQuizState('idle')}><ArrowLeft size={16} /> Back to Exams</button>
            </div>
          </div>
        )}

        {/* ── Past Results Tab ── */}
        {activeTab === 'results' && (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            <h3 style={{ fontWeight: 800, marginBottom: '1.5rem' }}>📈 Performance History</h3>
            {pastExams.length === 0 ? (
              <div className="asp-empty"><Trophy size={40} style={{ opacity: 0.3 }} /><p>No exam results yet. Take your first mock test!</p></div>
            ) : (
              <div className="asp-past-grid">
                {pastExams.map(e => {
                const p = Math.round((e.score / e.total) * 100);
                const cls = p >= 80 ? 'high' : p >= 50 ? 'mid' : 'low';
                const color = p >= 80 ? '#22C55E' : p >= 50 ? '#F5C518' : '#EF4444';
                return (
                  <div key={e.id} className="asp-past-card">
                    <div className="asp-past-header">
                      <div>
                        <p className="asp-past-title">{e.title}</p>
                        <p className="asp-past-date">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <span className={`asp-score-badge ${cls}`}>{e.score}%</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#7A8BA8', margin: '0.5rem 0' }}>{e.questions} questions · Score: {e.score}/{e.total}</p>
                    <div className="asp-progress-bar">
                      <div className="asp-progress-fill" style={{ width: `${p}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
