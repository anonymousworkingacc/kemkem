import { useEffect, useState, type FormEvent } from "react"
import { Trash2Icon } from "lucide-react"

import type { Note } from "@shared/types"
import { api, postJson } from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export const order = 10

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api<Note[]>("/notes")
      .then(setNotes)
      .catch((e: Error) => setError(e.message))
  }, [])

  async function add(event: FormEvent) {
    event.preventDefault()
    try {
      const note = await postJson<Note>("/notes", { body: draft })
      setNotes((prev) => [note, ...prev])
      setDraft("")
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function remove(id: number) {
    await api(`/notes/${id}`, { method: "DELETE" })
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Stored in D1.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <form onSubmit={add} className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a note…"
            maxLength={500}
          />
          <Button type="submit" disabled={!draft.trim()}>
            Add
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <ul className="grid gap-1">
          {notes.map((note) => (
            <li
              key={note.id}
              className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-muted"
            >
              <span className="text-sm break-words">{note.body}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete note"
                onClick={() => remove(note.id)}
              >
                <Trash2Icon />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
