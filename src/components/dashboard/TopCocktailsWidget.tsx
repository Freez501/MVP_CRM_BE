import { useMemo } from "react"
import { Event } from "@/types"
import { Cocktail } from "@/types/db"
import { GlassWater, Sparkles } from "lucide-react"

interface TopCocktailsWidgetProps {
  events: Event[]
  cocktails: Record<string, Cocktail>
}

export function TopCocktailsWidget({ events, cocktails }: TopCocktailsWidgetProps) {
  const topCocktails = useMemo(() => {
    const map = new Map<string, number>()

    for (const event of events) {
      if (event.details?.cocktails) {
        for (const item of event.details.cocktails) {
          if (item.name && item.qty > 0) {
            map.set(item.name, (map.get(item.name) || 0) + item.qty)
          }
        }
      }
    }

    const sorted = Array.from(map.entries())
      .map(([name, totalQty]) => {
        // Find category from cocktail db
        const found = Object.values(cocktails).find(
          (c) => c.name.toLowerCase() === name.toLowerCase()
        )
        return {
          name,
          totalQty,
          category: found?.category || "Коктейли",
        }
      })
      .sort((a, b) => b.totalQty - a.totalQty)

    return sorted.slice(0, 5)
  }, [events, cocktails])

  const maxQty = topCocktails.length > 0 ? topCocktails[0].totalQty : 1

  return (
    <div className="card p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-surface-secondary/40 text-brand">
              <GlassWater className="w-4 h-4" />
            </div>
            <h3 className="font-cormorant italic text-[22px] text-text-primary">
              Топ коктейлей в заказах
            </h3>
          </div>
          <span className="font-montserrat text-xs text-text-tertiary flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand" />
            Статистика
          </span>
        </div>

        {topCocktails.length === 0 ? (
          <div className="py-8 text-center text-text-tertiary font-montserrat text-xs border border-dashed border-border-sketch rounded-lg">
            Коктейли ещё не добавлены в сметы мероприятий
          </div>
        ) : (
          <div className="space-y-3.5">
            {topCocktails.map((item, index) => {
              const percent = Math.round((item.totalQty / maxQty) * 100)
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-surface-secondary/50 flex items-center justify-center font-montserrat text-xs font-bold text-text-secondary">
                        {index + 1}
                      </span>
                      <span className="font-montserrat font-medium text-text-primary">
                        {item.name}
                      </span>
                      <span className="font-montserrat text-[11px] text-text-tertiary hidden sm:inline">
                        · {item.category}
                      </span>
                    </div>
                    <span className="font-montserrat font-bold text-text-primary">
                      {item.totalQty}{" "}
                      <span className="text-xs font-normal text-text-secondary">порц.</span>
                    </span>
                  </div>
                  <div className="w-full bg-surface-secondary/40 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
