import React, { useState } from 'react';
import { useAppContext } from '../context/AuthContext';
import { Plus, Trash2, Clock, AlertTriangle } from 'lucide-react';
import { createExam } from '../db.service';

export default function ExamCreator({ tutorId, batches }) {
  const { mockExams, setMockExams, isMockMode } = useAppContext();
  
  const [title, setTitle] = useState('');
  const [batchId, setBatchId] = useState('');
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState([
    { id: 1, type: 'mcq', text: '', options: ['', '', '', ''], correct: 0 }
  ]);

  const addQuestion = (type) => {
    const newQ = type === 'mcq'
      ? { id: Date.now(), type: 'mcq', text: '', options: ['', '', '', ''], correct: 0 }
      : { id: Date.now(), type: 'short', text: '' };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const updateOption = (qId, idx, value) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      const opts = [...q.options];
      opts[idx] = value;
      return { ...q, options: opts };
    }));
  };

  const removeQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title || !batchId || questions.length === 0) return;

    const examData = {
      tutorId,
      batchId,
      title,
      duration_minutes: parseInt(duration),
      passing_score: parseInt(passingScore),
      questions: questions.map((q, i) => ({ ...q, number: i + 1 })),
      created_at: new Date().toISOString()
    };

    if (isMockMode) {
      const newExam = { id: `exam-${Date.now()}`, ...examData };
      setMockExams(prev => [...prev, newExam]);
      alert(`Exam "${title}" created (Mock Mode - Not persisted to DB).`);
    } else {
      try {
        await createExam(examData);
        alert(`Exam "${title}" published successfully! 🚀`);
      } catch (err) {
        console.error('Failed to publish exam:', err);
        alert('Failed to publish exam. Please check your connection.');
      }
    }

    setTitle(''); setBatchId(''); setDuration(30); setPassingScore(60);
    setQuestions([{ id: 1, type: 'mcq', text: '', options: ['', '', '', ''], correct: 0 }]);
  };

  return (
    <div>
      <form onSubmit={handleCreate}>
        <div className="glass-panel p-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="m-0">Create New Exam</h3>
            {isMockMode && (
              <span className="flex items-center gap-1 text-xs text-danger" title="Persistence disabled">
                <AlertTriangle size={12} /> Mock Mode Active
              </span>
            )}
          </div>
          <div className="flex gap-4 flex-wrap mb-4">
            <div className="input-group mb-0" style={{ flex: 2, minWidth: '200px' }}>
              <label className="input-label">Exam Title</label>
              <input type="text" className="input-field" placeholder="e.g. Unit 1 - Mid-Term MCQ Test" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="input-group mb-0" style={{ flex: 1, minWidth: '160px' }}>
              <label className="input-label">Target Batch</label>
              <select className="input-field" value={batchId} onChange={e => setBatchId(e.target.value)} required>
                <option value="" disabled>Select...</option>
                {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="input-group mb-0" style={{ flex: 1, minWidth: '120px' }}>
              <label className="input-label">Duration (min)</label>
              <input type="number" className="input-field" min="5" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="input-group mb-0" style={{ flex: 1, minWidth: '120px' }}>
              <label className="input-label">Passing Score (%)</label>
              <input type="number" className="input-field" min="0" max="100" value={passingScore} onChange={e => setPassingScore(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="flex-col gap-4 mb-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-panel p-6" style={{ position: 'relative' }}>
              <div className="flex justify-between items-center mb-4">
                <h4>Q{idx + 1} — {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}</h4>
                <button type="button" onClick={() => removeQuestion(q.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              <input
                type="text"
                className="input-field mb-4"
                placeholder="Enter question text..."
                value={q.text}
                onChange={e => updateQuestion(q.id, 'text', e.target.value)}
                required
              />

              {q.type === 'mcq' && (
                <div className="flex-col gap-2">
                  {q.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correct === i}
                        onChange={() => updateQuestion(q.id, 'correct', i)}
                        title="Mark as correct answer"
                        style={{ cursor: 'pointer', accentColor: 'var(--secondary)' }}
                      />
                      <input
                        type="text"
                        className="input-field"
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        value={opt}
                        onChange={e => updateOption(q.id, i, e.target.value)}
                        style={{ flex: 1 }}
                        required
                      />
                      {q.correct === i && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', whiteSpace: 'nowrap' }}>✓ Correct</span>
                      )}
                    </div>
                  ))}
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Select the radio button next to the correct answer.</p>
                </div>
              )}
              {q.type === 'short' && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Student will type a short answer. You will grade this manually.</p>
              )}
            </div>
          ))}
        </div>

        {/* Add Question Buttons */}
        <div className="flex gap-4 mb-6">
          <button type="button" className="btn btn-outline" onClick={() => addQuestion('mcq')}><Plus size={16}/> MCQ Question</button>
          <button type="button" className="btn btn-outline" onClick={() => addQuestion('short')}><Plus size={16}/> Short Answer</button>
        </div>

        <button type="submit" className="btn btn-primary">
          <Clock size={16} /> Publish Exam
        </button>
      </form>
    </div>
  );
}
