# Week 2 reading — decompose a feature into API + data model + access

~20 minutes. Read this before you touch code. The written artifact is at the bottom.

## The feature, in one line

"Let a user log a meal and see their own meals later."

That sentence hides three separate decisions. Naming them is the skill this week.

### 1. The endpoints (the API)

- `POST /meals` — accept one meal and record it.
- `GET /meals` — return the caller's meals.

An endpoint is a contract: a method, a path, a request shape, a response shape, and — easy to
forget — **who is allowed to call it**.

### 2. The table (the data model)

One table, `meals`, with columns for the user it belongs to, the dish name, four score columns,
and a created-at timestamp. The database also carries **constraints**: rules it enforces no
matter what the application code does. Here, each score must be an integer 0..5. A row that
breaks the rule is rejected — the database refuses to store a lie.

### 3. Who may call it (access)

This is the decision that most bugs hide in.

- A **write** needs credentials that are allowed to write. In Supabase, the public **anon**
  key is Row-Level-Security-restricted; a default policy lets it read a user's own rows but not
  insert. Writes go through the **service** key, which runs trusted server code and bypasses RLS.
- A **read** of personal data needs to know **who is asking**. That identity must come from a
  validated session — never from a value the caller can set themselves.

Get the access decision wrong and nothing throws. The write is dropped; the read leaks. The
system keeps answering 200. That silence is the entire lesson of Module 2.

## The one rule

> **Right access for the job.** Read credentials and write credentials are different. The wrong
> one does not crash — it fails silently.

## Written artifact (put this in your PR, three bullets)

For `POST /meals` and `GET /meals`:

- **What endpoint** — method + path + who may call it.
- **What table** — which columns are written or read, and what constraint the database enforces.
- **Who may call it** — where the user identity comes from, and which client (anon vs service)
  does the work and why.
