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
  title: "Tìm số",
  icon: ({ className }) => (
    <span className={cn("leading-none font-bold", className)}>123</span>
  ),
  order: 20,
}

/** `lang` sets the language of everything the game says, not just numbers. */
type Settings = { max: 10 | 20; lang: "vi" | "en" }

const parse = (saved: Partial<Settings>): Settings => ({
  max: saved.max === 20 ? 20 : 10,
  lang: saved.lang === "en" ? "en" : "vi",
})

// 6 and 9 look alike once the tiles are tilted.
const LOOKALIKES = { "6": ["9"], "9": ["6"], "16": ["19"], "19": ["16"] }

function alphabetFor({ max, lang }: Settings): Alphabet {
  const voice = voices.find((v) => v.lang === lang)!
  return {
    ...voice,
    lang,
    letters: voice.letters.slice(0, max),
    lookalikes: LOOKALIKES,
  }
}

export default function NumberGame({ onExit }: GameProps) {
  const [settings, save] = useStoredSettings("kemkem-numbers", parse)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <GameSettings
        title="Cài đặt tìm số"
        settings={settings}
        onDone={(next) => {
          save(next)
          setEditing(false)
        }}
      >
        {(draft, setDraft) => (
          <>
            <Choice<Settings["max"]>
              title="Các số"
              value={draft.max}
              options={[
                { value: 10, label: "1 – 10" },
                { value: 20, label: "1 – 20" },
              ]}
              onChange={(max) => setDraft({ ...draft, max })}
            />
            <Choice
              title="Ngôn ngữ"
              value={draft.lang}
              options={LANGUAGE_OPTIONS}
              onChange={(lang) => setDraft({ ...draft, lang })}
            />
          </>
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
