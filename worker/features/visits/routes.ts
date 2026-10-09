import { Hono } from "hono"

import type { AppEnv } from "../../types"

const KEY = "visits:count"

// KV example: a visit counter. KV is eventually consistent and has no atomic
// increment, so it suits caches and counters that may drift, not money.
const visits = new Hono<AppEnv>()

visits.get("/", async (c) => {
  const count = Number((await c.env.KV.get(KEY)) ?? 0)
  return c.json({ count })
})

visits.post("/", async (c) => {
  const count = Number((await c.env.KV.get(KEY)) ?? 0) + 1
  await c.env.KV.put(KEY, String(count))
  return c.json({ count })
})

export default visits
