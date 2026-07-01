#!/usr/bin/env node
// npm run unlock -- N   (N = 1..4)
//
// Bug gate (LOCAL, honor-system scaffold). Checks that the current bug's tests pass and its
// journal is filled in. The gate bot delivers the next failing test after your PR merges.
//
// This is NOT enforced — it is a learning scaffold that keeps you honest about doing one bug
// at a time. The enforced gate is CI on your PR.

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const N = parseInt(process.argv[2], 10);
if (!N || N < 1 || N > 4) {
  console.error("\nUsage: npm run unlock -- <1-4>\n");
  process.exit(1);
}

// 1. Tests must pass.
try {
  execSync("npx vitest run", { stdio: "inherit" });
} catch {
  console.error("\n\u274c Tests are not passing. Fix the current bug before unlocking the next.\n");
  process.exit(1);
}

// 2. The current bug's journal must exist and be non-trivial.
const journalPath = path.join("bug-journal", `bug-0${N}.md`);
if (!fs.existsSync(journalPath)) {
  console.error(`\n\u274c ${journalPath} is missing. Fill in the journal before unlocking.\n`);
  process.exit(1);
}
const journal = fs.readFileSync(journalPath, "utf8");
const wordCount = journal.split(/\s+/).filter(Boolean).length;

const keywords = {
  1: [/service|anon|client|rls/i],
  2: [/auth|guard|401|session|scope/i],
  3: [/silent|discover|read.?back|reproduc|200/i],
  4: [/error|check|destructure|constraint|surface/i],
};

const failures = [];
if (wordCount < 80) failures.push(`bug-0${N}.md has ${wordCount} words \u2014 needs at least 80`);
(keywords[N] || []).forEach((re, i) => {
  if (!re.test(journal)) {
    failures.push(`bug-0${N}.md seems incomplete (check question ${i + 1} \u2014 your answer is missing key reasoning)`);
  }
});

if (failures.length > 0) {
  console.error("\n\u274c Journal not complete:\n");
  for (const f of failures) console.error("  \u2022 " + f);
  console.error("");
  process.exit(1);
}

// 3. Next bug is delivered by the gate bot after your PR merges.
if (N < 4) {
  const next = N + 1;
  console.log(`\n\u2713 Bug ${N} complete.\n`);
  console.log(`  Push your branch and open a PR \u2014 the gate bot will`);
  console.log(`  deliver Bug ${next}'s test file after you merge.\n`);
} else {
  console.log("\n\u2713 All four bugs fixed. Before opening your PR:\n");
  console.log("  1. Fill in REFLECTION.md");
  console.log("  2. Fill in SKILL-STATEMENT.md");
  console.log("  3. Fill in ai-session-log.md (one entry per bug)");
  console.log("  4. Run: npm run validate\n");
}
