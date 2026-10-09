import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const order = 0

export default function Visits() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    api<{ count: number }>("/visits", { method: "POST" })
      .then((data) => setCount(data.count))
      .catch(() => setCount(null))
  }, [])

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          {count === null ? "…" : count.toLocaleString()} visits
        </CardTitle>
        <CardDescription>Counted in Workers KV.</CardDescription>
      </CardHeader>
    </Card>
  )
}
