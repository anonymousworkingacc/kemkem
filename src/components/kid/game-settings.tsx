import { useState, type ReactNode } from "react"
import { ArrowLeftIcon, CheckIcon, PlayIcon } from "lucide-react"

import { IconButton } from "@/components/kid/icon-button"
import { cn } from "@/lib/utils"

/**
 * Settings saved on the device under `key`. `parse` turns whatever was
 * stored (possibly nothing, or an old shape) into valid settings.
 */
export function useStoredSettings<T>(
  key: string,
  parse: (saved: Partial<T>) => T
) {
  const [settings, setSettings] = useState<T>(() => {
    try {
      return parse(JSON.parse(localStorage.getItem(key) ?? "{}"))
    } catch {
      return parse({})
    }
  })
  const save = (next: T) => {
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // Not persisted, but still used for this visit.
    }
    setSettings(next)
  }
  return [settings, save] as const
}

/** A row of two (or more) big choice buttons. */
export function Choice<T>(props: {
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

/**
 * Full-screen in-game settings for the parent (always in Vietnamese).
 * The back arrow discards the draft, "Chơi" applies it.
 */
export function GameSettings<T>({
  title,
  settings,
  onDone,
  children,
}: {
  title: string
  settings: T
  onDone: (settings: T) => void
  children: (draft: T, setDraft: (draft: T) => void) => ReactNode
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
          {title}
        </h1>
      </header>
      {children(draft, setDraft)}
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

export const LANGUAGE_OPTIONS = [
  { value: "vi" as const, label: "Tiếng Việt" },
  { value: "en" as const, label: "Tiếng Anh" },
]
