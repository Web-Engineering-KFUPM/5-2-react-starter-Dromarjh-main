// scripts/grader.cjs
// Flexible, resilient grader for the React Starter Lab (JS + JSX)
// - Works even if Task 2 is missing
// - Compatible with projects that use "type": "module" (use .cjs to avoid ESM issues)
// - Softer scoring, but now without "commenting" in Code Quality
// - Detailed feedback: shows achieved and missed checks with point deltas

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/* ---------------------------
   Helpers
----------------------------*/
function safeRead(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}
function exists(p) { return fs.existsSync(p); }
function hasRegex(str, regex) { return !!(str && regex.test(str)); }
function points(val, max) { return Math.max(0, Math.min(max, val)); }
function getCommitISOTime() {
  try { return execSync('git log -1 --format=%cI').toString().trim() || null; } catch { return null; }
}
function firstThatExists(paths) {
  for (const p of paths) if (exists(p)) return p;
  return null;
}
function readFirst(paths) {
  const p = firstThatExists(paths);
  return { path: p || null, content: p ? safeRead(p) : '' };
}

// feedback item helper
function addCheck(bucket, condition, pts, okMsg, missMsg) {
  bucket.items.push({
    ok: !!condition,
    points: condition ? pts : 0,
    max: pts,
    okMsg,
    missMsg,
  });
  bucket.total += condition ? pts : 0;
  bucket.max += pts;
}

/* ---------------------------
   Inputs / Files
----------------------------*/
const appFilePick   = readFirst([path.join('src','App.jsx'), path.join('src','App.js')]);
const cardFilePick  = readFirst([path.join('src','components','StudentCard.jsx'), path.join('src','components','StudentCard.js')]);

const appPath = appFilePick.path;
const appFile = appFilePick.content;

const studentCardPath = cardFilePick.path;
const studentCardFile = cardFilePick.content;

const hasStudentCardFile = !!studentCardPath;

/* ---------------------------
   Submission Points (20)
----------------------------*/
const DUE_DATE = process.env.DUE_DATE || '';  // ISO 8601, e.g. "2025-10-01T23:59:59+03:00"
const commitISO = getCommitISOTime();

let submissionPoints = 20;
let submissionFeedback = 'Full credit (no due date set).';
if (DUE_DATE && commitISO) {
  const commitTime = new Date(commitISO).getTime();
  const dueTime    = new Date(DUE_DATE).getTime();
  if (!Number.isNaN(commitTime) && !Number.isNaN(dueTime)) {
    if (commitTime <= dueTime) {
      submissionPoints = 20;
      submissionFeedback = 'On time.';
    } else {
      submissionPoints = 10; // 50% penalty on submission points only
      submissionFeedback = 'Late submission (50% penalty on submission points only).';
    }
  } else {
    submissionFeedback = 'Invalid DUE_DATE or commit time; defaulting to full submission points.';
  }
}

/* ---------------------------
   Checks & regexes (flexible)
----------------------------*/
// Component-like in StudentCard file (any name/case)
const anyComponentDecl =
  hasRegex(studentCardFile, /\bfunction\s+[A-Za-z_]\w*\s*\(/) ||
  hasRegex(studentCardFile, /\bconst\s+[A-Za-z_]\w*\s*=\s*\(/) ||
  hasRegex(studentCardFile, /\bconst\s+[A-Za-z_]\w*\s*=\s*.*=>/);

// Specifically named StudentCard (for potential future use)
const namedStudentCardDecl =
  hasRegex(studentCardFile, /\bfunction\s+StudentCard\s*\(/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*\(/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*.*=>/);

// Any export (named OR default)
const anyExport = hasRegex(studentCardFile, /\bexport\s+default\b|\bexport\s+\{[^}]*\}/);

// JSX presence (very loose)
const hasJSXReturn = hasRegex(studentCardFile, /return\s*\(?\s*<[^>]/s) || hasRegex(studentCardFile, /=>\s*\(?\s*<[^>]/s);

// Label presence (flexible tags/text)
const hasNameLabel = hasRegex(studentCardFile, /<\w+[^>]*>\s*Name\b/i);
const hasIdLabel = hasRegex(studentCardFile, /<\w+[^>]*>\s*(ID|Student\s*ID)\b/i);
const hasDeptLabel = hasRegex(studentCardFile, /<\w+[^>]*>\s*(Department|Dept)\b/i);

// Import StudentCard (w/ or w/o extension)
const importStudentCard = hasRegex(
  appFile,
  new RegExp(String.raw`import\s+StudentCard\s+from\s+['"][^'"]*components\/StudentCard(?:\.jsx?|)['"]`)
);
// Render in App
const renderStudentCardCount = (appFile.match(/<StudentCard\b/g) || []).length;
const rendersStudentCard = renderStudentCardCount >= 1;

// Props usage
const usesPropsVars =
  hasRegex(studentCardFile, /\{props\.(name|id|department|dept|studentId)\}/) ||
  (hasRegex(studentCardFile, /\{name\}/) || hasRegex(studentCardFile, /\{id\}/) || hasRegex(studentCardFile, /\{department\}/) || hasRegex(studentCardFile, /\{dept\}/) || hasRegex(studentCardFile, /\{studentId\}/));

// Accepts props (params contain props or destructured fields)
const acceptsProps =
  hasRegex(studentCardFile, /\bfunction\s+StudentCard\s*\(\s*props\s*\)/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*\(\s*props\s*\)\s*=>/) ||
  hasRegex(studentCardFile, /\bfunction\s+[A-Za-z_]\w*\s*\(\s*props\s*\)/) ||
  hasRegex(studentCardFile, /\bconst\s+[A-Za-z_]\w*\s*=\s*\(\s*props\s*\)\s*=>/) ||
  hasRegex(studentCardFile, /\(\s*\{\s*(?:name|id|studentId|department|dept)(?:\s*,\s*(?:name|id|studentId|department|dept))*\s*\}\s*\)/);

// Two instances & different values (heuristic by "name" or "id")
const hasTwoInstances = renderStudentCardCount >= 2;
function extractPropValues(regex) {
  const out = [];
  const r = new RegExp(regex, 'g');
  let m;
  while ((m = r.exec(appFile)) !== null) out.push(m[1]);
  return out;
}
const namesPassed = extractPropValues(/<StudentCard[^>]*\sname\s*=\s*["'`]([^"'`]+)["'`]/);
const idsPassed   = extractPropValues(/<StudentCard[^>]*\s(?:id|studentId)\s*=\s*["'`]([^"'`]+)["'`]/);
const twoDifferentNames = namesPassed.length >= 2 && new Set(namesPassed).size >= 2;
const twoDifferentIds   = idsPassed.length >= 2 && new Set(idsPassed).size >= 2;

// All three props (name + id/studentId + department/dept) appear somewhere in StudentCard JSX
const usesAllThreeProps =
  (hasRegex(studentCardFile, /\bprops\.name\b/) || hasRegex(studentCardFile, /\{name\}/)) &&
  (hasRegex(studentCardFile, /\bprops\.(id|studentId)\b/) || hasRegex(studentCardFile, /\{(?:id|studentId)\}/)) &&
  (hasRegex(studentCardFile, /\bprops\.(department|dept)\b/) || hasRegex(studentCardFile, /\{(?:department|dept)\}/));

/* ---------------------------
   Task 1 Scoring (40)
   Correctness: 18, Completeness: 14, Quality: 8
----------------------------*/
const t1 = { correctness: { items: [], total: 0, max: 0 },
             completeness: { items: [], total: 0, max: 0 },
             quality: { items: [], total: 0, max: 0 } };

// Correctness (18)
addCheck(t1.correctness, anyComponentDecl && hasJSXReturn, 6, 'Component with JSX found.', 'Component/JSX not clearly detected.');
addCheck(t1.correctness, importStudentCard || rendersStudentCard, 6, 'Component is imported or rendered in App.', 'Not imported or rendered in App.');
addCheck(t1.correctness, rendersStudentCard, 6, 'Component is rendered in App.', 'No rendering detected in App.');

// Completeness (14)
addCheck(t1.completeness, hasStudentCardFile, 3, 'StudentCard file found.', 'StudentCard file missing.');
addCheck(t1.completeness, hasNameLabel, 4, 'Name label shown.', 'Name label not detected.');
addCheck(t1.completeness, hasIdLabel, 3, 'ID/Student ID label shown.', 'ID/Student ID label not detected.');
addCheck(t1.completeness, hasDeptLabel, 4, 'Department/Dept label shown.', 'Department/Dept label not detected.');

// Quality (8) — rebalanced (removed comment; +JSX from 1→2)
addCheck(t1.quality, hasStudentCardFile, 2, 'File present.', 'Expected file not found.');
addCheck(t1.quality, anyComponentDecl, 2, 'Reasonable component structure.', 'Component structure not detected.');
addCheck(t1.quality, hasJSXReturn, 2, 'JSX used.', 'No JSX return detected.');
addCheck(t1.quality, anyExport, 1, 'Exports detected.', 'No export detected.');
addCheck(t1.quality, (importStudentCard || rendersStudentCard) && rendersStudentCard, 1, 'Wired into App.', 'Not wired into App (import + render).');

const task1Total = points(t1.correctness.total, 18) + points(t1.completeness.total, 14) + points(t1.quality.total, 8);

/* ---------------------------
   Task 2 Scoring (40)
   Correctness: 18, Completeness: 14, Quality: 8
----------------------------*/
const t2 = { correctness: { items: [], total: 0, max: 0 },
             completeness: { items: [], total: 0, max: 0 },
             quality: { items: [], total: 0, max: 0 } };

// Correctness (18)
addCheck(t2.correctness, acceptsProps || usesPropsVars, 6, 'Props accepted/used.', 'Props not clearly accepted/used.');
addCheck(t2.correctness, usesPropsVars, 6, 'Props displayed in JSX.', 'Props not shown in JSX.');
addCheck(t2.correctness, hasTwoInstances, 6, 'Two <StudentCard> instances rendered.', 'Less than two instances rendered.');

// Completeness (14)
addCheck(t2.completeness, usesAllThreeProps, 9, 'All three props used (name, id/studentId, department/dept).', 'Missing one or more required props.');
addCheck(t2.completeness, twoDifferentNames || twoDifferentIds, 5, 'Instances show different data (name/id).', 'Instances appear to use identical data.');

// Quality (8) — rebalanced (removed comment; +Export from 1→2)
addCheck(t2.quality, hasStudentCardFile, 2, 'File present.', 'Expected file not found.');
addCheck(t2.quality, usesPropsVars, 2, 'Props wired to UI.', 'Props not wired to JSX.');
addCheck(t2.quality, (hasRegex(studentCardFile, /\bname\b/)) &&
                     (hasRegex(studentCardFile, /\b(id|studentId)\b/)) &&
                     (hasRegex(studentCardFile, /\b(department|dept)\b/)), 2,
        'Reasonable prop naming.', 'Non-standard prop naming.');
addCheck(t2.quality, anyExport, 2, 'Exports detected.', 'No export detected.');

const task2Total = points(t2.correctness.total, 18) + points(t2.completeness.total, 14) + points(t2.quality.total, 8);

/* ---------------------------
   Totals & Feedback Builder
----------------------------*/
const grandTotal = submissionPoints + task1Total + task2Total;

function formatBucket(title, bucket) {
  const lines = bucket.items.map(it => {
    const mark = it.ok ? '✓' : '✗';
    const reason = it.ok ? it.okMsg : it.missMsg;
    const delta = `${it.points}/${it.max}`;
    return `- ${mark} ${reason} _(+${it.points} / ${it.max})_`;
  });

  // Deductions summary
  const missed = bucket.items.filter(it => !it.ok);
  const lost = missed.reduce((s, it) => s + (it.max - it.points), 0);
  const deducLines = missed.length
    ? missed.map(it => `  • ${it.missMsg} _(-${it.max - it.points})_`)
    : ['  • None'];

  return [
    `**${title}: ${bucket.items.reduce((s, it) => s + it.points, 0)}/${bucket.max}**`,
    ...lines,
    '',
    `**Deductions in ${title}: -${lost}**`,
    ...deducLines,
  ].join('\n');
}

function formatTaskFeedback(taskTitle, taskObj, taskMax) {
  const total = points(taskObj.correctness.total, 18)
              + points(taskObj.completeness.total, 14)
              + points(taskObj.quality.total, 8);

  return [
    `### ${taskTitle} — **${total}/${taskMax}**`,
    '',
    formatBucket('Correctness', taskObj.correctness),
    '',
    formatBucket('Completeness', taskObj.completeness),
    '',
    formatBucket('Code Quality', taskObj.quality),
  ].join('\n');
}

const feedbackDetailed = [
  formatTaskFeedback('Task 1 (StudentCard component & wiring)', t1, 40),
  '',
  formatTaskFeedback('Task 2 (Props & multiple instances)', t2, 40)
].join('\n');

/* ---------------------------
   Report output
----------------------------*/
const report = {
  meta: {
    appPath: appPath || '(not found)',
    studentCardPath: studentCardPath || '(not found)',
    dueDate: DUE_DATE || '(not set; assuming on-time)',
    commitISO: commitISO || '(not available)',
  },
  submission: { points: submissionPoints, max: 20, feedback: submissionFeedback },
  task1: {
    correctness: t1.correctness.items, completeness: t1.completeness.items, quality: t1.quality.items,
    totals: { correctness: points(t1.correctness.total, 18), completeness: points(t1.completeness.total, 14), quality: points(t1.quality.total, 8) },
    total: task1Total, max: 40,
  },
  task2: {
    correctness: t2.correctness.items, completeness: t2.completeness.items, quality: t2.quality.items,
    totals: { correctness: points(t2.correctness.total, 18), completeness: points(t2.completeness.total, 14), quality: points(t2.quality.total, 8) },
    total: task2Total, max: 40,
  },
  grandTotal: { points: grandTotal, max: 100 },
  feedback: {
    submission: submissionFeedback,
    detailed: feedbackDetailed
  },
};

try {
  fs.mkdirSync('grading', { recursive: true });
  fs.writeFileSync('grading/grade.json', JSON.stringify(report, null, 2));
} catch { /* ignore */ }

const md = `
# Auto Grade Report

**Due Date:** ${report.meta.dueDate}  
**Commit Time:** ${report.meta.commitISO}

**Detected files:**  
- App: ${report.meta.appPath}  
- StudentCard: ${report.meta.studentCardPath}

## Submission (20)
- Points: **${submissionPoints}/20** — ${submissionFeedback}

## Task 1 (40)
${formatBucket('Correctness', t1.correctness)}

${formatBucket('Completeness', t1.completeness)}

${formatBucket('Code Quality', t1.quality)}

**Task 1 Total:** **${task1Total}/40**

---

## Task 2 (40)
${formatBucket('Correctness', t2.correctness)}

${formatBucket('Completeness', t2.completeness)}

${formatBucket('Code Quality', t2.quality)}

**Task 2 Total:** **${task2Total}/40**

---

## Grand Total
- **${grandTotal}/100**

---

## Detailed Feedback

${feedbackDetailed}
`.trim();

console.log(md);
try { fs.writeFileSync('grading/grade.md', md); } catch { /* ignore */ }
