import { createClient } from "@supabase/supabase-js";
import { createMockClient, type MockClient } from "./mock-supabase";

// Two clients, one job each:
//
//   anon    — the public, Row-Level-Security-restricted client. Safe for reads a logged-in
//             user is allowed to make. It CANNOT write past a default RLS policy.
//   service — the service-role client. It bypasses RLS. It is trusted server-side code only
//             and must never be exposed to a browser.
//
// The whole module is about picking the right one for the job. Using `anon` for a write
// fails silently: the row never lands, but the call still returns.
//
// By default (and in CI) both are in-memory mocks that model RLS + a CHECK constraint, so the
// suite is deterministic and needs no network. Set USE_REAL_SUPABASE=1 with real credentials
// to run the identical routes against an actual Supabase project.

export interface SupabaseClients {
  anon: MockClient;
  service: MockClient;
}

export function getClients(): SupabaseClients {
  if (process.env.USE_REAL_SUPABASE === "1") {
    const url = requireEnv("SUPABASE_URL");
    const anon = createClient(url, requireEnv("SUPABASE_ANON_KEY"));
    const service = createClient(url, requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
      auth: { persistSession: false },
    });
    // The real client is structurally compatible with the narrow surface the routes use
    // (.from().insert().select().eq()); cast to the shared shape.
    return { anon: anon as unknown as MockClient, service: service as unknown as MockClient };
  }

  return {
    anon: createMockClient("anon"),
    service: createMockClient("service"),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is required when USE_REAL_SUPABASE=1. See .env.example and supabase/migrations/0001_meals.sql.`
    );
  }
  return value;
}
