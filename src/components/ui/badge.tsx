import { HTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 font-montserrat font-medium uppercase text-[11px] tracking-wide",
  {
    variants: {
      variant: {
        new: "bg-accent-primary text-text-primary",
        active: "bg-accent-secondary text-text-primary",
        qualified: "bg-accent-secondary text-text-primary",
        closed: "bg-text-tertiary text-text-inverse",
        won: "bg-text-tertiary text-text-inverse",
        lost: "bg-border text-text-secondary",
      },
    },
    defaultVariants: {
      variant: "new",
    },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
