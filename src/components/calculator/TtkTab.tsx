// src/components/calculator/TtkTab.tsx
import React from "react"
import { TtkCocktail, PfToMakeItem } from "./useCalculator"

interface TtkTabProps {
  ttkList: TtkCocktail[]
  pfToMake: PfToMakeItem[]
}

export const TtkTab = React.memo(function TtkTab({ ttkList, pfToMake }: TtkTabProps) {
  return (
    <div className="space-y-4">
      {ttkList.map((cocktail) => (
        <div key={cocktail.key} className="bg-bg-app border border-border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h4 className="font-tenor font-bold uppercase tracking-leif text-sm sm:text-base text-text-primary">
              {cocktail.name}
            </h4>
            <span className="bg-accent-primary/60 text-text-primary font-tenor text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-leif">
              {cocktail.count} порций
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Слева: Состав */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary block border-b border-border/40 pb-0.5">
                Ингредиенты / Состав:
              </span>
              {cocktail.recipeItems?.length > 0 ? (
                cocktail.recipeItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between font-assistant text-xs py-0.5 border-b border-border/30 last:border-0"
                  >
                    <span className="text-text-primary font-medium pr-1 truncate">{item.name}</span>
                    <div className="text-right shrink-0">
                      <span className="text-text-tertiary text-[11px]">
                        {item.displayFormula} ={" "}
                      </span>
                      <span className="font-bold text-text-primary">{item.displayTotal}</span>
                    </div>
                  </div>
                ))
              ) : (
                <span className="text-text-tertiary text-xs italic">—</span>
              )}
            </div>

            {/* Справа: Подача (Лёд, Украшение, Посуда) */}
            <div className="space-y-2.5 sm:border-l sm:border-border sm:pl-4">
              {/* Лёд */}
              <div>
                <span className="text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary block pb-0.5">
                  Лёд:
                </span>
                {cocktail.iceItems?.length > 0 ? (
                  cocktail.iceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between font-assistant text-xs py-0.5"
                    >
                      <span className="text-text-primary font-medium pr-1 truncate">
                        {item.name}
                      </span>
                      <div className="text-right shrink-0">
                        <span className="text-text-tertiary text-[11px]">
                          {item.displayFormula} ={" "}
                        </span>
                        <span className="font-bold text-text-primary">{item.displayTotal}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-text-tertiary text-[11px] italic">Без льда</span>
                )}
              </div>

              {/* Украшение */}
              <div>
                <span className="text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary block pb-0.5">
                  Украшение:
                </span>
                {cocktail.decorationItems?.length > 0 ? (
                  cocktail.decorationItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between font-assistant text-xs py-0.5"
                    >
                      <span className="text-text-primary font-medium pr-1 truncate">
                        {item.name}
                      </span>
                      <div className="text-right shrink-0">
                        <span className="text-text-tertiary text-[11px]">
                          {item.displayFormula} ={" "}
                        </span>
                        <span className="font-bold text-text-primary">{item.displayTotal}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-text-tertiary text-[11px] italic">Без украшения</span>
                )}
              </div>

              {/* Посуда */}
              <div>
                <span className="text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary block pb-0.5">
                  Посуда:
                </span>
                {cocktail.glasswareItems?.length > 0 ? (
                  cocktail.glasswareItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between font-assistant text-xs py-0.5"
                    >
                      <span className="text-text-primary font-medium pr-1 truncate">
                        {item.name}
                      </span>
                      <div className="text-right shrink-0">
                        <span className="text-text-tertiary text-[11px]">
                          {item.displayFormula} ={" "}
                        </span>
                        <span className="font-bold text-text-primary">{item.displayTotal}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-text-tertiary text-[11px] italic">Не указана</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* ТТК Полуфабрикатов к приготовлению */}
      {pfToMake.length > 0 && (
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            🍯 ТТК полуфабрикатов к приготовлению ({pfToMake.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pfToMake.map((pf) => (
              <div key={pf.key} className="bg-bg-app border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-border">
                  <h4 className="font-tenor font-bold uppercase tracking-leif text-xs sm:text-sm text-text-primary truncate pr-1">
                    {pf.name}
                  </h4>
                  <span className="bg-accent-primary/60 text-text-primary font-tenor text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-leif shrink-0">
                    Приготовить: {pf.volume} {pf.unit}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold font-tenor uppercase tracking-leif text-text-tertiary block border-b border-border/40 pb-0.5">
                    Ингредиенты / Состав:
                  </span>
                  {pf.items?.length > 0 ? (
                    pf.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between font-assistant text-xs py-0.5 border-b border-border/30 last:border-0"
                      >
                        <span className="text-text-primary font-medium pr-1 truncate">
                          {item.name}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="text-text-tertiary text-[10px]">
                            {item.displayFormula} ={" "}
                          </span>
                          <span className="font-bold text-text-primary text-[11px]">
                            {item.displayTotal}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-text-tertiary text-xs italic">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
