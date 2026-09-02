import { useState, useEffect } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { IngredientData } from "@/context/DatabaseContext"

interface IngredientEditModalProps {
  open: boolean
  onClose: () => void
  ingredient: IngredientData | null
  categories: Record<string, string>
  onSave: (key: string, updates: Partial<IngredientData>) => void
  onDelete: (key: string) => void
}

export function IngredientEditModal({
  open,
  onClose,
  ingredient,
  categories,
  onSave,
  onDelete,
}: IngredientEditModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("алкоголь")
  const [unit, setUnit] = useState("л")
  const [price, setPrice] = useState<number | string>(0)
  const [bottle, setBottle] = useState<number | string>("")
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (ingredient && open) {
      setName(ingredient.name || "")
      setCategory(ingredient.category || Object.keys(categories)[0] || "алкоголь")
      setUnit(ingredient.unit || "л")
      setPrice(ingredient.price || 0)
      setBottle(ingredient.bottle !== undefined && ingredient.bottle !== null ? ingredient.bottle : "")
    }
  }, [ingredient, open, categories])

  if (!ingredient) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(ingredient.key, {
      name: name.trim() || ingredient.name,
      category,
      unit,
      price: parseFloat(String(price).replace(",", ".")) || 0,
      bottle: bottle === "" ? 0 : parseFloat(String(bottle).replace(",", ".")) || 0,
    })
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Редактирование ингредиента" maxWidth="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Верхняя строка действий */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-montserrat uppercase tracking-wider text-text-secondary bg-surface-secondary/50 px-3 py-1 rounded-full font-medium">
              Ингредиент базы
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

          {/* Название и Категория */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Название ингредиента *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-cormorant italic text-lg text-text-primary focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Категория *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                {Object.entries(categories).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Единица, Цена и Объём бутылки */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border">
            <div>
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Единица измерения *
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-2 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer text-center"
              >
                <option value="л">л (литры)</option>
                <option value="мл">мл (миллилитры)</option>
                <option value="г">г (граммы)</option>
                <option value="кг">кг (килограммы)</option>
                <option value="шт">шт (штуки)</option>
              </select>
            </div>

            <div>
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Цена за единицу (₽) *
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0"
                value={price}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPrice(e.target.value.replace(",", "."))}
                className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-montserrat text-sm text-right text-text-primary focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Объём бутылки / тары
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Напр. 0.7 или 1"
                value={bottle}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setBottle(e.target.value.replace(",", "."))}
                className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-montserrat text-sm text-right text-text-primary focus:outline-none focus:border-brand"
              />
            </div>
          </div>

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
          onDelete(ingredient.key)
          onClose()
        }}
        title="Удаление ингредиента"
        description={`Удалить ингредиент «${ingredient.name}» из базы?`}
        confirmText="Удалить"
      />
    </>
  )
}
