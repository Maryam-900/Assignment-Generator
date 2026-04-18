// ── Academic Document Formatter ──────────────────────────────────────────────

const formatBtn    = document.getElementById('formatBtn');
const clearBtn     = document.getElementById('clearBtn');
const copyHtmlBtn  = document.getElementById('copyHtmlBtn');
const pdfBtn       = document.getElementById('pdfBtn');
const wordBtn      = document.getElementById('wordBtn');
const rawInput     = document.getElementById('rawInput');
const previewBox   = document.getElementById('previewBox');
const enableFP     = document.getElementById('enableFrontPage');
const fpFields     = document.getElementById('frontPageFields');
const enableWM     = document.getElementById('enableWatermark');
const wmText       = document.getElementById('watermarkText');

// ── Pre-load logo as base64 so it embeds in PDF & Word exports ────────────────
let logoBase64 = '';
(function loadLogo() {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function () {
    const canvas = document.createElement('canvas');
    canvas.width  = img.naturalWidth  || 160;
    canvas.height = img.naturalHeight || 160;
    canvas.getContext('2d').drawImage(img, 0, 0);
    logoBase64 = canvas.toDataURL('image/png');
    // Also update any already-rendered logo in the preview
    document.querySelectorAll('.fp-logo').forEach(el => { el.src = logoBase64; });
  };
  img.onerror = () => { logoBase64 = ''; };
  img.src = 'logo.png';
})();

// Toggle front page fields
enableFP.addEventListener('change', () => {
  fpFields.classList.toggle('hidden', !enableFP.checked);
});

// Toggle watermark input
enableWM.addEventListener('change', () => {
  wmText.classList.toggle('hidden', !enableWM.checked);
  applyWatermark();
});
wmText.addEventListener('input', applyWatermark);

function applyWatermark() {
  // Remove existing watermark overlay
  const existing = previewBox.querySelector('.wm-overlay');
  if (existing) existing.remove();

  if (!enableWM.checked || !wmText.value.trim()) return;

  const wm = document.createElement('div');
  wm.className = 'wm-overlay';
  wm.textContent = wmText.value.trim();
  previewBox.appendChild(wm);
}

// ── Main format handler ───────────────────────────────────────────────────────
formatBtn.addEventListener('click', () => {
  const raw = rawInput.value.trim();
  if (!raw) {
    previewBox.innerHTML = '<p class="placeholder-text">Please paste some content first.</p>';
    return;
  }

  let html = '';

  // Front page
  if (enableFP.checked) {
    html += buildFrontPage();
  }

  html += formatContent(raw);
  previewBox.innerHTML = html;
});

// ── Clear ─────────────────────────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  rawInput.value = '';
  previewBox.innerHTML = '<p class="placeholder-text">Your formatted document will appear here...</p>';
  document.getElementById('assignmentNo').value  = '';
  document.getElementById('subjectName').value   = '';
  document.getElementById('submittedTo').value   = '';
  document.getElementById('studentName').value   = '';
  document.getElementById('rollNumber').value    = '';
  document.getElementById('dateField').value     = '';
  enableFP.checked = false;
  fpFields.classList.add('hidden');
});

// ── Copy HTML ─────────────────────────────────────────────────────────────────
copyHtmlBtn.addEventListener('click', () => {
  const html = previewBox.innerHTML;
  navigator.clipboard.writeText(html).then(() => {
    copyHtmlBtn.textContent = 'Copied!';
    setTimeout(() => copyHtmlBtn.textContent = 'Copy HTML', 2000);
  });
});

// ── Save as PDF (print dialog) ────────────────────────────────────────────────
pdfBtn.addEventListener('click', () => {
  // Inject watermark CSS for print if enabled
  const wm = enableWM.checked ? wmText.value.trim() : '';
  let styleEl = document.getElementById('wm-print-style');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'wm-print-style';
    document.head.appendChild(styleEl);
  }
  if (wm) {
    styleEl.textContent = `
      @media print {
        #previewBox::after {
          content: "${wm}";
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 80pt;
          color: rgba(0,0,0,0.08);
          font-family: 'Times New Roman', serif;
          font-weight: bold;
          pointer-events: none;
          z-index: 9999;
          white-space: nowrap;
        }
      }`;
  } else {
    styleEl.textContent = '';
  }
  window.print();
});

// ── Save as Word (.docx) ──────────────────────────────────────────────────────
wordBtn.addEventListener('click', () => {
  if (previewBox.querySelector('.placeholder-text')) {
    alert('Please format a document first.');
    return;
  }

  const wm = enableWM.checked ? wmText.value.trim() : '';

  // Build a self-contained HTML string with inline styles for Word
  const wmStyle = wm ? `
    .wm-word {
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80pt; color: rgba(0,0,0,0.07);
      font-family: 'Times New Roman', serif; font-weight: bold;
      pointer-events: none; z-index: 9999; white-space: nowrap;
    }` : '';

  const wmDiv = wm ? `<div class="wm-word">${escapeHtml(wm)}</div>` : '';

  // Clone previewBox content without the overlay div
  const clone = previewBox.cloneNode(true);
  const overlay = clone.querySelector('.wm-overlay');
  if (overlay) overlay.remove();

  const docHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; color: #000; margin: 2cm; }
    h1 { font-size: 14pt; font-weight: bold; margin: 20px 0 8px; }
    h2 { font-size: 13pt; font-weight: bold; margin: 18px 0 6px; }
    h3 { font-size: 12pt; font-weight: bold; margin: 14px 0 4px; }
    p  { margin-bottom: 10px; text-align: justify; line-height: 1.8; }
    ul, ol { margin: 6px 0 12px 28px; }
    li { margin-bottom: 4px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 11pt; }
    th { font-weight: bold; padding: 8px 10px; border: 1px solid #000; text-align: left; background: #fff; }
    td { padding: 8px 10px; border: 1px solid #000; vertical-align: top; }
    .field-line { margin-bottom: 10px; display: block; }
    .table-caption { font-weight: bold; display: block; margin-bottom: 4px; }
    .doc-front-page { text-align: center; padding: 60px 20px 50px; page-break-after: always; }
    .fp-university { font-size: 14pt; font-weight: bold; margin-bottom: 4px; }
    .fp-campus { font-size: 12pt; font-weight: 600; margin-bottom: 20px; }
    .fp-fields { text-align: left; display: inline-block; min-width: 300px; }
    .fp-row { margin-bottom: 16px; font-size: 12pt; }
    .fp-label { font-weight: bold; }
    .fp-logo { width: 140px; height: 140px; margin-bottom: 14px; }
    ${wmStyle}
  </style></head><body>
  ${wmDiv}
  ${clone.innerHTML}
  </body></html>`;

  const blob = htmlDocx.asBlob(docHtml);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'assignment.docx';
  a.click();
  URL.revokeObjectURL(url);
});

// ── Front Page Builder ────────────────────────────────────────────────────────
function buildFrontPage() {
  const assignmentNo  = document.getElementById('assignmentNo').value.trim()  || '';
  const subject       = document.getElementById('subjectName').value.trim()   || '';
  const submittedTo   = document.getElementById('submittedTo').value.trim()   || '';
  const studentName   = document.getElementById('studentName').value.trim()   || '';
  const rollNumber    = document.getElementById('rollNumber').value.trim()    || '';
  const date          = document.getElementById('dateField').value.trim()     || '';

  const logoSrc = logoBase64 || 'logo.png';
  return `
  <div class="doc-front-page">
    <img src="${logoSrc}" alt="COMSATS University Logo" class="fp-logo" />
    <div class="fp-university">COMSATS UNIVERSITY ISLAMABAD</div>
    <div class="fp-campus">Vehari Campus</div>
    <div class="fp-divider"></div>
    <div class="fp-fields">
      <div class="fp-row"><span class="fp-label">Assignment No:</span><span class="fp-value">${escapeHtml(assignmentNo)}</span></div>
      <div class="fp-row"><span class="fp-label">Subject:</span><span class="fp-value">${escapeHtml(subject)}</span></div>
      <div class="fp-row"><span class="fp-label">Submitted To:</span><span class="fp-value">${escapeHtml(submittedTo)}</span></div>
      <div class="fp-row"><span class="fp-label">Submitted By:</span><span class="fp-value">${escapeHtml(studentName)}</span></div>
      <div class="fp-row"><span class="fp-label">Roll Number:</span><span class="fp-value">${escapeHtml(rollNumber)}</span></div>
      <div class="fp-row"><span class="fp-label">Submission Date:</span><span class="fp-value">${escapeHtml(date)}</span></div>
    </div>
  </div>`;
}

// ── Core Content Formatter ────────────────────────────────────────────────────
function formatContent(raw) {
  const lines = raw.split('\n');
  let html    = '';
  let i       = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === '') { i++; continue; }

    // ── Pipe/tab/spaced table block (multi-line) ────────────────────────────
    if (isTableBlock(lines, i)) {
      const { tableHtml, nextIndex } = parseTable(lines, i);
      html += tableHtml;
      i = nextIndex;
      continue;
    }

    // ── "Table: Title" — reads header + data rows below it ────────────────
    // Format:
    //   Table: Software Engineering Phases
    //   Phase  Description  Example
    //   Requirement Analysis  Understand user needs  Shopping app
    //   Design  Plan structure  Create layout
    const tableLabel = trimmed.match(/^table\s*:\s*(.+)$/i);
    if (tableLabel && i + 1 < lines.length) {
      const caption = tableLabel[1].trim();
      const { tableHtml, nextIndex } = parseStructuredTable(caption, lines, i + 1);
      if (tableHtml) {
        html += tableHtml;
        i = nextIndex;
        continue;
      }
    }

    // ── Markdown headings ───────────────────────────────────────────────────
    if (/^###\s+/.test(trimmed)) {
      html += `<h3>${escapeHtml(trimmed.replace(/^###\s+/, ''))}</h3>\n`;
      i++; continue;
    }
    if (/^##\s+/.test(trimmed)) {
      html += `<h2>${escapeHtml(trimmed.replace(/^##\s+/, ''))}</h2>\n`;
      i++; continue;
    }
    if (/^#\s+/.test(trimmed)) {
      html += `<h1>${escapeHtml(trimmed.replace(/^#\s+/, ''))}</h1>\n`;
      i++; continue;
    }

    // ── Q1. / Question 1 headings ───────────────────────────────────────────
    if (/^(Q\.?\s*\d+[\.\):]?|Question\s+\d+[\.\):]?)/i.test(trimmed)) {
      html += `<h2>${escapeHtml(trimmed)}</h2>\n`;
      i++; continue;
    }

    // ── "Label: value" field lines (e.g. Roll Number: FA23-BSE-037) ─────────
    const fieldMatch = trimmed.match(/^([^:]{1,35}):\s*(.*)$/);
    if (
      fieldMatch &&
      !trimmed.startsWith('http') &&
      !/^(https?|ftp)/.test(trimmed) &&
      fieldMatch[1].split(' ').length <= 5
    ) {
      const label = fieldMatch[1].trim();
      const value = fieldMatch[2].trim();
      html += `<p class="field-line"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>\n`;
      i++; continue;
    }

    // ── Table caption: short line immediately before a table block ──────────
    if (
      i + 1 < lines.length &&
      isTableBlock(lines, i + 1) &&
      trimmed.length <= 80
    ) {
      html += `<span class="table-caption">${escapeHtml(trimmed)}</span>\n`;
      i++; continue;
    }

    // ── Lists ───────────────────────────────────────────────────────────────
    if (isBulletLine(trimmed)) {
      const { listHtml, nextIndex } = parseList(lines, i, 'ul');
      html += listHtml;
      i = nextIndex;
      continue;
    }

    if (isNumberedLine(trimmed)) {
      const { listHtml, nextIndex } = parseList(lines, i, 'ol');
      html += listHtml;
      i = nextIndex;
      continue;
    }

    // ── Paragraph ───────────────────────────────────────────────────────────
    const { paraHtml, nextIndex } = parseParagraph(lines, i);
    html += paraHtml;
    i = nextIndex;
  }

  return html;
}

// ── Structured multi-line table parser ───────────────────────────────────────
// Handles:
//   Table: Software Engineering Phases          ← caption (already consumed)
//   Phase  Description  Example                 ← header row (2+ spaces between cols)
//   Requirement Analysis  Understand user needs  Shopping app
//   Design  Plan structure  Create layout
//
// Each line is split by 2+ consecutive spaces into cells.
// First data line = header row, rest = body rows.
function parseStructuredTable(caption, lines, start) {
  const rows = [];
  let i = start;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Stop at blank line or a new section heading
    if (trimmed === '') { i++; break; }
    if (/^(Q\.?\s*\d+|Question\s+\d+|#{1,3}\s)/i.test(trimmed)) break;

    // Split by 2+ spaces (preserves multi-word cell values like "Requirement Analysis")
    const cols = trimmed.split(/\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
    if (cols.length >= 2) {
      rows.push(cols);
    } else if (rows.length === 0) {
      // Not a valid table start
      break;
    } else {
      // Single-word line after table started — stop
      break;
    }
    i++;
  }

  if (rows.length === 0) return { tableHtml: null, nextIndex: start };

  let html = `<span class="table-caption">${escapeHtml(caption)}</span>\n<table>\n`;

  // First row = header
  html += '<thead><tr>';
  rows[0].forEach(cell => { html += `<th>${escapeHtml(cell)}</th>`; });
  html += '</tr></thead>\n<tbody>\n';

  const colCount = rows[0].length;
  for (let r = 1; r < rows.length; r++) {
    html += '<tr>';
    for (let c = 0; c < colCount; c++) {
      html += `<td>${escapeHtml(rows[r][c] || '')}</td>`;
    }
    html += '</tr>\n';
  }

  html += '</tbody>\n</table>\n';
  return { tableHtml: html, nextIndex: i };
}

// ── Paragraph parser (merges consecutive non-special lines) ──────────────────
function parseParagraph(lines, start) {
  let text = '';
  let i = start;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === '') { i++; break; }
    if (isSpecialLine(trimmed, lines, i)) break;

    text += (text ? ' ' : '') + trimmed;
    i++;
  }

  return {
    paraHtml: text ? `<p>${escapeHtml(text)}</p>\n` : '',
    nextIndex: i
  };
}

// ── List parser ───────────────────────────────────────────────────────────────
function parseList(lines, start, type) {
  const tag = type === 'ul' ? 'ul' : 'ol';
  let html = `<${tag}>\n`;
  let i = start;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === '') { i++; break; }

    if (type === 'ul' && isBulletLine(trimmed)) {
      const content = trimmed.replace(/^[-*•]\s+/, '');
      html += `  <li>${escapeHtml(content)}</li>\n`;
    } else if (type === 'ol' && isNumberedLine(trimmed)) {
      const content = trimmed.replace(/^\d+[\.\)]\s+/, '');
      html += `  <li>${escapeHtml(content)}</li>\n`;
    } else {
      break;
    }
    i++;
  }

  html += `</${tag}>\n`;
  return { listHtml: html, nextIndex: i };
}

// ── Table detection & parser ──────────────────────────────────────────────────
function isTableBlock(lines, start) {
  // Need at least 2 consecutive lines that look like whitespace-separated columns
  let count = 0;
  for (let j = start; j < Math.min(start + 5, lines.length); j++) {
    if (looksLikeTableRow(lines[j].trim())) count++;
    else break;
  }
  return count >= 2;
}

function looksLikeTableRow(line) {
  if (!line) return false;
  // Has pipe separators
  if (line.includes('|')) return true;
  // Has 2+ tab-separated values
  if (line.split('\t').length >= 2) return true;
  // Has 2+ consecutive-space-separated values (at least 3 columns)
  const cols = line.split(/\s{2,}/);
  return cols.length >= 2 && cols.every(c => c.trim().length > 0);
}

function parseTable(lines, start) {
  const rows = [];
  let i = start;

  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (!trimmed || !looksLikeTableRow(trimmed)) break;

    // Skip markdown separator rows like |---|---|
    if (/^[\|\-\s:]+$/.test(trimmed)) { i++; continue; }

    let cols;
    if (trimmed.includes('|')) {
      cols = trimmed.split('|').map(c => c.trim()).filter(c => c !== '');
    } else if (trimmed.includes('\t')) {
      cols = trimmed.split('\t').map(c => c.trim());
    } else {
      cols = trimmed.split(/\s{2,}/).map(c => c.trim());
    }

    rows.push(cols);
    i++;
  }

  if (rows.length === 0) return { tableHtml: '', nextIndex: i };

  let html = '<table>\n';
  // First row as header
  html += '  <thead><tr>';
  rows[0].forEach(cell => { html += `<th>${escapeHtml(cell)}</th>`; });
  html += '</tr></thead>\n  <tbody>\n';

  for (let r = 1; r < rows.length; r++) {
    html += '    <tr>';
    rows[r].forEach(cell => { html += `<td>${escapeHtml(cell)}</td>`; });
    html += '</tr>\n';
  }

  html += '  </tbody>\n</table>\n';
  return { tableHtml: html, nextIndex: i };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isBulletLine(line) {
  return /^[-*•]\s+/.test(line);
}

function isNumberedLine(line) {
  return /^\d+[\.\)]\s+/.test(line);
}

function isSpecialLine(trimmed, lines, i) {
  const fieldMatch = trimmed.match(/^([^:]{1,35}):\s*(.*)$/);
  const isField = fieldMatch &&
    !trimmed.startsWith('http') &&
    fieldMatch[1].split(' ').length <= 5;

  return (
    /^(Q\.?\s*\d+[\.\):]?|Question\s+\d+[\.\):]?)/i.test(trimmed) ||
    /^#{1,3}\s+/.test(trimmed) ||
    isBulletLine(trimmed) ||
    isNumberedLine(trimmed) ||
    isField ||
    isTableBlock(lines, i)
  );
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
