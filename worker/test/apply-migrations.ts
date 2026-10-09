import { applyD1Migrations } from "cloudflare:test"
import { env } from "cloudflare:workers"

// Runs before every test file so the local D1 has the current schema.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS)
