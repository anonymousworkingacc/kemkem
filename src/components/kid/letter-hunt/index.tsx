import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  CheckIcon,
  HouseIcon,
  PlayIcon,
  SettingsIcon,
  Volume2Icon,
} from "lucide-react"

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
  /**
   * What the symbols are called: "chữ"/"số" or "letter"/"number". Empty for
   * picture games, where the name says it all ("xe cứu thương").
   */
  noun: string
  /** Lower-case letters; `say` is how the voice names the letter. */
  letters: { id: string; char: string; say: string }[]
  /**
   * Picture games: drawings keyed by `char`, shown instead of the glyph.
   * Pictures have no upper/lower case and are named by `say` on screen.
   */
  pictures?: Record<string, () => ReactNode>
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
  const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1)
  const join = (...parts: string[]) => parts.filter(Boolean).join(" ")
  const pictures = alphabet.pictures
  /** "chữ B" / "xe cứu thương", as written in the prompt. */
  const nameOf = (char: string) =>
    pictures ? byChar.get(char)!.say : join(alphabet.noun, char.toUpperCase())
  /** "Chữ b." / "Xe cứu thương.", as written after a tap. */
  const tappedName = (glyph: string) =>
    capitalize(pictures ? byChar.get(glyph)!.say : join(alphabet.noun, glyph))
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
      join(prompt.text, alphabet.noun, letter.say)
    )
  }
  /** "Chữ bờ" / "Letter B", said for the tile just tapped (either case). */
  const letterClip = (glyph: string) => {
    const letter = byChar.get(glyph.toLowerCase())!
    return clip(
      alphabet.dir,
      `letter-${letter.id}`,
      capitalize(join(alphabet.noun, letter.say))
    )
  }
  return {
    phrases,
    letters: alphabet.letters.map((l) => l.char),
    pictures,
    nameOf,
    tappedName,
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

/** Draws a picture by id; a component so React keeps one per tile. */
function Picture({
  pictures,
  id,
}: {
  pictures: Record<string, () => ReactNode>
  id: string
}) {
  const Draw = pictures[id]
  return <Draw />
}

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
  const { phrases, phraseClip, promptClip, letterClip, pictures } = game
  const promptText = (round: Round) =>
    `${round.prompt.text} ${game.nameOf(round.target)}`
  const newRound = (bag: string[], last: string | null): Round => {
    const next = drawTarget(game.letters, bag, last)
    return {
      ...next,
      prompt: pick(phrases.prompt),
      cells: buildBoard(
        next.target,
        game.letters,
        alphabet.lookalikes,
        !pictures
      ),
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
      setFeedback({
        kind,
        text: `${game.tappedName(cell.char)}. ${phrase.text}`,
      })
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
        aria-label={`Các ${alphabet.noun || "hình"} cần tìm`}
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
            {!pictures ? (
              c.char
            ) : c.found ? (
              // Drawings are ink-outlined: a found one turns into a ✓.
              <CheckIcon className="size-[70%]" strokeWidth={4} />
            ) : (
              <span className="size-[90%]">
                <Picture pictures={pictures} id={c.char} />
              </span>
            )}
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
              aria-label={pictures ? game.nameOf(cell.char) : cell.char}
              className={cn(
                "letter-tile flex min-h-0 items-center justify-center rounded-2xl border-[3px] border-ink text-ink",
                TILE_BG[cell.tone]
              )}
            >
              {pictures ? (
                <span
                  className="letter-picture"
                  style={{ transform: `rotate(${cell.tilt / 2}deg)` }}
                >
                  <Picture pictures={pictures} id={cell.char} />
                </span>
              ) : (
                <span
                  className="letter-glyph font-bold"
                  style={{ transform: `rotate(${cell.tilt}deg)` }}
                >
                  {cell.char}
                </span>
              )}
            </button>
          )
        )}
      </main>
    </div>
  )
}
