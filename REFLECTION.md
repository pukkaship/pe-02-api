# Reflection — the one idea

Fill this in after you have fixed all five bugs. CI checks it is at least 30 words.

## Right access for the job

Read credentials and write credentials are different. Using the wrong one does not crash — it
fails *silently*: the API answers 200 and nothing was written. The same shape appears when an
error is thrown away, or when a guard is defined but never applied.

## Connect the bugs (write 1–2 paragraphs)

Explain how Bug 1 (anon client for a write), Bug 4 (the discarded `error`), Bug 3 (the green
test that was lying), and Bug 5 (the coaching reply that silently fell back to "Logged!") are
four views of the same failure: a system that *appears* to succeed while doing nothing. What
general rule ties them together, and how does Bug 2 (the unapplied guard) fit the theme of
"a safeguard that exists but does not run"?

[your reflection here]
