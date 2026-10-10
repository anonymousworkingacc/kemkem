import { useState } from "react"

import {
  Choice,
  GameSettings,
  LANGUAGE_OPTIONS,
  useStoredSettings,
} from "@/components/kid/game-settings"
import { LetterHunt, type Alphabet } from "@/components/kid/letter-hunt"
import type { GameMeta, GameProps } from "@/lib/game"
import { VEHICLES } from "./vehicles/pictures"
import vehicleVoices from "./vehicles/voice.json"

export const meta: GameMeta = {
  title: "Tìm đồ vật",
  icon: ({ className }) => (
    <span className={className}>
      <span className="block size-[1.8em]">
        <VEHICLES.bus />
      </span>
    </span>
  ),
  order: 30,
}

/**
 * Topics: each is a folder with `pictures.tsx` (drawings keyed by id) and
 * `voice.json` (names per language, for scripts/gen-voice.py).
 */
const TOPICS = {
  vehicles: {
    label: "Phương tiện giao thông",
    pictures: VEHICLES,
    voices: vehicleVoices,
  },
}

type Topic = keyof typeof TOPICS

/** `lang` sets the language of everything the game says. */
type Settings = { topic: Topic; lang: "vi" | "en" }

const parse = (saved: Partial<Settings>): Settings => ({
  topic: saved.topic && saved.topic in TOPICS ? saved.topic : "vehicles",
  lang: saved.lang === "en" ? "en" : "vi",
})

function alphabetFor({ topic, lang }: Settings): Alphabet {
  const { voices, pictures } = TOPICS[topic]
  const voice = voices.find((v) => v.lang === lang)!
  return { ...voice, lang, pictures, lookalikes: {} }
}

export default function ObjectGame({ onExit }: GameProps) {
  const [settings, save] = useStoredSettings("kemkem-objects", parse)
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <GameSettings
        title="Cài đặt tìm đồ vật"
        settings={settings}
        onDone={(next) => {
          save(next)
          setEditing(false)
        }}
      >
        {(draft, setDraft) => (
          <>
            <Choice<Topic>
              title="Chủ đề"
              value={draft.topic}
              options={Object.entries(TOPICS).map(([value, t]) => ({
                value: value as Topic,
                label: t.label,
              }))}
              onChange={(topic) => setDraft({ ...draft, topic })}
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
