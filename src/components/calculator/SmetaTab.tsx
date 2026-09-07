// src/components/calculator/SmetaTab.tsx
import React from "react"
import { Wine } from "lucide-react"
import { CategorizedIngredients } from "./useCalculator"

interface SmetaTabProps {
  categorized: CategorizedIngredients
}

export const SmetaTab = React.memo(function SmetaTab({ categorized }: SmetaTabProps) {
  return (
    <div className="space-y-6">
      {/* Полуфабрикаты к приготовлению */}
      {categorized.pf_to_make.length > 0 && (
        <div className="border border-border rounded-lg p-3.5 bg-bg-app/50">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary mb-2 flex items-center gap-1.5">
            🍯 Полуфабрикаты к приготовлению ({categorized.pf_to_make.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categorized.pf_to_make.map((pf) => (
              <div
                key={pf.key}
                className="flex items-center justify-between bg-bg-card px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary truncate">{pf.name}</span>
                <span className="font-semibold text-brand shrink-0 ml-2">
                  {pf.volume} {pf.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Алкоголь */}
      {categorized.alcohol.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            🥃 Алкоголь ({categorized.alcohol.length})
          </h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs font-assistant">
              <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] font-tenor tracking-leif">
                <tr>
                  <th className="px-3 py-2">Позиция</th>
                  <th className="px-3 py-2 text-right">Объём</th>
                  <th className="px-3 py-2 text-right">Бутылки</th>
                  <th className="px-3 py-2 text-right">Сумма, ₽</th>
                </tr>
              </thead>
              <tbody>
                {categorized.alcohol.map((a, i) => (
                  <tr
                    key={a.name}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? "bg-bg-card" : "bg-bg-app/30"
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-text-primary">{a.name}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {a.amount.toFixed(3)} л
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text-primary">
                      {a.bottles} бут. ({a.bottleVol} л)
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text-primary">
                      {a.cost.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Безалкогольное и соки */}
      {categorized.non_alcohol.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            🥤 Безалкогольное / Соки ({categorized.non_alcohol.length})
          </h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs font-assistant">
              <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] font-tenor tracking-leif">
                <tr>
                  <th className="px-3 py-2">Позиция</th>
                  <th className="px-3 py-2 text-right">Объём</th>
                  <th className="px-3 py-2 text-right">Сумма, ₽</th>
                </tr>
              </thead>
              <tbody>
                {categorized.non_alcohol.map((na, i) => (
                  <tr
                    key={na.name}
                    className={`border-b border-border last:border-0 ${
                      i % 2 === 0 ? "bg-bg-card" : "bg-bg-app/30"
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-text-primary">{na.name}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {na.amount.toFixed(3)} л
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text-primary">
                      {na.cost.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Сиропы, пюре, концентраты */}
      {(categorized.syrups.length > 0 ||
        categorized.puree.length > 0 ||
        categorized.concentrate.length > 0) && (
        <div className="space-y-2">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            🧪 Сиропы и пюре
          </h4>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs font-assistant">
              <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] font-tenor tracking-leif">
                <tr>
                  <th className="px-3 py-2">Позиция</th>
                  <th className="px-3 py-2 text-right">Объём / Тара</th>
                  <th className="px-3 py-2 text-right">Сумма, ₽</th>
                </tr>
              </thead>
              <tbody>
                {categorized.syrups.map((s) => (
                  <tr key={s.name} className="border-b border-border last:border-0 bg-bg-card">
                    <td className="px-3 py-2 font-medium text-text-primary">{s.name}</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {s.amount.toFixed(3)} л ({s.bottles} бут.)
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text-primary">
                      {s.cost.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
                {categorized.puree.map((p) => (
                  <tr key={p.name} className="border-b border-border last:border-0 bg-bg-card">
                    <td className="px-3 py-2 font-medium text-text-primary">{p.name} (пюре)</td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {p.amount.toFixed(3)} л
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text-primary">
                      {p.cost.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
                {categorized.concentrate.map((c) => (
                  <tr key={c.name} className="border-b border-border last:border-0 bg-bg-card">
                    <td className="px-3 py-2 font-medium text-text-primary">
                      {c.name} (концентрат)
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {c.amount.toFixed(3)} л
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-text-primary">
                      {c.cost.toLocaleString()} ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Лёд */}
      {(categorized.ice_cube.length > 0 || categorized.ice_figurine.length > 0) && (
        <div className="space-y-2">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            🧊 Лёд
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categorized.ice_cube.map((ic) => (
              <div
                key={ic.name}
                className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary">{ic.name}</span>
                <span className="font-semibold text-text-primary">
                  {ic.amount} кг ({ic.cost.toLocaleString()} ₽)
                </span>
              </div>
            ))}
            {categorized.ice_figurine.map((ifig) => (
              <div
                key={ifig.name}
                className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary">{ifig.name}</span>
                <span className="font-semibold text-text-primary">
                  {ifig.amount} шт ({ifig.cost.toLocaleString()} ₽)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Украшения и сухие ингредиенты */}
      {(categorized.decorations_pcs.length > 0 ||
        categorized.decorations_gr.length > 0 ||
        categorized.dry_gr.length > 0) && (
        <div className="space-y-2">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            🍒 Украшения и специи
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categorized.decorations_pcs.map((dp) => (
              <div
                key={dp.name}
                className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary truncate">{dp.name}</span>
                <span className="font-semibold text-text-primary shrink-0 ml-2">
                  {dp.amount} шт ({dp.cost.toLocaleString()} ₽)
                </span>
              </div>
            ))}
            {categorized.decorations_gr.map((dg) => (
              <div
                key={dg.name}
                className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary truncate">{dg.name}</span>
                <span className="font-semibold text-text-primary shrink-0 ml-2">
                  {dg.displayWeight} ({dg.cost.toLocaleString()} ₽)
                </span>
              </div>
            ))}
            {categorized.dry_gr.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary truncate">{d.name}</span>
                <span className="font-semibold text-text-primary shrink-0 ml-2">
                  {d.displayWeight} ({d.cost.toLocaleString()} ₽)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Посуда */}
      {categorized.glassware.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-tenor font-bold text-xs uppercase tracking-leif text-text-primary flex items-center gap-1.5">
            <Wine className="w-3.5 h-3.5 text-brand" />
            Посуда и бокалы
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {categorized.glassware.map((g) => (
              <div
                key={g.name}
                className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-assistant"
              >
                <span className="font-medium text-text-primary">{g.name}</span>
                <span className="font-bold text-text-primary">{g.count} шт.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
