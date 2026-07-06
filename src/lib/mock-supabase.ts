import type { MealRow } from "../types";

// An in-memory stand-in for a Supabase project, just faithful enough to teach the lesson.
// It models two things a real Supabase project would enforce:
//
//   1. Row-Level Security (RLS): the ANON client cannot INSERT into `meals`. The insert
//      comes back with an error and nothing is written — exactly what a default RLS policy
//      does. The SERVICE (service-role) client bypasses RLS and can write.
//
//   2. A CHECK constraint: every score column must be an integer 0..5. A row that breaks it
//      is rejected with an error by the database — even for the service client.
//
// The mock returns the same `{ data, error }` shape as @supabase/supabase-js, so the routes
// are written against the real client interface. Swap in the real client (USE_REAL_SUPABASE=1)
// and the routes do not change.

export type Role = "anon" | "service";

export interface QueryResult<T> {
  data: T | null;
  error: { message: string; code?: string } | null;
}

let store: MealRow[] = [];
let idCounter = 0;

// Exposed for tests: gives every test a clean database.
export function resetMockStore(): void {
  store = [];
  idCounter = 0;
}

function scoresValid(row: { [k: string]: unknown }): boolean {
  const cols = ["carb_score", "protein_score", "fibre_score", "fat_score"];
  return cols.every((c) => {
    const v = row[c];
    return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 5;
  });
}

type Filter = [column: string, value: unknown];

class MealsQuery implements PromiseLike<QueryResult<MealRow[]>> {
  private op: "select" | "insert" | "delete" = "select";
  private rows: Array<Record<string, unknown>> = [];
  private filters: Filter[] = [];

  constructor(private readonly role: Role) {}

  insert(rows: Record<string, unknown> | Array<Record<string, unknown>>): this {
    this.op = "insert";
    this.rows = Array.isArray(rows) ? rows : [rows];
    return this;
  }

  select(_columns?: string): this {
    if (this.op !== "insert") {
      this.op = "select";
    }
    return this;
  }

  delete(): this {
    this.op = "delete";
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push([column, value]);
    return this;
  }

  private run(): QueryResult<MealRow[]> {
    if (this.op === "insert") {
      // RLS: the anon client may not write.
      if (this.role === "anon") {
        return {
          data: null,
          error: {
            message: 'new row violates row-level security policy for table "meals"',
            code: "42501",
          },
        };
      }
      const inserted: MealRow[] = [];
      for (const raw of this.rows) {
        if (!scoresValid(raw)) {
          return {
            data: null,
            error: {
              message:
                'new row for relation "meals" violates check constraint "meals_scores_range"',
              code: "23514",
            },
          };
        }
        const row: MealRow = {
          id: `meal_${++idCounter}`,
          user_id: String(raw.user_id ?? ""),
          name: String(raw.name ?? ""),
          carb_score: raw.carb_score as number,
          protein_score: raw.protein_score as number,
          fibre_score: raw.fibre_score as number,
          fat_score: raw.fat_score as number,
          created_at: new Date(idCounter).toISOString(),
        };
        store.push(row);
        inserted.push(row);
      }
      return { data: inserted, error: null };
    }

    if (this.op === "delete") {
      // RLS: the anon client may not delete rows it does not own.
      // It returns success (no error) but deletes nothing — a silent no-op.
      if (this.role === "anon") {
        return { data: [], error: null };
      }
      const before = store.length;
      let remaining = store.slice();
      for (const [column, value] of this.filters) {
        remaining = remaining.filter(
          (r) => (r as unknown as Record<string, unknown>)[column] !== value
        );
      }
      store = remaining;
      const deleted: MealRow[] = [];
      return { data: deleted, error: null };
    }

    // select
    let rows = store.slice();
    for (const [column, value] of this.filters) {
      rows = rows.filter((r) => (r as unknown as Record<string, unknown>)[column] === value);
    }
    return { data: rows, error: null };
  }

  then<TResult1 = QueryResult<MealRow[]>, TResult2 = never>(
    onfulfilled?:
      | ((value: QueryResult<MealRow[]>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.run()).then(onfulfilled, onrejected);
  }
}

export interface MockClient {
  from(table: string): MealsQuery;
}

export function createMockClient(role: Role): MockClient {
  return {
    from(_table: string): MealsQuery {
      return new MealsQuery(role);
    },
  };
}
