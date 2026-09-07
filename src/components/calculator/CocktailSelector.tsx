// src/components/calculator/CocktailSelector.tsx
import { useState, useMemo } from "react"
import { Search, Star } from "lucide-react"
import { Cocktail } from "@/types/db"
import { SelectedCocktail } from "./useCalculator"
import { CocktailCard } from "./CocktailCard"

type SortOrder = "name_asc" | "name_desc"

interface CocktailSelectorProps {
  cocktails: Record<string, Cocktail>
  cocktailCategories: string[]
  isStarred: (key: string) => boolean
  selected: SelectedCocktail[]
  getQty: (key: string) => number
  setQty: (key: string, name: string, qty: number) => void
  changeQty: (key: string, name: string, delta: number) => void
  addBatchToAllSelected: (delta: number) => void
}

export function CocktailSelector({
  cocktails,
  cocktailCategories,
  isStarred,
  selected,
  getQty,
  setQty,
  changeQty,
  addBatchToAllSelected,
}: CocktailSelectorProps) {
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc")
  const [onlyStarred, setOnlyStarred] = useState(false)

  const cocktailsList = useMemo(
    () =>
      Object.entries(cocktails).map(([key, value]) => ({
        key,
        ...value,
      })),
    [cocktails]
  )

  const filteredCocktails = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cocktailsList
      .filter((c) => {
        if (onlyStarred && !isStarred(c.key)) return false
        if (categoryFilter !== "all" && c.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false
        }
        if (!q) return true
        return c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const qtyA = selected.find((item) => item.key === a.key)?.qty || 0
        const qtyB = selected.find((item) => item.key === b.key)?.qty || 0

        const isSelectedA = qtyA > 0 ? 1 : 0
        const isSelectedB = qtyB > 0 ? 1 : 0

        // 1. Сначала выбранные коктейли (qty > 0) наверх
        if (isSelectedA !== isSelectedB) {
          return isSelectedB - isSelectedA
        }

        // 2. Внутри каждой группы сортируем по выбранному порядку (А-Я или Я-А)
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [cocktailsList, query, categoryFilter, sortOrder, onlyStarred, isStarred, selected])

  return (
    <div className="space-y-4">
      {/* Панель поиска и фильтров */}
      <div className="bg-bg-card border border-border rounded-lg p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск коктейля..."
            className="w-full bg-bg-app border border-border-sketch rounded pl-10 pr-3 py-1.5 font-assistant text-xs sm:text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 bg-bg-app border border-border-sketch rounded px-2.5 py-1.5 font-tenor text-[11px] uppercase tracking-leif text-text-primary focus:outline-none focus:border-brand cursor-pointer truncate"
          >
            <option value="all">Все категории</option>
            {cocktailCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="w-24 bg-bg-app border border-border-sketch rounded px-2 py-1.5 font-tenor text-[11px] uppercase tracking-leif text-text-primary focus:outline-none focus:border-brand cursor-pointer text-center"
          >
            <option value="name_asc">А → Я</option>
            <option value="name_desc">Я → А</option>
          </select>

          <button
            type="button"
            onClick={() => setOnlyStarred(!onlyStarred)}
            className={`p-1.5 rounded border transition-all ${
              onlyStarred
                ? "bg-accent-primary border-accent-primary text-text-primary"
                : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
            }`}
            title="Только проверенные ⭐"
          >
            <Star className={`w-3.5 h-3.5 ${onlyStarred ? "fill-text-primary" : ""}`} />
          </button>
        </div>

        {/* Быстрые кнопки пачек (+10, +20, +50 на все выбранные) */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-assistant">
            <span className="text-text-tertiary text-[10px] font-tenor uppercase tracking-leif">
              Пакетно к выбранным:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => addBatchToAllSelected(10)}
                className="px-2 py-0.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-text-primary text-[10px] font-tenor uppercase tracking-leif font-semibold transition-colors"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => addBatchToAllSelected(20)}
                className="px-2 py-0.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-text-primary text-[10px] font-tenor uppercase tracking-leif font-semibold transition-colors"
              >
                +20
              </button>
              <button
                type="button"
                onClick={() => addBatchToAllSelected(50)}
                className="px-2 py-0.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-text-primary text-[10px] font-tenor uppercase tracking-leif font-semibold transition-colors"
              >
                +50
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Список компактных карточек коктейлей (без состава) */}
      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {filteredCocktails.length === 0 ? (
          <div className="card py-12 text-center">
            <p className="font-cormorant italic text-xl text-text-primary">Ничего не найдено</p>
            <p className="font-assistant text-xs text-text-tertiary mt-1">
              Измените параметры поиска
            </p>
          </div>
        ) : (
          filteredCocktails.map((cocktail) => {
            const qty = getQty(cocktail.key)
            return (
              <CocktailCard
                key={cocktail.key}
                cocktail={cocktail}
                qty={qty}
                onQtyChange={(delta) => changeQty(cocktail.key, cocktail.name, delta)}
                onQtySet={(val) => setQty(cocktail.key, cocktail.name, val)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
