// Script to generate a demo Excel exam template for testing Smart Upload
// Run with: node scripts/generateSampleExam.mjs

import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rows = [
  // Header row (optional — parser skips short/empty question texts)
  ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer'],

  // MCQ questions
  ['What is the derivative of x²?', '2x', 'x', 'x²', '2', 'A'],
  ['Which law states F = ma?', "Newton's First", "Newton's Second", "Newton's Third", "Hooke's Law", 'B'],
  ['What is the SI unit of electric current?', 'Volt', 'Watt', 'Ampere', 'Ohm', 'C'],
  ['What is the value of π to 2 decimal places?', '3.12', '3.14', '3.16', '3.18', 'B'],
  ['What does CPU stand for?', 'Central Processing Unit', 'Computer Power Unit', 'Core Processing Utility', 'Central Program Uploader', 'A'],

  // Short answer (no options or correct answer column)
  ['Explain the principle of conservation of energy.', '', '', '', '', ''],
  ['Describe the photoelectric effect in 2-3 sentences.', '', '', '', '', ''],
];

const ws = XLSX.utils.aoa_to_sheet(rows);

// Auto-size columns
ws['!cols'] = [
  { wch: 55 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 15 }
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Exam Questions');

const outPath = path.join(__dirname, '../public/sample_exam_template.xlsx');
XLSX.writeFile(wb, outPath);

console.log('✅ Sample exam template created at:', outPath);
