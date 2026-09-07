import { useState, useMemo } from "react"
import { Search, Filter, ArrowUpDown, Pencil, Trash2, Tag, AlertCircle } from "lucide-react"
import { useIngredients, IngredientData } from "@/context/IngredientsContext"
import { useCategories } from "@/context/CategoriesContext"
import { useCocktails } from "@/context/CocktailsContext"
import { useSemiProducts } from "@/context/SemiProductsContext"
import { IngredientAddModal } from "./IngredientAddModal"
import { IngredientEditModal } from "./IngredientEditModal"
import { CategoriesManageModal } from "./CategoriesManageModal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { capitalize, cleanPfKey } from "@/utils/formatting"

type SortOrder = "name_asc" | "name_desc"

interface IngredientsTabProps {
  isAddOpen?: boolean
  onAddClose?: () => void
}

export function IngredientsTab({
  isAddOpen: externalAddOpen,
  onAddClose: onExternalAddClose,
}: IngredientsTabProps = {}) {
  const {
    prices,
    categories,
    ingredientInfo,
    bottleVolumes,
    addIngredient,
    updateIngredient,
    removeIngredient,
  } = useIngredients()

  const { categoryNames, addCategory, removeCategory } = useCategories()
  const { cocktails } = useCocktails()
  const { semiProducts } = useSemiProducts()

  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc")

  // Modals state
  const [editingIngredientKey, setEditingIngredientKey] = useState<string | null>(null)
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [isManageCatsOpen, setIsManageCatsOpen] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  // Карта использования ингредиента в коктейлях и ПФ
  const usageMap = useMemo(() => {
    const map: Record<string, { cocktails: string[]; semis: string[] }> = {}
    const normalizedKeyToOriginalKey: Record<string, string> = {}

    Object.keys(prices).forEach((k) => {
      map[k] = { cocktails: [], semis: [] }
      normalizedKeyToOriginalKey[cleanPfKey(k)] = k
      normalizedKeyToOriginalKey[k.toLowerCase().trim()] = k
    })

    const recordUsage = (ingKey: string, itemName: string, type: "cocktails" | "semis") => {
      if (!ingKey) return
      const clean = cleanPfKey(ingKey)
      const targetKey = map[ingKey]
        ? ingKey
        : normalizedKeyToOriginalKey[clean] ||
          normalizedKeyToOriginalKey[ingKey.toLowerCase().trim()]
      if (targetKey && map[targetKey] && !map[targetKey][type].includes(itemName)) {
        map[targetKey][type].push(itemName)
      }
    }

    Object.values(cocktails).forEach((cocktail) => {
      Object.keys(cocktail.recipe || {}).forEach((ing) => {
        recordUsage(ing, cocktail.name, "cocktails")
      })
      Object.keys(cocktail.decorations || {}).forEach((dec) => {
        recordUsage(dec, cocktail.name, "cocktails")
      })
    })

    Object.values(semiProducts).forEach((semi) => {
      Object.keys(semi.recipe || {}).forEach((ing) => {
        recordUsage(ing, semi.name, "semis")
      })
    })

    return map
  }, [prices, cocktails, semiProducts])

  // Список ингредиентов без посуды
  const ingredientsList = useMemo(() => {
    return Object.keys(prices)
      .filter((key) => categories[key] !== "посуда")
      .map((key) => {
        const info = ingredientInfo[key] || {}
        return {
          key,
          name: info.display_name || key,
          category: categories[key] || "алкоголь",
          price: prices[key] || 0,
          unit: info.unit || "л",
          bottle: bottleVolumes[key],
        }
      })
  }, [prices, categories, ingredientInfo, bottleVolumes])

  const { unusedCount, usedCount } = useMemo(() => {
    let unused = 0
    let used = 0
    ingredientsList.forEach((item) => {
      const usage = usageMap[item.key]
      const total = (usage?.cocktails.length || 0) + (usage?.semis.length || 0)
      if (total === 0) {
        unused++
      } else {
        used++
      }
    })
    return { unusedCount: unused, usedCount: used }
  }, [ingredientsList, usageMap])

  const filteredIngredients = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ingredientsList
      .filter((item) => {
        const usage = usageMap[item.key]
        const total = (usage?.cocktails.length || 0) + (usage?.semis.length || 0)
        const isUnused = total === 0

        if (categoryFilter === "unused") {
          if (!isUnused) return false
        } else if (categoryFilter === "used") {
          if (isUnused) return false
        } else if (categoryFilter !== "all" && item.category !== categoryFilter) {
          return false
        }

        if (!q) return true
        return (
          item.name.toLowerCase().includes(q) ||
          item.key.toLowerCase().includes(q) ||
          (categoryNames[item.category] || item.category).toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [ingredientsList, query, categoryFilter, sortOrder, categoryNames, usageMap])

  const ingredientCategoriesOnly = useMemo(() => {
    const cats = { ...categoryNames }
    delete cats["посуда"]
    return cats
  }, [categoryNames])

  const selectedIngredient: IngredientData | null = editingIngredientKey
    ? {
        key: editingIngredientKey,
        name: ingredientInfo[editingIngredientKey]?.display_name || editingIngredientKey,
        category: categories[editingIngredientKey] || "алкоголь",
        price: prices[editingIngredientKey] || 0,
        unit: ingredientInfo[editingIngredientKey]?.unit || "л",
        bottle: bottleVolumes[editingIngredientKey],
      }
    : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск ингредиента по названию..."
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
              <option value="all">Все категории ({ingredientsList.length})</option>
              <option value="unused">⚠️ Не используются ({unusedCount})</option>
              <option value="used">✓ Используются ({usedCount})</option>
              <option disabled>──────────</option>
              {Object.entries(ingredientCategoriesOnly).map(([k, name]) => {
                const count = ingredientsList.filter((ing) => ing.category === k).length
                return (
                  <option key={k} value={k}>
                    {name.toUpperCase()} ({count})
                  </option>
                )
              })}
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
            onClick={() => setIsManageCatsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-sketch bg-bg-app hover:border-brand font-tenor text-[11px] uppercase tracking-leif text-text-primary transition-all"
            title="Управление списком категорий"
          >
            <Tag className="w-3.5 h-3.5 text-brand" />
            Категории ({Object.keys(categoryNames).length})
          </button>
        </div>
      </div>

      {filteredIngredients.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
          <p className="font-assistant text-xs text-text-tertiary mt-2">
            Попробуйте изменить поисковый запрос или категорию
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden bg-bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm font-assistant">
              <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] font-tenor tracking-leif">
                <tr>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Категория</th>
                  <th className="px-4 py-3 text-right">Тара / Бутылка</th>
                  <th className="px-4 py-3 text-right">Цена за ед.</th>
                  <th className="px-4 py-3">Использование</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.map((item, i) => {
                  const usage = usageMap[item.key] || { cocktails: [], semis: [] }
                  const totalUsages = usage.cocktails.length + usage.semis.length
                  const isUnused = totalUsages === 0

                  return (
                    <tr
                      key={item.key}
                      onClick={() => setEditingIngredientKey(item.key)}
                      className={`border-b border-border/60 hover:bg-surface-secondary/20 cursor-pointer transition-colors ${
                        isUnused
                          ? "bg-amber-500/[0.06] hover:bg-amber-500/[0.12]"
                          : i % 2 === 0
                            ? "bg-bg-card"
                            : "bg-bg-app/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        <div className="flex items-center gap-2">
                          {isUnused && (
                            <span
                              className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                              title="Ингредиент не используется ни в одном коктейле или полуфабрикате"
                            />
                          )}
                          <span>{capitalize(item.name)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-secondary/40 text-text-secondary font-tenor text-[10px] uppercase tracking-leif font-semibold">
                          {categoryNames[item.category] || item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary text-xs">
                        {item.bottle ? `${item.bottle} ${item.unit}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-text-primary">
                        {item.price > 0 ? (
                          <span>
                            {item.price.toLocaleString()} ₽ / {item.unit}
                          </span>
                        ) : (
                          <span className="text-text-tertiary italic text-xs">Не указана</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">
                        {totalUsages > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-text-primary font-medium">
                              {usage.cocktails.length > 0 && `${usage.cocktails.length} кокт.`}
                              {usage.cocktails.length > 0 && usage.semis.length > 0 && ", "}
                              {usage.semis.length > 0 && `${usage.semis.length} ПФ`}
                            </span>
                            <span
                              className="text-[11px] text-text-tertiary truncate max-w-[200px]"
                              title={[
                                ...usage.cocktails,
                                ...usage.semis.map((s) => `(ПФ) ${s}`),
                              ].join(", ")}
                            >
                              {[...usage.cocktails, ...usage.semis.map((s) => `(ПФ) ${s}`)]
                                .slice(0, 2)
                                .join(", ")}
                              {totalUsages > 2 ? "..." : ""}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            Не используется
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setEditingIngredientKey(item.key)}
                            className="p-1.5 rounded hover:bg-surface-secondary/50 text-text-secondary hover:text-brand transition-colors"
                            title="Редактировать ингредиент"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingKey(item.key)}
                            className="p-1.5 rounded hover:bg-red-50 text-text-secondary hover:text-red-500 transition-colors"
                            title="Удалить ингредиент"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модалки ингредиентов */}
      <IngredientEditModal
        open={Boolean(editingIngredientKey)}
        onClose={() => setEditingIngredientKey(null)}
        ingredient={selectedIngredient}
        categories={ingredientCategoriesOnly}
        onSave={updateIngredient}
        onDelete={removeIngredient}
      />

      <IngredientAddModal
        open={isAddIngredientOpen || Boolean(externalAddOpen)}
        onClose={() => {
          setIsAddIngredientOpen(false)
          onExternalAddClose?.()
        }}
        categories={ingredientCategoriesOnly}
        onAdd={addIngredient}
      />

      <CategoriesManageModal
        open={isManageCatsOpen}
        onClose={() => setIsManageCatsOpen(false)}
        categories={categoryNames}
        onAddCategory={addCategory}
        onRemoveCategory={removeCategory}
      />

      <ConfirmDialog
        open={Boolean(deletingKey)}
        onClose={() => setDeletingKey(null)}
        onConfirm={() => {
          if (deletingKey) removeIngredient(deletingKey)
        }}
        title="Удалить ингредиент?"
        description={`Вы действительно хотите удалить ингредиент «${
          deletingKey ? ingredientInfo[deletingKey]?.display_name || deletingKey : ""
        }»? Данные будут стёрты из базы.`}
        confirmText="Удалить"
        danger
      />
    </div>
  )
}
