import { useState } from "react"
import { ArrowLeftIcon, CheckIcon, PlayIcon } from "lucide-react"

import { IconButton } from "@/components/kid/icon-button"
import { LetterHunt, type Alphabet } from "@/components/kid/letter-hunt"
import type { GameMeta, GameProps } from "@/lib/game"
import { cn } from "@/lib/utils"
import voices from "./voice.json"

export const meta: GameMeta = {
  title: "Tìm số",
  icon: ({ className }) => (
    <span className={cn("leading-none font-bold", className)}>123</span>
  ),
  order: 30,
}

type Settings = { max: 10 | 20; lang: "vi" | "en" }

const STORAGE_KEY = "kemkem-numbers"
const DEFAULTS: Settings = { max: 10, lang: "vi" }

function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    return {
      max: saved.max === 20 ? 20 : 10,
      lang: saved.lang === "en" ? "en" : "vi",
    }
  } catch {
    return DEFAULTS
  }
}

// 6 and 9 look alike once the tiles are tilted.
const LOOKALIKES = { "6": ["9"], "9": ["6"], "16": ["19"], "19": ["16"] }

function alphabetFor({ max, lang }: Settings): Alphabet {
  const voice = voices.find((v) => v.id === lang)!
  return {
    ...voice,
    letters: voice.letters.slice(0, max),
    lookalikes: LOOKALIKES,
  }
}

export default function NumberHunt({ onExit }: GameProps) {
  const [settings, setSettings] = useState(loadSettings)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <NumberSettings
        settings={settings}
        onDone={(next) => {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            // Not persisted, but still used for this visit.
          }
          setSettings(next)
          setEditing(false)
        }}
      />
    )
  }
  return (
    <LetterHunt
      alphabet={alphabetFor(settings)}
      onExit={onExit}
      onSettings={() => setEditing(true)}
    />
  )
}

function Choice<T>(props: {
  title: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  return (
    <section className="flex flex-col gap-[2vmin]">
      <h2 className="text-[clamp(1.25rem,4vmin,2.25rem)] font-bold">
        {props.title}
      </h2>
      <div className="grid grid-cols-2 gap-[3vmin]">
        {props.options.map((option) => {
          const selected = option.value === props.value
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => props.onChange(option.value)}
              className={cn(
                "flex h-[clamp(4rem,14vmin,7rem)] items-center justify-center gap-[1vmin] rounded-3xl border-ink bg-paper text-[clamp(1.25rem,5vmin,2.75rem)] font-bold",
                selected ? "border-[6px]" : "border-[3px] border-dashed"
              )}
            >
              {selected && (
                <CheckIcon className="size-[1.1em]" strokeWidth={4} />
              )}
              {option.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

/** In-game settings, meant for the parent: number range and reading language. */
function NumberSettings({
  settings,
  onDone,
}: {
  settings: Settings
  onDone: (settings: Settings) => void
}) {
  const [draft, setDraft] = useState(settings)
  return (
    <div className="flex h-full flex-col gap-[4vmin] p-[3vmin]">
      <header className="flex shrink-0 items-center gap-[2vmin]">
        <IconButton
          icon={ArrowLeftIcon}
          label="Quay lại"
          onClick={() => onDone(settings)}
        />
        <h1 className="text-[clamp(1.75rem,6vmin,3.5rem)] font-bold">
          Cài đặt tìm số
        </h1>
      </header>
      <Choice<Settings["max"]>
        title="Các số"
        value={draft.max}
        options={[
          { value: 10, label: "1 – 10" },
          { value: 20, label: "1 – 20" },
        ]}
        onChange={(max) => setDraft({ ...draft, max })}
      />
      <Choice<Settings["lang"]>
        title="Đọc số bằng"
        value={draft.lang}
        options={[
          { value: "vi", label: "Tiếng Việt" },
          { value: "en", label: "Tiếng Anh" },
        ]}
        onChange={(lang) => setDraft({ ...draft, lang })}
      />
      <div className="flex min-h-0 flex-1 items-end justify-center">
        <button
          type="button"
          onClick={() => onDone(draft)}
          className="flex h-[clamp(4rem,14vmin,7rem)] items-center gap-[2vmin] rounded-full border-[4px] border-ink bg-accent px-[6vmin] text-[clamp(1.5rem,6vmin,3rem)] font-bold text-accent-ink active:bg-ink"
        >
          <PlayIcon className="size-[1.2em] fill-current" strokeWidth={2.5} />
          Chơi
        </button>
      </div>
    </div>
  )
}
