import { forwardRef, ButtonHTMLAttributes } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center font-montserrat font-semibold uppercase tracking-wider text-[13px] px-6 py-2.5 rounded-md transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-accent-primary text-text-primary shadow-sm hover:bg-[#e5e570] hover:shadow-md",
        secondary:
          "bg-transparent border-[1.5px] border-brand text-brand hover:bg-brand hover:text-text-inverse",
        ghost:
          "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/30 font-light tracking-[0.15em] text-xs px-4 py-3",
      },
      size: {
        default: "",
        sm: "px-4 py-2 text-xs",
        lg: "px-8 py-3 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
