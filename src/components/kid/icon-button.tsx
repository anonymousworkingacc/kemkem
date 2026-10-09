import type { ComponentProps } from "react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  icon: LucideIcon
  /** Spoken by screen readers; children can't read it anyway. */
  label: string
}

/** Square, thick-bordered touch target sized for small fingers on e-ink. */
export function IconButton({
  icon: Icon,
  label,
  className,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex size-[clamp(3.5rem,11vmin,6rem)] shrink-0 items-center justify-center rounded-2xl border-[3px] border-ink bg-paper text-ink active:bg-ink active:text-paper",
        className
      )}
      {...props}
    >
      <Icon className="size-3/5" strokeWidth={2.5} />
    </button>
  )
}
