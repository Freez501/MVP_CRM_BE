import React from "react"
import { PfToMakeItem } from "../useCalculator"
import { sectionHeaderStyle } from "./printStyles"

interface PrintSemiProductsProps {
  pfToMake: PfToMakeItem[]
}

export const PrintSemiProducts: React.FC<PrintSemiProductsProps> = React.memo(({ pfToMake }) => {
  if (!pfToMake || pfToMake.length === 0) return null

  return (
    <div style={{ marginBottom: "20px" }}>
      <div data-pdf-block="true" style={sectionHeaderStyle}>
        3. Полуфабрикаты (ТТК приготовления на мероприятие)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {pfToMake.map((pf) => (
          <div
            key={pf.key}
            data-pdf-block="true"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "10px 12px",
              backgroundColor: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "4px",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000" }}>
                {pf.name}
              </span>
              <span
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "#111111",
                }}
              >
                Приготовить: {pf.volume} {pf.unit}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              {pf.items && pf.items.length > 0 ? (
                pf.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      fontSize: "10px",
                      borderBottom: "1px solid #f9fafb",
                      padding: "1px 0",
                    }}
                  >
                    <span style={{ color: "#111827", fontWeight: "500", paddingRight: "4px" }}>
                      {item.name}
                    </span>
                    <span style={{ color: "#000000", fontWeight: "700", whiteSpace: "nowrap" }}>
                      <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "9px" }}>
                        {item.displayFormula} ={" "}
                      </span>
                      {item.displayTotal}
                    </span>
                  </div>
                ))
              ) : (
                <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "10px" }}>—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

PrintSemiProducts.displayName = "PrintSemiProducts"
