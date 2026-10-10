import { useState } from "react"

import {
  Choice,
  GameSettings,
  LANGUAGE_OPTIONS,
  useStoredSettings,
} from "@/components/kid/game-settings"
import { LetterHunt, type Alphabet } from "@/components/kid/letter-hunt"
import type { GameMeta, GameProps } from "@/lib/game"
import { cn } from "@/lib/utils"
import voices from "./voice.json"

export const meta: GameMeta = {
  title: "Tìm chữ",
  icon: ({ className }) => (
    <span className={cn("leading-none font-bold", className)}>Aa</span>
  ),
  order: 10,
}

/** Which alphabet; it also sets the language of everything the game says. */
type Settings = { lang: "vi" | "en" }

const parse = (saved: Partial<Settings>): Settings => ({
  lang: saved.lang === "en" ? "en" : "vi",
})

// Letters a 2–5 year old mistakes for one another never share a board.
const LOOKALIKES: Record<Settings["lang"], Record<string, string[]>> = {
  // Same letter but for the diacritic (a/ă/â, o/ô/ơ…), plus b/d/đ/p/q.
  vi: {
    a: ["ă", "â"],
    ă: ["a", "â"],
    â: ["a", "ă"],
    b: ["d", "đ", "p", "q"],
    d: ["đ", "b", "p", "q"],
    đ: ["d", "b", "p", "q"],
    p: ["b", "d", "đ", "q"],
    q: ["b", "d", "đ", "p", "g"],
    g: ["q"],
    e: ["ê"],
    ê: ["e"],
    o: ["ô", "ơ"],
    ô: ["o", "ơ"],
    ơ: ["o", "ô"],
    u: ["ư", "n"],
    ư: ["u", "n"],
    n: ["u", "ư"],
    i: ["l"],
    l: ["i"],
  },
  en: {
    b: ["d", "p", "q"],
    d: ["b", "p", "q"],
    p: ["b", "d", "q"],
    q: ["b", "d", "p", "g"],
    g: ["q"],
    m: ["w"],
    w: ["m"],
    n: ["u"],
    u: ["n"],
    i: ["l", "j"],
    l: ["i"],
    j: ["i"],
  },
}

function alphabetFor({ lang }: Settings): Alphabet {
  const voice = voices.find((v) => v.lang === lang)!
  return { ...voice, lang, lookalikes: LOOKALIKES[lang] }
}

export default function LetterGame({ onExit }: GameProps) {
  const [settings, save] = useStoredSettings("kemkem-letters", parse)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <GameSettings
        title="Cài đặt tìm chữ"
        settings={settings}
        onDone={(next) => {
          save(next)
          setEditing(false)
        }}
      >
        {(draft, setDraft) => (
          <Choice
            title="Bảng chữ cái"
            value={draft.lang}
            options={LANGUAGE_OPTIONS}
            onChange={(lang) => setDraft({ ...draft, lang })}
          />
        )}
      </GameSettings>
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
