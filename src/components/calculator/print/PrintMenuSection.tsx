import React from "react"
import { TtkCocktail } from "../useCalculator"
import { printStyles } from "./printStyles"

export interface PrintMenuSectionProps {
  ttkList: TtkCocktail[]
}

export const PrintMenuSection = React.memo(function PrintMenuSection({
  ttkList,
}: PrintMenuSectionProps) {
  return (
    <div data-pdf-block="true" style={{ marginBottom: "20px" }}>
      <div style={printStyles.sectionHeader}>1. Заказ (Коктейли и количество)</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "28px",
          rowGap: "4px",
        }}
      >
        {ttkList.map((c) => (
          <div
            key={c.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "1px solid #e5e7eb",
              paddingBottom: "3px",
              fontSize: "11px",
            }}
          >
            <span style={{ fontWeight: "600", color: "#111111" }}>{c.name}</span>
            <span style={{ fontWeight: "700", color: "#000000" }}>{c.count} порций</span>
          </div>
        ))}
      </div>
    </div>
  )
})
