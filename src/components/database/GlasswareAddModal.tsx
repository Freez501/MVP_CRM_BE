import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Wine } from "lucide-react"

interface GlasswareAddModalProps {
  open: boolean
  onClose: () => void
  onAdd: (name: string) => void
}

export function GlasswareAddModal({ open, onClose, onAdd }: GlasswareAddModalProps) {
  const [name, setName] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd(name.trim())
    setName("")
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Новый бокал / посуда" maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Верхняя плашка */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="flex items-center gap-1.5 text-xs font-montserrat uppercase tracking-wider text-text-secondary bg-surface-secondary/50 px-3 py-1 rounded-full font-medium">
            <Wine className="w-3.5 h-3.5 text-brand" />
            Бокал / Посуда
          </span>
        </div>

        {/* Название */}
        <div>
          <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
            Название бокала *
          </label>
          <input
            type="text"
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например: Бокал Флюте"
            className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-cormorant italic text-lg text-text-primary focus:outline-none focus:border-brand"
          />
        </div>

        {/* Кнопки */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Добавить бокал
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
