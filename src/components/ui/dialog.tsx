import { ReactNode, useEffect } from "react"
import { X } from "lucide-react"

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  maxWidth?: "md" | "lg" | "xl" | "2xl"
  children: ReactNode
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  maxWidth = "xl",
  children,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  const widthClasses = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="fixed inset-0 bg-[#141414]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${widthClasses} bg-bg-card border-2 border-border-sketch rounded-xl shadow-2xl p-5 sm:p-6 z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden`}
      >
        <div className="flex items-start justify-between pb-3 border-b border-border/70 mb-4">
          <div>
            <h2 className="font-cormorant italic text-2xl sm:text-3xl text-text-primary leading-tight">
              {title}
            </h2>
            {description && (
              <p className="font-montserrat text-xs text-text-secondary mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary p-1 rounded-full hover:bg-surface-secondary/30 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}
