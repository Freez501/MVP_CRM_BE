// src/components/calculator/CalculatorHeader.tsx
import { Sparkles, Calendar, RotateCcw, Calculator as CalcIcon } from "lucide-react"

interface CalculatorHeaderProps {
  eventName: string
  setEventName: (val: string) => void
  eventDate: string
  setEventDate: (val: string) => void
  bufferPercent: number
  setBufferPercent: (val: number) => void
  grandTotalCost: number
  totalPortions: number
  hasSelected: boolean
  onClear: () => void
}

export function CalculatorHeader({
  eventName,
  setEventName,
  eventDate,
  setEventDate,
  bufferPercent,
  setBufferPercent,
  grandTotalCost,
  totalPortions,
  hasSelected,
  onClear,
}: CalculatorHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Верхняя шапка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalcIcon className="w-5 h-5 text-brand" />
            <h1 className="font-cormorant italic text-2xl sm:text-3xl text-text-primary font-semibold">
              Калькулятор и смета закупок
            </h1>
          </div>
          <p className="font-assistant text-xs text-text-tertiary mt-1">
            Выберите коктейли и укажите количество порций для мгновенного расчёта сметы, ТТК и
            закупок
          </p>
        </div>

        <div className="flex items-center gap-4 self-end md:self-center">
          {totalPortions > 0 && (
            <div className="text-right">
              <span className="block font-tenor text-[10px] uppercase tracking-leif text-text-tertiary">
                Итого закупка {bufferPercent > 0 ? `(запас +${bufferPercent}%)` : ""}:
              </span>
              <span className="font-assistant font-bold text-xl sm:text-2xl text-text-primary">
                {grandTotalCost.toLocaleString()} ₽
              </span>
            </div>
          )}

          {hasSelected && (
            <button
              onClick={onClear}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-sketch hover:border-brand text-[11px] font-tenor uppercase tracking-leif text-text-secondary hover:text-brand transition-all"
              title="Сбросить все выбранные коктейли"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сброс
            </button>
          )}
        </div>
      </div>

      {/* Единая карточка информации о мероприятии (Название + Дата + Запас %) */}
      <div className="bg-bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
        {/* Название мероприятия */}
        <div className="flex-1 min-w-0 relative">
          <label className="block text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary mb-1">
            Название мероприятия / Заказчик
          </label>
          <div className="relative">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand/70" />
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Например: Свадьба Анны и Михаила, Корпоратив VK..."
              className="w-full bg-bg-app border border-border-sketch rounded-lg pl-10 pr-3 py-2 font-assistant text-xs sm:text-sm text-text-primary placeholder:italic placeholder:font-cormorant placeholder:text-text-tertiary focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Дата проведения */}
        <div className="w-full sm:w-52 shrink-0">
          <label className="block text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary mb-1">
            Дата проведения
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-bg-app border border-border-sketch rounded-lg pl-10 pr-3 py-2 font-assistant text-xs sm:text-sm text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            />
          </div>
        </div>

        {/* Коэффициент запаса / пролива */}
        <div className="shrink-0">
          <label className="block text-[10px] font-bold font-tenor uppercase tracking-leif text-text-tertiary mb-1">
            Запас на пролив / форс-мажор
          </label>
          <div className="flex items-center gap-1 bg-bg-app border border-border-sketch p-1 rounded-lg">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setBufferPercent(pct)}
                className={`px-2.5 py-1 rounded text-xs font-tenor font-semibold uppercase tracking-leif transition-all ${
                  bufferPercent === pct
                    ? "bg-brand text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40"
                }`}
              >
                {pct === 0 ? "0%" : `+${pct}%`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
