import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, Download, Clock, Trophy, ChevronRight, ChevronLeft,
  Cpu, Zap, Atom, Brain, Play, CheckCircle, XCircle, Timer, ArrowLeft, Settings,
} from 'lucide-react';
import './NeetAspirant.css'; /* shared CSS */

/* ── Mock Data ── */
const JEE_MATERIALS = [
  { id: 'j1', title: 'Calculus — Differentiation & Integration', subject: 'Mathematics', class: '12th', pages: 250, tag: 'Notes', icon: Brain },
  { id: 'j2', title: 'Mechanics — Kinematics & Dynamics', subject: 'Physics', class: '11th', pages: 180, tag: 'Notes', icon: Settings },
  { id: 'j3', title: 'Coordinate Geometry — Complete Guide', subject: 'Mathematics', class: '11th', pages: 140, tag: 'Formula Sheet', icon: Brain },
  { id: 'j4', title: 'Organic Chemistry — Named Reactions', subject: 'Chemistry', class: '12th', pages: 95, tag: 'Cheat Sheet', icon: Atom },
  { id: 'j5', title: 'Electromagnetism — Theory & Problems', subject: 'Physics', class: '12th', pages: 210, tag: 'Notes', icon: Zap },
  { id: 'j6', title: 'Matrices & Determinants — JEE Advanced', subject: 'Mathematics', class: '12th', pages: 80, tag: 'Practice Set', icon: Cpu },
];

const JEE_QUESTIONS = [
  { id: 1, question: 'The value of lim(x→0) sin(x)/x is:', options: ['0', '1', '∞', 'Does not exist'], correct: 1 },
  { id: 2, question: 'If F = ma, what is the SI unit of force?', options: ['Joule', 'Newton', 'Watt', 'Pascal'], correct: 1 },
  { id: 3, question: 'The integral of 1/x dx is:', options: ['x²/2', 'ln|x| + C', '1/x² + C', 'e^x + C'], correct: 1 },
  { id: 4, question: 'Which of the following is a vector quantity?', options: ['Speed', 'Mass', 'Velocity', 'Temperature'], correct: 2 },
  { id: 5, question: 'The hybridization of carbon in methane is:', options: ['sp', 'sp²', 'sp³', 'sp³d'], correct: 2 },
  { id: 6, question: 'The rank of a 3×3 identity matrix is:', options: ['0', '1', '2', '3'], correct: 3 },
  { id: 7, question: 'Faraday\'s law is related to:', options: ['Electrostatics', 'Electromagnetic induction', 'Thermodynamics', 'Optics'], correct: 1 },
  { id: 8, question: 'The derivative of e^x is:', options: ['xe^(x-1)', 'e^x', 'e^(x+1)', 'ln(e^x)'], correct: 1 },
  { id: 9, question: 'Dimensional formula of work is:', options: ['[ML²T⁻²]', '[MLT⁻²]', '[ML²T⁻³]', '[M²LT⁻²]'], correct: 0 },
  { id: 10, question: 'Number of pi bonds in ethylene (C₂H₄):', options: ['0', '1', '2', '3'], correct: 1 },
];

const PAST_EXAMS = [
  { id: 'pe1', title: 'JEE Mock — Week 12', date: '2026-04-21', score: 78, total: 100, questions: 30 },
  { id: 'pe2', title: 'JEE Mock — Week 11', date: '2026-04-14', score: 92, total: 100, questions: 30 },
  { id: 'pe3', title: 'JEE Mock — Week 10', date: '2026-04-07', score: 65, total: 100, questions: 30 },
  { id: 'pe4', title: 'JEE Mock — Week 9', date: '2026-03-31', score: 88, total: 100, questions: 30 },
];

export default function JeeAspirant() {
  const [activeTab, setActiveTab] = useState('materials');
  const [quizState, setQuizState] = useState('idle');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(600);
  const [showAnswer, setShowAnswer] = useState(false);

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
  const nextQ = () => { if (currentQ < JEE_QUESTIONS.length - 1) { setCurrentQ(c => c + 1); setShowAnswer(false); } };
  const prevQ = () => { if (currentQ > 0) { setCurrentQ(c => c - 1); setShowAnswer(false); } };
  const finishQuiz = useCallback(() => { setQuizState('results'); }, []);

  const score = Object.entries(answers).filter(([qi, ai]) => JEE_QUESTIONS[qi].correct === ai).length;
  const pct = Math.round((score / JEE_QUESTIONS.length) * 100);
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
            {JEE_MATERIALS.map(m => (
              <div key={m.id} className="asp-mat-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem' }}>
                  <div className="asp-mat-icon"><m.icon size={22} color="var(--asp-accent)" /></div>
                  <div style={{ flex: 1 }}>
                    <p className="asp-mat-title">{m.title}</p>
                    <p className="asp-mat-meta">{m.pages} pages · Class {m.class}</p>
                  </div>
                </div>
                <div className="asp-mat-tags">
                  <span className="asp-mat-tag subject">{m.subject}</span>
                  <span className="asp-mat-tag">{m.tag}</span>
                </div>
                <button className="asp-dl-btn"><Download size={16} /> Download PDF</button>
              </div>
            ))}
          </div>
        )}

        {/* ── Exam ── */}
        {activeTab === 'exam' && quizState === 'idle' && (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            <div className="asp-exam-hero">
              <div className="asp-exam-info">
                <h3>📋 Weekly Mock Test — Week 13</h3>
                <p>Test your JEE preparation with this week's PCM mixed mock exam.</p>
                <div className="asp-exam-meta">
                  <span><Clock size={14} /> Duration: <strong>10 min</strong></span>
                  <span><FileText size={14} /> Questions: <strong>10 MCQs</strong></span>
                  <span><Trophy size={14} /> Max Score: <strong>100</strong></span>
                </div>
                <button className="asp-start-btn" onClick={startQuiz}><Play size={18} /> Start Mock Exam</button>
              </div>
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: '1rem', color: '#94A3B8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>📊 Previous Mock Exams</h4>
            <div className="asp-past-grid">
              {PAST_EXAMS.map(e => {
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
              <span className="asp-quiz-progress">Question {currentQ + 1} of {JEE_QUESTIONS.length}</span>
              <div className="asp-quiz-timer"><Timer size={16} /> {formatTime(timer)}</div>
            </div>
            <div className="asp-question-card">
              <div className="asp-question-num">Question {currentQ + 1}</div>
              <div className="asp-question-text">{JEE_QUESTIONS[currentQ].question}</div>
              <div className="asp-options">
                {JEE_QUESTIONS[currentQ].options.map((opt, i) => {
                  const selected = answers[currentQ] === i;
                  const correct = JEE_QUESTIONS[currentQ].correct === i;
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
            <div className="asp-quiz-nav">
              <button className="asp-nav-btn" onClick={prevQ} disabled={currentQ === 0}><ChevronLeft size={16} /> Previous</button>
              <button className="asp-nav-btn" onClick={() => setShowAnswer(!showAnswer)} style={{ color: 'var(--asp-accent)' }}>
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
              {currentQ === JEE_QUESTIONS.length - 1 ? (
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
            <p style={{ color: '#94A3B8', margin: '0.5rem 0 0' }}>{score} out of {JEE_QUESTIONS.length} correct</p>
            <div className="asp-results-breakdown">
              <div className="asp-results-item"><strong style={{ color: '#22C55E' }}>{score}</strong><span>Correct</span></div>
              <div className="asp-results-item"><strong style={{ color: '#EF4444' }}>{JEE_QUESTIONS.length - score - (JEE_QUESTIONS.length - Object.keys(answers).length)}</strong><span>Wrong</span></div>
              <div className="asp-results-item"><strong style={{ color: '#F5C518' }}>{JEE_QUESTIONS.length - Object.keys(answers).length}</strong><span>Skipped</span></div>
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
            <div className="asp-past-grid">
              {PAST_EXAMS.map(e => {
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
