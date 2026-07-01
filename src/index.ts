import { Hono } from "hono";
import type { AppEnv } from "./types";
import { meals } from "./routes/meals";

// The Hono application. Tests import this and drive it with app.request(...) — no network,
// no listening socket. src/server.ts wraps this for `npm start`.
export const app = new Hono<AppEnv>();

app.get("/health", (c) => c.json({ ok: true }));
app.route("/meals", meals);

export default app;
