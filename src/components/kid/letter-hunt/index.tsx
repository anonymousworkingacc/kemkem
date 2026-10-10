import { useEffect, useRef, useState } from "react"
import { HouseIcon, PlayIcon, SettingsIcon, Volume2Icon } from "lucide-react"

import { CELEBRATIONS } from "@/components/kid/celebration-art"
import { FeedbackBar, type Feedback } from "@/components/kid/feedback"
import { IconButton } from "@/components/kid/icon-button"
import { pick, type GameProps } from "@/lib/game"
import { enqueue, isPlaying, play, preload, stop, type Clip } from "@/lib/sound"
import { cn } from "@/lib/utils"
import { buildBoard, drawTarget, type Cell } from "./logic"
import phrasesEn from "./phrases.en.json"
import phrasesVi from "./phrases.vi.json"
import "./letter-hunt.css"

/** One game's letters, as stored in `src/features/<game>/voice.json`. */
export type Alphabet = {
  /**
   * Language of everything the game says and shows during play: the prompt,
   * the symbol names and the praise/encouragement lines.
   */
  lang: "vi" | "en"
  /**
   * Folder under /public with this game's clips (scripts/gen-voice.py):
   * `prompt-<n>-<id>.mp3` ("Bạn hãy tìm chữ bờ") and `letter-<id>.mp3`
   * ("Chữ bờ").
   */
  dir: string
  /** What the symbols are called: "chữ"/"số" or "letter"/"number". */
  noun: string
  /** Lower-case letters; `say` is how the voice names the letter. */
  letters: { id: string; char: string; say: string }[]
  /** Letters easily mistaken for the key, kept off its board (both cases). */
  lookalikes: Record<string, string[]>
}

type Phrase = { id: string; text: string }
type PhrasePack = typeof phrasesVi

const PACKS: Record<Alphabet["lang"], PhrasePack> = {
  vi: phrasesVi,
  en: phrasesEn,
}
const SPEECH_LANG = { vi: "vi-VN", en: "en-US" } as const

function setup(alphabet: Alphabet) {
  const phrases = PACKS[alphabet.lang]
  const lang = SPEECH_LANG[alphabet.lang]
  const byChar = new Map(alphabet.letters.map((l) => [l.char, l]))
  const Noun = alphabet.noun[0].toUpperCase() + alphabet.noun.slice(1)
  const clip = (dir: string, file: string, text: string): Clip => ({
    src: `/${dir}/${file}.mp3`,
    text,
    lang,
  })
  const phraseClip = (p: Phrase) => clip(phrases.dir, p.id, p.text)
  const promptClip = (prompt: Phrase, char: string) => {
    const letter = byChar.get(char)!
    return clip(
      alphabet.dir,
      `${prompt.id}-${letter.id}`,
      `${prompt.text} ${alphabet.noun} ${letter.say}`
    )
  }
  /** "Chữ bờ" / "Letter B", said for the tile just tapped (either case). */
  const letterClip = (glyph: string) => {
    const letter = byChar.get(glyph.toLowerCase())!
    return clip(alphabet.dir, `letter-${letter.id}`, `${Noun} ${letter.say}`)
  }
  return {
    phrases,
    letters: alphabet.letters.map((l) => l.char),
    Noun,
    phraseClip,
    promptClip,
    letterClip,
    // Prompt clips are fetched when played; what a tap says is preloaded so
    // the first tap answers without delay.
    tapClips: [
      ...alphabet.letters.map((l) => letterClip(l.char).src),
      ...[phrases.correct, phrases.wrong, phrases.complete]
        .flat()
        .map((p) => phraseClip(p).src),
    ],
  }
}

const TILE_BG = [
  "bg-tile-1",
  "bg-tile-2",
  "bg-tile-3",
  "bg-tile-4",
  "bg-tile-5",
  "bg-tile-6",
]

type Round = {
  target: string
  bag: string[]
  prompt: Phrase
  cells: Cell[]
}

/**
 * "Find the letter" game, shared by every alphabet: a board of tilted letter
 * tiles, a spoken prompt, ✓/✗ feedback with the spoken sentence, and a
 * celebration when all copies (upper and lower case) are found.
 */
export function LetterHunt({
  alphabet,
  onExit,
  onSettings,
}: GameProps & {
  alphabet: Alphabet
  /** Shows a settings button in the game header (e.g. number range). */
  onSettings?: () => void
}) {
  const [game] = useState(() => setup(alphabet))
  const { phrases, phraseClip, promptClip, letterClip, Noun } = game
  const promptText = (round: Round) =>
    `${round.prompt.text} ${alphabet.noun} ${round.target.toUpperCase()}`
  const newRound = (bag: string[], last: string | null): Round => {
    const next = drawTarget(game.letters, bag, last)
    return {
      ...next,
      prompt: pick(phrases.prompt),
      cells: buildBoard(next.target, game.letters, alphabet.lookalikes),
    }
  }
  const [round, setRound] = useState(() => newRound([], null))
  const [feedback, setFeedback] = useState<Feedback>(() => ({
    kind: "prompt",
    text: promptText(round),
  }))
  const [win, setWin] = useState<{
    Art: (typeof CELEBRATIONS)[number]
    phrase: Phrase
  } | null>(null)

  useEffect(() => {
    preload(game.tapClips)
    return stop
  }, [game])

  // Ask for the letter at the start of every round (targets never repeat
  // back to back, so this runs once per round, not on every tap).
  const { prompt, target } = round
  // Letter whose name + reaction is being said, so tapping the same letter
  // again (or another copy of it) does not restart the sentence.
  const saying = useRef<string | null>(null)
  useEffect(() => {
    saying.current = null
    play(promptClip(prompt, target))
  }, [prompt, target, promptClip])

  const repeatPrompt = () => {
    setFeedback({ kind: "prompt", text: promptText(round) })
    saying.current = null
    play(promptClip(round.prompt, round.target))
  }

  // Every tap first names the tapped letter ("Chữ bờ"), then reacts.
  const tap = (cell: Cell) => {
    if (cell.found) return
    const key = cell.char.toLowerCase()
    const repeat = saying.current === key && isPlaying()
    saying.current = key
    const named = letterClip(cell.char)
    const say = (phrase: Phrase) => play(named, phraseClip(phrase))
    const show = (kind: Feedback["kind"], phrase: Phrase) =>
      setFeedback({ kind, text: `${Noun} ${cell.char}. ${phrase.text}` })
    if (repeat) {
      // Same letter while its sentence is still playing: let it finish.
      if (!cell.target) return
    } else if (!cell.target) {
      const phrase = pick(phrases.wrong)
      show("wrong", phrase)
      say(phrase)
      return
    }
    const cells = round.cells.map((c) =>
      c.id === cell.id ? { ...c, found: true } : c
    )
    setRound({ ...round, cells })
    if (cells.every((c) => !c.target || c.found)) {
      const phrase = pick(phrases.complete)
      setWin({ Art: pick(CELEBRATIONS), phrase })
      if (repeat) enqueue(phraseClip(phrase))
      else say(phrase)
    } else if (!repeat) {
      const phrase = pick(phrases.correct)
      show("correct", phrase)
      say(phrase)
    }
  }

  const playAgain = () => {
    const next = newRound(round.bag, round.target)
    setRound(next)
    setFeedback({ kind: "prompt", text: promptText(next) })
    setWin(null)
  }

  if (win) {
    const { Art } = win
    return (
      <div className="flex h-full flex-col items-center gap-[3vmin] p-[3vmin]">
        <div className="flex w-full justify-start">
          <IconButton icon={HouseIcon} label="Về trang chủ" onClick={onExit} />
        </div>
        <div className="flex min-h-0 w-full flex-1 items-center justify-center">
          <div className="aspect-square h-full max-w-full">
            <Art />
          </div>
        </div>
        <p className="text-center text-[clamp(1.5rem,5.5vmin,3rem)] leading-tight font-bold">
          {win.phrase.text}
        </p>
        <button
          type="button"
          onClick={playAgain}
          className="flex h-[clamp(4rem,14vmin,7rem)] items-center gap-[2vmin] rounded-full border-[4px] border-ink bg-accent px-[6vmin] text-[clamp(1.5rem,6vmin,3rem)] font-bold text-accent-ink active:bg-ink"
        >
          <PlayIcon className="size-[1.2em] fill-current" strokeWidth={2.5} />
          {phrases.playAgain}
        </button>
      </div>
    )
  }

  const targets = round.cells.filter((c) => c.target)

  return (
    <div className="flex h-full flex-col gap-[2vmin] p-[2vmin]">
      <header className="flex h-[clamp(3.5rem,11vmin,6rem)] shrink-0 items-stretch gap-[2vmin]">
        <IconButton icon={HouseIcon} label="Về trang chủ" onClick={onExit} />
        {onSettings && (
          <IconButton
            icon={SettingsIcon}
            label="Cài đặt"
            onClick={onSettings}
          />
        )}
        <FeedbackBar feedback={feedback} />
        <IconButton
          icon={Volume2Icon}
          label="Nghe lại"
          onClick={repeatPrompt}
          className="bg-accent text-accent-ink"
        />
      </header>

      <div
        aria-label={`Các ${alphabet.noun} cần tìm`}
        className="flex h-[clamp(2.5rem,7vmin,4rem)] shrink-0 justify-center gap-[2vmin]"
      >
        {targets.map((c) => (
          <span
            key={c.id}
            className={cn(
              "flex aspect-square h-full items-center justify-center rounded-xl border-[3px] border-ink text-[clamp(1.25rem,4.5vmin,2.5rem)] font-bold",
              c.found ? "bg-ink text-paper" : "border-dashed bg-paper"
            )}
          >
            {c.char}
          </span>
        ))}
      </div>

      <main className="grid min-h-0 flex-1 grid-cols-3 grid-rows-4 gap-[2vmin] landscape:grid-cols-4 landscape:grid-rows-3">
        {round.cells.map((cell) =>
          cell.found ? (
            <div key={cell.id} aria-hidden />
          ) : (
            <button
              key={cell.id}
              type="button"
              onClick={() => tap(cell)}
              aria-label={cell.char}
              className={cn(
                "letter-tile flex min-h-0 items-center justify-center rounded-2xl border-[3px] border-ink text-ink",
                TILE_BG[cell.tone]
              )}
            >
              <span
                className="letter-glyph font-bold"
                style={{ transform: `rotate(${cell.tilt}deg)` }}
              >
                {cell.char}
              </span>
            </button>
          )
        )}
      </main>
    </div>
  )
}
