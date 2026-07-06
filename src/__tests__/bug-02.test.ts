import { describe, it, expect, beforeEach } from "vitest";
import app from "../index";
import { resetMockStore } from "../lib/mock-supabase";
import type { MealRow } from "../types";

// Bug 2 â GET /meals must require a session and return only that user's rows.
//
// Right now the route has no guard and no per-user scope: an unauthenticated caller gets a
// 200 and every user's data. Wire src/middleware/auth.ts onto the routes and scope the read
// to c.get("userId").

async function postAs(token: string, body: Record<string, unknown>): Promise<Response> {
  return app.request("/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

const mealBody = (over: Record<string, unknown> = {}) => ({
  name: "poha",
  carb_score: 3,
  protein_score: 2,
  fibre_score: 2,
  fat_score: 1,
  ...over,
});

describe("GET /meals â Bug 2: auth guard + per-user scope", () => {
  beforeEach(() => resetMockStore());

  it("returns 401 when no Authorization header is present", async () => {
    const res = await app.request("/meals");
    expect(res.status).toBe(401);
  });

  it("returns only the authenticated user's meals, not everyone's", async () => {
    await postAs("token-u1", mealBody({ user_id: "u1", name: "poha" }));
    await postAs("token-u2", mealBody({ user_id: "u2", name: "masala dosa" }));

    const res = await app.request("/meals", { headers: { Authorization: "Bearer token-u1" } });
    expect(res.status).toBe(200);

    const { meals } = (await res.json()) as { meals: MealRow[] };
    expect(meals.length).toBeGreaterThan(0);
    expect(meals.every((m) => m.user_id === "u1")).toBe(true);
    expect(meals.map((m) => m.name)).not.toContain("masala dosa");
  });
});
