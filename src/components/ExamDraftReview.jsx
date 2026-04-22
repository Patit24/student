import React, { useState } from 'react';
import { Edit2, Trash2, CheckCircle, AlertTriangle, Save, Plus, ChevronDown, ChevronUp } from 'lucide-react';

const CONFIDENCE_COLOR = (score) => {
  if (score >= 0.9) return 'var(--secondary)';
  if (score >= 0.7) return '#f59e0b';
  return 'var(--danger)';
};

export default function ExamDraftReview({ draft, batches, onPublish, onCancel }) {
  const [title, setTitle] = useState(`Auto-Exam from ${draft.source_file_name}`);
  const [batchId, setBatchId] = useState(batches[0]?.id || '');
  const [duration, setDuration] = useState(30);
  const [passingScore, setPassingScore] = useState(60);
  const [questions, setQuestions] = useState(draft.questions);
  const [expandedIdx, setExpandedIdx] = useState(null);

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions(prev => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const deleteQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
    setExpandedIdx(null);
  };

  const handlePublish = (asDraft = false) => {
    if (!title || !batchId) { alert('Please fill in Exam Title and Target Batch.'); return; }
    if (questions.length === 0) { alert('You must keep at least one question.'); return; }

    const exam = {
      id: `exam-${Date.now()}`,
      title,
      batchId,
      duration_minutes: parseInt(duration),
      passing_score: parseInt(passingScore),
      questions: questions.map((q, i) => ({ ...q, number: i + 1 })),
      is_draft: asDraft,
      generation_method: draft.generation_method,
      source_file_url: draft.source_file_url,
      created_at: new Date().toISOString()
    };
    onPublish(exam, asDraft);
  };

  const lowConfidence = questions.filter(q => q.confidence_score < 0.75).length;

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Header */}
      <div className="glass-panel p-6 mb-6">
        <div className="flex justify-between items-start mb-4" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 className="mb-1">Draft Review</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Source: <strong>{draft.source_file_name}</strong> · {draft.generation_method} · {questions.length} questions extracted
            </p>
          </div>
          {lowConfidence > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: 'var(--radius)', background: 'rgba(245,158,11,0.15)', border: '1px solid #f59e0b' }}>
              <AlertTriangle size={16} color="#f59e0b" />
              <span style={{ fontSize: '0.85rem', color: '#f59e0b' }}>{lowConfidence} low-confidence question{lowConfidence > 1 ? 's' : ''} — review carefully</span>
            </div>
          )}
        </div>

        {/* Exam Meta */}
        <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: '200px' }}>
            <label className="input-label">Exam Title</label>
            <input type="text" className="input-field" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="input-label">Target Batch</label>
            <select className="input-field" value={batchId} onChange={e => setBatchId(e.target.value)} required>
              {batches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="input-label">Duration (min)</label>
            <input type="number" className="input-field" min="5" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <label className="input-label">Pass Score (%)</label>
            <input type="number" className="input-field" min="0" max="100" value={passingScore} onChange={e => setPassingScore(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="flex-col gap-4 mb-6">
        {questions.map((q, idx) => (
          <div key={q.id} style={{
            border: `1px solid ${q.confidence_score < 0.75 ? '#f59e0b' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            background: 'rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            {/* Question header row */}
            <div
              className="flex justify-between items-center"
              style={{ padding: '1rem 1.25rem', cursor: 'pointer' }}
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>Q{idx + 1}</span>
                <span style={{ fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.text || '(empty question)'}</span>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '1rem', background: q.type === 'mcq' ? 'rgba(79,70,229,0.2)' : 'rgba(16,185,129,0.2)', color: q.type === 'mcq' ? 'var(--primary)' : 'var(--secondary)', flexShrink: 0 }}>
                  {q.type === 'mcq' ? 'MCQ' : 'Short'}
                </span>
              </div>

              <div className="flex items-center gap-3" style={{ flexShrink: 0 }}>
                {/* Confidence indicator */}
                <div title={`Confidence: ${Math.round(q.confidence_score * 100)}%`} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: CONFIDENCE_COLOR(q.confidence_score) }}>
                  <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ width: `${q.confidence_score * 100}%`, height: '100%', background: CONFIDENCE_COLOR(q.confidence_score) }} />
                  </div>
                  {Math.round(q.confidence_score * 100)}%
                </div>

                {/* Marks */}
                <div className="flex items-center gap-1">
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Marks:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={q.marks}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateQuestion(idx, 'marks', parseInt(e.target.value) || 1)}
                    style={{ width: '50px', padding: '0.2rem 0.4rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text)', textAlign: 'center', fontSize: '0.85rem' }}
                  />
                </div>

                <button onClick={e => { e.stopPropagation(); deleteQuestion(idx); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.25rem' }}>
                  <Trash2 size={16} />
                </button>
                {expandedIdx === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {/* Expanded Edit Panel */}
            {expandedIdx === idx && (
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }}>
                <label className="input-label">Question Text</label>
                <textarea
                  className="input-field mb-4"
                  rows={2}
                  value={q.text}
                  onChange={e => updateQuestion(idx, 'text', e.target.value)}
                  style={{ resize: 'vertical' }}
                />

                <label className="input-label">Type</label>
                <div className="flex gap-3 mb-4">
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="radio" checked={q.type === 'mcq'} onChange={() => updateQuestion(idx, 'type', 'mcq')} style={{ accentColor: 'var(--primary)' }} />
                    Multiple Choice
                  </label>
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input type="radio" checked={q.type === 'short'} onChange={() => updateQuestion(idx, 'type', 'short')} style={{ accentColor: 'var(--primary)' }} />
                    Short Answer
                  </label>
                </div>

                {q.type === 'mcq' && (
                  <div className="flex-col gap-2">
                    <label className="input-label">Options (radio = correct answer)</label>
                    {(q.options.length < 2 ? ['', '', '', ''] : q.options).map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correct === i}
                          onChange={() => updateQuestion(idx, 'correct', i)}
                          style={{ accentColor: 'var(--secondary)', cursor: 'pointer' }}
                        />
                        <input
                          type="text"
                          className="input-field"
                          placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          value={opt}
                          onChange={e => updateOption(idx, i, e.target.value)}
                          style={{ flex: 1 }}
                        />
                        {q.correct === i && <span style={{ fontSize: '0.75rem', color: 'var(--secondary)', flexShrink: 0 }}>✓ Correct</span>}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'short' && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Students will type a short answer. You will grade this manually.
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary & Actions */}
      <div className="glass-panel p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <p style={{ fontWeight: 600 }}>{questions.length} Questions · {questions.reduce((a, q) => a + (q.marks || 1), 0)} Total Marks</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              {questions.filter(q => q.type === 'mcq').length} MCQ · {questions.filter(q => q.type === 'short').length} Short Answer
            </p>
          </div>
          <div className="flex gap-3">
            <button className="btn btn-outline" onClick={onCancel}>← Back</button>
            <button className="btn btn-outline" onClick={() => handlePublish(true)}>
              <Save size={16} /> Save as Draft
            </button>
            <button className="btn btn-secondary" onClick={() => handlePublish(false)}>
              <CheckCircle size={16} /> Publish to Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
