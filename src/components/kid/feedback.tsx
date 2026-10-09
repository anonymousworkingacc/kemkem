import { CheckIcon, Volume2Icon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export type Feedback = { kind: "prompt" | "correct" | "wrong"; text: string }

const ICONS = { prompt: Volume2Icon, correct: CheckIcon, wrong: XIcon }

/**
 * Notification strip: a ✓ / ✗ badge plus the exact sentence the voice says,
 * so the game still works on readers that cannot play sound. Fixed height so
 * the board below never shifts.
 */
export function FeedbackBar({ feedback }: { feedback: Feedback }) {
  const Icon = ICONS[feedback.kind]
  return (
    <div
      role="status"
      className="flex min-w-0 flex-1 items-center gap-[2vmin] rounded-2xl border-[3px] border-ink bg-paper px-[2vmin]"
    >
      <span
        className={cn(
          "flex size-[clamp(2.5rem,8vmin,4.5rem)] shrink-0 items-center justify-center rounded-full border-[3px] border-ink",
          feedback.kind === "correct" && "bg-ok",
          feedback.kind === "wrong" && "bg-no",
          feedback.kind === "prompt" && "bg-paper"
        )}
      >
        <Icon
          className="size-3/4"
          strokeWidth={feedback.kind === "prompt" ? 2.5 : 4}
        />
      </span>
      <p className="line-clamp-2 text-[clamp(1rem,3.6vmin,2rem)] leading-tight font-bold">
        {feedback.text}
      </p>
    </div>
  )
}
