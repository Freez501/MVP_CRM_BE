import { useState, useEffect } from "react"
import { Cocktail } from "@/types/db"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, X, MoveVertical } from "lucide-react"
import { SearchableSelect, SelectOption } from "@/components/ui/searchable-select"

interface RecipeItemState {
  id: string
  ing: string
  amount: number | string
  unit: "мл" | "л" | "г" | "кг" | "шт"
}

interface DecItemState {
  id: string
  key: string
  amount: number | string
  unit: string
}

interface IceItemState {
  id: string
  key: string
  amount: number | string
  unit: "кг" | "шт"
}

interface CocktailAddModalProps {
  open: boolean
  onClose: () => void
  onAdd: (key: string, cocktail: Cocktail) => void
  categories: string[]
  availableIngredients: SelectOption[]
  availableDecorations: SelectOption[]
  availableGlassware: SelectOption[]
  availableIce: SelectOption[]
  ingredientInfo?: Record<string, { display_name?: string; unit?: string }>
  initialData?: (Partial<Cocktail> & { name?: string }) | null
}

export function CocktailAddModal({
  open,
  onClose,
  onAdd,
  categories,
  availableIngredients,
  availableDecorations,
  availableGlassware,
  availableIce,
  ingredientInfo = {},
  initialData = null,
}: CocktailAddModalProps) {
  const [name, setName] = useState("")
  const [category, setCategory] = useState(categories[0] || "классические")
  const [recipe, setRecipe] = useState<RecipeItemState[]>([
    {
      id: "rec_init_1",
      ing: availableIngredients[0]?.key || "джин",
      amount: 50,
      unit: "мл",
    },
  ])
  const [decorations, setDecorations] = useState<DecItemState[]>([])
  const [iceList, setIceList] = useState<IceItemState[]>([])
  const [selectedGlass, setSelectedGlass] = useState<string>("none")
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setName(initialData.name || "")
      setCategory(initialData.category || categories[0] || "классические")

      const recItems: RecipeItemState[] = Object.entries(initialData.recipe || {}).map(
        ([ing, amount], idx) => {
          const info = ingredientInfo[ing] || {}
          const unit = info.unit || "мл"
          let displayAmount = amount
          let displayUnit: "мл" | "л" | "г" | "кг" | "шт" = "мл"

          if (unit === "г" || unit === "кг") {
            displayAmount = amount < 1 ? Math.round(amount * 1000) : amount
            displayUnit = "г"
          } else if (unit === "шт") {
            displayAmount = amount
            displayUnit = "шт"
          } else {
            displayAmount = amount < 1 ? Math.round(amount * 1000) : amount
            displayUnit = amount < 1 ? "мл" : "л"
          }

          return {
            id: `rec_init_${idx}_${Date.now()}`,
            ing,
            amount: displayAmount,
            unit: displayUnit,
          }
        }
      )
      setRecipe(
        recItems.length > 0
          ? recItems
          : [
              {
                id: "rec_init_1",
                ing: availableIngredients[0]?.key || "джин",
                amount: 50,
                unit: "мл",
              },
            ]
      )

      const decItems: DecItemState[] = []
      const iceItems: IceItemState[] = []
      Object.entries(initialData.decorations || {}).forEach(([key, amount], idx) => {
        const k = key.toLowerCase()
        if (
          k.includes("лед") ||
          k.includes("лёд") ||
          k.includes("кубик") ||
          k.includes("фрапе") ||
          k.includes("фраппе") ||
          k.includes("глыба") ||
          k.includes("шар") ||
          k.includes("стик")
        ) {
          const isFig = k.includes("шар") || k.includes("стик") || k.includes("фигур")
          iceItems.push({
            id: `ice_init_${idx}_${Date.now()}`,
            key,
            amount,
            unit: isFig ? "шт" : "кг",
          })
        } else {
          decItems.push({
            id: `dec_init_${idx}_${Date.now()}`,
            key,
            amount,
            unit: ingredientInfo[key]?.unit || "шт",
          })
        }
      })
      setDecorations(decItems)
      setIceList(iceItems)

      const glassKeys = Object.keys(initialData.glassware || {})
      setSelectedGlass(glassKeys.length > 0 ? glassKeys[0] : "none")
    } else {
      setName("")
      setCategory(categories[0] || "классические")
      setRecipe([
        {
          id: "rec_init_1",
          ing: availableIngredients[0]?.key || "джин",
          amount: 50,
          unit: "мл",
        },
      ])
      setDecorations([])
      setIceList([])
      setSelectedGlass("none")
    }
  }, [open, initialData])

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
    const defaultUnit = (ingredientInfo[newIng]?.unit as "мл" | "л" | "г" | "кг" | "шт") || "мл"
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
    setRecipe((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount: val } : item))
    )
  }

  const handleRecipeUnitChange = (
    index: number,
    newUnit: "мл" | "л" | "г" | "кг" | "шт"
  ) => {
    setRecipe((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unit: newUnit } : item))
    )
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
        amount: 50,
        unit: "мл",
      },
    ])
  }

  // ================= DECORATIONS =================
  const handleDecKeyChange = (index: number, val: string) => {
    const dbUnit = ingredientInfo[val]?.unit || "шт"
    setDecorations((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              key: val,
              unit: dbUnit,
            }
          : item
      )
    )
  }

  const handleDecAmountChange = (index: number, val: number | string) => {
    setDecorations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount: val } : item))
    )
  }

  const handleDecUnitChange = (index: number, val: string) => {
    setDecorations((prev) =>
      prev.map((item, i) => (i === index ? { ...item, unit: val } : item))
    )
  }

  const handleRemoveDecItem = (index: number) => {
    setDecorations((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddDecItem = () => {
    const defaultDec = availableDecorations[0]?.key || "мята"
    const dbUnit = ingredientInfo[defaultDec]?.unit || "шт"
    setDecorations((prev) => [
      ...prev,
      {
        id: `dec_${Date.now()}_${Math.random()}`,
        key: defaultDec,
        amount: dbUnit === "г" ? 15 : 1,
        unit: dbUnit,
      },
    ])
  }

  // ================= ICE =================
  const handleIceKeyChange = (index: number, val: string) => {
    setIceList((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const isFigured =
            val.includes("шар") || val.includes("стик") || val.includes("фигурный")
          return {
            ...item,
            key: val,
            unit: isFigured ? "шт" : "кг",
            amount: isFigured ? 1 : 0.2,
          }
        }
        return item
      })
    )
  }

  const handleIceAmountChange = (index: number, val: number | string) => {
    setIceList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, amount: val } : item))
    )
  }

  const handleRemoveIceItem = (index: number) => {
    setIceList((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddIceItem = () => {
    const defaultIce = availableIce[0]?.key || "лед кубик"
    const isFigured =
      defaultIce.includes("шар") || defaultIce.includes("стик") || defaultIce.includes("фигурный")
    setIceList((prev) => [
      ...prev,
      {
        id: `ice_${Date.now()}_${Math.random()}`,
        key: defaultIce,
        amount: isFigured ? 1 : 0.2,
        unit: isFigured ? "шт" : "кг",
      },
    ])
  }

  // ================= SUBMIT =================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const key = name.trim().toLowerCase().replace(/\s+/g, "_")
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

    const decObj: Record<string, number> = {}
    decorations.forEach((d) => {
      if (!d.key.trim()) return
      const parsed = parseFloat(String(d.amount).replace(",", ".")) || 0
      decObj[d.key.trim()] = parsed
    })

    iceList.forEach((ice) => {
      if (!ice.key.trim()) return
      const parsed = parseFloat(String(ice.amount).replace(",", ".")) || 0
      decObj[ice.key.trim()] = parsed
    })

    const glassObj: Record<string, number> = {}
    if (selectedGlass && selectedGlass !== "none") {
      glassObj[selectedGlass] = 1
    }

    const newCocktail: Cocktail = {
      name: name.trim(),
      category: category || "классические",
      recipe: recipeObj,
      decorations: decObj,
      glassware: glassObj,
    }

    onAdd(key, newCocktail)
    setName("")
    setRecipe([
      {
        id: "rec_init_1",
        ing: availableIngredients[0]?.key || "джин",
        amount: 50,
        unit: "мл",
      },
    ])
    setDecorations([])
    setIceList([])
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Новый коктейль">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
              Название коктейля *
            </label>
            <input
              type="text"
              required
              placeholder="Например: Негрони Спешл"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-1.5 font-cormorant italic text-lg text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-[11px] text-text-tertiary mb-1">
              Категория *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 1. Ингредиенты */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-montserrat font-semibold uppercase tracking-[0.12em] text-[11px] text-text-primary">
              Ингредиенты ({recipe.length})
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
            {recipe.map((item, index) => (
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
                  className="cursor-grab active:cursor-grabbing text-text-tertiary/60 hover:text-brand"
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
                  className="w-14 bg-bg-card border border-border-sketch rounded px-1.5 py-1 font-montserrat text-xs text-right text-text-primary focus:outline-none focus:border-brand"
                />

                <select
                  value={item.unit}
                  onChange={(e) =>
                    handleRecipeUnitChange(
                      index,
                      e.target.value as "мл" | "л" | "г" | "кг" | "шт"
                    )
                  }
                  className="w-12 bg-bg-card border border-border-sketch rounded px-1 py-1 font-montserrat text-[11px] text-text-secondary focus:outline-none focus:border-brand cursor-pointer text-center"
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
                  className="text-text-tertiary hover:text-brand transition-colors p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Украшения */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-montserrat font-semibold uppercase tracking-[0.12em] text-[11px] text-text-primary">
              Украшения
            </h4>
            <button
              type="button"
              onClick={handleAddDecItem}
              className="text-[11px] font-montserrat font-semibold uppercase tracking-wider text-brand hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Добавить
            </button>
          </div>

          {decorations.length > 0 && (
            <div className="space-y-1.5">
              {decorations.map((d, index) => (
                <div key={d.id} className="flex items-center gap-2 bg-bg-app px-2.5 py-1.5 rounded border border-border">
                  <div className="flex-1 min-w-0">
                    <SearchableSelect
                      value={d.key}
                      onChange={(val) => handleDecKeyChange(index, val)}
                      options={availableDecorations}
                      placeholder="Украшение..."
                    />
                  </div>

                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={d.amount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      handleDecAmountChange(index, e.target.value.replace(",", "."))
                    }
                    className="w-14 bg-bg-card border border-border-sketch rounded px-1.5 py-1 font-montserrat text-xs text-right text-text-primary focus:outline-none focus:border-brand"
                  />

                  <select
                    value={d.unit}
                    onChange={(e) => handleDecUnitChange(index, e.target.value)}
                    className="w-16 bg-bg-card border border-border-sketch rounded px-1 py-1 font-montserrat text-[11px] text-text-secondary focus:outline-none focus:border-brand cursor-pointer text-center"
                  >
                    <option value="г">г</option>
                    <option value="шт">шт</option>
                    <option value="долька">долька</option>
                    <option value="ветка">ветка</option>
                    <option value="лист">лист</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemoveDecItem(index)}
                    className="text-text-tertiary hover:text-brand transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Посуда и Лёд */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
          <div>
            <label className="block font-montserrat font-semibold uppercase tracking-[0.12em] text-[11px] text-text-primary mb-1">
              Бокал / Посуда
            </label>
            <div className="bg-bg-app px-2 py-1 rounded border border-border">
              <SearchableSelect
                value={selectedGlass || "none"}
                onChange={(val) => setSelectedGlass(val === "none" ? "" : val)}
                options={[{ key: "none", name: "Без бокала / навынос" }, ...availableGlassware]}
                placeholder="Выбрать бокал..."
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-montserrat font-semibold uppercase tracking-[0.12em] text-[11px] text-text-primary">
                Лёд
              </label>
              <button
                type="button"
                onClick={handleAddIceItem}
                className="text-[11px] font-montserrat font-semibold uppercase tracking-wider text-brand hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                Лёд
              </button>
            </div>

            {iceList.length === 0 ? (
              <div
                onClick={handleAddIceItem}
                className="bg-bg-app px-2.5 py-2 rounded border border-border text-xs font-montserrat text-text-tertiary cursor-pointer hover:border-brand"
              >
                Без льда (+ добавить)
              </div>
            ) : (
              <div className="space-y-1.5">
                {iceList.map((ice, index) => (
                  <div key={ice.id} className="flex items-center gap-1.5 bg-bg-app px-2 py-1 rounded border border-border">
                    <div className="flex-1 min-w-0">
                      <SearchableSelect
                        value={ice.key}
                        onChange={(val) => handleIceKeyChange(index, val)}
                        options={availableIce}
                        placeholder="Тип льда..."
                      />
                    </div>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={ice.amount}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        handleIceAmountChange(index, e.target.value.replace(",", "."))
                      }
                      className="w-14 bg-bg-card border border-border-sketch rounded px-1.5 py-1 font-montserrat text-xs text-right text-text-primary focus:outline-none focus:border-brand"
                    />

                    <span className="text-[11px] font-montserrat text-text-tertiary w-4">
                      {ice.unit}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveIceItem(index)}
                      className="text-text-tertiary hover:text-brand p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" size="sm">
            Создать
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
