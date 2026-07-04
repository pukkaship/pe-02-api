// A stand-in for the LLM call that turns a logged meal into Nudge's coaching reply.
//
// Real models don't guarantee well-formed JSON back. This mock deliberately models one concrete,
// deterministic way that can fail — it builds its response with naive string templating instead
// of JSON.stringify, so a meal name containing a literal `"` character breaks the JSON
// structurally. That's not a random flake (tests must be reproducible); it is exactly what
// happens when a model echoes a user's own text back into a "structured" response without
// escaping it.
//
// Swap in a real provider (Gemini/OpenAI/etc.) behind this same signature when you're ready —
// nothing in the route handler needs to change.
export async function generateCoachingReply(mealName: string, signal: string): Promise<string> {
  const confidence = signal === "balanced" ? "high" : "medium";
  return `{"reply": "Nice, that ${mealName} looks ${signal}!", "confidence": "${confidence}"}`;
}

// A simple, deterministic "review" signal derived from the meal's scores — stands in for
// whatever heuristic or model call would classify the meal in a real system. Balanced needs
// both protein AND fibre present — the same fail-loud AND-not-OR lesson from Module 1, now one
// level up the system.
export function classifySignal(meal: { protein_score: number; fibre_score: number }): string {
  return meal.protein_score > 0 && meal.fibre_score > 0 ? "balanced" : "needs-balance";
}
