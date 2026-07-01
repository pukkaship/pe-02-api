#!/usr/bin/env node
// npm run validate    (also runs in CI on every pull request)
//
// THE ENFORCED GATE. Unlike begin/unlock (local scaffolds), this is what actually decides
// whether your PR can merge. It checks that every required artifact exists and is real, and
// that the discovery bug (Bug 3) was genuinely reproduced — not left as a status-only test.
//
// PR body: in CI the PR description is passed in via the PR_BODY env var. Locally, you can
// preview the check by saving your PR text to PR_BODY.md before running.

const fs = require("node:fs");

const failures = [];

function wordCount(file) {
  return fs.readFileSync(file, "utf8").trim().split(/\s+/).filter(Boolean).length;
}
function requireFile(file, minWords, label) {
  if (!fs.existsSync(file)) {
    failures.push(`${label} (${file}) is missing`);
    return;
  }
  if (minWords > 0 && wordCount(file) < minWords) {
    failures.push(`${label} (${file}) is too short \u2014 needs at least ${minWords} words`);
  }
}

// 1. Pre-code hypothesis.
requireFile("hypothesis.md", 100, "Pre-code hypothesis");

// 2. All five bug journals.
for (let i = 1; i <= 5; i++) {
  requireFile(`bug-journal/bug-0${i}.md`, 80, `Bug ${i} journal`);
}

// 3. Reflection + skill statement + AI log.
requireFile("REFLECTION.md", 30, "REFLECTION.md");
requireFile("SKILL-STATEMENT.md", 0, "SKILL-STATEMENT.md");
if (fs.existsSync("SKILL-STATEMENT.md") && fs.readFileSync("SKILL-STATEMENT.md", "utf8").trim().length < 20) {
  failures.push("SKILL-STATEMENT.md is essentially empty \u2014 fill it in");
}
requireFile("ai-session-log.md", 20, "ai-session-log.md");

// 4. All five tests unlocked (present in the live test folder).
for (let i = 1; i <= 5; i++) {
  if (!fs.existsSync(`src/__tests__/bug-0${i}.test.ts`)) {
    failures.push(`src/__tests__/bug-0${i}.test.ts is missing \u2014 you have not unlocked all five bugs`);
  }
}

// 5. Discovery check: Bug 3's test must do more than assert status === 200.
//    It must read the data back (toContain / .length / not.toContain) OR assert a non-2xx
//    status (a 4xx/5xx expectation) — the reproduction a status-only test would have missed.
const bug03Path = "src/__tests__/bug-03.test.ts";
if (fs.existsSync(bug03Path)) {
  const bug03 = fs.readFileSync(bug03Path, "utf8");
  const readsBack = /toContain|\.length\b|not\.toContain/i.test(bug03);
  const assertsReject = /(toBeGreaterThanOrEqual\(\s*4\d\d|toBe\(\s*4\d\d|not\.toBe\(\s*200)/i.test(bug03);
  if (!readsBack && !assertsReject) {
    failures.push(
      "bug-03.test.ts still only checks the status code \u2014 rewrite it to read the meal back " +
        "or assert a non-2xx status. That is the discovery: a 200 is not proof the write happened."
    );
  }
}

// 6. Discovery check: Bug 5's test must do more than assert status === 200 on DELETE.
//    It must read the data back after the delete (to confirm the row is gone) OR assert a non-2xx.
const bug05Path = "src/__tests__/bug-05.test.ts";
if (fs.existsSync(bug05Path)) {
  const bug05 = fs.readFileSync(bug05Path, "utf8");
  const readsBack = /toContain|\.length\b|not\.toContain|toEqual\(\s*\[\s*\]/i.test(bug05);
  const assertsReject = /(toBeGreaterThanOrEqual\(\s*4\d\d|toBe\(\s*4\d\d|not\.toBe\(\s*200)/i.test(bug05);
  if (!readsBack && !assertsReject) {
    failures.push(
      "bug-05.test.ts still only checks the status code \u2014 rewrite it to confirm the row was " +
        "actually deleted (read the list back after DELETE, or assert a non-2xx status). " +
        "That is the discovery: a 200 is not proof the delete happened."
    );
  }
}

// 8. PR body sections (only when a PR body is available).
const prBody = process.env.PR_BODY || (fs.existsSync("PR_BODY.md") ? fs.readFileSync("PR_BODY.md", "utf8") : "");
if (prBody) {
  if (!/why each fix was necessary/i.test(prBody)) {
    failures.push('PR description must include a section titled "Why each fix was necessary"');
  }
  if (!/hypothesis/i.test(prBody)) {
    failures.push('PR description must include a "Hypothesis" section (what you thought was wrong before editing)');
  }
  if (!/discovery/i.test(prBody)) {
    failures.push('PR description must include a "Discovery" section (how you found the bugs nothing pointed you to \u2014 Bugs 3 and 5)');
  }
} else {
  console.log("\u2139 No PR body found (PR_BODY env or PR_BODY.md). Skipping PR-section check locally.");
}

if (failures.length > 0) {
  console.error("\n\u274c PR validation failed:\n");
  for (const f of failures) console.error("  \u2022 " + f);
  console.error("\nFix the above and push again.\n");
  process.exit(1);
}

console.log("\n\u2713 All required artifacts present. PR validation passed.\n");
