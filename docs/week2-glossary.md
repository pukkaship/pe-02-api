# Week 2 — Glossary (8 terms)

Plain language. No jargon inside the definitions.

- **API endpoint** — A single, named entry point into a service: a method (GET, POST) plus a path
  (`/meals`). It defines what you send, what you get back, and who is allowed to call it.

- **anon client vs service client** — Two ways to talk to the same database. The *anon* client
  uses the public key and is fenced in by Row-Level Security — safe to expose, but it cannot do
  privileged writes. The *service* client uses the secret service-role key, bypasses those
  fences, and must stay server-side. Using the anon client for a write is Bug 1.

- **Row-Level Security (RLS)** — Rules the database itself enforces about which rows a caller may
  read or write, based on who they are. Because the database enforces it, a missing check in your
  application code cannot leak or corrupt data past it. With RLS on and no insert policy, an
  anon-key insert is simply rejected.

- **auth guard** — A piece of code that runs **before the route handler** and refuses the request
  (typically a 401) if there is no valid session. A guard that is written but never **wired to
  the route** protects nothing — the handler still runs for every caller. That is Bug 2. In this
  module the guard is named `requireAuth` in `src/middleware/auth.ts`; exporting it from a file
  is not enough — the GET /meals route must be configured to run it first.

- **session** — Proof, established by logging in, of who the caller is. The user's identity for a
  request must come from the session, not from a field the caller can set — otherwise anyone can
  claim to be anyone.

- **CHECK constraint** — A rule attached to a table column that the database enforces on every
  write (here: each score is an integer 0..5). A row that breaks it is rejected with an error.

- **`{ data, error }`** — The shape a Supabase call returns. `data` is the result; `error` is set
  when the call failed. Destructuring only `data` and ignoring `error` turns a real failure into
  an invisible one. That is Bug 4.

- **side effect** — A change the request makes to the world beyond its response — here, a row
  written to the database. A test that checks only the status code checks the response, not the
  side effect. Bug 3 is what happens when you trust the status and never check the side effect.

## A note for Python engineers

If you have written a Flask (or FastAPI) route, `POST /meals` will feel familiar:

```python
# Flask — the guard lives in application code. If you forget the decorator, nothing stops the call.
@app.post("/meals")
@login_required                       # ← forget this line and the endpoint is wide open
def create_meal():
    body = request.get_json()
    db.session.add(Meal(user_id=current_user.id, **body))
    db.session.commit()
    return {"ok": True}
```

Two things differ in this module, and both matter:

1. **Where the guard lives.** In the Flask sketch, the *only* thing protecting the row is the
   `@login_required` decorator — application code you can forget (exactly Bug 2). With Supabase
   RLS, the database *also* refuses unauthorized writes. Defense in the database survives a bug in
   the code. You will still add the app-level guard — but understand that RLS is the backstop.

2. **The silent write.** `db.session.commit()` raising on failure is loud. An anon-key Supabase
   write returns `{ error }` instead of throwing — so if you ignore `error`, it fails in silence.
   Same request/response shape as Flask; different failure mode. That difference is Module 2.
