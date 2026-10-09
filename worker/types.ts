import type { Hono } from "hono"

export type AppEnv = { Bindings: Env }

/** Every `worker/features/<name>/routes.ts` default-exports one of these. */
export type FeatureRoutes = Hono<AppEnv>
