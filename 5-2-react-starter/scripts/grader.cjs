#!/usr/bin/env node

/**
 * Lab Autograder — React Starter Lab
 *
 * Repo layout (your case):
 * - Workflow is in repo root: .github/workflows/grade.yml
 * - Grader is in: 5-2-react-starter/ scripts/grader.cjs
 * - Student code is in: 5-2-react-starter/src/...
 *
 * Marking:
 * - 80 marks for TODOs (React checks) => 2 TODOs × 40
 * - 20 marks for submission timing (deadline-based)
 *   - On/before deadline => 20/20
 *   - After deadline     => 10/20
 *
 * Deadline: 18 Feb 2026 1:59 PM (Asia/Riyadh, UTC+03:00)
 *
 * Notes:
 * - Ignores JS/JSX comments (so examples inside comments do NOT count).
 * - Lenient checks only: looks for top-level structure and key constructs.
 * - Accepts common equivalents and flexible naming.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ARTIFACTS_DIR = "artifacts";
const FEEDBACK_DIR = path.join(ARTIFACTS_DIR, "feedback");
fs.mkdirSync(FEEDBACK_DIR, { recursive: true });

/* -----------------------------
   Deadline (Asia/Riyadh)
   18 Feb 2026, 1:59 PM
-------------------------------- */
const DEADLINE_RIYADH_ISO = "2026-02-18T13:59:00+03:00";
const DEADLINE_MS = Date.parse(DEADLINE_RIYADH_ISO);

// Submission marks policy
const SUBMISSION_MAX = 20;
const SUBMISSION_LATE = 10;

/* -----------------------------
   TODO marks (out of 80)
-------------------------------- */
const tasks = [
  { id: "todo1", name: "TODO 1: StudentCard Static Component (basic card with hardcoded info)", marks: 40 },
  { id: "todo2", name: "TODO 2: StudentCard Dynamic (props + map in App.jsx)", marks: 40 },
];

const STEPS_MAX = tasks.reduce((sum, t) => sum + t.marks, 0); // 80
const TOTAL_MAX = STEPS_MAX + SUBMISSION_MAX; // 100

/* -----------------------------
   Helpers
-------------------------------- */
function safeRead(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function mdEscape(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function splitMarks(stepMarks, missingCount, totalChecks) {
  if (missingCount <= 0) return stepMarks;
  const perItem = stepMarks / totalChecks;
  const deducted = perItem * missingCount;
  return Math.max(0, round2(stepMarks - deducted));
}

/**
 * Strip JS/JSX comments while trying to preserve strings/templates.
 * Not a full parser, but robust enough for beginner labs and avoids
 * counting commented-out code.
 */
function stripJsComments(code) {
  if (!code) return code;

  let out = "";
  let i = 0;

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    // Handle string/template boundaries (with escapes)
    if (!inDouble && !inTemplate && ch === "'" && !inSingle) {
      inSingle = true;
      out += ch;
      i++;
      continue;
    }
    if (inSingle && ch === "'") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inSingle = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && !inDouble) {
      inDouble = true;
      out += ch;
      i++;
      continue;
    }
    if (inDouble && ch === '"') {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inDouble = false;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && !inTemplate) {
      inTemplate = true;
      out += ch;
      i++;
      continue;
    }
    if (inTemplate && ch === "`") {
      let backslashes = 0;
      for (let k = i - 1; k >= 0 && code[k] === "\\"; k--) backslashes++;
      if (backslashes % 2 === 0) inTemplate = false;
      out += ch;
      i++;
      continue;
    }

    // If not inside a string/template, strip comments
    if (!inSingle && !inDouble && !inTemplate) {
      // line comment
      if (ch === "/" && next === "/") {
        i += 2;
        while (i < code.length && code[i] !== "\n") i++;
        continue;
      }
      // block comment
      if (ch === "/" && next === "*") {
        i += 2;
        while (i < code.length) {
          if (code[i] === "*" && code[i + 1] === "/") {
            i += 2;
            break;
          }
          i++;
        }
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

function existsFile(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function listAllFiles(rootDir) {
  const ignoreDirs = new Set([
    "node_modules",
    ".git",
    ARTIFACTS_DIR,
    "dist",
    "build",
    ".next",
    ".cache",
  ]);
  const stack = [rootDir];
  const out = [];

  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!ignoreDirs.has(e.name)) stack.push(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  return out;
}

/* -----------------------------
   IMPORTANT: paths for your repo layout
   - workflow runs at repo root (cwd = repo root)
   - grader lives in 5-2-react-starter/scripts/grader.cjs
   - student code lives in 5-2-react-starter/src/...
-------------------------------- */
const REPO_ROOT = process.cwd();
const PROJECT_ROOT = path.join(REPO_ROOT, "5-2-react-starter");

/* -----------------------------
   Find files (inside PROJECT_ROOT)
-------------------------------- */
function findReactAppFile() {
  const candidates = [
    path.join(PROJECT_ROOT, "src", "App.jsx"),
    path.join(PROJECT_ROOT, "src", "App.js"),
  ];
  for (const p of candidates) if (existsFile(p)) return p;

  // fallback: first App.jsx/App.js anywhere under PROJECT_ROOT
  const all = listAllFiles(PROJECT_ROOT);
  return all.find((p) => /(^|\/)App\.(jsx|js)$/i.test(p)) || null;
}

function findComponentFileByNames(names) {
  const preferred = names
    .flatMap((n) => [path.join(PROJECT_ROOT, "src", "components", n)])
    .filter((p) => existsFile(p));
  if (preferred.length) return preferred[0];

  const all = listAllFiles(PROJECT_ROOT);
  const lowerSet = new Set(names.map((x) => x.toLowerCase()));
  return all.find((p) => lowerSet.has(path.basename(p).toLowerCase())) || null;
}

/* -----------------------------
   Determine submission time
-------------------------------- */
let lastCommitISO = null;
let lastCommitMS = null;

try {
  lastCommitISO = execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim();
  lastCommitMS = Date.parse(lastCommitISO);
} catch {
  // fallback (still grades, but treat as "now")
  lastCommitISO = new Date().toISOString();
  lastCommitMS = Date.now();
}

/* -----------------------------
   Submission marks
-------------------------------- */
const isLate = Number.isFinite(lastCommitMS) ? lastCommitMS > DEADLINE_MS : true;
const submissionScore = isLate ? SUBMISSION_LATE : SUBMISSION_MAX;

/* -----------------------------
   Load student files (React)
-------------------------------- */
const appFile = findReactAppFile();

// Your actual filenames (from screenshot)
const staticCardFile = findComponentFileByNames([
  "Student_Card_Static.jsx",
  "StudentCard.jsx",
  "StudentCardStatic.jsx",
  "StudentCardSatic.jsx", // tolerate typo
]);

const dynamicCardFile = findComponentFileByNames([
  "Student_Card_Static_Dynamic.jsx",
  "StudentCardDynamic.jsx",
]);

const appRaw = appFile ? safeRead(appFile) : null;
const staticRaw = staticCardFile ? safeRead(staticCardFile) : null;
const dynamicRaw = dynamicCardFile ? safeRead(dynamicCardFile) : null;

const app = appRaw ? stripJsComments(appRaw) : null;
const staticCard = staticRaw ? stripJsComments(staticRaw) : null;
const dynamicCard = dynamicRaw ? stripJsComments(dynamicRaw) : null;

const results = []; // { id, name, max, score, checklist[], deductions[] }

/* -----------------------------
   Result helpers
-------------------------------- */
function addResult(task, required, missing) {
  const score = splitMarks(task.marks, missing.length, required.length);
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score,
    checklist: required.map((r) => `${r.ok ? "✅" : "❌"} ${r.label}`),
    deductions: missing.length ? missing.map((m) => `Missing: ${m.label}`) : [],
  });
}

function failTask(task, reason) {
  results.push({
    id: task.id,
    name: task.name,
    max: task.marks,
    score: 0,
    checklist: [],
    deductions: [reason],
  });
}

/* -----------------------------
   Light detection helpers
-------------------------------- */
function mkHas(code) {
  return (re) => re.test(code);
}

function anyOf(has, res) {
  return res.some((r) => has(r));
}

/* -----------------------------
   Grade TODOs (React)
-------------------------------- */

// TODO1: Static Student Card
{
  if (!staticCard) {
    failTask(
      tasks[0],
      staticCardFile
        ? `Could not read component file at: ${staticCardFile}`
        : "Static card component file not found (expected src/components/Student_Card_Static.jsx)."
    );
  } else {
    const has = mkHas(staticCard);

    const required = [
      {
        label: "Has a React component (function or const arrow function) (lenient)",
        ok: anyOf(has, [
          /\bfunction\s+StudentCard/i,
          /\bfunction\s+StudentCardStatic/i,
          /\bfunction\s+StudentCardSatic/i,
          /\bconst\s+StudentCard/i,
          /\bconst\s+StudentCardStatic/i,
          /\bconst\s+StudentCardSatic/i,
        ]),
      },
      {
        label: "Returns JSX with a wrapping <div> (lenient)",
        ok: anyOf(has, [
          /\breturn\s*\(\s*<div[\s>]/i,
          /return\s+<div[\s>]/i,
          /<div[\s>][\s\S]*<\/div>/i,
        ]),
      },
      {
        label: "Includes an <h3> element for student name (lenient)",
        ok: /<h3[\s>]/i.test(staticCard),
      },
      {
        label: "Includes at least two <p> elements for id + department (lenient)",
        ok: (staticCard.match(/<p[\s>]/gi) || []).length >= 2,
      },
      {
        label: "Exports default (any component name) (lenient)",
        ok: anyOf(has, [/export\s+default\s+\w+/i, /export\s+default\s+function\s+\w+/i]),
      },
      {
        label: 'Mentions labels like "Name" / "ID" / "Department" OR placeholders (lenient)',
        ok: anyOf(has, [
          /\bname\b/i,
          /\bdepartment\b/i,
          /\bdept\b/i,
          /\bid\b/i,
          /YOUR_NAME/i,
          /YOUR_STUDENT_ID/i,
          /YOUR_DEPARTMENT/i,
        ]),
      },
    ];

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[0], required, missing);
  }
}

// TODO2: Dynamic card (props) + map in App.jsx
{
  if (!dynamicCard && !app) {
    failTask(tasks[1], "Missing key React files: App.jsx (or App.js) and Student_Card_Static_Dynamic.jsx.");
  } else {
    const required = [];

    // Dynamic component checks
    if (!dynamicCard) {
      required.push({
        label: "Dynamic card component file exists (expected src/components/Student_Card_Static_Dynamic.jsx)",
        ok: false,
      });
    } else {
      const hasD = mkHas(dynamicCard);

      required.push({
        label: "Dynamic component accepts props (props param or destructuring) (lenient)",
        ok: anyOf(hasD, [
          /\bfunction\s+\w+\s*\(\s*props\s*\)/i,
          /\bfunction\s+\w+\s*\(\s*\{\s*[^}]*\}\s*\)/i,
          /\bconst\s+\w+\s*=\s*\(\s*props\s*\)\s*=>/i,
          /\bconst\s+\w+\s*=\s*\(\s*\{\s*[^}]*\}\s*\)\s*=>/i,
        ]),
      });

      required.push({
        label: "Uses props values in JSX (props.name/id/department OR destructured vars) (lenient)",
        ok: anyOf(hasD, [
          /\bprops\s*\.\s*name\b/i,
          /\bprops\s*\.\s*id\b/i,
          /\bprops\s*\.\s*department\b/i,
          /\bprops\s*\.\s*dept\b/i,
          /\{\s*name\s*\}/i,
          /\{\s*id\s*\}/i,
          /\{\s*department\s*\}/i,
          /\{\s*dept\s*\}/i,
        ]),
      });

      required.push({
        label: "Renders name in <h3> and other fields in <p> tags (lenient)",
        ok: /<h3[\s>]/i.test(dynamicCard) && (dynamicCard.match(/<p[\s>]/gi) || []).length >= 2,
      });

      required.push({
        label: "Exports default (lenient)",
        ok: anyOf(hasD, [/export\s+default\s+\w+/i, /export\s+default\s+function\s+\w+/i]),
      });
    }

    // App.jsx checks (map + array)
    if (!app) {
      required.push({
        label: "App.jsx (or App.js) found/readable",
        ok: false,
      });
    } else {
      const hasA = mkHas(app);

      required.push({
        label: "Defines a students array (const/let) (lenient)",
        ok: anyOf(hasA, [/\bconst\s+students\s*=\s*\[/i, /\blet\s+students\s*=\s*\[/i]),
      });

      required.push({
        label: "Student objects include id, name, department (or dept) (lenient)",
        ok: anyOf(hasA, [
          /\{\s*id\s*:\s*\d+/i,
          /\{\s*name\s*:\s*["'`]/i,
          /\{\s*department\s*:\s*["'`]/i,
          /\{\s*dept\s*:\s*["'`]/i,
        ]),
      });

      required.push({
        label: "Uses map() to render cards (students.map(...)) (lenient)",
        ok: anyOf(hasA, [/\bstudents\s*\.\s*map\s*\(/i, /\.map\s*\(\s*\(\s*\w+\s*\)\s*=>/i]),
      });

      required.push({
        label: "Renders a Student card component in JSX (StudentCardDynamic/StudentCard etc.) (lenient)",
        ok: anyOf(hasA, [
          /<\s*StudentCardDynamic\b/i,
          /<\s*Student_Card_Static_Dynamic\b/i, // in case they used filename as component name
          /<\s*StudentCard\b/i,
        ]),
      });

      required.push({
        label: "Passes props from map item (name/id/department) (lenient)",
        ok: anyOf(hasA, [
          /\bname\s*=\s*\{\s*\w+\s*\.\s*name\s*\}/i,
          /\bid\s*=\s*\{\s*\w+\s*\.\s*id\s*\}/i,
          /\bdepartment\s*=\s*\{\s*\w+\s*\.\s*department\s*\}/i,
          /\bdept\s*=\s*\{\s*\w+\s*\.\s*dept\s*\}/i,
        ]),
      });

      required.push({
        label: "Uses unique key prop (key={...}) (lenient)",
        ok: anyOf(hasA, [/\bkey\s*=\s*\{\s*[^}]+\s*\}/i]),
      });
    }

    const missing = required.filter((r) => !r.ok);
    addResult(tasks[1], required, missing);
  }
}

/* -----------------------------
   Final scoring
-------------------------------- */
const stepsScore = results.reduce((sum, r) => sum + r.score, 0);
const totalScore = round2(stepsScore + submissionScore);

/* -----------------------------
   Build summary + feedback
-------------------------------- */
const submissionLine = `- **Lab:** 5-2-react-starter-main
- **Deadline (Riyadh / UTC+03:00):** ${DEADLINE_RIYADH_ISO}
- **Last commit time (from git log):** ${lastCommitISO}
- **Submission marks:** **${submissionScore}/${SUBMISSION_MAX}** ${isLate ? "(Late submission)" : "(On time)"}
`;

let summary = `# 5-2-react-starter-main — Autograding Summary

## Submission

${submissionLine}

## Files Checked

- Repo root: ${REPO_ROOT}
- Project root: ${PROJECT_ROOT}
- App: ${appFile ? `✅ ${appFile}` : "❌ App.jsx/App.js not found"}
- Static card: ${staticCardFile ? `✅ ${staticCardFile}` : "❌ Static component file not found"}
- Dynamic card: ${dynamicCardFile ? `✅ ${dynamicCardFile}` : "❌ Dynamic component file not found"}

## Marks Breakdown

| Component | Marks |
|---|---:|
`;

for (const r of results) summary += `| ${r.name} | ${r.score}/${r.max} |\n`;
summary += `| Submission (timing) | ${submissionScore}/${SUBMISSION_MAX} |\n`;

summary += `
## Total Marks

**${totalScore} / ${TOTAL_MAX}**

## Detailed Checks (What you did / missed)
`;

for (const r of results) {
  const done = (r.checklist || []).filter((x) => x.startsWith("✅"));
  const missed = (r.checklist || []).filter((x) => x.startsWith("❌"));

  summary += `
<details>
  <summary><strong>${mdEscape(r.name)}</strong> — ${r.score}/${r.max}</summary>

  <br/>

  <strong>✅ Found</strong>
  ${done.length ? "\n" + done.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing detected)"}

  <br/><br/>

  <strong>❌ Missing</strong>
  ${missed.length ? "\n" + missed.map((x) => `- ${mdEscape(x)}`).join("\n") : "\n- (Nothing missing)"}

  <br/><br/>

  <strong>❗ Deductions / Notes</strong>
  ${
    r.deductions && r.deductions.length
      ? "\n" + r.deductions.map((d) => `- ${mdEscape(d)}`).join("\n")
      : "\n- No deductions."
  }

</details>
`;
}

summary += `
> Full feedback is also available in: \`artifacts/feedback/README.md\`
`;

let feedback = `# 5-2-react-starter-main — Feedback

## Submission

${submissionLine}

## Files Checked

- Repo root: ${REPO_ROOT}
- Project root: ${PROJECT_ROOT}
- App: ${appFile ? `✅ ${appFile}` : "❌ App.jsx/App.js not found"}
- Static card: ${staticCardFile ? `✅ ${staticCardFile}` : "❌ Static component file not found"}
- Dynamic card: ${dynamicCardFile ? `✅ ${dynamicCardFile}` : "❌ Dynamic component file not found"}

---

## TODO-by-TODO Feedback
`;

for (const r of results) {
  feedback += `
### ${r.name} — **${r.score}/${r.max}**

**Checklist**
${r.checklist.length ? r.checklist.map((x) => `- ${x}`).join("\n") : "- (No checks available)"}

**Deductions / Notes**
${r.deductions.length ? r.deductions.map((d) => `- ❗ ${d}`).join("\n") : "- ✅ No deductions. Good job!"}
`;
}

feedback += `
---

## How marks were deducted (rules)

- JS/JSX comments are ignored (so examples in comments do NOT count).
- Checks are intentionally light: they look for key constructs and basic structure.
- Code can be in ANY order; repeated code is allowed.
- Common equivalents are accepted, and naming is flexible.
- Missing required items reduce marks proportionally within that TODO.
`;

/* -----------------------------
   Write outputs
-------------------------------- */
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);

const csv = `student,score,max_score
all_students,${totalScore},${TOTAL_MAX}
`;

fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
fs.writeFileSync(path.join(ARTIFACTS_DIR, "grade.csv"), csv);
fs.writeFileSync(path.join(FEEDBACK_DIR, "README.md"), feedback);

console.log(
  `✔ Lab graded: ${totalScore}/${TOTAL_MAX} (Submission: ${submissionScore}/${SUBMISSION_MAX}, TODOs: ${stepsScore}/${STEPS_MAX}).`
);
