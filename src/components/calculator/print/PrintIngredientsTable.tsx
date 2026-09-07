import React from "react"
import { CategorizedIngredients } from "../useCalculator"
import { sectionHeaderStyle, thStyle, tdBorderBottom, tableStyle } from "./printStyles"

interface PrintIngredientsTableProps {
  categorized: CategorizedIngredients
}

export const PrintIngredientsTable: React.FC<PrintIngredientsTableProps> = React.memo(
  ({ categorized }) => {
    return (
      <div style={{ marginBottom: "20px" }}>
        <div data-pdf-block="true" style={sectionHeaderStyle}>
          4. Сводная смета закупки
        </div>

        <table style={tableStyle}>
          <thead data-pdf-block="true">
            <tr style={{ color: "#000000" }}>
              <th style={thStyle}>Позиция</th>
              <th style={thStyle}>Категория</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Количество</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Тара / Бутылки</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Сумма, ₽</th>
            </tr>
          </thead>
          <tbody>
            {/* Алкоголь */}
            {categorized.alcohol.map((a) => (
              <tr key={a.name} data-pdf-block="true" style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {a.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>Алкоголь</td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {a.amount.toFixed(3)} л
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
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
                    ...tdBorderBottom,
                  }}
                >
                  {a.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Безалкогольное */}
            {categorized.non_alcohol.map((na) => (
              <tr key={na.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {na.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Безалкогольное
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {na.amount.toFixed(3)} л
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {na.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Сиропы */}
            {categorized.syrups.map((s) => (
              <tr key={s.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {s.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>Сироп</td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {s.amount.toFixed(3)} л
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
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
                    ...tdBorderBottom,
                  }}
                >
                  {s.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Пюре */}
            {categorized.puree.map((p) => (
              <tr key={p.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {p.name} (пюре)
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>Пюре</td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {p.amount.toFixed(3)} л
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {p.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Концентрат */}
            {categorized.concentrate.map((c) => (
              <tr key={c.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {c.name} (концентрат)
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Концентрат
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {c.amount.toFixed(3)} л
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {c.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Лёд кубиковый */}
            {categorized.ice_cube.map((ic) => (
              <tr key={ic.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {ic.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Лёд кубиковый
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {ic.amount} кг
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {ic.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Лёд фигурный */}
            {categorized.ice_figurine.map((ifig) => (
              <tr key={ifig.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {ifig.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Лёд фигурный
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {ifig.amount} шт
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {ifig.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Украшения шт */}
            {categorized.decorations_pcs.map((dp) => (
              <tr key={dp.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {dp.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Украшение (шт)
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {dp.amount} шт
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {dp.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Украшения г */}
            {categorized.decorations_gr.map((dg) => (
              <tr key={dg.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {dg.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Украшение (г)
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {dg.displayWeight}
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {dg.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Сыпучка */}
            {categorized.dry_gr.map((d) => (
              <tr key={d.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {d.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Сыпучка / Специи
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {d.displayWeight}
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "700",
                    color: "#000000",
                    ...tdBorderBottom,
                  }}
                >
                  {d.cost.toLocaleString()} ₽
                </td>
              </tr>
            ))}

            {/* Посуда */}
            {categorized.glassware.map((g) => (
              <tr key={g.name} data-pdf-block="true">
                <td
                  style={{
                    padding: "4px 0",
                    fontWeight: "500",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {g.name}
                </td>
                <td style={{ padding: "4px 0", color: "#4b5563", ...tdBorderBottom }}>
                  Посуда / Бокалы
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    fontWeight: "600",
                    color: "#111111",
                    ...tdBorderBottom,
                  }}
                >
                  {g.count} шт
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
                <td
                  style={{
                    padding: "4px 0",
                    textAlign: "right",
                    color: "#9ca3af",
                    ...tdBorderBottom,
                  }}
                >
                  —
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
)

PrintIngredientsTable.displayName = "PrintIngredientsTable"
