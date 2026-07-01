import { describe, it, expect, beforeEach } from "vitest";
import app from "../index";
import { resetMockStore } from "../lib/mock-supabase";
import type { MealRow } from "../types";

// Bug 1 — a write must use the SERVICE client.
//
// This is the only test active when you clone the repo. It fails. Read it, then read the
// POST handler in src/routes/meals.ts.
//
// The handler answers 200, so a test that only checked the status code would be fooled.
// This test does the one thing that catches a silent write failure: it reads the data back.

const AUTH_U1 = "Bearer token-u1";

async function post(body: Record<string, unknown>): Promise<Response> {
  return app.request("/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: AUTH_U1 },
    body: JSON.stringify(body),
  });
}

describe("POST /meals — Bug 1: writes must use the service client", () => {
  beforeEach(() => resetMockStore());

  it("actually persists the meal so it can be read back — not just returns 200", async () => {
    const res = await post({
      user_id: "u1",
      name: "poha",
      carb_score: 3,
      protein_score: 2,
      fibre_score: 2,
      fat_score: 1,
    });
    expect(res.status).toBe(200);

    const list = await app.request("/meals", { headers: { Authorization: AUTH_U1 } });
    const { meals } = (await list.json()) as { meals: MealRow[] };

    expect(meals.map((m) => m.name)).toContain("poha");
  });
});
