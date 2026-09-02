import { forwardRef } from "react"

interface PrintableSmetaProps {
  calculation: any
  totalPortions: number
  grandTotalCost: number
  selectedCount: number
  eventName?: string
  eventDate?: string
}

export const PrintableSmeta = forwardRef<HTMLDivElement, PrintableSmetaProps>(
  ({ calculation, totalPortions, grandTotalCost, selectedCount, eventName, eventDate }, ref) => {
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
            <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: "#111111" }}>{formattedDate}</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "11px", color: "#555555", fontWeight: "500" }}>
              {totalPortions} порций · {selectedCount} позиций
            </p>
          </div>
        </div>

        {/* ─── 1. Заказ коктейлей ─── */}
        <div data-pdf-block="true" style={{ marginBottom: "20px" }}>
          <div
            style={{
              backgroundColor: "#f3f4f6",
              padding: "5px 10px",
              borderLeft: "4px solid #111111",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#111111",
              marginBottom: "8px",
            }}
          >
            1. Заказ (Коктейли и количество)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: "28px", rowGap: "4px" }}>
            {calculation.ttkList.map((c: any) => (
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

        {/* ─── 2. ТТК и раскладка по коктейлям ─── */}
        <div style={{ marginBottom: "20px" }}>
          <div
            data-pdf-block="true"
            style={{
              backgroundColor: "#f3f4f6",
              padding: "5px 10px",
              borderLeft: "4px solid #111111",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#111111",
              marginBottom: "10px",
            }}
          >
            2. Технологические карты (ТТК) на мероприятие
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {calculation.ttkList.map((c: any) => (
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
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#000000" }}>{c.name}</span>
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
                        c.recipeItems.map((item: any, i: number) => (
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
                            <span style={{ color: "#000000", fontWeight: "700", whiteSpace: "nowrap", textAlign: "right" }}>
                              <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "10px" }}>
                                {item.displayFormula} ={" "}
                              </span>
                              {item.displayTotal}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>—</span>
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
                        c.iceItems.map((item: any, i: number) => (
                          <div
                            key={i}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "11px" }}
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
                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>Без льда</span>
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
                        c.decorationItems.map((item: any, i: number) => (
                          <div
                            key={i}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "11px" }}
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
                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>Без украшения</span>
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
                        c.glasswareItems.map((item: any, i: number) => (
                          <div
                            key={i}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "11px" }}
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
                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "11px" }}>Не указана</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 3. Полуфабрикаты (ТТК и рецепты приготовления) ─── */}
        {calculation.categorized.pf_to_make.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <div
              data-pdf-block="true"
              style={{
                backgroundColor: "#f3f4f6",
                padding: "5px 10px",
                borderLeft: "4px solid #111111",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#111111",
                marginBottom: "10px",
              }}
            >
              3. Полуфабрикаты (ТТК приготовления на мероприятие)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {calculation.categorized.pf_to_make.map((pf: any) => (
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
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#000000" }}>{pf.name}</span>
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
                    {pf.items?.length > 0 ? (
                      pf.items.map((item: any, i: number) => (
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
        )}

        {/* ─── 4. Сводная смета закупки ─── */}
        <div style={{ marginBottom: "20px" }}>
          <div
            data-pdf-block="true"
            style={{
              backgroundColor: "#f3f4f6",
              padding: "5px 10px",
              borderLeft: "4px solid #111111",
              fontSize: "11px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#111111",
              marginBottom: "8px",
            }}
          >
            4. Сводная смета закупки
          </div>

          <table
            style={{
              width: "100%",
              fontSize: "11px",
              textAlign: "left",
              borderCollapse: "separate",
              borderSpacing: "0",
            }}
          >
            <thead data-pdf-block="true">
              <tr style={{ color: "#000000" }}>
                <th
                  style={{
                    padding: "6px 0 8px 0",
                    borderBottom: "2px solid #111111",
                    fontWeight: "800",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Позиция
                </th>
                <th
                  style={{
                    padding: "6px 0 8px 0",
                    borderBottom: "2px solid #111111",
                    fontWeight: "800",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Категория
                </th>
                <th
                  style={{
                    padding: "6px 0 8px 0",
                    borderBottom: "2px solid #111111",
                    fontWeight: "800",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    textAlign: "right",
                  }}
                >
                  Количество
                </th>
                <th
                  style={{
                    padding: "6px 0 8px 0",
                    borderBottom: "2px solid #111111",
                    fontWeight: "800",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    textAlign: "right",
                  }}
                >
                  Тара / Бутылки
                </th>
                <th
                  style={{
                    padding: "6px 0 8px 0",
                    borderBottom: "2px solid #111111",
                    fontWeight: "800",
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    textAlign: "right",
                  }}
                >
                  Сумма, ₽
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Алкоголь */}
              {calculation.categorized.alcohol.map((a: any) => (
                <tr key={a.name} data-pdf-block="true" style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {a.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>Алкоголь</td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {a.amount.toFixed(3)} л
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {a.bottles} бут. ({a.bottleVol} л)
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {a.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}

              {/* Безалкогольное */}
              {calculation.categorized.non_alcohol.map((na: any) => (
                <tr key={na.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {na.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Безалкогольное
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {na.amount.toFixed(3)} л
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {na.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}

              {/* Сиропы и пюре */}
              {calculation.categorized.syrups.map((s: any) => (
                <tr key={s.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {s.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>Сироп</td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {s.amount.toFixed(3)} л
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {s.bottles} бут.
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {s.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
              {calculation.categorized.puree.map((p: any) => (
                <tr key={p.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {p.name} (пюре)
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>Пюре</td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {p.amount.toFixed(3)} л
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {p.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
              {calculation.categorized.concentrate.map((c: any) => (
                <tr key={c.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {c.name} (концентрат)
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>Концентрат</td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {c.amount.toFixed(3)} л
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {c.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}

              {/* Лёд */}
              {calculation.categorized.ice_cube.map((ic: any) => (
                <tr key={ic.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {ic.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Лёд кубиковый
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {ic.amount} кг
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {ic.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
              {calculation.categorized.ice_figurine.map((ifig: any) => (
                <tr key={ifig.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {ifig.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>Лёд фигурный</td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {ifig.amount} шт
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {ifig.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}

              {/* Украшения */}
              {calculation.categorized.decorations_pcs.map((dp: any) => (
                <tr key={dp.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {dp.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Украшение (шт)
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {dp.amount} шт
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {dp.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
              {calculation.categorized.decorations_gr.map((dg: any) => (
                <tr key={dg.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {dg.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Украшение (г)
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {dg.displayWeight}
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {dg.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}
              {calculation.categorized.dry_gr.map((d: any) => (
                <tr key={d.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {d.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Сыпучка / Специи
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {d.displayWeight}
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "700",
                      color: "#000000",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {d.cost.toLocaleString()} ₽
                  </td>
                </tr>
              ))}

              {/* Посуда */}
              {calculation.categorized.glassware.map((g: any) => (
                <tr key={g.name} data-pdf-block="true">
                  <td style={{ padding: "4px 0", fontWeight: "500", color: "#111111", borderBottom: "1px solid #e5e7eb" }}>
                    {g.name}
                  </td>
                  <td style={{ padding: "4px 0", color: "#4b5563", borderBottom: "1px solid #e5e7eb" }}>
                    Посуда / Бокалы
                  </td>
                  <td
                    style={{
                      padding: "4px 0",
                      textAlign: "right",
                      fontWeight: "600",
                      color: "#111111",
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    {g.count} шт
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                  <td style={{ padding: "4px 0", textAlign: "right", color: "#9ca3af", borderBottom: "1px solid #e5e7eb" }}>
                    —
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── 5. Итоговая строка ─── */}
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
          <span style={{ fontSize: "17px", color: "#000000" }}>{grandTotalCost.toLocaleString()} ₽</span>
        </div>
      </div>
    )
  }
)
PrintableSmeta.displayName = "PrintableSmeta"
