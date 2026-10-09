import { pick, shuffle } from "@/lib/game"

export const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("")

export const BOARD_SIZE = 12

export type Cell = {
  id: number
  /** The glyph shown, upper or lower case. */
  char: string
  target: boolean
  found: boolean
  /** Rotation in degrees; every cell on a board gets a different one. */
  tilt: number
  /** Index into the tile palette (only visible in the colour theme). */
  tone: number
}

// Glyphs that a 2–5 year old easily mistakes for the target, keyed by the
// target letter. They are kept off the board so a "wrong" tap is fair.
const LOOKALIKES: Record<string, string[]> = {
  b: ["d", "p", "q"],
  d: ["b", "p", "q"],
  p: ["b", "d", "q"],
  q: ["b", "d", "p", "g"],
  g: ["q"],
  m: ["w", "W"],
  w: ["m", "M"],
  n: ["u"],
  u: ["n"],
  i: ["l", "j"],
  l: ["I", "i"],
  j: ["i"],
}

const TILTS = [-14, -11, -8, -5, -3, 3, 5, 8, 11, 14, -12, 12]

/**
 * Draws the next target letter from a bag, so all 26 letters come up before
 * any repeats, and never the letter that was just played.
 */
export function drawTarget(bag: readonly string[], last: string | null) {
  const pool = bag.length > 0 ? bag : LETTERS
  const target = pick(pool.filter((c) => c !== last))
  return { target, bag: pool.filter((c) => c !== target) }
}

export function buildBoard(target: string): Cell[] {
  const upper = target.toUpperCase()
  const count = 3 + Math.floor(Math.random() * 2) // 3 or 4 targets
  const targets = [upper, target]
  while (targets.length < count) {
    targets.push(Math.random() < 0.5 ? upper : target)
  }

  const banned = new Set([target, upper, ...(LOOKALIKES[target] ?? [])])
  const distractors = shuffle(
    LETTERS.flatMap((c) => [c, c.toUpperCase()]).filter((c) => !banned.has(c))
  ).slice(0, BOARD_SIZE - count)

  const tilts = shuffle(TILTS)
  const tones = shuffle([0, 1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5])
  return shuffle([
    ...targets.map((char) => ({ char, target: true })),
    ...distractors.map((char) => ({ char, target: false })),
  ]).map((cell, id) => ({
    ...cell,
    id,
    found: false,
    tilt: tilts[id],
    tone: tones[id],
  }))
}
