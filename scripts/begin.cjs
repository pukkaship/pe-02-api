#!/usr/bin/env node
// npm run begin
//
// Entry gate (LOCAL, honor-system). A scaffold that nudges you to think before you code —
// it is NOT enforced. The real, enforced gate is CI on your pull request
// (scripts/validate_pr.cjs). Run this after you have filled in hypothesis.md.

const fs = require("node:fs");

function fail(messages) {
  console.error("\n\u274c Not ready to start:\n");
  for (const m of messages) console.error("  \u2022 " + m);
  console.error("\nFix the above, then run: npm run begin\n");
  process.exit(1);
}

if (!fs.existsSync("hypothesis.md")) {
  fail(["hypothesis.md is missing. Fill in the template before you begin."]);
}

const hypothesis = fs.readFileSync("hypothesis.md", "utf8").trim();
const wordCount = hypothesis.split(/\s+/).filter(Boolean).length;
const failures = [];

if (wordCount < 100) {
  failures.push(`hypothesis.md has ${wordCount} words \u2014 needs at least 100`);
}
if (!/(hypothesis|error)/i.test(hypothesis)) {
  failures.push('hypothesis.md must mention "hypothesis" or "error" (shows you read docs/week2-micro-loop material)');
}
if (!/the rule is/i.test(hypothesis)) {
  failures.push('hypothesis.md must contain "the rule is" \u2014 finish the sentence from the orientation video');
}

if (failures.length > 0) fail(failures);

console.log("\n\u2713 Ready. Now run: npm test \u2014 one test is failing (Bug 1). Start there.\n");
