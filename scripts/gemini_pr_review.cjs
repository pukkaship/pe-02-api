#!/usr/bin/env node
// Best-effort AI PR reviewer for Module 2. Reads the PR body + the review rules, asks Gemini
// for a READY / NEEDS CHANGES verdict, and posts it as a PR comment. Never blocks merge.
//
// No-ops cleanly if GEMINI_API_KEY is missing (e.g. on forks). The enforced gate is CI.

const fs = require("node:fs");
const { execSync } = require("node:child_process");

const apiKey = process.env.GEMINI_API_KEY;
const prBody = process.env.PR_BODY || "";
const prNumber = process.env.PR_NUMBER;
const repo = process.env.REPO;

if (!apiKey) {
  console.log("GEMINI_API_KEY not set — skipping AI review (this is fine).");
  process.exit(0);
}

const rules = fs.existsSync(".github/gemini-review-rules.md")
  ? fs.readFileSync(".github/gemini-review-rules.md", "utf8")
  : "Review this Module 2 PR for whether it explains WHY each fix was necessary.";

const prompt = `${rules}\n\n--- PULL REQUEST DESCRIPTION ---\n${prBody}\n\n--- END ---\n\nRespond with a verdict line "VERDICT: READY" or "VERDICT: NEEDS CHANGES", then specific feedback.`;

async function main() {
  const model = "gemini-3-flash-preview";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) {
    console.log(`Gemini call failed (${res.status}) — skipping.`);
    return;
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "AI review produced no text.";
  const comment = `### 🤖 AI PR review (advisory — not a merge gate)\n\n${text}`;

  if (prNumber && repo && process.env.GH_TOKEN) {
    fs.writeFileSync("/tmp/ai-review.md", comment);
    try {
      execSync(`gh pr comment ${prNumber} --repo ${repo} --body-file /tmp/ai-review.md`, { stdio: "inherit" });
    } catch {
      console.log("Could not post comment; printing instead:\n" + comment);
    }
  } else {
    console.log(comment);
  }
}

main().catch((e) => {
  console.log("AI review error (non-blocking): " + e.message);
});
