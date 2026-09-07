// src/components/database/SemiProductsTab.tsx
import { useState, useMemo } from "react"
import { Search, ArrowUpDown, Copy } from "lucide-react"
import { SemiProduct } from "@/types/db"
import { useSemiProducts } from "@/context/SemiProductsContext"
import { useCocktails } from "@/context/CocktailsContext"
import { useIngredients } from "@/context/IngredientsContext"
import { SemiProductAddModal } from "./SemiProductAddModal"
import { SemiProductEditModal } from "./SemiProductEditModal"
import { capitalize, cleanPfKey } from "@/utils/formatting"
import { SelectOption } from "@/components/ui/searchable-select"

type SortOrder = "name_asc" | "name_desc"

interface SemiProductsTabProps {
  isAddOpen?: boolean
  onAddClose?: () => void
}

export function SemiProductsTab({
  isAddOpen: externalAddOpen,
  onAddClose: onExternalAddClose,
}: SemiProductsTabProps = {}) {
  const { semiProducts, addSemiProduct, updateSemiProduct, removeSemiProduct } = useSemiProducts()

  const { cocktails } = useCocktails()
  const { prices, categories, ingredientInfo } = useIngredients()

  const [query, setQuery] = useState("")
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc")

  // Modals state
  const [editingPfKey, setEditingPfKey] = useState<string | null>(null)
  const [isAddPfOpen, setIsAddPfOpen] = useState(false)
  const [duplicatingSemi, setDuplicatingSemi] = useState<
    (Partial<SemiProduct> & { name?: string }) | null
  >(null)

  const semiProductsList = useMemo(
    () =>
      Object.entries(semiProducts).map(([key, value]) => ({
        key,
        ...value,
      })),
    [semiProducts]
  )

  // Карта использования полуфабрикатов в коктейлях
  const semiUsageMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    Object.keys(semiProducts).forEach((k) => {
      map[k] = []
    })

    Object.values(cocktails).forEach((cocktail) => {
      Object.keys(cocktail.recipe || {}).forEach((ing) => {
        const cleanIng = cleanPfKey(ing)
        Object.keys(semiProducts).forEach((pfKey) => {
          if (pfKey === ing || pfKey === cleanIng || cleanPfKey(pfKey) === cleanIng) {
            if (!map[pfKey]) map[pfKey] = []
            if (!map[pfKey].includes(cocktail.name)) {
              map[pfKey].push(cocktail.name)
            }
          }
        })
      })
    })

    return map
  }, [semiProducts, cocktails])

  const filteredSemi = useMemo(() => {
    const q = query.trim().toLowerCase()
    return semiProductsList
      .filter((s) => {
        if (!q) return true
        const inName = s.name.toLowerCase().includes(q)
        const inRecipe = Object.keys(s.recipe || {}).some((ing) => ing.toLowerCase().includes(q))
        return inName || inRecipe
      })
      .sort((a, b) => {
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [semiProductsList, query, sortOrder])

  // Select Options for Semi Product ingredients
  const availableIngredients: SelectOption[] = useMemo(() => {
    const items: SelectOption[] = []

    // Вложенные ПФ
    Object.entries(semiProducts).forEach(([key, semi]) => {
      const clean = cleanPfKey(key)
      items.push({
        key: `(пф) ${clean}`,
        name: `(ПФ) ${capitalize(semi.name)}`,
        category: "полуфабрикаты",
      })
    })

    // Ингредиенты из цен
    Object.keys(prices).forEach((key) => {
      const cat = categories[key] || "алкоголь"
      if (cat !== "посуда") {
        const name = ingredientInfo[key]?.display_name || key
        items.push({
          key,
          name: capitalize(name),
          category: cat,
        })
      }
    })

    return items.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [semiProducts, prices, categories, ingredientInfo])

  const handleDuplicateSemi = (s: SemiProduct & { key: string }) => {
    setDuplicatingSemi({
      name: `${s.name} (копия)`,
      output_volume: s.output_volume,
      unit: s.unit,
      recipe: { ...s.recipe },
    })
    setIsAddPfOpen(true)
  }

  const selectedSemi = editingPfKey ? semiProducts[editingPfKey] : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию или составу ПФ..."
            className="w-full bg-bg-app border border-border-sketch rounded pl-10 pr-4 py-1.5 font-assistant text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-tenor text-[11px] uppercase tracking-leif text-text-primary focus:outline-none focus:border-brand cursor-pointer"
          >
            <option value="name_asc">А → Я</option>
            <option value="name_desc">Я → А</option>
          </select>
        </div>
      </div>

      {filteredSemi.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
          <p className="font-assistant text-xs text-text-tertiary mt-2">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSemi.map((pf) => {
            const ingredientNames = Object.keys(pf.recipe || {})

            return (
              <div
                key={pf.key}
                onClick={() => setEditingPfKey(pf.key)}
                className="card card-hover cursor-pointer relative p-4 transition-all duration-200 border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-accent-primary/60 text-text-primary font-tenor text-[10px] uppercase tracking-leif font-semibold">
                      Выход: {pf.output_volume} {pf.unit}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicateSemi(pf)
                      }}
                      title="Дублировать полуфабрикат"
                      className="p-1 rounded-full text-text-tertiary/60 hover:text-brand hover:bg-surface-secondary/40 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h3 className="font-tenor font-bold uppercase tracking-leif text-[13px] sm:text-[14px] text-text-primary leading-snug truncate">
                    {pf.name}
                  </h3>

                  <div className="mt-3 pt-2.5 border-t border-border">
                    <p className="font-tenor font-semibold uppercase tracking-leif text-[10px] text-text-secondary mb-1.5">
                      Состав ({ingredientNames.length}):
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ingredientNames.slice(0, 4).map((ing) => (
                        <span
                          key={ing}
                          className="bg-bg-app border border-border-sketch/70 px-2 py-0.5 rounded text-xs font-assistant font-medium text-text-primary"
                        >
                          {capitalize(ing)}
                        </span>
                      ))}
                      {ingredientNames.length > 4 && (
                        <span className="text-xs font-assistant text-text-secondary self-center font-medium pl-0.5">
                          +{ingredientNames.length - 4} ещё
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border text-xs font-assistant text-text-secondary">
                  {semiUsageMap[pf.key]?.length > 0 ? (
                    <div>
                      <span className="text-text-secondary text-xs">
                        Используется в{" "}
                        <strong className="text-text-primary font-semibold">
                          {semiUsageMap[pf.key].length}
                        </strong>{" "}
                        {semiUsageMap[pf.key].length === 1
                          ? "коктейле"
                          : semiUsageMap[pf.key].length < 5
                            ? "коктейлях"
                            : "коктейлях"}
                        :
                      </span>
                      <p
                        className="text-[11px] text-text-tertiary truncate mt-0.5 font-assistant"
                        title={semiUsageMap[pf.key].join(", ")}
                      >
                        {semiUsageMap[pf.key].slice(0, 3).join(", ")}
                        {semiUsageMap[pf.key].length > 3 ? "..." : ""}
                      </p>
                    </div>
                  ) : (
                    <span className="text-text-tertiary text-xs">Не привязан к коктейлям</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Модалки полуфабрикатов */}
      <SemiProductEditModal
        open={Boolean(editingPfKey)}
        onClose={() => setEditingPfKey(null)}
        pfKey={editingPfKey}
        semiProduct={selectedSemi}
        onSave={updateSemiProduct}
        onDelete={removeSemiProduct}
        availableIngredients={availableIngredients}
        ingredientInfo={ingredientInfo}
      />

      <SemiProductAddModal
        open={isAddPfOpen || Boolean(externalAddOpen)}
        onClose={() => {
          setIsAddPfOpen(false)
          setDuplicatingSemi(null)
          onExternalAddClose?.()
        }}
        onAdd={addSemiProduct}
        availableIngredients={availableIngredients}
        ingredientInfo={ingredientInfo}
        initialData={duplicatingSemi || undefined}
      />
    </div>
  )
}
