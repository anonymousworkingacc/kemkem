import { app } from "./app"

// Requests for /api/* reach the Worker first (see `run_worker_first` in
// wrangler.jsonc); everything else is served from the built React assets.
export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>
