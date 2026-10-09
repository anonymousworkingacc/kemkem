import type { ComponentType } from "react"

/**
 * Contract for a game in `src/features/<name>/index.tsx`, discovered by App:
 *   export const meta: GameMeta
 *   export default function MyGame({ onExit }: GameProps) { … }
 * The game owns the whole screen while it is open.
 */
export type GameMeta = {
  title: string
  /** Large glyph shown on the home screen card (kids cannot read yet). */
  icon: ComponentType<{ className?: string }>
  order?: number
}

export type GameProps = { onExit: () => void }

export function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

export function shuffle<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
