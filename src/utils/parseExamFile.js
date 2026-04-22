/**
 * parseExamFile.js
 * Client-side parsing engine for Smart Exam Upload.
 *
 * Supports:
 *  - .xlsx / .xls  → reads via SheetJS (xlsx)
 *  - .csv          → reads via SheetJS
 *  - .pdf          → extracts text via PDF.js (CDN), then NLP-pattern-matches questions
 *
 * Expected column layout for spreadsheets:
 *   Col A  → Question text
 *   Col B  → Option A
 *   Col C  → Option B
 *   Col D  → Option C
 *   Col E  → Option D
 *   Col F  → Correct answer letter (A / B / C / D) — optional → Short Answer if absent
 */

import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Excel / CSV parsing
// ---------------------------------------------------------------------------
export async function parseSpreadsheet(file) {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  const questions = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const questionText = String(row[0] || '').trim();
    if (!questionText || questionText.length < 3) continue;

    const optA = String(row[1] || '').trim();
    const optB = String(row[2] || '').trim();
    const optC = String(row[3] || '').trim();
    const optD = String(row[4] || '').trim();
    const correctLetter = String(row[5] || '').trim().toUpperCase();

    const hasMCQ = optA && optB;
    const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

    questions.push({
      id: Date.now() + i,
      text: questionText,
      type: hasMCQ ? 'mcq' : 'short',
      options: hasMCQ ? [optA, optB, optC || '', optD || ''] : [],
      correct: hasMCQ && correctIndex >= 0 ? correctIndex : 0,
      marks: 1,
      confidence_score: 0.95,
      generation_method: 'Auto-Parsed',
    });
  }

  return questions;
}

// ---------------------------------------------------------------------------
// PDF text extraction + NLP question pattern matching
// ---------------------------------------------------------------------------

// Load PDF.js from CDN dynamically (avoids large build deps)
async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return window.pdfjsLib;
}

async function extractTextFromPDF(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let fullText = '';

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

function nlpParseText(rawText) {
  /**
   * Heuristic NLP parser for MCQ exam PDFs.
   *
   * Pattern 1 — Numbered MCQ block:
   *   1. What is X?
   *   A) foo  B) bar  C) baz  D) qux   [Answer: B]
   *
   * Pattern 2 — Question line ending in '?'
   */
  const questions = [];
  const lines = rawText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentQuestion = null;

  const QUESTION_RE = /^(\d+)[.)]\s+(.+)/; // 1. or 1)
  const OPTION_RE = /\b([A-D])[.)]\s*([^A-D]{2,40})/gi;
  const ANSWER_RE = /\bAnswer\s*[:\-]?\s*([A-D])\b/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const qMatch = line.match(QUESTION_RE);

    if (qMatch) {
      if (currentQuestion) questions.push(finalise(currentQuestion));
      currentQuestion = {
        id: Date.now() + i,
        text: qMatch[2].trim(),
        type: 'short',
        options: [],
        correct: 0,
        marks: 1,
        rawOptionText: '',
        confidence_score: 0.75,
        generation_method: 'Auto-Parsed (PDF OCR)',
      };
      continue;
    }

    // Lines ending with '?' that weren't numbered
    if (!currentQuestion && line.endsWith('?')) {
      currentQuestion = {
        id: Date.now() + i,
        text: line,
        type: 'short',
        options: [],
        correct: 0,
        marks: 1,
        rawOptionText: '',
        confidence_score: 0.65,
        generation_method: 'Auto-Parsed (PDF OCR)',
      };
      continue;
    }

    if (currentQuestion) {
      // Accumulate option text
      currentQuestion.rawOptionText += ' ' + line;

      // Check for answer key
      const ansMatch = line.match(ANSWER_RE);
      if (ansMatch) {
        currentQuestion.correct = ['A', 'B', 'C', 'D'].indexOf(ansMatch[1].toUpperCase());
        questions.push(finalise(currentQuestion));
        currentQuestion = null;
      }
    }
  }
  if (currentQuestion) questions.push(finalise(currentQuestion));
  return questions;
}

function finalise(q) {
  if (!q.rawOptionText) return { ...q };

  // Extract MCQ options from accumulated text
  const matches = [...q.rawOptionText.matchAll(/([A-D])[.)]\s*([^A-D\n]+?)(?=[A-D][.)]|Answer|$)/gi)];
  if (matches.length >= 2) {
    q.options = matches.slice(0, 4).map((m) => m[2].trim());
    q.type = 'mcq';
    q.confidence_score = Math.min(q.confidence_score + 0.1, 0.95);
  }
  delete q.rawOptionText;
  return q;
}

export async function parsePDF(file) {
  const rawText = await extractTextFromPDF(file);
  return nlpParseText(rawText);
}

// ---------------------------------------------------------------------------
// Main entry point — dispatch by file type
// ---------------------------------------------------------------------------
export async function parseExamFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf') return parsePDF(file);
  if (['xlsx', 'xls', 'csv'].includes(ext)) return parseSpreadsheet(file);
  throw new Error(`Unsupported file type: .${ext}`);
}
