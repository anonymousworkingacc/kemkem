import { LetterHunt, type Alphabet } from "@/components/kid/letter-hunt"
import type { GameMeta, GameProps } from "@/lib/game"
import { cn } from "@/lib/utils"
import voice from "./voice.json"

export const meta: GameMeta = {
  title: "Chữ cái tiếng Anh",
  icon: ({ className }) => (
    <span className={cn("leading-none font-bold", className)}>Aa</span>
  ),
  order: 10,
}

// English letter names, said by the Vietnamese voice ("ây", "bi", "xi"…).
const alphabet: Alphabet = {
  ...voice,
  lookalikes: {
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

export default function AlphabetHunt({ onExit }: GameProps) {
  return <LetterHunt alphabet={alphabet} onExit={onExit} />
}
