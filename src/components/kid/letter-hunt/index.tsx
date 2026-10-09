import { useEffect, useState } from "react"
import { HouseIcon, PlayIcon, Volume2Icon } from "lucide-react"

import { CELEBRATIONS } from "@/components/kid/celebration-art"
import { FeedbackBar, type Feedback } from "@/components/kid/feedback"
import { IconButton } from "@/components/kid/icon-button"
import { pick, type GameProps } from "@/lib/game"
import { play, preload, stop, type Clip } from "@/lib/sound"
import { cn } from "@/lib/utils"
import { buildBoard, drawTarget, type Cell } from "./logic"
import phrases from "./phrases.json"
import "./letter-hunt.css"

/** One game's letters, as stored in `src/features/<game>/voice.json`. */
export type Alphabet = {
  /** Folder under /public with this game's clips (scripts/gen-voice.py). */
  dir: string
  lang: Clip["lang"]
  /**
   * true: each prompt is recorded whole per letter (`prompt-<n>-<id>.mp3`).
   * false: the shared prompt is followed by `letter-<id>.mp3`.
   */
  fullPrompt?: boolean
  /** Lower-case letters; `say` is how the voice names the letter. */
  letters: { id: string; char: string; say: string }[]
  /** Letters easily mistaken for the key, kept off its board (both cases). */
  lookalikes: Record<string, string[]>
}

type Phrase = { id: string; text: string }

const vi = (p: Phrase): Clip => ({
  src: `/${phrases.dir}/${p.id}.mp3`,
  text: p.text,
  lang: "vi-VN",
})

// Prompt clips are fetched when played; only the shared reactions are
// preloaded so the first tap answers without delay.
const REACTION_CLIPS = [phrases.correct, phrases.wrong, phrases.complete]
  .flat()
  .map((p) => vi(p).src)

function setup(alphabet: Alphabet) {
  const byChar = new Map(alphabet.letters.map((l) => [l.char, l]))
  const promptClips = (prompt: Phrase, char: string): Clip[] => {
    const letter = byChar.get(char)!
    if (alphabet.fullPrompt) {
      return [
        {
          src: `/${alphabet.dir}/${prompt.id}-${letter.id}.mp3`,
          text: `${prompt.text} ${letter.say}`,
          lang: alphabet.lang,
        },
      ]
    }
    return [
      vi(prompt),
      {
        src: `/${alphabet.dir}/letter-${letter.id}.mp3`,
        text: letter.say,
        lang: alphabet.lang,
      },
    ]
  }
  return { letters: alphabet.letters.map((l) => l.char), promptClips }
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

const promptText = (round: Round) =>
  `${round.prompt.text} ${round.target.toUpperCase()}`

/**
 * "Find the letter" game, shared by every alphabet: a board of tilted letter
 * tiles, a spoken prompt, ✓/✗ feedback with the spoken sentence, and a
 * celebration when all copies (upper and lower case) are found.
 */
export function LetterHunt({
  alphabet,
  onExit,
}: GameProps & { alphabet: Alphabet }) {
  const [game] = useState(() => setup(alphabet))
  const { promptClips } = game
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
    preload(REACTION_CLIPS)
    return stop
  }, [])

  // Ask for the letter at the start of every round (targets never repeat
  // back to back, so this runs once per round, not on every tap).
  const { prompt, target } = round
  useEffect(() => {
    play(...promptClips(prompt, target))
  }, [prompt, target, promptClips])

  const repeatPrompt = () => {
    setFeedback({ kind: "prompt", text: promptText(round) })
    play(...promptClips(round.prompt, round.target))
  }

  const tap = (cell: Cell) => {
    if (cell.found) return
    if (!cell.target) {
      const phrase = pick(phrases.wrong)
      setFeedback({ kind: "wrong", text: phrase.text })
      play(vi(phrase))
      return
    }
    const cells = round.cells.map((c) =>
      c.id === cell.id ? { ...c, found: true } : c
    )
    setRound({ ...round, cells })
    if (cells.every((c) => !c.target || c.found)) {
      const phrase = pick(phrases.complete)
      setWin({ Art: pick(CELEBRATIONS), phrase })
      play(vi(phrase))
    } else {
      const phrase = pick(phrases.correct)
      setFeedback({ kind: "correct", text: phrase.text })
      play(vi(phrase))
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
          Chơi tiếp
        </button>
      </div>
    )
  }

  const targets = round.cells.filter((c) => c.target)

  return (
    <div className="flex h-full flex-col gap-[2vmin] p-[2vmin]">
      <header className="flex h-[clamp(3.5rem,11vmin,6rem)] shrink-0 items-stretch gap-[2vmin]">
        <IconButton icon={HouseIcon} label="Về trang chủ" onClick={onExit} />
        <FeedbackBar feedback={feedback} />
        <IconButton
          icon={Volume2Icon}
          label="Nghe lại"
          onClick={repeatPrompt}
          className="bg-accent text-accent-ink"
        />
      </header>

      <div
        aria-label="Các chữ cần tìm"
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
