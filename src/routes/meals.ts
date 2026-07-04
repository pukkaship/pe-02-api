import { Hono } from "hono";
import type { AppEnv, MealInput } from "../types";
import { getClients } from "../lib/supabase";
import { classifySignal, generateCoachingReply } from "../lib/coach";

// The meal-log + coaching routes. Four bugs live in this file. You will not meet them all at
// once — the gate system reveals one failing test at a time. Read each test before you touch code.
//
// The auth guard you need for Bug 2 already exists in src/middleware/auth.ts. It is not
// wired up. Nothing here requires a session, and nothing scopes a read to one user.

export const meals = new Hono<AppEnv>();

// POST /meals — log a meal and have Nudge's coach reply.
//
// Bug 1: a write must go through the SERVICE client. This uses the ANON client, which is
//        Row-Level-Security restricted: the insert is rejected and NOTHING is written — yet
//        this handler still generates and returns a coaching reply, so the response looks
//        completely normal. That is the "200 OK, nothing happened" trap.
//
// Bug 4: the result of the insert is destructured as `{ data }` only. The `error` the client
//        hands back (RLS rejection, a CHECK-constraint violation, a dropped connection) is
//        thrown away. An unchecked error is an invisible failure.
//
// Bug 5: the model's reply is JSON.parse'd inside a try/catch that silently falls back to a
//        generic "Logged!" message on a parse failure, instead of surfacing it. A user whose
//        meal name breaks the mock's naive templating (see src/lib/coach.ts) gets a reply that
//        looks fine but isn't the real coaching text.
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

  const signal = classifySignal(body);
  let reply = "Logged!";
  try {
    const raw = await generateCoachingReply(body.name, signal);
    const parsed = JSON.parse(raw) as { reply: string; confidence: string };
    reply = parsed.reply;
  } catch {
    // fall back to the generic message above — Bug 5.
  }

  return c.json({ ok: true, meal: data?.[0] ?? null, reply });
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
