import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"

import type { Note } from "@shared/types"

import type { AppEnv } from "../../types"

const MAX_BODY_LENGTH = 500

// D1 example: a tiny notes list.
const notes = new Hono<AppEnv>()

notes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, body, created_at FROM notes ORDER BY id DESC LIMIT 50"
  ).all<Note>()
  return c.json(results)
})

notes.post("/", async (c) => {
  const { body } = await c.req.json<{ body?: unknown }>()
  if (typeof body !== "string" || !body.trim()) {
    throw new HTTPException(400, { message: "body is required" })
  }
  if (body.length > MAX_BODY_LENGTH) {
    throw new HTTPException(400, { message: "body is too long" })
  }
  const note = await c.env.DB.prepare(
    "INSERT INTO notes (body) VALUES (?) RETURNING id, body, created_at"
  )
    .bind(body.trim())
    .first<Note>()
  return c.json(note, 201)
})

notes.delete("/:id{[0-9]+}", async (c) => {
  await c.env.DB.prepare("DELETE FROM notes WHERE id = ?")
    .bind(Number(c.req.param("id")))
    .run()
  return c.body(null, 204)
})

export default notes
