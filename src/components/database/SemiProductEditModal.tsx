import { useState, useEffect } from "react"
import { SemiProduct } from "@/types/db"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, Plus, X, MoveVertical } from "lucide-react"
import { SearchableSelect, SelectOption } from "@/components/ui/searchable-select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface RecipeItemState {
  id: string
  ing: string
  amount: number | string
  unit: "мл" | "л" | "г" | "кг" | "шт"
}

interface SemiProductEditModalProps {
  open: boolean
  onClose: () => void
  pfKey: string | null
  semiProduct: SemiProduct | null
  onSave: (key: string, updated: SemiProduct) => void
  onDelete: (key: string) => void
  availableIngredients: SelectOption[]
  ingredientInfo?: Record<string, { display_name?: string; unit?: string }>
}

export function SemiProductEditModal({
  open,
  onClose,
  pfKey,
  semiProduct,
  onSave,
  onDelete,
  availableIngredients,
  ingredientInfo = {},
}: SemiProductEditModalProps) {
  const [name, setName] = useState("")
  const [outputVolume, setOutputVolume] = useState<number | string>(1)
  const [outputUnit, setOutputUnit] = useState<string>("л")
  const [recipe, setRecipe] = useState<RecipeItemState[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)

  useEffect(() => {
    if (semiProduct && open) {
      setName(semiProduct.name || "")
      setOutputVolume(semiProduct.output_volume || 1)
      setOutputUnit(semiProduct.unit || "л")

      const parsedRecipe: RecipeItemState[] = Object.entries(semiProduct.recipe || {}).map(
        ([ing, val], idx) => {
          let unit: "мл" | "л" | "г" | "кг" | "шт" = "мл"
          let displayAmount = val
          const cleanKey = ing.replace(/^\(пф\)\s*/i, "")
          const infoUnit = ingredientInfo[ing]?.unit || ingredientInfo[cleanKey]?.unit

          if (infoUnit === "г" || infoUnit === "кг") {
            if (val < 1 && val > 0) {
              unit = "г"
              displayAmount = Math.round(val * 1000 * 100) / 100
            } else {
              unit = "кг"
              displayAmount = val
            }
          } else if (val < 1 && val > 0) {
            unit = "мл"
            displayAmount = Math.round(val * 1000 * 100) / 100
          } else {
            unit = "л"
            displayAmount = val
          }

          return {
            id: `pf_rec_${idx}_${Date.now()}`,
            ing,
            amount: displayAmount,
            unit,
          }
        }
      )
      setRecipe(parsedRecipe)
    }
  }, [semiProduct, open, ingredientInfo])

  if (!semiProduct || !pfKey) return null

  // ================= DRAG & DROP =================
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === targetIndex) return

    setRecipe((prev) => {
      const copy = [...prev]
      const [movedItem] = copy.splice(draggedIndex, 1)
      copy.splice(targetIndex, 0, movedItem)
      return copy
    })
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  // ================= RECIPE ACTIONS =================
  const handleRecipeIngChange = (index: number, newIng: string) => {
    const cleanKey = newIng.replace(/^\(пф\)\s*/i, "")
    const defaultUnit =
      (ingredientInfo[newIng]?.unit as "мл" | "л" | "г" | "кг" | "шт") ||
      (ingredientInfo[cleanKey]?.unit as "мл" | "л" | "г" | "кг" | "шт") ||
      "мл"

    setRecipe((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              ing: newIng,
              unit: defaultUnit === "кг" ? "г" : defaultUnit === "л" ? "мл" : defaultUnit,
            }
          : item
      )
    )
  }

  const handleRecipeAmountChange = (index: number, val: number | string) => {
    setRecipe((prev) => prev.map((item, i) => (i === index ? { ...item, amount: val } : item)))
  }

  const handleRecipeUnitChange = (index: number, newUnit: "мл" | "л" | "г" | "кг" | "шт") => {
    setRecipe((prev) => prev.map((item, i) => (i === index ? { ...item, unit: newUnit } : item)))
  }

  const handleRemoveRecipeItem = (index: number) => {
    setRecipe((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddRecipeItem = () => {
    const defaultIng = availableIngredients[0]?.key || ""
    setRecipe((prev) => [
      ...prev,
      {
        id: `rec_${Date.now()}_${Math.random()}`,
        ing: defaultIng,
        amount: 500,
        unit: "мл",
      },
    ])
  }

  // ================= SUBMIT =================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const recipeObj: Record<string, number> = {}
    recipe.forEach((r) => {
      if (!r.ing.trim()) return
      const parsed = parseFloat(String(r.amount).replace(",", ".")) || 0
      let finalAmount = parsed
      if (r.unit === "мл" || r.unit === "г") {
        finalAmount = Math.round((parsed / 1000) * 10000) / 10000
      }
      recipeObj[r.ing.trim()] = finalAmount
    })

    let finalName = name.trim()
    if (!finalName.startsWith("(ПФ)") && !finalName.startsWith("ПФ")) {
      finalName = `(ПФ) ${finalName}`
    }

    const parsedOutput = parseFloat(String(outputVolume).replace(",", ".")) || 1

    const updated: SemiProduct = {
      name: finalName,
      output_volume: parsedOutput,
      unit: outputUnit || "л",
      recipe: recipeObj,
    }

    onSave(pfKey, updated)
    onClose()
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} title="Редактирование полуфабриката" maxWidth="xl">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 max-h-[75vh] overflow-y-auto overflow-x-hidden pr-1"
        >
          {/* Верхняя плашка действий */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-xs font-montserrat uppercase tracking-wider text-text-secondary bg-surface-secondary/50 px-3 py-1 rounded-full font-medium">
              Полуфабрикат (ПФ)
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

          {/* Название и Выход */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Название ПФ *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 bg-bg-card border-2 border-border-sketch rounded px-3 font-cormorant italic text-lg text-text-primary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="w-full sm:w-44 shrink-0">
              <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
                Выход готового ПФ *
              </label>
              <div className="flex items-center gap-1.5 h-10">
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="0"
                  value={outputVolume}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setOutputVolume(e.target.value.replace(",", "."))}
                  className="w-24 h-full bg-bg-card border-2 border-border-sketch rounded px-2.5 font-montserrat text-sm text-right text-text-primary focus:outline-none focus:border-brand"
                />
                <select
                  value={outputUnit}
                  onChange={(e) => setOutputUnit(e.target.value)}
                  className="flex-1 h-full bg-bg-card border-2 border-border-sketch rounded px-2 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer text-center"
                >
                  <option value="л">л</option>
                  <option value="кг">кг</option>
                  <option value="г">г</option>
                  <option value="мл">мл</option>
                  <option value="шт">шт</option>
                </select>
              </div>
            </div>
          </div>

          {/* Состав полуфабриката */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="font-montserrat font-semibold uppercase tracking-[0.12em] text-[11px] text-text-primary">
                Ингредиенты рецепта ({recipe.length})
              </h4>
              <button
                type="button"
                onClick={handleAddRecipeItem}
                className="text-[11px] font-montserrat font-semibold uppercase tracking-wider text-brand hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Добавить
              </button>
            </div>

            <div className="space-y-1.5">
              {recipe.length === 0 ? (
                <p className="text-xs font-montserrat text-text-tertiary py-3 text-center bg-bg-app rounded border border-border">
                  Нет ингредиентов
                </p>
              ) : (
                recipe.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-2 bg-bg-app px-2.5 py-1.5 rounded border transition-all ${
                      draggedIndex === index
                        ? "opacity-40 border-dashed border-brand"
                        : "border-border hover:border-border-sketch"
                    }`}
                  >
                    <div
                      className="cursor-grab active:cursor-grabbing text-text-tertiary/60 hover:text-brand shrink-0"
                      title="Перетащите"
                    >
                      <MoveVertical className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        value={item.ing}
                        onChange={(val) => handleRecipeIngChange(index, val)}
                        options={availableIngredients}
                        placeholder="Ингредиент..."
                      />
                    </div>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={item.amount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleRecipeAmountChange(index, e.target.value.replace(",", "."))
                      }
                      className="w-14 shrink-0 bg-bg-card border border-border-sketch rounded px-1.5 py-1 font-montserrat text-xs text-right text-text-primary focus:outline-none focus:border-brand"
                    />

                    <select
                      value={item.unit}
                      onChange={(e) =>
                        handleRecipeUnitChange(
                          index,
                          e.target.value as "мл" | "л" | "г" | "кг" | "шт"
                        )
                      }
                      className="w-12 shrink-0 bg-bg-card border border-border-sketch rounded px-1 py-1 font-montserrat text-[11px] text-text-secondary focus:outline-none focus:border-brand cursor-pointer text-center"
                    >
                      <option value="мл">мл</option>
                      <option value="л">л</option>
                      <option value="г">г</option>
                      <option value="кг">кг</option>
                      <option value="шт">шт</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveRecipeItem(index)}
                      className="text-text-tertiary hover:text-brand transition-colors p-0.5 shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Кнопки сохранения */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Сохранить ПФ
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={() => {
          onDelete(pfKey)
          onClose()
        }}
        title="Удаление полуфабриката"
        description={`Удалить полуфабрикат «${semiProduct.name}» из базы?`}
        confirmText="Удалить"
      />
    </>
  )
}
