// src/components/database/CocktailsTab.tsx
import { useState, useMemo } from "react"
import { Search, Star, Filter, ArrowUpDown, Copy } from "lucide-react"
import { Cocktail } from "@/types/db"
import { useCocktails } from "@/context/CocktailsContext"
import { useSemiProducts } from "@/context/SemiProductsContext"
import { useIngredients } from "@/context/IngredientsContext"
import { CocktailAddModal } from "./CocktailAddModal"
import { CocktailEditModal } from "./CocktailEditModal"
import { capitalize, cleanPfKey } from "@/utils/formatting"
import { SelectOption } from "@/components/ui/searchable-select"

type SortOrder = "name_asc" | "name_desc"
type QuickCocktailFilter = "all" | "alc" | "non_alc" | "with_pf"

interface CocktailsTabProps {
  isAddOpen?: boolean
  onAddClose?: () => void
}

export function CocktailsTab({
  isAddOpen: externalAddOpen,
  onAddClose: onExternalAddClose,
}: CocktailsTabProps = {}) {
  const {
    cocktails,
    cocktailCategories,
    toggleStar,
    isStarred,
    addCocktail,
    updateCocktail,
    removeCocktail,
  } = useCocktails()

  const { semiProducts } = useSemiProducts()
  const { prices, categories, ingredientInfo } = useIngredients()

  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [quickFilter, setQuickFilter] = useState<QuickCocktailFilter>("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc")
  const [onlyStarred, setOnlyStarred] = useState(false)

  // Modals state
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [duplicatingCocktail, setDuplicatingCocktail] = useState<
    (Partial<Cocktail> & { name?: string }) | null
  >(null)

  const cocktailsList = useMemo(
    () =>
      Object.entries(cocktails).map(([key, value]) => ({
        key,
        ...value,
      })),
    [cocktails]
  )

  const filteredCocktails = useMemo(() => {
    const isNonAlc = (c: Cocktail) => {
      const cat = (c.category || "").toLowerCase()
      return (
        cat.includes("non alc") ||
        cat.includes("безалкоголь") ||
        cat.includes("б/а") ||
        cat === "special non alc"
      )
    }

    const hasSemi = (c: Cocktail) => {
      return Object.keys(c.recipe || {}).some((ing) => {
        const k = ing.toLowerCase()
        return (
          k.startsWith("(пф)") ||
          k.startsWith("пф") ||
          semiProducts[k] ||
          semiProducts[cleanPfKey(k)]
        )
      })
    }

    const q = query.trim().toLowerCase()
    return cocktailsList
      .filter((c) => {
        if (onlyStarred && !isStarred(c.key)) return false
        if (categoryFilter !== "all" && c.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false
        }
        if (quickFilter === "alc" && isNonAlc(c)) return false
        if (quickFilter === "non_alc" && !isNonAlc(c)) return false
        if (quickFilter === "with_pf" && !hasSemi(c)) return false

        if (!q) return true
        const inName = c.name.toLowerCase().includes(q)
        const inCat = c.category.toLowerCase().includes(q)
        const inRecipe = Object.keys(c.recipe || {}).some((ing) => ing.toLowerCase().includes(q))
        return inName || inCat || inRecipe
      })
      .sort((a, b) => {
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [
    cocktailsList,
    query,
    categoryFilter,
    quickFilter,
    sortOrder,
    onlyStarred,
    isStarred,
    semiProducts,
  ])

  // Select Options for Cocktails modals
  const availableIngredients: SelectOption[] = useMemo(() => {
    const items: SelectOption[] = []

    // Полуфабрикаты
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
      if (cat !== "посуда" && !cat.startsWith("украшение") && !cat.startsWith("лёд")) {
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

  const availableDecorations: SelectOption[] = useMemo(() => {
    const items: SelectOption[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (
        cat.startsWith("украшение") ||
        cat === "травы" ||
        cat === "ягоды" ||
        cat === "фрукты" ||
        cat === "сухой_гр"
      ) {
        const name = ingredientInfo[key]?.display_name || key
        items.push({ key, name: capitalize(name), category: cat })
      }
    })
    return items.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [categories, ingredientInfo])

  const availableGlassware: SelectOption[] = useMemo(() => {
    const items: SelectOption[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat === "посуда") {
        const name = ingredientInfo[key]?.display_name || key
        items.push({ key, name: capitalize(name), category: "посуда" })
      }
    })
    return items.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [categories, ingredientInfo])

  const availableIce: SelectOption[] = useMemo(() => {
    const items: SelectOption[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat.startsWith("лёд") || key.includes("лед") || key.includes("лёд")) {
        const name = ingredientInfo[key]?.display_name || key
        items.push({ key, name: capitalize(name), category: cat })
      }
    })
    if (items.length === 0) {
      items.push(
        { key: "лед_кубик", name: "Лёд кубик", category: "лёд_кубик" },
        { key: "лед_краш", name: "Лёд краш / фраппе", category: "лёд_кубик" },
        { key: "лед_глыба", name: "Лёд глыба / стик", category: "лёд_фигурный" }
      )
    }
    return items
  }, [categories, ingredientInfo])

  const handleDuplicateCocktail = (c: Cocktail & { key: string }) => {
    setDuplicatingCocktail({
      name: `${c.name} (копия)`,
      category: c.category,
      recipe: { ...c.recipe },
      decorations: { ...c.decorations },
      glassware: { ...c.glassware },
    })
    setIsAddOpen(true)
  }

  const selectedCocktail = editingKey ? cocktails[editingKey] : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 bg-bg-card border border-border rounded-lg p-4">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по названию или ингредиенту..."
              className="w-full bg-bg-app border border-border-sketch rounded pl-10 pr-4 py-1.5 font-assistant text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-text-tertiary" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-tenor text-[11px] uppercase tracking-leif text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="all">Все категории</option>
                {cocktailCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>
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

            <button
              type="button"
              onClick={() => setOnlyStarred(!onlyStarred)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-[11px] font-tenor uppercase tracking-leif transition-all ${
                onlyStarred
                  ? "bg-accent-primary border-accent-primary text-text-primary font-semibold"
                  : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${onlyStarred ? "fill-text-primary" : ""}`} />
              Проверенные
            </button>
          </div>
        </div>

        {/* Быстрые чипсы-фильтры */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-border/60">
          <span className="text-[11px] font-tenor uppercase tracking-leif text-text-tertiary mr-1">
            Быстрый фильтр:
          </span>
          {[
            { id: "all", label: "Все" },
            { id: "alc", label: "Алкогольные" },
            { id: "non_alc", label: "Безалкогольные" },
            { id: "with_pf", label: "С полуфабрикатами" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setQuickFilter(chip.id as QuickCocktailFilter)}
              className={`px-3 py-1 rounded-full text-[11px] font-tenor uppercase tracking-leif transition-all border ${
                quickFilter === chip.id
                  ? "bg-brand text-white border-brand shadow-sm font-semibold"
                  : "bg-bg-app border-border-sketch text-text-secondary hover:text-text-primary hover:border-brand"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {filteredCocktails.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
          <p className="font-assistant text-xs text-text-tertiary mt-2">
            Попробуйте изменить поисковый запрос или фильтры
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCocktails.map((cocktail) => {
            const starred = isStarred(cocktail.key)
            const ingredientNames = Object.keys(cocktail.recipe || {})

            return (
              <div
                key={cocktail.key}
                onClick={() => setEditingKey(cocktail.key)}
                className={`card card-hover cursor-pointer relative p-4 transition-all duration-200 ${
                  starred
                    ? "border-2 border-accent-secondary/60 bg-gradient-to-b from-[#fefdfd] to-[#faf4ee] shadow-md"
                    : "border border-border"
                }`}
              >
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicateCocktail(cocktail)
                    }}
                    title="Дублировать коктейль"
                    className="p-1 rounded-full text-text-tertiary/60 hover:text-brand hover:bg-surface-secondary/40 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStar(cocktail.key)
                    }}
                    title={starred ? "Проверен" : "Отметить как проверенный"}
                    className={`p-1 rounded-full transition-all ${
                      starred
                        ? "text-brand bg-accent-primary/50 hover:bg-accent-primary"
                        : "text-text-tertiary/60 hover:text-brand hover:bg-surface-secondary/30"
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${starred ? "fill-brand text-brand" : ""}`} />
                  </button>
                </div>

                <div className="pr-14 mb-2">
                  <h3 className="font-tenor font-bold uppercase tracking-leif text-[13px] sm:text-[14px] text-text-primary leading-snug truncate">
                    {cocktail.name}
                  </h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-surface-secondary/40 text-text-primary font-tenor text-[10px] uppercase tracking-leif font-semibold">
                    {cocktail.category}
                  </span>
                </div>

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

                {Object.keys(cocktail.decorations || {}).length > 0 && (
                  <div className="mt-3 text-xs font-assistant flex items-center gap-1.5 pt-2 border-t border-border/60">
                    <span className="font-tenor font-semibold uppercase tracking-leif text-[10px] text-text-secondary shrink-0">
                      Украшение:
                    </span>
                    <span className="text-text-primary font-medium truncate">
                      {Object.keys(cocktail.decorations).map(capitalize).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Модалки коктейлей */}
      <CocktailEditModal
        open={Boolean(editingKey)}
        onClose={() => setEditingKey(null)}
        cocktailKey={editingKey}
        cocktail={selectedCocktail}
        isStarred={editingKey ? isStarred(editingKey) : false}
        onToggleStar={toggleStar}
        onSave={updateCocktail}
        onDelete={removeCocktail}
        categories={cocktailCategories}
        availableIngredients={availableIngredients}
        availableDecorations={availableDecorations}
        availableGlassware={availableGlassware}
        availableIce={availableIce}
        ingredientInfo={ingredientInfo}
      />

      <CocktailAddModal
        open={isAddOpen || Boolean(externalAddOpen)}
        onClose={() => {
          setIsAddOpen(false)
          setDuplicatingCocktail(null)
          onExternalAddClose?.()
        }}
        onAdd={addCocktail}
        categories={cocktailCategories}
        availableIngredients={availableIngredients}
        availableDecorations={availableDecorations}
        availableGlassware={availableGlassware}
        availableIce={availableIce}
        ingredientInfo={ingredientInfo}
        initialData={duplicatingCocktail || undefined}
      />
    </div>
  )
}
