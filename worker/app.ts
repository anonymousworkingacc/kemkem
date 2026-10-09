import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import type { AppEnv, FeatureRoutes } from "./types"

// Features are discovered from the file system so parallel branches never
// have to edit a shared route list: `features/<name>/routes.ts` is mounted
// at `/api/<name>`.
const features = import.meta.glob<{ default: FeatureRoutes }>(
  "./features/*/routes.ts",
  { eager: true }
)

export const app = new Hono<AppEnv>().basePath("/api")

app.get("/health", (c) => c.json({ ok: true, env: c.env.APP_ENV }))

for (const [path, mod] of Object.entries(features)) {
  const name = path.split("/")[2]
  app.route(`/${name}`, mod.default)
}

app.notFound((c) => c.json({ error: "Not found" }, 404))

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status)
  }
  console.error(err)
  return c.json({ error: "Internal Server Error" }, 500)
})
