// scripts/grader.js
// Resilient grader for React Starter Lab (JS and JSX compatible)

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ---------------------------
// Helpers
// ---------------------------
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}
function fileExists(filePath) {
  return fs.existsSync(filePath);
}
function hasRegex(str, regex) {
  if (!str) return false;
  return regex.test(str);
}
function getCommitISOTime() {
  try {
    const iso = execSync('git log -1 --format=%cI').toString().trim();
    return iso || null;
  } catch {
    return null;
  }
}
function points(value, max) {
  return Math.max(0, Math.min(max, value));
}

// Prefer .jsx if present, else .js
function firstThatExists(paths) {
  for (const p of paths) {
    if (fileExists(p)) return p;
  }
  return null;
}
function readFirst(paths) {
  const p = firstThatExists(paths);
  return { content: p ? safeRead(p) : '', path: p };
}

// ---------------------------
// Inputs / Files (JS + JSX)
// ---------------------------
const appCandidates = [path.join('src', 'App.jsx'), path.join('src', 'App.js')];
const studentCardCandidates = [
  path.join('src', 'components', 'StudentCard.jsx'),
  path.join('src', 'components', 'StudentCard.js'),
];

const { content: appFile, path: appPath } = readFirst(appCandidates);
const { content: studentCardFile, path: studentCardPath } = readFirst(studentCardCandidates);

const hasStudentCardFile = Boolean(studentCardPath);

// ---------------------------
// Submission Points (20)
// ---------------------------
const DUE_DATE = process.env.DUE_DATE || '';
const commitISO = getCommitISOTime();

let submissionPoints = 20;
if (DUE_DATE && commitISO) {
  const commitTime = new Date(commitISO).getTime();
  const dueTime = new Date(DUE_DATE).getTime();
  if (!Number.isNaN(commitTime) && !Number.isNaN(dueTime)) {
    submissionPoints = commitTime <= dueTime ? 20 : 10; // 50% penalty on submission points only
  }
}

// ---------------------------
// Task 1 (40 points)
// ---------------------------
let t1_correctness = 0;
let t1_completeness = 0;
let t1_quality = 0;

const t1_hasComponent =
  hasRegex(studentCardFile, /\bfunction\s+StudentCard\s*\(/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*\(/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*.*=>/);

const t1_exportsDefault = hasRegex(studentCardFile, /\bexport\s+default\s+StudentCard\b/);
const t1_hasJSX = hasRegex(studentCardFile, /return\s*\(\s*<[^>]+>/s);

const t1_hasNameH3 = hasRegex(studentCardFile, /<h3[^>]*>.*Name[:\s]/i);
const t1_hasIdP = hasRegex(studentCardFile, /<p[^>]*>.*ID[:\s]/i);
const t1_hasDeptP = hasRegex(studentCardFile, /<p[^>]*>.*Department[:\s]/i);

// Import path detection: allow .js, .jsx, or no extension
const importRe = new RegExp(
  String.raw`import\s+StudentCard\s+from\s+['"][^'"]*components\/StudentCard(?:\.jsx?|)['"]`
);
const t1_appImports = hasRegex(appFile, importRe);

// Render detection: <StudentCard /> or <StudentCard/>
const t1_appRenders = hasRegex(appFile, /<StudentCard(\s[^>]*)?\/>/);

// Correctness (18): component exists (6) + export+JSX (6) + imported & rendered (6)
if (t1_hasComponent) t1_correctness += 6;
if (t1_exportsDefault && t1_hasJSX) t1_correctness += 6;
if (t1_appImports && t1_appRenders) t1_correctness += 6;

// Completeness (14): file exists (4) + Name h3 (4) + ID p (3) + Dept p (3)
if (hasStudentCardFile) t1_completeness += 4;
if (t1_hasNameH3) t1_completeness += 4;
if (t1_hasIdP) t1_completeness += 3;
if (t1_hasDeptP) t1_completeness += 3;

// Code Quality (8): has comment (3) + reasonable naming (3) + structure (2)
const t1_hasComment = hasRegex(studentCardFile, /\/\/|\/\*|\*\//);
if (t1_hasComment) t1_quality += 3;
if (t1_hasComponent) t1_quality += 3;
if (t1_exportsDefault && t1_hasJSX) t1_quality += 2;

t1_correctness = points(t1_correctness, 18);
t1_completeness = points(t1_completeness, 14);
t1_quality = points(t1_quality, 8);

const task1Total = t1_correctness + t1_completeness + t1_quality;

// ---------------------------
// Task 2 (40 points)
// ---------------------------
let t2_correctness = 0;
let t2_completeness = 0;
let t2_quality = 0;

const t2_acceptsProps =
  hasRegex(studentCardFile, /\bfunction\s+StudentCard\s*\(\s*props\s*\)/) ||
  hasRegex(studentCardFile, /\bfunction\s+StudentCard\s*\(\s*\{\s*name\s*,\s*id\s*,\s*department\s*\}\s*\)/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*\(\s*props\s*\)\s*=>/) ||
  hasRegex(studentCardFile, /\bconst\s+StudentCard\s*=\s*\(\s*\{\s*name\s*,\s*id\s*,\s*department\s*\}\s*\)\s*=>/);

const t2_usesPropsInJSX =
  hasRegex(studentCardFile, /\{props\.name\}/) ||
  hasRegex(studentCardFile, /\{props\.id\}/) ||
  hasRegex(studentCardFile, /\{props\.department\}/) ||
  (hasRegex(studentCardFile, /\{name\}/) &&
    hasRegex(studentCardFile, /\{id\}/) &&
    hasRegex(studentCardFile, /\{department\}/));

const studentCardUsageCount = (appFile.match(/<StudentCard\b/g) || []).length;
const t2_appRendersTwo = studentCardUsageCount >= 2;

// Pull names from props in App (rough heuristic)
function extractPropValues(regex) {
  const matches = [];
  const r = new RegExp(regex, 'g');
  let m;
  while ((m = r.exec(appFile)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}
const namesPassed = extractPropValues(/<StudentCard[^>]*\sname\s*=\s*["'`]([^"'`]+)["'`]/);
const t2_twoDifferentNames = namesPassed.length >= 2 && new Set(namesPassed).size >= 2;

// Correctness (18): accepts props (6) + uses props (6) + renders two (6)
if (t2_acceptsProps) t2_correctness += 6;
if (t2_usesPropsInJSX) t2_correctness += 6;
if (t2_appRendersTwo) t2_correctness += 6;

// Completeness (14): uses all three props (9) + two different data (5)
const usesAllThreeProps =
  (hasRegex(studentCardFile, /\bprops\.name\b/) || hasRegex(studentCardFile, /\b\{?\bname\b\}?/)) &&
  (hasRegex(studentCardFile, /\bprops\.id\b/) || hasRegex(studentCardFile, /\b\{?\bid\b\}?/)) &&
  (hasRegex(studentCardFile, /\bprops\.department\b/) || hasRegex(studentCardFile, /\b\{?\bdepartment\b\}?/));

if (usesAllThreeProps) t2_completeness += 9;
if (t2_twoDifferentNames) t2_completeness += 5;

// Code Quality (8): comment (3) + good prop names (3) + export present (2)
const t2_hasComment = hasRegex(studentCardFile, /\/\/|\/\*|\*\//);
if (t2_hasComment) t2_quality += 3;

const t2_reasonablePropNames =
  hasRegex(studentCardFile, /\bname\b/) &&
  hasRegex(studentCardFile, /\bid\b/) &&
  hasRegex(studentCardFile, /\bdepartment\b/);
if (t2_reasonablePropNames) t2_quality += 3;

if (t1_exportsDefault) t2_quality += 2;

t2_correctness = points(t2_correctness, 18);
t2_completeness = points(t2_completeness, 14);
t2_quality = points(t2_quality, 8);

const task2Total = t2_correctness + t2_completeness + t2_quality;

// ---------------------------
// Totals
// ---------------------------
const total = submissionPoints + task1Total + task2Total;

const report = {
  meta: {
    appPath: appPath || '(not found)',
    studentCardPath: studentCardPath || '(not found)',
    dueDate: DUE_DATE || '(not set; assuming on-time)',
    commitISO: commitISO || '(not available)',
  },
  submission: {
    points: submissionPoints,
    note: DUE_DATE
      ? (submissionPoints === 20 ? 'On-time submission' : 'Late submission (50% penalty on submission points)')
      : 'DUE_DATE not set; awarding full submission points',
    max: 20,
  },
  task1: {
    correctness: t1_correctness,
    completeness: t1_completeness,
    quality: t1_quality,
    total: task1Total,
    max: 40,
    notes: {
      fileFound: hasStudentCardFile,
      importedInApp: t1_appImports,
      renderedInApp: t1_appRenders,
      hasNameH3: t1_hasNameH3,
      hasIdP: t1_hasIdP,
      hasDeptP: t1_hasDeptP,
    },
  },
  task2: {
    correctness: t2_correctness,
    completeness: t2_completeness,
    quality: t2_quality,
    total: task2Total,
    max: 40,
    notes: {
      acceptsProps: t2_acceptsProps,
      usesPropsInJSX: t2_usesPropsInJSX,
      rendersTwo: t2_appRendersTwo,
      twoDifferentNames: t2_twoDifferentNames,
    },
  },
  grandTotal: {
    points: total,
    max: 100,
  },
};

try {
  fs.mkdirSync('grading', { recursive: true });
  fs.writeFileSync('grading/grade.json', JSON.stringify(report, null, 2));
} catch {}

function asMarkdown(r) {
  return `
# Auto Grade Report

**Due Date:** ${r.meta.dueDate}  
**Commit Time:** ${r.meta.commitISO}

**Detected files:**  
- App: ${r.meta.appPath}  
- StudentCard: ${r.meta.studentCardPath}

## Submission (20)
- Points: **${r.submission.points}** (${r.submission.note})

## Task 1 (40)
- Correctness: **${r.task1.correctness}/18**
- Completeness: **${r.task1.completeness}/14**
- Code Quality: **${r.task1.quality}/8**
- Total: **${r.task1.total}/40**

Details:
- StudentCard file: ${r.task1.notes.fileFound ? 'found' : 'missing'}
- Imported in App: ${r.task1.notes.importedInApp ? 'yes' : 'no'}
- Rendered in App: ${r.task1.notes.renderedInApp ? 'yes' : 'no'}
- Name <h3>: ${r.task1.notes.hasNameH3 ? 'yes' : 'no'}
- ID <p>: ${r.task1.notes.hasIdP ? 'yes' : 'no'}
- Department <p>: ${r.task1.notes.hasDeptP ? 'yes' : 'no'}

## Task 2 (40)
- Correctness: **${r.task2.correctness}/18**
- Completeness: **${r.task2.completeness}/14**
- Code Quality: **${r.task2.quality}/8**
- Total: **${r.task2.total}/40**

Details:
- Accepts props: ${r.task2.notes.acceptsProps ? 'yes' : 'no'}
- Uses props in JSX: ${r.task2.notes.usesPropsInJSX ? 'yes' : 'no'}
- Renders two <StudentCard>: ${r.task2.notes.rendersTwo ? 'yes' : 'no'}
- Two different names: ${r.task2.notes.twoDifferentNames ? 'yes' : 'no'}

## Grand Total
- **${r.grandTotal.points}/100**
`.trim();
}
const md = asMarkdown(report);
console.log(md);
try {
  fs.writeFileSync('grading/grade.md', md);
} catch {}
