import React from "react"

interface PrintTotalsProps {
  grandTotalCost: number
}

export const PrintTotals: React.FC<PrintTotalsProps> = React.memo(({ grandTotalCost }) => {
  return (
    <div
      data-pdf-block="true"
      style={{
        borderTop: "2px solid #111111",
        paddingTop: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "14px",
        fontWeight: "800",
      }}
    >
      <span style={{ textTransform: "uppercase", color: "#111111" }}>ИТОГО К ЗАКУПКЕ:</span>
      <span style={{ fontSize: "17px", color: "#000000" }}>
        {grandTotalCost.toLocaleString()} ₽
      </span>
    </div>
  )
})

PrintTotals.displayName = "PrintTotals"
