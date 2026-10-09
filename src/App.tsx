import { useEffect, useState, type ComponentType } from "react"
import {
  ArrowLeftIcon,
  CheckIcon,
  MaximizeIcon,
  MinimizeIcon,
  SettingsIcon,
} from "lucide-react"

import { api } from "@/lib/api"
import type { GameMeta, GameProps } from "@/lib/game"
import { cn } from "@/lib/utils"
import { IconButton } from "@/components/kid/icon-button"
import { useTheme, type Theme } from "@/components/theme-provider"

type GameModule = { default: ComponentType<GameProps>; meta: GameMeta }

// Each `src/features/<name>/index.tsx` is a game picked up automatically, so
// new games never need to edit this file (fewer merge conflicts).
const games = Object.entries(
  import.meta.glob<GameModule>("./features/*/index.tsx", { eager: true })
)
  .map(([path, mod]) => ({ name: path.split("/")[2], ...mod }))
  .sort((a, b) => (a.meta.order ?? 100) - (b.meta.order ?? 100))

type Screen =
  { kind: "home" } | { kind: "settings" } | { kind: "game"; name: string }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ kind: "home" })
  const home = () => setScreen({ kind: "home" })

  if (screen.kind === "settings") return <Settings onBack={home} />
  if (screen.kind === "game") {
    const game = games.find((g) => g.name === screen.name)
    if (game) return <game.default onExit={home} />
  }
  return (
    <Home
      onPlay={(name) => setScreen({ kind: "game", name })}
      onSettings={() => setScreen({ kind: "settings" })}
    />
  )
}

function useFullscreen() {
  const [on, setOn] = useState(() => !!document.fullscreenElement)
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", sync)
    return () => document.removeEventListener("fullscreenchange", sync)
  }, [])
  const toggle = () => {
    const request = on
      ? document.exitFullscreen()
      : document.documentElement.requestFullscreen()
    request.catch(() => {})
  }
  return { supported: !!document.fullscreenEnabled, on, toggle }
}

function Home({
  onPlay,
  onSettings,
}: {
  onPlay: (name: string) => void
  onSettings: () => void
}) {
  const fullscreen = useFullscreen()
  return (
    <div className="flex h-full flex-col gap-[3vmin] p-[3vmin]">
      <header className="flex shrink-0 items-center gap-[2vmin]">
        <h1 className="flex-1 text-[clamp(2rem,8vmin,4.5rem)] leading-none font-bold">
          Kemkem
        </h1>
        {fullscreen.supported && (
          <IconButton
            icon={fullscreen.on ? MinimizeIcon : MaximizeIcon}
            label={fullscreen.on ? "Thoát toàn màn hình" : "Toàn màn hình"}
            onClick={fullscreen.toggle}
          />
        )}
        <IconButton icon={SettingsIcon} label="Cài đặt" onClick={onSettings} />
      </header>
      <main className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-[3vmin] landscape:grid-cols-2">
        {games.map(({ name, meta }) => (
          <button
            key={name}
            type="button"
            onClick={() => onPlay(name)}
            className="flex min-h-0 flex-col items-center justify-center gap-[2vmin] rounded-3xl border-[4px] border-ink bg-tile-1 p-[3vmin] active:bg-ink active:text-paper"
          >
            <meta.icon className="text-[clamp(5rem,30vmin,16rem)]" />
            <span className="text-[clamp(1.5rem,6vmin,3rem)] font-bold">
              {meta.title}
            </span>
          </button>
        ))}
      </main>
    </div>
  )
}

const THEME_OPTIONS: { value: Theme; label: string; swatches: string[] }[] = [
  {
    value: "bw",
    label: "Đen trắng",
    swatches: ["#000", "#fff", "#8a8a8a", "#d0d0d0"],
  },
  {
    value: "color",
    label: "Có màu",
    swatches: ["#ffd23f", "#7cc8ff", "#ff9a8b", "#8fe388"],
  },
]

function Settings({ onBack }: { onBack: () => void }) {
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
    <div className="flex h-full flex-col gap-[3vmin] p-[3vmin]">
      <header className="flex shrink-0 items-center gap-[2vmin]">
        <IconButton icon={ArrowLeftIcon} label="Quay lại" onClick={onBack} />
        <h1 className="text-[clamp(1.75rem,6vmin,3.5rem)] font-bold">
          Cài đặt
        </h1>
      </header>
      <section className="flex min-h-0 flex-1 flex-col gap-[2vmin]">
        <h2 className="text-[clamp(1.25rem,4vmin,2.25rem)] font-bold">
          Giao diện
        </h2>
        <div className="grid grid-cols-2 gap-[3vmin]">
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.value
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex flex-col items-center gap-[2vmin] rounded-3xl border-ink bg-paper p-[3vmin]",
                  selected ? "border-[6px]" : "border-[3px] border-dashed"
                )}
              >
                <span className="grid grid-cols-2 gap-[1vmin]">
                  {option.swatches.map((color) => (
                    <span
                      key={color}
                      className="size-[clamp(2rem,8vmin,4rem)] rounded-lg border-[3px] border-ink"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span className="flex items-center gap-[1vmin] text-[clamp(1.25rem,4.5vmin,2.5rem)] font-bold">
                  {selected && (
                    <CheckIcon className="size-[1.1em]" strokeWidth={4} />
                  )}
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      </section>
      <p className="shrink-0 text-center text-sm">Kemkem · {env}</p>
    </div>
  )
}
