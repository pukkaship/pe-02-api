import { serve } from "@hono/node-server";
import app from "./index";

// `npm start` — serve the app locally. Try it by hand:
//   curl -s localhost:3000/meals                       # (broken) returns everyone's rows
//   curl -s -X POST localhost:3000/meals \
//     -H 'content-type: application/json' \
//     -H 'authorization: Bearer token-u1' \
//     -d '{"user_id":"u1","name":"poha","carb_score":3,"protein_score":2,"fibre_score":2,"fat_score":1}'
//   curl -s localhost:3000/meals                        # (broken) the meal is NOT there
const port = Number(process.env.PORT ?? 3000);
serve({ fetch: app.fetch, port });
console.log(`pe-02-api listening on http://localhost:${port}`);
