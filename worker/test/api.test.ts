import { exports } from "cloudflare:workers"
import { describe, expect, it } from "vitest"

const api = (path: string, init?: RequestInit) =>
  exports.default.fetch(new Request(`http://localhost/api${path}`, init))

describe("api", () => {
  it("reports health", async () => {
    const res = await api("/health")
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ ok: true })
  })

  it("returns JSON 404 for unknown routes", async () => {
    const res = await api("/does-not-exist")
    expect(res.status).toBe(404)
  })
})

describe("notes (D1)", () => {
  it("creates, lists and deletes a note", async () => {
    const created = await api("/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "hello" }),
    })
    expect(created.status).toBe(201)
    const note = await created.json<{ id: number; body: string }>()
    expect(note.body).toBe("hello")

    const list = await (await api("/notes")).json<{ id: number }[]>()
    expect(list.map((n) => n.id)).toContain(note.id)

    const deleted = await api(`/notes/${note.id}`, { method: "DELETE" })
    expect(deleted.status).toBe(204)
  })

  it("rejects an empty note", async () => {
    const res = await api("/notes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: "  " }),
    })
    expect(res.status).toBe(400)
  })
})

describe("visits (KV)", () => {
  it("increments the counter", async () => {
    const before = await (await api("/visits")).json<{ count: number }>()
    const after = await (
      await api("/visits", { method: "POST" })
    ).json<{
      count: number
    }>()
    expect(after.count).toBe(before.count + 1)
  })
})
