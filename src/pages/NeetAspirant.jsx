import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, FileText, Download, Clock, Trophy, ChevronRight, ChevronLeft,
  Microscope, Heart, Atom, Leaf, Brain, Play, CheckCircle, XCircle, Timer, ArrowLeft,
} from 'lucide-react';
import './NeetAspirant.css';

/* ── Mock Data ── */
const NEET_MATERIALS = [
  { id: 'n1', title: 'NCERT Biology — Chapter-wise Notes', subject: 'Biology', class: '11th & 12th', pages: 320, tag: 'Notes', icon: Leaf },
  { id: 'n2', title: 'Human Physiology — Quick Revision', subject: 'Biology', class: '12th', pages: 85, tag: 'Revision', icon: Heart },
  { id: 'n3', title: 'Organic Chemistry — Reaction Mechanisms', subject: 'Chemistry', class: '12th', pages: 140, tag: 'Notes', icon: Atom },
  { id: 'n4', title: 'Physics — Optics & Modern Physics', subject: 'Physics', class: '12th', pages: 110, tag: 'Formula Sheet', icon: Brain },
  { id: 'n5', title: 'Inorganic Chemistry — Periodic Table Tricks', subject: 'Chemistry', class: '11th', pages: 60, tag: 'Cheat Sheet', icon: Atom },
  { id: 'n6', title: 'Biology — Ecology & Environment', subject: 'Biology', class: '12th', pages: 75, tag: 'Notes', icon: Leaf },
];

const NEET_QUESTIONS = [
  { id: 1, question: 'Which of the following is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Body'], correct: 1 },
  { id: 2, question: 'The pH of human blood is approximately:', options: ['6.4', '7.4', '8.4', '5.4'], correct: 1 },
  { id: 3, question: 'Which vitamin is synthesized by intestinal bacteria?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin K', 'Vitamin D'], correct: 2 },
  { id: 4, question: 'Krebs cycle occurs in:', options: ['Cytoplasm', 'Mitochondrial matrix', 'Nucleus', 'ER'], correct: 1 },
  { id: 5, question: 'The smallest bone in the human body is:', options: ['Stapes', 'Femur', 'Humerus', 'Radius'], correct: 0 },
  { id: 6, question: 'Which of the following is NOT a greenhouse gas?', options: ['CO₂', 'N₂O', 'O₂', 'CH₄'], correct: 2 },
  { id: 7, question: 'DNA replication is:', options: ['Conservative', 'Semi-conservative', 'Dispersive', 'Random'], correct: 1 },
  { id: 8, question: 'The functional unit of kidney is:', options: ['Neuron', 'Nephron', 'Alveoli', 'Hepatocyte'], correct: 1 },
  { id: 9, question: 'Which blood group is universal donor?', options: ['A', 'B', 'AB', 'O'], correct: 3 },
  { id: 10, question: 'Photosynthesis occurs in:', options: ['Mitochondria', 'Chloroplast', 'Ribosome', 'Nucleus'], correct: 1 },
];

const PAST_EXAMS = [
  { id: 'pe1', title: 'Mock Test — Week 12', date: '2026-04-21', score: 85, total: 100, questions: 50 },
  { id: 'pe2', title: 'Mock Test — Week 11', date: '2026-04-14', score: 72, total: 100, questions: 50 },
  { id: 'pe3', title: 'Mock Test — Week 10', date: '2026-04-07', score: 91, total: 100, questions: 50 },
  { id: 'pe4', title: 'Mock Test — Week 9', date: '2026-03-31', score: 68, total: 100, questions: 50 },
];

export default function NeetAspirant() {
  const [activeTab, setActiveTab] = useState('materials');
  const [quizState, setQuizState] = useState('idle'); // idle | active | results
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(600); // 10 min
  const [showAnswer, setShowAnswer] = useState(false);

  // Timer
  useEffect(() => {
    if (quizState !== 'active') return;
    if (timer <= 0) { finishQuiz(); return; }
    const t = setInterval(() => setTimer(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [quizState, timer]);

  const startQuiz = () => {
    setQuizState('active'); setCurrentQ(0); setAnswers({}); setTimer(600); setShowAnswer(false);
  };

  const selectOption = (idx) => {
    if (showAnswer) return;
    setAnswers(prev => ({ ...prev, [currentQ]: idx }));
  };

  const nextQ = () => {
    if (currentQ < NEET_QUESTIONS.length - 1) { setCurrentQ(c => c + 1); setShowAnswer(false); }
  };
  const prevQ = () => {
    if (currentQ > 0) { setCurrentQ(c => c - 1); setShowAnswer(false); }
  };

  const finishQuiz = useCallback(() => { setQuizState('results'); }, []);

  const score = Object.entries(answers).filter(([qi, ai]) => NEET_QUESTIONS[qi].correct === ai).length;
  const pct = Math.round((score / NEET_QUESTIONS.length) * 100);
  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const tabs = [
    { id: 'materials', label: 'Study Materials', icon: BookOpen },
    { id: 'exam', label: 'Mock Exam', icon: Brain },
    { id: 'results', label: 'Past Results', icon: Trophy },
  ];

  return (
    <div className="asp-root asp-neet">
      {/* ── Hero ── */}
      <section className="asp-hero">
        <div className="asp-hero-badge"><Microscope size={14} /> NEET 2026</div>
        <h1>Your Path to <span>Medical Excellence</span></h1>
        <p>Curated study materials, weekly mock exams, and instant results — everything you need to crack NEET.</p>
        <div className="asp-hero-stats">
          <div className="asp-hero-stat"><strong>720</strong><span>Max Marks</span></div>
          <div className="asp-hero-stat"><strong>180</strong><span>Questions</span></div>
          <div className="asp-hero-stat"><strong>3:20</strong><span>Hours</span></div>
          <div className="asp-hero-stat"><strong>200+</strong><span>Materials</span></div>
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className="asp-tabs">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`asp-tab ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => { setActiveTab(t.id); if (t.id !== 'exam') setQuizState('idle'); }}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="asp-content">

        {/* ── Materials Tab ── */}
        {activeTab === 'materials' && (
          <div className="asp-materials-grid" style={{ animation: 'fadeInUp 0.5s ease' }}>
            {NEET_MATERIALS.map(m => (
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

        {/* ── Exam Tab ── */}
        {activeTab === 'exam' && quizState === 'idle' && (
          <div style={{ animation: 'fadeInUp 0.5s ease' }}>
            <div className="asp-exam-hero">
              <div className="asp-exam-info">
                <h3>📋 Weekly Mock Test — Week 13</h3>
                <p>Test your NEET preparation with this week's biology-focused mock exam.</p>
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
              <span className="asp-quiz-progress">Question {currentQ + 1} of {NEET_QUESTIONS.length}</span>
              <div className="asp-quiz-timer"><Timer size={16} /> {formatTime(timer)}</div>
            </div>
            <div className="asp-question-card">
              <div className="asp-question-num">Question {currentQ + 1}</div>
              <div className="asp-question-text">{NEET_QUESTIONS[currentQ].question}</div>
              <div className="asp-options">
                {NEET_QUESTIONS[currentQ].options.map((opt, i) => {
                  const selected = answers[currentQ] === i;
                  const correct = NEET_QUESTIONS[currentQ].correct === i;
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
              {currentQ === NEET_QUESTIONS.length - 1 ? (
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
            <p style={{ color: '#94A3B8', margin: '0.5rem 0 0' }}>{score} out of {NEET_QUESTIONS.length} correct</p>
            <div className="asp-results-breakdown">
              <div className="asp-results-item"><strong style={{ color: '#22C55E' }}>{score}</strong><span>Correct</span></div>
              <div className="asp-results-item"><strong style={{ color: '#EF4444' }}>{NEET_QUESTIONS.length - score - (NEET_QUESTIONS.length - Object.keys(answers).length)}</strong><span>Wrong</span></div>
              <div className="asp-results-item"><strong style={{ color: '#F5C518' }}>{NEET_QUESTIONS.length - Object.keys(answers).length}</strong><span>Skipped</span></div>
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
            {PAST_EXAMS.length === 0 ? (
              <div className="asp-empty"><Trophy size={40} style={{ opacity: 0.3 }} /><p>No exam results yet. Take your first mock test!</p></div>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}
