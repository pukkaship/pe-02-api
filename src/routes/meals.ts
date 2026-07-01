import { Hono } from "hono";
import type { AppEnv, MealInput } from "../types";
import { getClients } from "../lib/supabase";

// The meal-log routes. Three bugs live in this file. You will not meet them all at once —
// the gate system reveals one failing test at a time. Read each test before you touch code.
//
// The auth guard you need for Bug 2 already exists in src/middleware/auth.ts. It is not
// wired up. Nothing here requires a session, and nothing scopes a read to one user.

export const meals = new Hono<AppEnv>();

// POST /meals — record one meal for a user.
//
// Bug 1: a write must go through the SERVICE client. This uses the ANON client, which is
//        Row-Level-Security restricted: the insert is rejected and NOTHING is written — yet
//        this handler still answers with 200. That is the "200 OK, nothing happened" trap.
//
// Bug 4: the result of the insert is destructured as `{ data }` only. The `error` the client
//        hands back (RLS rejection, a CHECK-constraint violation, a dropped connection) is
//        thrown away. An unchecked error is an invisible failure.
meals.post("/", async (c) => {
  const body = await c.req.json<MealInput>();
  const { anon } = getClients();

  const { data } = await anon
    .from("meals")
    .insert({
      user_id: body.user_id ?? "anonymous",
      name: body.name,
      carb_score: body.carb_score,
      protein_score: body.protein_score,
      fibre_score: body.fibre_score,
      fat_score: body.fat_score,
    })
    .select();

  return c.json({ ok: true, meal: data?.[0] ?? null });
});

// GET /meals — list a user's meals.
//
// Bug 2: no auth guard, and no per-user scope. Any caller — with no credentials at all —
//        reaches this and gets back EVERY user's rows. Apply requireAuth and return only the
//        authenticated user's meals.
meals.get("/", async (c) => {
  const { service } = getClients();
  const { data } = await service.from("meals").select("*");
  return c.json({ meals: data ?? [] });
});

// DELETE /meals/:id — remove one meal by ID.
//
// Bug 5 — DISCOVERY. The handler returns 200 OK. The row is not deleted.
//
// The anon client's RLS policy for DELETE is the same as for INSERT: it can only
// affect rows that belong to the authenticated user — and even then, only when
// the policy has been declared to allow it. On a default Supabase project with
// standard RLS, the anon client delete is a silent no-op: Supabase returns success
// with 0 rows affected, and the handler never checks.
//
// A test that only asserts `status === 200` will pass — and will not notice the row
// is still there. This is Bug 5 (discovery): investigate, then rewrite the test.
meals.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const { anon } = getClients();

  // Bug 5: this should use the SERVICE client (which can actually delete the row).
  // The anon client returns success but deletes nothing — RLS blocks it silently.
  const { data } = await anon.from("meals").delete().eq("id", id);

  return c.json({ ok: true, deleted: data });
});
