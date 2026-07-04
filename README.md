# pe-02-api — Nudge's first live endpoint

> A service logged every meal a user sent and generated a coaching reply. Every request returned
> `200 OK`. Weeks later, support noticed some users' history was missing rows — with no error,
> anywhere. The writes had been going through a client that was never allowed to write, and the
> coaching reply never noticed. This repo has that bug, and three others like it. You fix them
> one at a time.

This is **Module 2**. The founder wants something live for a demo: wire the app to a model and a
database. You build Nudge's first real endpoint — someone logs a meal, it's stored, and the coach
replies. This is Nudge's **review** capability: look at one thing that already happened and say
something true about it. The one idea is **a boundary is where you stop trusting input** — the
request body, the database row, and the model's reply are all untrusted until proven, and using
the wrong access credential fails *silently*.

---

## What it does (once fixed)

A small [Hono](https://hono.dev) API backed by Supabase, with a coaching reply generated on every
logged meal:

- `POST /meals` — record one meal for the signed-in user and return a coaching reply.
- `GET /meals` — return **that user's** meals (and nobody else's).

```bash
# log a meal and get a coaching reply
curl -s -X POST localhost:3000/meals \
  -H 'content-type: application/json' -H 'authorization: Bearer token-u1' \
  -d '{"name":"poha","carb_score":3,"protein_score":2,"fibre_score":2,"fat_score":1}'

# read it back
curl -s localhost:3000/meals -H 'authorization: Bearer token-u1'
```

## What is broken

- A logged meal returns `200` with a coaching reply, but sometimes **never actually gets stored** —
  with no error shown, and the reply sounds completely normal either way.
- `GET /meals` answers callers who send **no credentials at all**, and hands back **every** user's
  data, not just the caller's.
- A teammate reports: *"meals sometimes don't show up later, but the API always returns 200 with a
  reply. I can't reproduce it and I don't know where to look."* That one is yours to track down —
  nothing will point you at it.
- Another teammate reports: *"I logged a meal with a quote mark in the name and got back 'Logged!'
  instead of a real coaching message."* Also yours to track down.

> No real database or model call is required. The test suite runs against an in-memory Supabase
> mock that models Row-Level Security and a CHECK constraint, and a deterministic mock coach
> (`src/lib/coach.ts`) standing in for the LLM call, so CI is deterministic and offline. If you
> want to prove the database behaviour against a real project, see **Run it for real** below.

---

## Warm-up (~1.5h) — before you start Module 2

Return to your **pe-01** repo and extend it:

1. Add a `sodiumLevel` field to the `Meal` interface and to the scorer.
2. Add one test that exercises the new field.
3. `npm run typecheck` must still pass.

This reinforces the interface-extension habit from Module 1. Note it in your PR.

---

## Before touching code — reading (~40 min + video)

▶ **[Orientation video — 5 min](https://customer-r5z7zoebyw1di9aq.cloudflarestream.com/d3798102d8a50fae4c343944a3a4ccc3/watch)** — watch first.

1. [`docs/week2-decompose-reading.md`](docs/week2-decompose-reading.md) — decompose a feature into
   API + data model + access (20 min). Includes the three-bullet artifact for your PR.
2. [`docs/week2-glossary.md`](docs/week2-glossary.md) — 8 terms + a Flask/Python comparison (10 min).
3. [`docs/week2-design-review.md`](docs/week2-design-review.md) — 5 min — the first section of the
   design review you'll keep building on all program: state & correctness.
4. [`docs/week2-ai-workflow.md`](docs/week2-ai-workflow.md) — 5 min — formalizing intake, and your
   first look at a "prompt" (still a mock — treated as a reviewed asset for real starting in
   Module 5).

Then fill in [`hypothesis.md`](hypothesis.md) (including the new **Design note** section) and run
`npm run begin`.

---

## How to proceed — one bug at a time

You do not fix everything at once. Each fix is documented before the next bug's test is revealed.

1. Do the warm-up + reading → fill in `hypothesis.md` → `npm run begin`
2. Fix Bug 1 → fill in `bug-journal/bug-01.md` → push, open a PR, **merge when CI is green**
3. Pull `main` — the gate bot delivers the next bug's test → fix it → open a PR → **merge again**
4. Repeat through Bug 5. **Bugs 3 and 5 are discovery bugs** — see below.
5. Fill in `REFLECTION.md`, `SKILL-STATEMENT.md`, and `ai-session-log.md`
6. `npm run validate` → open your final pull request → **merge when CI is green**

See [`docs/pull-request-flow.md`](docs/pull-request-flow.md) for the full PR + merge loop.

> **The discovery bugs (Bugs 3 and 5).** Their tests *pass* when you receive them. That is the point. A test that only checks a status code proves the server answered — not that anything actually happened. You have to notice the lie, reproduce the silent failure, and rewrite the test to prove what really happened (read the data back, or assert a non-2xx status). Bug 3: a write that does nothing. Bug 5: a coaching reply that silently falls back to a generic message when the model's output can't be parsed. The gate checks both.

> **What is actually enforced:** `begin` and `unlock` are local scaffolds that keep you honest —
> they are not enforced. The real gate is **CI on your pull request** (`npm run validate` +
> typecheck + tests). **You click Merge when CI is green** — the gate bot only runs after merge.
> The AI PR review is advisory and never blocks merge.

---

## Getting started

Open [`docs/cursor-setup.md`](docs/cursor-setup.md) if you have not set up Cursor yet (rules and
hooks ship in `.cursor/`).

```bash
node -v          # need 20+ (22 recommended — see .nvmrc)
npm install      # first time only; re-run after pulling dependency changes
npm run begin    # fails until hypothesis.md is complete
npm test         # one test fails (Bug 1) — start there
```

## Run it for real (optional)

To prove the RLS behaviour against an actual database:

1. Create a free [Supabase](https://supabase.com) project.
2. Run [`supabase/migrations/0001_meals.sql`](supabase/migrations/0001_meals.sql) in its SQL editor.
3. Copy `.env.example` to `.env`, set `USE_REAL_SUPABASE=1` and the three keys, then `npm start`.
4. POST a meal with the anon key path and watch the row **not** appear — the same failure the mock
   models. This is not required to pass CI.

## The Cursor rule

You may use Cursor. You may ask it what an error means. You may **not** ask it to fix code you have
not read. At your weekly sync you will explain each fix — especially how you found Bugs 3 and 5 — without
looking at your PR.

## PR requirements (Module 2)

Your PR description must include:

- **Why each fix was necessary** — one short paragraph per bug, naming the *failure mode*.
- **Hypothesis** — what you thought was wrong before you started editing.
- **Discovery** — how you found Bugs 3 and 5, the bugs nothing pointed you to directly. For each: what superficial signal the original test was checking, what you investigated, and what you rewrote the test to prove instead.

## Methodology checklist

- [ ] Hypothesis written before first code change
- [ ] Smallest change that tests the hypothesis
- [ ] All CI checks green
- [ ] PR explains *why*, not just *what*
- [ ] Discovery section: how you found Bugs 3 and 5

## What this demonstrates

*Leave blank. You fill this in at the portfolio wrap.*
