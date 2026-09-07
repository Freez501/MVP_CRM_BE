import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "w-full bg-bg-card border-2 border-border-sketch rounded px-4 py-2.5 font-montserrat text-[15px] text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-[#a69c92] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
