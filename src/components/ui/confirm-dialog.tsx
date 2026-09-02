import { useEffect } from "react"
import { Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  description: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Подтверждение действия",
  description,
  confirmText = "Удалить",
  cancelText = "Отмена",
  danger = true,
}: ConfirmDialogProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
      {/* Затемняющий оверлей */}
      <div
        className="fixed inset-0 bg-[#141414]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Окно по центру */}
      <div className="relative w-full max-w-sm bg-bg-card border-2 border-border-sketch rounded-xl shadow-2xl p-5 sm:p-6 z-10 animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary p-1 rounded-full hover:bg-surface-secondary/30 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-accent-primary/50 flex items-center justify-center text-brand shrink-0">
            <Trash2 className="w-4 h-4" />
          </div>
          <h3 className="font-cormorant italic text-2xl text-text-primary leading-tight">
            {title}
          </h3>
        </div>

        <p className="font-montserrat text-xs sm:text-sm text-text-secondary mb-6 leading-relaxed">
          {description}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className={danger ? "bg-accent-primary text-text-primary font-semibold" : ""}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
