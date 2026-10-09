/** Small fetch wrapper for the Hono API under /api. Throws on non-2xx. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init)
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(data?.error ?? `Request failed: ${res.status}`)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return api<T>(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}
