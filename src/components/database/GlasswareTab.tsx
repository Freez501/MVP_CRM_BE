// src/components/database/GlasswareTab.tsx
import { useState, useMemo } from "react"
import { Search, Pencil, Trash2, AlertCircle } from "lucide-react"
import { useIngredients } from "@/context/IngredientsContext"
import { useCocktails } from "@/context/CocktailsContext"
import { GlasswareAddModal } from "./GlasswareAddModal"
import { GlasswareEditModal } from "./GlasswareEditModal"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { capitalize } from "@/utils/formatting"

interface GlasswareTabProps {
  isAddOpen?: boolean
  onAddClose?: () => void
}

export function GlasswareTab({
  isAddOpen: externalAddOpen,
  onAddClose: onExternalAddClose,
}: GlasswareTabProps = {}) {
  const { prices, categories, ingredientInfo, addIngredient, updateIngredient, removeIngredient } =
    useIngredients()

  const { cocktails } = useCocktails()

  const [query, setQuery] = useState("")
  const [editingGlassKey, setEditingGlassKey] = useState<string | null>(null)
  const [isAddGlassOpen, setIsAddGlassOpen] = useState(false)
  const [deletingKey, setDeletingKey] = useState<string | null>(null)

  // Карта использования бокалов в коктейлях
  const glasswareUsageMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    Object.keys(prices).forEach((k) => {
      if (categories[k] === "посуда") map[k] = []
    })

    Object.values(cocktails).forEach((cocktail) => {
      Object.keys(cocktail.glassware || {}).forEach((glass) => {
        if (!map[glass]) map[glass] = []
        if (!map[glass].includes(cocktail.name)) {
          map[glass].push(cocktail.name)
        }
      })
    })

    return map
  }, [prices, categories, cocktails])

  const glasswareList = useMemo(() => {
    return Object.keys(prices)
      .filter((key) => categories[key] === "посуда")
      .map((key) => {
        const info = ingredientInfo[key] || {}
        return {
          key,
          name: info.display_name || key,
          category: "посуда",
          price: prices[key] || 0,
          unit: info.unit || "шт",
        }
      })
  }, [prices, categories, ingredientInfo])

  const filteredGlassware = useMemo(() => {
    const q = query.trim().toLowerCase()
    return glasswareList
      .filter((item) => {
        if (!q) return true
        return item.name.toLowerCase().includes(q) || item.key.toLowerCase().includes(q)
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
  }, [glasswareList, query])

  const selectedGlass = editingGlassKey
    ? {
        key: editingGlassKey,
        name: ingredientInfo[editingGlassKey]?.display_name || editingGlassKey,
        usageCount: (glasswareUsageMap[editingGlassKey] || []).length,
      }
    : null

  const handleAddGlass = (name: string) => {
    const key = name.trim().toLowerCase()
    addIngredient({
      key,
      name: name.trim(),
      category: "посуда",
      price: 0,
      unit: "шт",
    })
  }

  const handleSaveGlass = (key: string, updates: { name: string }) => {
    updateIngredient(key, { name: updates.name })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-bg-card border border-border rounded-lg p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию посуды..."
            className="w-full bg-bg-app border border-border-sketch rounded pl-10 pr-4 py-1.5 font-assistant text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
          />
        </div>
      </div>

      {filteredGlassware.length === 0 ? (
        <div className="card py-16 text-center">
          <p className="font-cormorant italic text-2xl text-text-primary">Ничего не найдено</p>
          <p className="font-assistant text-xs text-text-tertiary mt-2">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGlassware.map((glass) => {
            const usages = glasswareUsageMap[glass.key] || []

            return (
              <div
                key={glass.key}
                onClick={() => setEditingGlassKey(glass.key)}
                className="card card-hover cursor-pointer relative p-4 transition-all duration-200 border border-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-surface-secondary/40 text-text-secondary font-tenor text-[10px] uppercase tracking-leif font-semibold">
                      Посуда / Бокал
                    </span>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEditingGlassKey(glass.key)}
                        className="p-1 rounded-full text-text-tertiary/60 hover:text-brand hover:bg-surface-secondary/40 transition-all"
                        title="Редактировать"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingKey(glass.key)}
                        className="p-1 rounded-full text-text-tertiary/60 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-tenor font-bold uppercase tracking-leif text-[13px] sm:text-[14px] text-text-primary leading-snug truncate">
                    {capitalize(glass.name)}
                  </h3>

                  <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs font-assistant">
                    <span className="text-text-secondary">Стоимость:</span>
                    <span className="font-bold text-text-primary">
                      {glass.price > 0 ? `${glass.price.toLocaleString()} ₽ / шт` : "—"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-border text-xs font-assistant text-text-secondary">
                  {usages.length > 0 ? (
                    <div>
                      <span className="text-text-secondary text-xs">
                        Используется в{" "}
                        <strong className="text-text-primary font-semibold">{usages.length}</strong>{" "}
                        {usages.length === 1
                          ? "коктейле"
                          : usages.length < 5
                            ? "коктейлях"
                            : "коктейлях"}
                        :
                      </span>
                      <p
                        className="text-[11px] text-text-tertiary truncate mt-0.5"
                        title={usages.join(", ")}
                      >
                        {usages.slice(0, 3).join(", ")}
                        {usages.length > 3 ? "..." : ""}
                      </p>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Не привязан к коктейлям
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Модалки посуды */}
      <GlasswareEditModal
        open={Boolean(editingGlassKey)}
        onClose={() => setEditingGlassKey(null)}
        glassware={selectedGlass}
        onSave={handleSaveGlass}
        onDelete={removeIngredient}
      />

      <GlasswareAddModal
        open={isAddGlassOpen || Boolean(externalAddOpen)}
        onClose={() => {
          setIsAddGlassOpen(false)
          onExternalAddClose?.()
        }}
        onAdd={handleAddGlass}
      />

      <ConfirmDialog
        open={Boolean(deletingKey)}
        onClose={() => setDeletingKey(null)}
        onConfirm={() => {
          if (deletingKey) removeIngredient(deletingKey)
        }}
        title="Удалить посуду?"
        description={`Вы действительно хотите удалить позицию «${
          deletingKey ? ingredientInfo[deletingKey]?.display_name || deletingKey : ""
        }»? Данные будут стёрты из базы.`}
        confirmText="Удалить"
        danger
      />
    </div>
  )
}
