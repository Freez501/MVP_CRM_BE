import { useState, useEffect } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Wine } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface GlasswareItem {
  key: string
  name: string
  usageCount: number
}

interface GlasswareEditModalProps {
  open: boolean
  onClose: () => void
  glassware: GlasswareItem | null
  onSave: (key: string, updates: { name: string }) => void
  onDelete: (key: string) => void
}

export function GlasswareEditModal({
  open,
  onClose,
  glassware,
  onSave,
  onDelete,
}: GlasswareEditModalProps) {
  const [name, setName] = useState("")
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (glassware && open) {
      setName(glassware.name || "")
    }
  }, [glassware, open])

  if (!glassware) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave(glassware.key, { name: name.trim() })
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Редактирование посуды" maxWidth="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Верхняя плашка */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="flex items-center gap-1.5 text-xs font-montserrat uppercase tracking-wider text-text-secondary bg-surface-secondary/50 px-3 py-1 rounded-full font-medium">
              <Wine className="w-3.5 h-3.5 text-brand" />
              Бокал / Посуда
            </span>

            <button
              type="button"
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="flex items-center gap-1 text-xs text-text-tertiary hover:text-brand transition-colors font-montserrat uppercase tracking-wider"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Удалить
            </button>
          </div>

          {/* Название */}
          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
              Название бокала / посуды *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Бокал Рокс тонкий"
              className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-cormorant italic text-lg text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          {glassware.usageCount > 0 && (
            <p className="text-xs font-montserrat text-text-tertiary bg-bg-app px-3 py-2 rounded border border-border">
              Используется в <span className="font-semibold text-text-primary">{glassware.usageCount}</span> коктейлях базы.
            </p>
          )}

          {/* Кнопки */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Сохранить
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDelete(glassware.key)
          onClose()
        }}
        title="Удаление посуды"
        description={`Удалить бокал «${glassware.name}» из базы?`}
        confirmText="Удалить"
      />
    </>
  )
}
