import { forwardRef } from "react"
import { useCalculator } from "../useCalculator"
import { PrintHeader } from "./PrintHeader"
import { PrintMenuSection } from "./PrintMenuSection"
import { PrintTtkSection } from "./PrintTtkSection"
import { PrintSemiProducts } from "./PrintSemiProducts"
import { PrintIngredientsTable } from "./PrintIngredientsTable"
import { PrintTotals } from "./PrintTotals"

export interface PrintableSmetaProps {
  calculation: ReturnType<typeof useCalculator>
  totalPortions: number
  grandTotalCost: number
  selectedCount: number
  eventName?: string
  eventDate?: string
  bufferPercent?: number
}

export const PrintableSmeta = forwardRef<HTMLDivElement, PrintableSmetaProps>(
  (
    {
      calculation,
      totalPortions,
      grandTotalCost,
      selectedCount,
      eventName,
      eventDate,
      bufferPercent,
    },
    ref
  ) => {
    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })

    return (
      <div
        ref={ref}
        style={{
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#ffffff",
          color: "#111111",
          padding: "36px 32px",
          maxWidth: "850px",
          margin: "0 auto",
          fontSize: "12px",
          lineHeight: "1.5",
        }}
      >
        {/* ─── Шапка документа ─── */}
        <PrintHeader
          eventName={eventName}
          formattedDate={formattedDate}
          totalPortions={totalPortions}
          selectedCount={selectedCount}
          bufferPercent={bufferPercent}
        />

        {/* ─── 1. Заказное меню коктейлей ─── */}
        <PrintMenuSection ttkList={calculation.ttkList} />

        {/* ─── 2. Технико-технологические карты (ТТК) ─── */}
        <PrintTtkSection ttkList={calculation.ttkList} />

        {/* ─── 3. Полуфабрикаты (ТТК приготовления на мероприятие) ─── */}
        <PrintSemiProducts pfToMake={calculation.categorized.pf_to_make} />

        {/* ─── 4. Сводная смета закупки ─── */}
        <PrintIngredientsTable categorized={calculation.categorized} />

        {/* ─── 5. Итоговая строка ─── */}
        <PrintTotals grandTotalCost={grandTotalCost} />
      </div>
    )
  }
)

PrintableSmeta.displayName = "PrintableSmeta"
