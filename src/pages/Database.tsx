import { useMemo, useState } from "react"
import { Search, Plus, Star, Filter, ArrowUpDown, Pencil, Trash2, Tag, Wine } from "lucide-react"
import { Cocktail, SemiProduct } from "@/types/db"
import { useDatabase } from "@/context/DatabaseContext"
import { Button } from "@/components/ui/button"
import { CocktailEditModal } from "@/components/database/CocktailEditModal"
import { CocktailAddModal } from "@/components/database/CocktailAddModal"
import { SemiProductEditModal } from "@/components/database/SemiProductEditModal"
import { SemiProductAddModal } from "@/components/database/SemiProductAddModal"
import { IngredientEditModal } from "@/components/database/IngredientEditModal"
import { IngredientAddModal } from "@/components/database/IngredientAddModal"
import { CategoriesManageModal } from "@/components/database/CategoriesManageModal"
import { GlasswareEditModal } from "@/components/database/GlasswareEditModal"
import { GlasswareAddModal } from "@/components/database/GlasswareAddModal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

type Tab = "cocktails" | "semi" | "ingredients" | "glassware"
type SortOrder = "name_asc" | "name_desc"

const capitalize = (s: string) => {
  if (!s) return ""
  const trimmed = s.trim()
  if (/^\(?пф\)?/i.test(trimmed)) {
    const cleanName = trimmed.replace(/^(\(?пф\)?[:\s-]*)+/i, "").trim()
    if (!cleanName) return "(ПФ)"
    return `(ПФ) ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export default function Database() {
  const {
    cocktails,
    semiProducts,
    prices,
    categories,
    categoryNames,
    cocktailCategories,
    ingredientInfo,
    bottleVolumes,
    toggleStar,
    isStarred,
    addCocktail,
    updateCocktail,
    removeCocktail,
    addSemiProduct,
    updateSemiProduct,
    removeSemiProduct,
    addIngredient,
    updateIngredient,
    removeIngredient,
    addCategory,
    removeCategory,
  } = useDatabase()

  const [tab, setTab] = useState<Tab>("cocktails")
  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc")
  const [onlyStarred, setOnlyStarred] = useState(false)

  // Cocktails Modals
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Semi-products Modals
  const [editingPfKey, setEditingPfKey] = useState<string | null>(null)
  const [isAddPfOpen, setIsAddPfOpen] = useState(false)

  // Ingredients Modals
  const [editingIngredientKey, setEditingIngredientKey] = useState<string | null>(null)
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false)
  const [deletingIngredient, setDeletingIngredient] = useState<{ key: string; name: string } | null>(null)

  // Glassware Modals
  const [editingGlasswareKey, setEditingGlasswareKey] = useState<string | null>(null)
  const [isAddGlasswareOpen, setIsAddGlasswareOpen] = useState(false)

  // Cocktails array
  const cocktailsList = useMemo(
    () =>
      Object.entries(cocktails).map(([key, value]) => ({
        key,
        ...value,
      })) as (Cocktail & { key: string })[],
    [cocktails]
  )

  // Semi-products array
  const semiProductsList = useMemo(
    () =>
      Object.entries(semiProducts).map(([key, value]) => ({
        key,
        ...value,
      })) as (SemiProduct & { key: string })[],
    [semiProducts]
  )

  // Ingredients array (без посуды)
  const ingredientsList = useMemo(
    () =>
      Object.entries(prices)
        .filter(([key]) => categories[key] !== "посуда")
        .map(([key, price]) => {
          const info = ingredientInfo[key] || {}
          const category = categories[key] || "алкоголь"
          const displayName = info.display_name || key
          return {
            key,
            name: displayName,
            category,
            price,
            unit: info.unit || "л",
            bottle: bottleVolumes[key],
          }
        }),
    [prices, ingredientInfo, categories, bottleVolumes]
  )

  // Glassware array
  const glasswareList = useMemo(() => {
    const list: { key: string; name: string; usageCount: number }[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat === "посуда") {
        const displayName = capitalize(ingredientInfo[key]?.display_name || key)
        const usageCount = cocktailsList.filter(
          (c) => c.glassware && Object.prototype.hasOwnProperty.call(c.glassware, key)
        ).length
        list.push({ key, name: displayName, usageCount })
      }
    })
    return list
  }, [categories, ingredientInfo, cocktailsList])

  // Available ingredients for cocktails (including semi-products, deduplicated)
  const availableIngredients = useMemo(() => {
    const list: { key: string; name: string }[] = []
    const seenKeys = new Set<string>()

    // 1. Semi-products first (with (ПФ) prefix)
    Object.keys(semiProducts).forEach((key) => {
      const cleanKey = key.toLowerCase().replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()
      const displayName = semiProducts[key]?.name || `(ПФ) ${capitalize(cleanKey)}`
      if (!seenKeys.has(cleanKey)) {
        seenKeys.add(cleanKey)
        list.push({ key, name: capitalize(displayName) })
      }
    })

    // 2. Regular ingredients from prices
    Object.keys(prices).forEach((key) => {
      if (categories[key] !== "посуда") {
        const cleanKey = key.toLowerCase().replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()
        if (!seenKeys.has(cleanKey)) {
          seenKeys.add(cleanKey)
          const name = capitalize(ingredientInfo[key]?.display_name || key)
          list.push({ key, name })
        }
      }
    })

    return list.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [prices, semiProducts, ingredientInfo, categories])

  // Available glassware options for cocktail select
  const availableGlassware = useMemo(() => {
    const list: { key: string; name: string }[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat === "посуда") {
        const name = capitalize(ingredientInfo[key]?.display_name || key)
        list.push({ key, name })
      }
    })
    if (list.length === 0) {
      list.push(
        { key: "бокал купе", name: "Бокал Купе / Шале" },
        { key: "рокс", name: "Рокс" },
        { key: "хайбол", name: "Хайбол" },
        { key: "флюте", name: "Флюте (игристое)" },
        { key: "ник и нора", name: "Ник и Нора" }
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [categories, ingredientInfo])

  // Available ice options
  const availableIce = useMemo(() => {
    const list: { key: string; name: string }[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (cat === "лёд_кубик" || cat === "лёд_фигурный" || key.includes("лед") || key.includes("лёд")) {
        const name = capitalize(ingredientInfo[key]?.display_name || key)
        list.push({ key, name })
      }
    })
    if (list.length === 0) {
      list.push(
        { key: "лед кубик", name: "Лёд кубиковый" },
        { key: "лёд фигурный", name: "Лёд фигурный (глыба/брусок)" },
        { key: "лед фрапе", name: "Лёд краш / фраппе" }
      )
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [categories, ingredientInfo])

  // Available decorations options
  const availableDecorations = useMemo(() => {
    const list: { key: string; name: string; category?: string }[] = []
    Object.entries(categories).forEach(([key, cat]) => {
      if (
        cat.startsWith("украшение") ||
        cat === "травы" ||
        cat === "ягоды" ||
        cat === "фрукты" ||
        cat === "сухой_гр"
      ) {
        const name = capitalize(ingredientInfo[key]?.display_name || key)
        list.push({ key, name, category: cat })
      }
    })
    if (list.length < 5) {
      const decDefaults = [
        "мята",
        "лайм",
        "апельсин долька",
        "вишенка",
        "сублиматы клубники",
        "цветок",
        "розмарин",
        "тимьян",
        "оливки зеленые",
      ]
      decDefaults.forEach((key) => {
        if (!list.some((item) => item.key === key)) {
          list.push({ key, name: capitalize(ingredientInfo[key]?.display_name || key) })
        }
      })
    }
    return list.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [categories, ingredientInfo])

  // Filtered & Sorted Cocktails
  const filteredCocktails = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cocktailsList
      .filter((c) => {
        if (onlyStarred && !isStarred(c.key)) return false
        if (categoryFilter !== "all" && c.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false
        }
        if (!q) return true
        const inName = c.name.toLowerCase().includes(q)
        const inCat = c.category.toLowerCase().includes(q)
        const inRecipe = Object.keys(c.recipe || {}).some((ing) =>
          ing.toLowerCase().includes(q)
        )
        return inName || inCat || inRecipe
      })
      .sort((a, b) => {
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [cocktailsList, query, categoryFilter, sortOrder, onlyStarred, isStarred])

  // Filtered & Sorted Semi-Products
  const filteredSemi = useMemo(() => {
    const q = query.trim().toLowerCase()
    return semiProductsList
      .filter((s) => {
        if (!q) return true
        const inName = s.name.toLowerCase().includes(q)
        const inRecipe = Object.keys(s.recipe || {}).some((ing) =>
          ing.toLowerCase().includes(q)
        )
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

  // Filtered & Sorted Ingredients
  const filteredIngredients = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ingredientsList
      .filter((i) => {
        if (!q) return true
        const inName = i.name.toLowerCase().includes(q)
        const inCategory = (categoryNames[i.category] || i.category).toLowerCase().includes(q)
        return inName || inCategory
      })
      .sort((a, b) => {
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [ingredientsList, query, sortOrder, categoryNames])

  // Filtered & Sorted Glassware
  const filteredGlassware = useMemo(() => {
    const q = query.trim().toLowerCase()
    return glasswareList
      .filter((g) => (!q ? true : g.name.toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [glasswareList, query, sortOrder])

  const TabButton = ({ id, label }: { id: Tab; label: string }) => (
    <button
      onClick={() => {
        setTab(id)
        setQuery("")
      }}
      className={`px-5 py-2 rounded-full font-montserrat text-xs uppercase tracking-[0.12em] transition-all border ${
        tab === id
          ? "bg-accent-primary border-accent-primary text-text-primary shadow-sm font-medium"
          : "bg-bg-card border-border-sketch text-text-secondary hover:border-brand"
      }`}
    >
      {label}
    </button>
  )

  const selectedCocktail = editingKey ? cocktails[editingKey] : null
  const selectedSemi = editingPfKey ? semiProducts[editingPfKey] : null
  const selectedIngredient = editingIngredientKey
    ? ingredientsList.find((i) => i.key === editingIngredientKey) || null
    : null
  const selectedGlassware = editingGlasswareKey
    ? glasswareList.find((g) => g.key === editingGlasswareKey) || null
    : null

  // Обработчики посуды
  const handleAddGlassware = (name: string) => {
    const key = name.trim().toLowerCase().replace(/\s+/g, "_")
    addIngredient({
      key,
      name: name.trim(),
      category: "посуда",
      unit: "шт",
      price: 0,
      bottle: 0,
    })
  }

  const handleUpdateGlassware = (key: string, updates: { name: string }) => {
    updateIngredient(key, { name: updates.name })
  }

  const handleRemoveGlassware = (key: string) => {
    removeIngredient(key)
  }

  return (
    <div className="space-y-8">
      {/* Верхняя шапка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-cormorant italic text-[24px] text-text-primary">
            База рецептов, посуды и ингредиентов
          </p>
          <p className="font-montserrat text-xs text-text-tertiary mt-0.5">
            {cocktailsList.length} коктейлей · {semiProductsList.length} полуфабрикатов · {ingredientsList.length} ингредиентов · {glasswareList.length} видов посуды
          </p>
        </div>

        {tab === "cocktails" && (
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить коктейль
          </Button>
        )}

        {tab === "semi" && (
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setIsAddPfOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить ПФ
          </Button>
        )}

        {tab === "ingredients" && (
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setIsAddIngredientOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить ингредиент
          </Button>
        )}

        {tab === "glassware" && (
          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => setIsAddGlasswareOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить посуду
          </Button>
        )}
      </div>

      {/* Вкладки разделов */}
      <div className="flex flex-wrap gap-3">
        <TabButton id="cocktails" label="Коктейли" />
        <TabButton id="semi" label="Полуфабрикаты" />
        <TabButton id="ingredients" label="Ингредиенты" />
        <TabButton id="glassware" label="Посуда" />
      </div>

      {/* ===================== ВКЛАДКА: КОКТЕЙЛИ ===================== */}
      {tab === "cocktails" && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию или ингредиенту..."
                className="w-full bg-bg-app border-2 border-border-sketch rounded pl-10 pr-4 py-1.5 font-montserrat text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-text-tertiary" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
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
                  className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="name_asc">А → Я</option>
                  <option value="name_desc">Я → А</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setOnlyStarred(!onlyStarred)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-montserrat uppercase tracking-wider transition-all ${
                  onlyStarred
                    ? "bg-accent-primary border-accent-primary text-text-primary"
                    : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${onlyStarred ? "fill-text-primary" : ""}`} />
                Проверенные
              </button>
            </div>
          </div>

          {filteredCocktails.length === 0 ? (
            <div className="card py-16 text-center">
              <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
              <p className="font-montserrat text-xs text-text-tertiary mt-2">
                Попробуйте изменить поисковый запрос или сбросить фильтры
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
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleStar(cocktail.key)
                      }}
                      title={starred ? "Проверен" : "Отметить как проверенный"}
                      className={`absolute top-3.5 right-3.5 p-1 rounded-full transition-all ${
                        starred
                          ? "text-brand bg-accent-primary/50 hover:bg-accent-primary"
                          : "text-text-tertiary/60 hover:text-brand hover:bg-surface-secondary/30"
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${starred ? "fill-brand text-brand" : ""}`} />
                    </button>

                    <div className="pr-7 mb-2">
                      <h3 className="font-cormorant italic text-xl text-text-primary leading-tight truncate font-semibold">
                        {cocktail.name}
                      </h3>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-surface-secondary/50 text-text-primary font-montserrat text-[11px] uppercase tracking-wider font-medium">
                        {cocktail.category}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border">
                      <p className="font-montserrat font-medium uppercase tracking-[0.1em] text-xs text-text-secondary mb-2">
                        Состав ({ingredientNames.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ingredientNames.slice(0, 4).map((ing) => (
                          <span
                            key={ing}
                            className="bg-bg-app border border-border-sketch px-2 py-0.5 rounded text-xs font-montserrat font-medium text-text-primary"
                          >
                            {capitalize(ing)}
                          </span>
                        ))}
                        {ingredientNames.length > 4 && (
                          <span className="text-xs font-montserrat text-text-secondary self-center font-medium pl-0.5">
                            +{ingredientNames.length - 4} ещё
                          </span>
                        )}
                      </div>
                    </div>

                    {Object.keys(cocktail.decorations || {}).length > 0 && (
                      <div className="mt-3 text-xs font-montserrat flex items-center gap-1.5 pt-2 border-t border-border/60">
                        <span className="font-semibold uppercase tracking-wider text-[11px] text-text-secondary shrink-0">
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
        </div>
      )}

      {/* ===================== ВКЛАДКА: ПОЛУФАБРИКАТЫ ===================== */}
      {tab === "semi" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по названию или составу ПФ..."
                className="w-full bg-bg-app border-2 border-border-sketch rounded pl-10 pr-4 py-1.5 font-montserrat text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="name_asc">А → Я</option>
                <option value="name_desc">Я → А</option>
              </select>
            </div>
          </div>

          {filteredSemi.length === 0 ? (
            <div className="card py-16 text-center">
              <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
              <p className="font-montserrat text-xs text-text-tertiary mt-2">
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
                    className="card card-hover cursor-pointer relative p-4 transition-all duration-200 border border-border"
                  >
                    <div className="mb-2">
                      <h3 className="font-cormorant italic text-xl text-text-primary leading-tight truncate font-semibold">
                        {pf.name}
                      </h3>
                      <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-accent-primary/60 text-text-primary font-montserrat text-[11px] uppercase tracking-wider font-medium">
                        Выход: {pf.output_volume} {pf.unit}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-border">
                      <p className="font-montserrat font-medium uppercase tracking-[0.1em] text-xs text-text-secondary mb-2">
                        Состав ({ingredientNames.length}):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ingredientNames.slice(0, 4).map((ing) => (
                          <span
                            key={ing}
                            className="bg-bg-app border border-border-sketch px-2 py-0.5 rounded text-xs font-montserrat font-medium text-text-primary"
                          >
                            {capitalize(ing)}
                          </span>
                        ))}
                        {ingredientNames.length > 4 && (
                          <span className="text-xs font-montserrat text-text-secondary self-center font-medium pl-0.5">
                            +{ingredientNames.length - 4} ещё
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== ВКЛАДКА: ИНГРЕДИЕНТЫ ===================== */}
      {tab === "ingredients" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск ингредиента или категории..."
                className="w-full bg-bg-app border-2 border-border-sketch rounded pl-10 pr-4 py-1.5 font-montserrat text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                  className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="name_asc">А → Я</option>
                  <option value="name_desc">Я → А</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsCategoriesModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-sketch bg-bg-app hover:border-brand text-xs font-montserrat uppercase tracking-wider text-text-primary transition-all"
              >
                <Tag className="w-3.5 h-3.5 text-brand" />
                Категории
              </button>
            </div>
          </div>

          {/* Таблица ингредиентов */}
          <div className="card overflow-hidden p-0 border border-border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-bg-card">
                    <th className="px-6 py-3 font-montserrat font-semibold uppercase tracking-[0.12em] text-xs text-text-primary">
                      Ингредиент
                    </th>
                    <th className="px-6 py-3 font-montserrat font-semibold uppercase tracking-[0.12em] text-xs text-text-primary">
                      Категория
                    </th>
                    <th className="px-6 py-3 font-montserrat font-semibold uppercase tracking-[0.12em] text-xs text-text-primary">
                      Единица
                    </th>
                    <th className="px-6 py-3 font-montserrat font-semibold uppercase tracking-[0.12em] text-xs text-text-primary">
                      Цена, ₽
                    </th>
                    <th className="px-6 py-3 font-montserrat font-semibold uppercase tracking-[0.12em] text-xs text-text-primary">
                      Объём бутылки / тары
                    </th>
                    <th className="px-6 py-3 font-montserrat font-semibold uppercase tracking-[0.12em] text-xs text-text-primary text-right">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-text-tertiary font-montserrat text-xs">
                        Ингредиенты не найдены
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ing, i) => (
                      <tr
                        key={ing.key}
                        className={`border-b border-border last:border-0 transition-colors hover:bg-surface-secondary/20 ${
                          i % 2 === 0 ? "bg-bg-card" : "bg-bg-app"
                        }`}
                      >
                        <td className="px-6 py-3.5 font-cormorant italic text-lg text-text-primary font-semibold">
                          {capitalize(ing.name)}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-secondary/50 text-text-primary font-montserrat text-[11px] uppercase tracking-wider font-medium">
                            {categoryNames[ing.category] || ing.category}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-montserrat text-xs font-medium text-text-primary">
                          {ing.unit}
                        </td>
                        <td className="px-6 py-3.5 font-montserrat text-sm font-semibold text-text-primary">
                          {ing.price.toLocaleString()} ₽
                        </td>
                        <td className="px-6 py-3.5 font-montserrat text-xs text-text-secondary">
                          {ing.bottle ? `${ing.bottle} л` : "—"}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingIngredientKey(ing.key)}
                              className="p-1.5 text-text-tertiary hover:text-brand hover:bg-surface-secondary/30 rounded transition-colors"
                              title="Редактировать"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingIngredient({ key: ing.key, name: ing.name })}
                              className="p-1.5 text-text-tertiary hover:text-brand hover:bg-surface-secondary/30 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== ВКЛАДКА: ПОСУДА ===================== */}
      {tab === "glassware" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск бокала или посуды..."
                className="w-full bg-bg-app border-2 border-border-sketch rounded pl-10 pr-4 py-1.5 font-montserrat text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="bg-bg-app border border-border-sketch rounded px-3 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="name_asc">А → Я</option>
                <option value="name_desc">Я → А</option>
              </select>
            </div>
          </div>

          {filteredGlassware.length === 0 ? (
            <div className="card py-16 text-center">
              <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
              <p className="font-montserrat text-xs text-text-tertiary mt-2">
                Попробуйте изменить поисковый запрос
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredGlassware.map((glass) => (
                <div
                  key={glass.key}
                  onClick={() => setEditingGlasswareKey(glass.key)}
                  className="card card-hover cursor-pointer relative p-4 transition-all duration-200 border border-border flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-full bg-surface-secondary/40 flex items-center justify-center text-brand">
                        <Wine className="w-4 h-4" />
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-secondary/50 text-text-primary font-montserrat text-[11px] uppercase tracking-wider font-medium">
                        Посуда · шт
                      </span>
                    </div>

                    <h3 className="font-cormorant italic text-xl text-text-primary leading-tight font-semibold mt-1">
                      {glass.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-border text-xs font-montserrat text-text-secondary">
                    {glass.usageCount > 0 ? (
                      <span>
                        Используется в <strong className="text-text-primary font-semibold">{glass.usageCount}</strong> {glass.usageCount === 1 ? "коктейле" : glass.usageCount < 5 ? "коктейлях" : "коктейлях"}
                      </span>
                    ) : (
                      <span className="text-text-tertiary">Не привязан к коктейлям</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== МОДАЛКИ КОКТЕЙЛЕЙ ===================== */}
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
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={addCocktail}
        categories={cocktailCategories}
        availableIngredients={availableIngredients}
        availableDecorations={availableDecorations}
        availableGlassware={availableGlassware}
        availableIce={availableIce}
        ingredientInfo={ingredientInfo}
      />

      {/* ===================== МОДАЛКИ ПОЛУФАБРИКАТОВ ===================== */}
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
        open={isAddPfOpen}
        onClose={() => setIsAddPfOpen(false)}
        onAdd={addSemiProduct}
        availableIngredients={availableIngredients}
        ingredientInfo={ingredientInfo}
      />

      {/* ===================== МОДАЛКИ ИНГРЕДИЕНТОВ ===================== */}
      <IngredientEditModal
        open={Boolean(editingIngredientKey)}
        onClose={() => setEditingIngredientKey(null)}
        ingredient={selectedIngredient}
        categories={categoryNames}
        onSave={updateIngredient}
        onDelete={removeIngredient}
      />

      <IngredientAddModal
        open={isAddIngredientOpen}
        onClose={() => setIsAddIngredientOpen(false)}
        categories={categoryNames}
        onAdd={addIngredient}
      />

      {/* ===================== МОДАЛКА КАТЕГОРИЙ ===================== */}
      <CategoriesManageModal
        open={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={categoryNames}
        onAddCategory={addCategory}
        onRemoveCategory={removeCategory}
      />

      {/* ===================== МОДАЛКИ ПОСУДЫ ===================== */}
      <GlasswareEditModal
        open={Boolean(editingGlasswareKey)}
        onClose={() => setEditingGlasswareKey(null)}
        glassware={selectedGlassware}
        onSave={handleUpdateGlassware}
        onDelete={handleRemoveGlassware}
      />

      <GlasswareAddModal
        open={isAddGlasswareOpen}
        onClose={() => setIsAddGlasswareOpen(false)}
        onAdd={handleAddGlassware}
      />

      {/* Подтверждение удаления ингредиента из таблицы */}
      <ConfirmDialog
        open={Boolean(deletingIngredient)}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={() => {
          if (deletingIngredient) {
            removeIngredient(deletingIngredient.key)
          }
        }}
        title="Удаление ингредиента"
        description={`Удалить ингредиент «${deletingIngredient?.name}» из базы?`}
        confirmText="Удалить"
      />
    </div>
  )
}
