import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Loader } from 'lucide-react';
import { parseExamFile } from '../utils/parseExamFile';

const ACCEPTED = '.xlsx,.xls,.csv,.pdf';

export default function SmartExamUploader({ onDraftReady }) {
  const [status, setStatus] = useState('idle'); // idle | parsing | done | error
  const [errorMsg, setErrorMsg] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'pdf'].includes(ext)) {
      setErrorMsg(`Unsupported file type (.${ext}). Please upload .xlsx, .csv, or .pdf.`);
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setStatus('parsing');
    setErrorMsg('');

    try {
      const questions = await parseExamFile(file);
      if (questions.length === 0) throw new Error('No questions could be parsed from this file. Please check the format.');
      setStatus('done');
      onDraftReady({
        source_file_name: file.name,
        source_file_url: URL.createObjectURL(file),
        generation_method: ext === 'pdf' ? 'Auto-Parsed (PDF OCR)' : 'Auto-Parsed (Spreadsheet)',
        questions,
        is_draft: true
      });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Parsing failed. See console for details.');
      setStatus('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${status === 'error' ? 'var(--danger)' : status === 'done' ? 'var(--secondary)' : 'var(--primary)'}`,
          borderRadius: 'var(--radius)',
          padding: '3rem 2rem',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: status === 'parsing'
            ? 'rgba(79,70,229,0.05)'
            : status === 'done'
              ? 'rgba(16,185,129,0.05)'
              : 'transparent'
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {status === 'idle' && (
          <>
            <Upload size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 className="mb-2">Smart Exam Upload</h3>
            <p className="text-muted mb-4">Drop a file here or click to browse</p>
            <div className="flex justify-center gap-2" style={{ flexWrap: 'wrap' }}>
              {['.xlsx', '.csv', '.pdf'].map(f => (
                <span key={f} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem', border: '1px solid var(--border)', borderRadius: '1rem', color: 'var(--text-muted)' }}>{f}</span>
              ))}
            </div>
            <p className="text-muted mt-4" style={{ fontSize: '0.8rem' }}>
              <strong>Excel/CSV format:</strong> Col A = Question · B-E = Options (A-D) · F = Answer Letter
            </p>
            <a
              href="/sample_exam_template.xlsx"
              download
              onClick={e => e.stopPropagation()}
              style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}
            >
              ⬇ Download Sample Template (.xlsx)
            </a>
          </>
        )}

        {status === 'parsing' && (
          <>
            <Loader size={40} color="var(--primary)" style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
            <h3 className="mb-2">Parsing {fileName}</h3>
            <p className="text-muted">Extracting questions and options…</p>
          </>
        )}

        {status === 'done' && (
          <>
            <FileText size={40} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
            <h3 className="mb-1" style={{ color: 'var(--secondary)' }}>Parsing Complete!</h3>
            <p className="text-muted">{fileName} — Review your questions below</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertTriangle size={40} color="var(--danger)" style={{ marginBottom: '1rem' }} />
            <h3 className="mb-1" style={{ color: 'var(--danger)' }}>Parse Error</h3>
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{errorMsg}</p>
            <p className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>Click to try a different file</p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
