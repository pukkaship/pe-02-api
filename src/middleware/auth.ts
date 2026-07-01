import type { Context, Next } from "hono";
import type { AppEnv } from "../types";
import { getSession } from "../lib/session";

// An auth guard for the meal routes.
//
// Bug 2: this middleware is written and correct — but nothing wires it up. The routes in
// src/routes/meals.ts never call it, so GET /meals answers ANY caller and returns EVERY
// user's rows. A guard that is defined but not applied protects nothing.
//
// When you fix Bug 2 you will apply this to the routes and read the user id from the session
// (c.get("userId")) instead of trusting a value the caller supplied.
export async function requireAuth(c: Context<AppEnv>, next: Next): Promise<Response | void> {
  const header = c.req.header("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const session = getSession(token);
  if (!session) {
    return c.json({ error: "unauthorized" }, 401);
  }
  c.set("userId", session.userId);
  await next();
}
