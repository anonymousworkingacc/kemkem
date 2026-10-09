import { LetterHunt, type Alphabet } from "@/components/kid/letter-hunt"
import type { GameMeta, GameProps } from "@/lib/game"
import { cn } from "@/lib/utils"
import voice from "./voice.json"

export const meta: GameMeta = {
  title: "Chữ cái tiếng Việt",
  icon: ({ className }) => (
    <span className={cn("leading-none font-bold", className)}>Ăê</span>
  ),
  order: 20,
}

// The 29 letters of the Vietnamese alphabet, named as taught in preschool
// ("a", "á", "ớ", "bờ", "cờ"…). Letters that differ only by a diacritic
// (a/ă/â, o/ô/ơ…) never share a board with each other, nor b/d/đ/p/q.
const alphabet: Alphabet = {
  ...voice,
  lang: "vi-VN",
  lookalikes: {
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
}

export default function VietnameseHunt({ onExit }: GameProps) {
  return <LetterHunt alphabet={alphabet} onExit={onExit} />
}
