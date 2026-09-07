import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Tag } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface CategoriesManageModalProps {
  open: boolean
  onClose: () => void
  categories: Record<string, string>
  onAddCategory: (key: string, name: string) => void
  onRemoveCategory: (key: string) => void
}

export function CategoriesManageModal({
  open,
  onClose,
  categories,
  onAddCategory,
  onRemoveCategory,
}: CategoriesManageModalProps) {
  const [newName, setNewName] = useState("")
  const [deletingCategory, setDeletingCategory] = useState<{ key: string; label: string } | null>(
    null
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    const key = newName.trim().toLowerCase().replace(/\s+/g, "_")
    onAddCategory(key, newName.trim())
    setNewName("")
  }

  const categoryEntries = Object.entries(categories)

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Управление категориями" maxWidth="md">
        <div className="space-y-4">
          {/* Форма добавления новой категории */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Название новой категории..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1 h-9 bg-bg-card border-2 border-border-sketch rounded px-3 font-montserrat text-xs text-text-primary focus:outline-none focus:border-brand"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-9 shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Добавить
            </Button>
          </form>

          {/* Список существующих категорий */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {categoryEntries.length === 0 ? (
              <p className="text-xs font-montserrat text-text-tertiary text-center py-4">
                Категорий нет
              </p>
            ) : (
              categoryEntries.map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-brand shrink-0" />
                    <span className="font-montserrat text-xs font-medium text-text-primary">
                      {label}
                    </span>
                    <span className="font-montserrat text-[10px] text-text-tertiary">({key})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingCategory({ key, label })}
                    className="text-text-tertiary hover:text-brand p-1 transition-colors"
                    title="Удалить категорию"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Красивый диалог подтверждения удаления */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={() => {
          if (deletingCategory) {
            onRemoveCategory(deletingCategory.key)
          }
        }}
        title="Удаление категории"
        description={`Вы уверены, что хотите удалить категорию «${deletingCategory?.label}»?`}
        confirmText="Удалить"
      />
    </>
  )
}
