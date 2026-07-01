# Bug 1 — the wrong client silently drops the write

Fill this in as you fix Bug 1. At least 80 words. Run `npm run unlock -- 1` when done.

**1.** Paste what `bug-01.test.ts` reported before your fix — including the line that shows the
meal was NOT read back. What status code did the POST return while the write was failing?

```
[paste here]
```

**2.** There are two clients in `src/lib/supabase.ts`: `anon` and `service`. In one or two
sentences, what is the difference, and why does a write have to go through the service client?
What does Row-Level Security do to an anon-key insert?

[your answer]

**3.** The handler returned 200 the whole time the write was failing. In a real product, who
would eventually notice that meals were vanishing, and how long might that take? Why is a
silent success worse than a loud failure here?

[your answer]

**AI use (required for every bug):**

- Did you use an AI assistant? Paste the exact prompt you gave it.
- Did the AI identify the root cause (wrong client) or just a symptom? Where did your reasoning
  have to correct it?
