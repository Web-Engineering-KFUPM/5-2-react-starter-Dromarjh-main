// scripts/grader.cjs
// Flexible, resilient grader for the React Starter Lab (JS + JSX)
// - Works even if Task 2 is missing
// - Compatible with projects that use "type": "module" (use .cjs to avoid ESM issues)
// - More forgiving scoring so "basic but working" code still earns ~5/8 on quality
// - Gives short feedback for each grade category

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

// Specifically named StudentCard (for some correctness checks)
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

// Has comment
const hasAnyComment = hasRegex(studentCardFile, /\/\/|\/\*|\*\//);

/* ---------------------------
   Task 1 Scoring (40)
   Correctness: 18, Completeness: 14, Quality: 8
----------------------------*/
let t1_correctness = 0, t1_completeness = 0, t1_quality = 0;
const t1_fb = { correctness: [], completeness: [], quality: [] };

// Correctness (18) — flexible
// +6 component exists (any name/case) & has JSX
if (anyComponentDecl && hasJSXReturn) { t1_correctness += 6; t1_fb.correctness.push('Component with JSX found.'); }
else t1_fb.correctness.push('Component/JSX not clearly detected.');

// +6 imported OR rendered in App
if (importStudentCard || rendersStudentCard) { t1_correctness += 6; t1_fb.correctness.push('Component is imported or rendered in App.'); }
else t1_fb.correctness.push('Not imported or rendered in App.');

// +6 rendered at least once
if (rendersStudentCard) { t1_correctness += 6; t1_fb.correctness.push('Component is rendered in App.'); }
else t1_fb.correctness.push('No rendering detected in App.');

t1_correctness = points(t1_correctness, 18);

// Completeness (14)
// +3 file exists
if (hasStudentCardFile) { t1_completeness += 3; t1_fb.completeness.push('StudentCard file found.'); }
else t1_fb.completeness.push('StudentCard file missing.');

// +4 Name label present
if (hasNameLabel) { t1_completeness += 4; t1_fb.completeness.push('Name is shown.'); }
else t1_fb.completeness.push('Name label not detected.');

// +3 ID label present (ID or Student ID)
if (hasIdLabel) { t1_completeness += 3; t1_fb.completeness.push('ID is shown.'); }
else t1_fb.completeness.push('ID label not detected.');

// +4 Department/Dept label present
if (hasDeptLabel) { t1_completeness += 4; t1_fb.completeness.push('Department is shown.'); }
else t1_fb.completeness.push('Department/Dept label not detected.');

t1_completeness = points(t1_completeness, 14);

// Quality (8) — softer & baseline ~5/8 for basic implementations
// +2 baseline if file exists
if (hasStudentCardFile) { t1_quality += 2; t1_fb.quality.push('File present.'); }
// +2 any component-like declaration (any name/case)
if (anyComponentDecl) { t1_quality += 2; t1_fb.quality.push('Reasonable component structure.'); }
// +1 JSX present
if (hasJSXReturn) { t1_quality += 1; t1_fb.quality.push('JSX used.'); }
// +1 any export (named or default)
if (anyExport) { t1_quality += 1; t1_fb.quality.push('Exports detected.'); }
// +1 at least one comment
if (hasAnyComment) { t1_quality += 1; t1_fb.quality.push('Comment present.'); }
// +1 small bonus if imported & rendered in App
if ((importStudentCard || rendersStudentCard) && rendersStudentCard) { t1_quality += 1; t1_fb.quality.push('Wired into App.'); }

t1_quality = points(t1_quality, 8);

const task1Total = t1_correctness + t1_completeness + t1_quality;

/* ---------------------------
   Task 2 Scoring (40)
   Correctness: 18, Completeness: 14, Quality: 8
----------------------------*/
let t2_correctness = 0, t2_completeness = 0, t2_quality = 0;
const t2_fb = { correctness: [], completeness: [], quality: [] };

// Correctness (18)
// +6 accepts props (params use props or destructuring) OR props used in JSX
if (acceptsProps || usesPropsVars) { t2_correctness += 6; t2_fb.correctness.push('Props accepted/used.'); }
else t2_fb.correctness.push('Props not clearly accepted/used.');

// +6 uses props in JSX (explicit rendering)
if (usesPropsVars) { t2_correctness += 6; t2_fb.correctness.push('Props displayed in JSX.'); }
else t2_fb.correctness.push('Props not shown in JSX.');

// +6 renders two instances
if (hasTwoInstances) { t2_correctness += 6; t2_fb.correctness.push('Two <StudentCard> instances rendered.'); }
else t2_fb.correctness.push('Less than two instances rendered.');

t2_correctness = points(t2_correctness, 18);

// Completeness (14)
// +9 uses all three props (name + id/studentId + department/dept)
if (usesAllThreeProps) { t2_completeness += 9; t2_fb.completeness.push('All three props used (name, id/studentId, department/dept).'); }
else t2_fb.completeness.push('Missing one or more props (name, id/studentId, department/dept).');

// +5 two instances carry different values in name or id
if (twoDifferentNames || twoDifferentIds) { t2_completeness += 5; t2_fb.completeness.push('Instances show different data.'); }
else t2_fb.completeness.push('Instances appear to have identical data.');

t2_completeness = points(t2_completeness, 14);

// Quality (8) — softer
// +2 baseline if file exists
if (hasStudentCardFile) { t2_quality += 2; t2_fb.quality.push('File present.'); }
// +2 props appear in JSX (any of {props.x} or destructured)
if (usesPropsVars) { t2_quality += 2; t2_fb.quality.push('Props wired to UI.'); }
// +2 reasonable prop names (name + id/studentId + department/dept)
const reasonablePropNames =
  (hasRegex(studentCardFile, /\bname\b/)) &&
  (hasRegex(studentCardFile, /\b(id|studentId)\b/)) &&
  (hasRegex(studentCardFile, /\b(department|dept)\b/));
if (reasonablePropNames) { t2_quality += 2; t2_fb.quality.push('Reasonable prop naming.'); }
// +1 any comment
if (hasAnyComment) { t2_quality += 1; t2_fb.quality.push('Comment present.'); }
// +1 any export present
if (anyExport) { t2_quality += 1; t2_fb.quality.push('Exports detected.'); }

t2_quality = points(t2_quality, 8);

const task2Total = t2_correctness + t2_completeness + t2_quality;

/* ---------------------------
   Totals & Feedback Builder
----------------------------*/
const grandTotal = submissionPoints + task1Total + task2Total;

function oneLineFeedback(title, score, max, bullets) {
  // Grab 2–3 most important reasons to keep it short
  const picks = bullets.filter(Boolean).slice(0, 3);
  const msg = picks.length ? picks.join(' • ') : 'No checks matched.';
  return `**${title}: ${score}/${max}** — ${msg}`;
}

const feedback = [
  `**Submission (${submissionPoints}/20)** — ${submissionFeedback}`,
  oneLineFeedback('Task 1 – Correctness',  t1_correctness, 18, t1_fb.correctness),
  oneLineFeedback('Task 1 – Completeness', t1_completeness, 14, t1_fb.completeness),
  oneLineFeedback('Task 1 – Code Quality', t1_quality,      8,  t1_fb.quality),
  oneLineFeedback('Task 2 – Correctness',  t2_correctness, 18, t2_fb.correctness),
  oneLineFeedback('Task 2 – Completeness', t2_completeness, 14, t2_fb.completeness),
  oneLineFeedback('Task 2 – Code Quality', t2_quality,      8,  t2_fb.quality),
];

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
    correctness: t1_correctness, completeness: t1_completeness, quality: t1_quality,
    total: task1Total, max: 40,
    notes: { importStudentCard, rendersStudentCard, hasNameLabel, hasIdLabel, hasDeptLabel }
  },
  task2: {
    correctness: t2_correctness, completeness: t2_completeness, quality: t2_quality,
    total: task2Total, max: 40,
    notes: { acceptsProps, usesPropsInJSX: usesPropsVars, hasTwoInstances, twoDifferentNames, twoDifferentIds }
  },
  grandTotal: { points: grandTotal, max: 100 },
  feedback,
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
- Points: **${submissionPoints}/20**

## Task 1 (40)
- Correctness: **${t1_correctness}/18**
- Completeness: **${t1_completeness}/14**
- Code Quality: **${t1_quality}/8**
- Total: **${task1Total}/40**

## Task 2 (40)
- Correctness: **${t2_correctness}/18**
- Completeness: **${t2_completeness}/14**
- Code Quality: **${t2_quality}/8**
- Total: **${task2Total}/40**

## Grand Total
- **${grandTotal}/100**

---

## Feedback (why you got these marks)

${feedback.map(f => `- ${f}`).join('\n')}
`.trim();

console.log(md);
try { fs.writeFileSync('grading/grade.md', md); } catch { /* ignore */ }
