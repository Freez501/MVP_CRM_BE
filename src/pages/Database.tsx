// src/pages/Database.tsx
import { useState, useMemo } from "react"
import { Plus, Wine } from "lucide-react"
import { useCocktails } from "@/context/CocktailsContext"
import { useSemiProducts } from "@/context/SemiProductsContext"
import { useIngredients } from "@/context/IngredientsContext"
import { Button } from "@/components/ui/button"
import { CocktailsTab } from "@/components/database/CocktailsTab"
import { SemiProductsTab } from "@/components/database/SemiProductsTab"
import { IngredientsTab } from "@/components/database/IngredientsTab"
import { GlasswareTab } from "@/components/database/GlasswareTab"

type Tab = "cocktails" | "semi" | "ingredients" | "glassware"

export default function Database() {
  const { cocktails } = useCocktails()
  const { semiProducts } = useSemiProducts()
  const { prices, categories } = useIngredients()

  const [tab, setTab] = useState<Tab>("cocktails")
  const [isAddOpen, setIsAddOpen] = useState(false)

  const cocktailsCount = useMemo(() => Object.keys(cocktails).length, [cocktails])
  const semiCount = useMemo(() => Object.keys(semiProducts).length, [semiProducts])
  const ingredientsCount = useMemo(
    () => Object.keys(prices).filter((k) => categories[k] !== "посуда").length,
    [prices, categories]
  )
  const glasswareCount = useMemo(
    () => Object.keys(prices).filter((k) => categories[k] === "посуда").length,
    [prices, categories]
  )

  const getAddButtonLabel = () => {
    switch (tab) {
      case "cocktails":
        return "Новый коктейль"
      case "semi":
        return "Новый полуфабрикат"
      case "ingredients":
        return "Новый ингредиент"
      case "glassware":
        return "Новая посуда"
    }
  }

  return (
    <div className="space-y-6">
      {/* Шапка базы данных */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-cormorant italic text-3xl text-text-primary font-semibold">
            База рецептов и ингредиентов
          </h1>
          <p className="font-assistant text-xs text-text-tertiary mt-1">
            Коктейли, полуфабрикаты, цены на алкоголь, ингредиенты и посуду
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 self-start sm:self-auto font-tenor text-xs uppercase tracking-leif font-semibold"
        >
          <Plus className="w-4 h-4" />
          {getAddButtonLabel()}
        </Button>
      </div>

      {/* Навигационные табы */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          type="button"
          onClick={() => setTab("cocktails")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-tenor text-xs uppercase tracking-leif font-semibold transition-all ${
            tab === "cocktails"
              ? "bg-accent-primary text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40"
          }`}
        >
          <span>🍸 Коктейли</span>
          <span className="text-[10px] opacity-75 font-normal">({cocktailsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("semi")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-tenor text-xs uppercase tracking-leif font-semibold transition-all ${
            tab === "semi"
              ? "bg-accent-primary text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40"
          }`}
        >
          <span>🍯 Полуфабрикаты</span>
          <span className="text-[10px] opacity-75 font-normal">({semiCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("ingredients")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-tenor text-xs uppercase tracking-leif font-semibold transition-all ${
            tab === "ingredients"
              ? "bg-accent-primary text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40"
          }`}
        >
          <span>🍾 Ингредиенты и цены</span>
          <span className="text-[10px] opacity-75 font-normal">({ingredientsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setTab("glassware")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-tenor text-xs uppercase tracking-leif font-semibold transition-all ${
            tab === "glassware"
              ? "bg-accent-primary text-text-primary shadow-sm"
              : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40"
          }`}
        >
          <Wine className="w-3.5 h-3.5" />
          <span>Посуда</span>
          <span className="text-[10px] opacity-75 font-normal">({glasswareCount})</span>
        </button>
      </div>

      {/* Содержимое вкладки */}
      {tab === "cocktails" && (
        <CocktailsTab isAddOpen={isAddOpen} onAddClose={() => setIsAddOpen(false)} />
      )}
      {tab === "semi" && (
        <SemiProductsTab isAddOpen={isAddOpen} onAddClose={() => setIsAddOpen(false)} />
      )}
      {tab === "ingredients" && (
        <IngredientsTab isAddOpen={isAddOpen} onAddClose={() => setIsAddOpen(false)} />
      )}
      {tab === "glassware" && (
        <GlasswareTab isAddOpen={isAddOpen} onAddClose={() => setIsAddOpen(false)} />
      )}
    </div>
  )
}
