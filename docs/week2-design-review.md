# Week 2 — Design review, section 1: State & correctness

Starting this week, before you touch code on a real feature, you ask a small, fixed set of
questions about the design — not the whole checklist yet, one section at a time, as the program
gives you reason to need it. This week you get the first one.

## Section 1 — State & correctness

- **Where does each piece of state live?** For this app: a meal's data lives in exactly one place —
  the `meals` table. If you ever find yourself tempted to also cache it, derive it elsewhere, or
  infer it from something else (a log line, a request header, a client-supplied flag), that
  *is* the bug. **Single source of truth per field.**
- **What happens on retry / concurrent / out-of-order?** Nudge's coaching reply is generated
  *after* the write attempt. If the write fails, does the reply still go out? (Spoiler: right now,
  yes — that's Bug 1.) Name the failure before you fix it.
- **Is this a root-cause fix or a patch on a symptom?** Switching the client for one broken call is
  a root-cause fix if it's the *right* client for every write in this file, going forward — not
  just the one call a test happens to exercise.

## Why this section, this week

Bug 1 is a state/correctness bug in the purest form: the meal's data has exactly one legitimate
source of truth (the database, written through the service client), and the bug is a second,
illegitimate path (the anon client's silent no-op) that looks like it also writes state but
doesn't. Bug 4 is the same lens from a different angle — an error is state too (it tells you the
write didn't happen), and discarding it is losing track of state you already had.

## Write it down before you code

Before starting Bug 1, add three lines to `hypothesis.md` under a **Design note** heading:

1. Where does the meal's data live, and what's the *one* path that's allowed to write it?
2. What does the coaching reply currently assume about the write that already happened?
3. Is your planned fix the root cause, or does it only address the specific test in front of you?

This is a small version of a habit called **spec-first intake** — writing down what you think the
design should guarantee *before* you write the code that's supposed to guarantee it. You'll do a
fuller version of this every week from here on, and by the time you reach the full 7-section
review (a few weeks out), this will already be second nature.
