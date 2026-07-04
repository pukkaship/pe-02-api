# Week 2 — AI workflow: intake formalized, and your first "prompt"

Module 1 gave you three non-negotiables: never code in chat, files are memory not chat history,
red before green. Those don't change. This week adds one habit on top of them.

## Intake, formalized

Last week, "form a hypothesis before editing" meant a paragraph in `hypothesis.md`. This week it
gets a slightly fixed shape — a short **case brief** you write before touching code, answering
three named questions instead of writing free-form prose. You did this already if you filled in
the **Design note** in [`docs/week2-design-review.md`](week2-design-review.md) — that *was* the
case brief for this week. Same habit, one small step more structured. It'll keep gaining a little
more shape each week, the same way the design-review questions do.

Why bother formalizing it at all? Because "I thought about it" isn't checkable, but "I wrote down
what I expected the write to do, before I touched the handler" is — both by you, later, when you
re-read your own PR, and by anyone reviewing it.

## Your first prompt (sort of)

Open [`src/lib/coach.ts`](../src/lib/coach.ts). The string this function builds and returns is,
structurally, a prompt — it's the piece of text a real model call would eventually be built from.
It's a mock right now (no network call, deterministic output) precisely so this module can stay
about *reliability and boundaries*, not about calling a real API yet. But get used to looking at
it the way you'll be asked to look at every prompt starting in a few weeks: not as throwaway
string-building code, but as a reviewed asset with a job to do.

Notice, while you're in there, that the way it builds its response — plain string interpolation,
not `JSON.stringify` — is exactly the kind of thing that breaks when the input isn't what you
expected. That's not an accident. Real model output has the same failure shape: text that looks
like structured data until the input contains something the template didn't anticipate. You'll
meet this properly, with a real model, in Module 5.
