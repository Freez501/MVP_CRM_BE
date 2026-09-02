import { useState } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IngredientData } from "@/context/DatabaseContext"

interface IngredientAddModalProps {
  open: boolean
  onClose: () => void
  categories: Record<string, string>
  onAdd: (data: IngredientData) => void
}

export function IngredientAddModal({
  open,
  onClose,
  categories,
  onAdd,
}: IngredientAddModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState("алкоголь")
  const [unit, setUnit] = useState("л")
  const [price, setPrice] = useState<number | string>(1000)
  const [bottle, setBottle] = useState<number | string>(0.7)

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat)
    if (["алкоголь", "безалкогольное", "сироп", "пюре", "концентрат"].includes(newCat)) {
      setUnit("л")
    } else if (["посуда", "украшение_шт"].includes(newCat)) {
      setUnit("шт")
    } else if (["фрукты", "травы", "сыпучка", "сухой_гр"].includes(newCat)) {
      setUnit("г")
    } else if (["лёд_кубик", "лёд_фигурный"].includes(newCat)) {
      setUnit("кг")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const key = name.trim().toLowerCase().replace(/\s+/g, "_")
    onAdd({
      key,
      name: name.trim(),
      category: category || "алкоголь",
      unit: unit || "л",
      price: parseFloat(String(price).replace(",", ".")) || 0,
      bottle: bottle === "" ? 0 : parseFloat(String(bottle).replace(",", ".")) || 0,
    })

    setName("")
    setPrice(1000)
    setBottle(0.7)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Новый ингредиент" maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Название и Категория */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
              Название ингредиента *
            </label>
            <input
              type="text"
              required
              placeholder="Например: Ром Бакарди"
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
              onChange={(e) => handleCategoryChange(e.target.value)}
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
            Создать ингредиент
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
