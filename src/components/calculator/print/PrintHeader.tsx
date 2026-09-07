import React from "react"

export interface PrintHeaderProps {
  eventName?: string
  formattedDate: string
  totalPortions: number
  selectedCount: number
  bufferPercent?: number
}

export const PrintHeader = React.memo(function PrintHeader({
  eventName,
  formattedDate,
  totalPortions,
  selectedCount,
  bufferPercent,
}: PrintHeaderProps) {
  return (
    <div
      data-pdf-block="true"
      style={{
        borderBottom: "2px solid #111111",
        paddingBottom: "14px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "20px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "#000000",
          }}
        >
          {eventName ? eventName : "Смета закупок и ТТК"}
        </h1>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "#555555", fontWeight: "500" }}>
          {eventName
            ? "Смета закупок и ТТК коктейлей · Brilliant Bar Catering"
            : "CocktailCalc Pro · Brilliant Bar Catering"}
        </p>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#111111" }}>
          {formattedDate}
        </p>
        <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#555555", fontWeight: "500" }}>
          {totalPortions} порций · {selectedCount} позиций{" "}
          {bufferPercent && bufferPercent > 0 ? `· Запас: +${bufferPercent}%` : ""}
        </p>
      </div>
    </div>
  )
})
