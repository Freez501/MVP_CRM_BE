// src/components/calculator/CocktailCard.tsx
import React from "react"
import { Plus, Minus } from "lucide-react"
import { Cocktail } from "@/types/db"

interface CocktailCardProps {
  cocktail: Cocktail & { key: string }
  qty: number
  onQtyChange: (delta: number) => void
  onQtySet: (qty: number) => void
}

export const CocktailCard = React.memo(function CocktailCard({
  cocktail,
  qty,
  onQtyChange,
  onQtySet,
}: CocktailCardProps) {
  const isSelected = qty > 0

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-150 ${
        isSelected
          ? "bg-accent-primary/20 border-brand shadow-sm"
          : "bg-bg-card border-border hover:border-border-sketch"
      }`}
    >
      <div className="min-w-0 pr-2">
        <h4 className="font-tenor font-bold uppercase tracking-leif text-xs sm:text-[13px] text-text-primary leading-snug truncate">
          {cocktail.name}
        </h4>
        <span className="inline-block mt-0.5 text-xs font-montserrat text-text-secondary font-medium">
          {cocktail.category}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Быстрые +10 порций */}
        <button
          type="button"
          onClick={() => onQtyChange(10)}
          className="px-1.5 py-0.5 text-[10px] font-tenor uppercase tracking-leif font-semibold text-text-tertiary hover:text-brand hover:bg-surface-secondary/40 rounded transition-colors"
          title="Добавить +10 порций"
        >
          +10
        </button>

        {/* Счётчик порций [-] [qty] [+] */}
        <button
          type="button"
          onClick={() => onQtyChange(-1)}
          disabled={qty === 0}
          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
            qty > 0
              ? "bg-bg-app border border-border-sketch text-text-primary hover:border-brand active:scale-95"
              : "opacity-30 cursor-not-allowed text-text-tertiary border border-border"
          }`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <input
          type="number"
          min="0"
          value={qty === 0 ? "" : qty}
          placeholder="0"
          onChange={(e) => onQtySet(parseInt(e.target.value) || 0)}
          className="w-12 h-7 bg-bg-app border border-border-sketch rounded font-assistant text-xs font-semibold text-center text-text-primary focus:outline-none focus:border-brand"
        />

        <button
          type="button"
          onClick={() => onQtyChange(1)}
          className="w-7 h-7 rounded-md bg-accent-primary border border-accent-primary flex items-center justify-center text-text-primary hover:brightness-95 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
})
