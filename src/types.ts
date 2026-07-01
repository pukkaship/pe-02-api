// Shared shapes for the meal-log API.
//
// A meal row lives in the `meals` table (see supabase/migrations/0001_meals.sql).
// The four score columns each carry a CHECK constraint: they must be integers 0..5.
// The database will REJECT a row that violates it — which is the whole point of Bug 4.

export interface MealInput {
  // The broken POST handler trusts a client-supplied user_id. The fix derives it from
  // the authenticated session instead (Bug 2). Optional here so both paths type-check.
  user_id?: string;
  name: string;
  carb_score: number;
  protein_score: number;
  fibre_score: number;
  fat_score: number;
}

export interface MealRow extends MealInput {
  id: string;
  user_id: string;
  created_at: string;
}

export interface Session {
  userId: string;
}

// Hono request-scoped variables. requireAuth sets `userId` after validating a session.
export interface AppEnv {
  Variables: {
    userId: string;
  };
}
