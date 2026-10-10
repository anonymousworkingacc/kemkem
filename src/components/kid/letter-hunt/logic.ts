import { pick, shuffle } from "@/lib/game"

export const BOARD_SIZE = 12

export type Cell = {
  id: number
  /** The glyph shown, upper or lower case (or a picture id). */
  char: string
  target: boolean
  found: boolean
  /** Rotation in degrees; every cell on a board gets a different one. */
  tilt: number
  /** Index into the tile palette (only visible in the colour theme). */
  tone: number
}

const TILTS = [-14, -11, -8, -5, -3, 3, 5, 8, 11, 14, -12, 12]

/**
 * Draws the next target letter from a bag, so every letter comes up before
 * any repeats, and never the letter that was just played.
 */
export function drawTarget(
  letters: readonly string[],
  bag: readonly string[],
  last: string | null
) {
  const pool = bag.length > 0 ? bag : letters
  const target = pick(pool.filter((c) => c !== last))
  return { target, bag: pool.filter((c) => c !== target) }
}

/**
 * `letters` are lower case (or digits / picture ids, which have no case:
 * pass `cased = false` for those). `lookalikes` maps
 * a target to symbols a 2–5 year old easily mistakes for it (b/d, o/ô, 6/9…).
 * Both cases of those are kept off the board so a "wrong" tap is fair.
 */
export function buildBoard(
  target: string,
  letters: readonly string[],
  lookalikes: Readonly<Record<string, readonly string[]>>,
  cased = true
): Cell[] {
  const upper = cased ? target.toUpperCase() : target
  const count = 3 + Math.floor(Math.random() * 2) // 3 or 4 targets
  const targets = [upper, target]
  while (targets.length < count) {
    targets.push(Math.random() < 0.5 ? upper : target)
  }

  const banned = new Set([target, ...(lookalikes[target] ?? [])])
  const glyphs = shuffle([
    ...new Set(
      letters
        .filter((c) => !banned.has(c))
        .flatMap((c) => (cased ? [c, c.toUpperCase()] : [c]))
    ),
  ])
  // Small sets (numbers 1–10) repeat distractors to fill the board; large
  // ones show each distractor once.
  const distractors = Array.from(
    { length: BOARD_SIZE - count },
    (_, i) => glyphs[i % glyphs.length]
  )

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
