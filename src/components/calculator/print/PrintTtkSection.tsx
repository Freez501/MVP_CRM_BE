import React from "react"
import { TtkCocktail } from "../useCalculator"
import { printStyles } from "./printStyles"

export interface PrintTtkSectionProps {
  ttkList: TtkCocktail[]
}

export const PrintTtkSection = React.memo(function PrintTtkSection({
  ttkList,
}: PrintTtkSectionProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div data-pdf-block="true" style={printStyles.sectionHeader}>
        2. Технологические карты (ТТК) на мероприятие
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {ttkList.map((c) => (
          <div
            key={c.key}
            data-pdf-block="true"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              padding: "10px 14px",
              backgroundColor: "#ffffff",
            }}
          >
            {/* Шапка карточки коктейля */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "6px",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#000000" }}>
                {c.name}
              </span>
              <span
                style={{
                  backgroundColor: "#f3f4f6",
                  border: "1px solid #e5e7eb",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: "700",
                  color: "#111111",
                }}
              >
                {c.count} порций
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px" }}>
              {/* Левая колонка: СОСТАВ */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#4b5563",
                    borderBottom: "1px solid #e5e7eb",
                    paddingBottom: "3px",
                    marginBottom: "4px",
                  }}
                >
                  Ингредиенты / Состав:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                  {c.recipeItems?.length > 0 ? (
                    c.recipeItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          fontSize: "11px",
                          borderBottom: "1px solid #f9fafb",
                          padding: "1px 0",
                        }}
                      >
                        <span style={{ color: "#111827", fontWeight: "500", paddingRight: "6px" }}>
                          {item.name}
                        </span>
                        <span
                          style={{
                            color: "#000000",
                            fontWeight: "700",
                            whiteSpace: "nowrap",
                            textAlign: "right",
                          }}
                        >
                          <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "10px" }}>
                            {item.displayFormula} ={" "}
                          </span>
                          {item.displayTotal}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>
                      —
                    </span>
                  )}
                </div>
              </div>

              {/* Правая колонка: ЛЁД, УКРАШЕНИЕ, ПОСУДА */}
              <div
                style={{
                  borderLeft: "1px solid #e5e7eb",
                  paddingLeft: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Лёд */}
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#4b5563",
                      marginBottom: "2px",
                    }}
                  >
                    Лёд:
                  </div>
                  {c.iceItems?.length > 0 ? (
                    c.iceItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "#111827", fontWeight: "500", paddingRight: "4px" }}>
                          {item.name}
                        </span>
                        <span style={{ color: "#000000", fontWeight: "700", whiteSpace: "nowrap" }}>
                          <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "10px" }}>
                            {item.displayFormula} ={" "}
                          </span>
                          {item.displayTotal}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>
                      Без льда
                    </span>
                  )}
                </div>

                {/* Украшение */}
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#4b5563",
                      marginBottom: "2px",
                    }}
                  >
                    Украшение:
                  </div>
                  {c.decorationItems?.length > 0 ? (
                    c.decorationItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "#111827", fontWeight: "500", paddingRight: "4px" }}>
                          {item.name}
                        </span>
                        <span style={{ color: "#000000", fontWeight: "700", whiteSpace: "nowrap" }}>
                          <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "10px" }}>
                            {item.displayFormula} ={" "}
                          </span>
                          {item.displayTotal}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>
                      Без украшения
                    </span>
                  )}
                </div>

                {/* Посуда */}
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      color: "#4b5563",
                      marginBottom: "2px",
                    }}
                  >
                    Посуда:
                  </div>
                  {c.glasswareItems?.length > 0 ? (
                    c.glasswareItems.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          fontSize: "11px",
                        }}
                      >
                        <span style={{ color: "#111827", fontWeight: "500", paddingRight: "4px" }}>
                          {item.name}
                        </span>
                        <span style={{ color: "#000000", fontWeight: "700", whiteSpace: "nowrap" }}>
                          <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "10px" }}>
                            {item.displayFormula} ={" "}
                          </span>
                          {item.displayTotal}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>
                      Не указана
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})
