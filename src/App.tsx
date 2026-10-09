import { useEffect, useState, type ComponentType } from "react"

import { api } from "@/lib/api"
import { useTheme } from "@/components/theme-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type FeatureModule = { default: ComponentType; order?: number }

// Each `src/features/<name>/index.tsx` is picked up automatically, so new
// features never need to edit this file (fewer merge conflicts).
const features = Object.entries(
  import.meta.glob<FeatureModule>("./features/*/index.tsx", { eager: true })
)
  .map(([path, mod]) => ({ name: path.split("/")[2], ...mod }))
  .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

export default function App() {
  const { theme, setTheme } = useTheme()
  // "dev" or "production" comes from the Worker, so reviewers always see
  // which deployment they are looking at.
  const [env, setEnv] = useState(import.meta.env.DEV ? "local" : "…")

  useEffect(() => {
    if (import.meta.env.DEV) return
    api<{ env: string }>("/health")
      .then((data) => setEnv(data.env))
      .catch(() => setEnv("offline"))
  }, [])

  return (
    <div className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">My App</h1>
          <Badge variant={env === "production" ? "default" : "secondary"}>
            {env}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "Light" : "Dark"} mode
        </Button>
      </header>
      <main className="grid gap-4">
        {features.map(({ name, default: Feature }) => (
          <Feature key={name} />
        ))}
      </main>
    </div>
  )
}
