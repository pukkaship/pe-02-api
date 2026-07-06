# Bug 2 â the guard that was never applied

Fill this in as you fix Bug 2. At least 80 words. Run `npm run unlock -- 2` when done.

**1.** Before your fix, what did `GET /meals` return when you called it with **no** Authorization
header at all? Paste the status code and a line of the body.

```
[paste here]
```

**2.** `src/middleware/auth.ts` already existed and was correct. Why did it protect nothing? In
your own words, what is the difference between *defining* a guard and *applying* it â and what
did you change to wire it onto the routes?

[your answer]

**3.** The broken read returned every user's rows. Describe the ownership scope you added: where
does the user id come from now, and why must it come from the validated session rather than a
value the caller supplies (for example a `user_id` query parameter)?

[your answer]

**AI use (required for every bug):**

- Paste the exact prompt you gave your AI assistant, if any.
- Did it suggest reading the user id from the request, or from the session? Which is safe, and why?
