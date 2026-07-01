import type { Session } from "../types";

// A stand-in for a real auth provider (Supabase Auth, Clerk, a JWT verifier, ...).
// In this module it maps two fixed bearer tokens to two user ids so the tests can act
// as different people. The real mechanism does not matter here — the lesson is WHERE the
// user identity comes from: a validated session, never a value the caller can choose.
const TOKENS: Record<string, string> = {
  "token-u1": "u1",
  "token-u2": "u2",
};

export function getSession(token: string | undefined): Session | null {
  if (!token) {
    return null;
  }
  const userId = TOKENS[token];
  return userId ? { userId } : null;
}
