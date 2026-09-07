import { useMemo } from "react"
import { SelectedCocktail, CalculatorResult } from "./useCalculator"

export interface FormattedTextsParams {
  selected: SelectedCocktail[]
  eventName: string
  eventDate: string
  bufferPercent: number
  calculation: CalculatorResult
}

export interface FormattedTexts {
  messengerText: string
  reportText: string
  ttkText: string
}

export function useFormattedTexts({
  selected,
  eventName,
  eventDate,
  bufferPercent,
  calculation,
}: FormattedTextsParams): FormattedTexts {
  // Генерация текста для Telegram / WhatsApp
  const messengerText = useMemo(() => {
    if (selected.length === 0) return "Нет выбранных коктейлей"
    const lines: string[] = []
    lines.push(`📋 *ЗАКУПКА: ${eventName ? eventName.toUpperCase() : "КОКТЕЙЛЬНЫЙ БАР"}*`)
    if (eventDate) {
      lines.push(`📅 Дата: ${new Date(eventDate).toLocaleDateString("ru-RU")}`)
    }
    lines.push(`🍸 Всего коктейлей: *${calculation.totalPortions} шт.*`)
    if (bufferPercent > 0) {
      lines.push(`📦 Запас на мероприятие: *+${bufferPercent}%* (включён в закупку)`)
    }
    lines.push("")

    lines.push("🍹 *МЕНЮ КОКТЕЙЛЕЙ:*")
    selected.forEach((c) => {
      lines.push(`• ${c.name} — ${c.qty} шт.`)
    })
    lines.push("")

    const { categorized } = calculation

    if (categorized.alcohol.length > 0) {
      lines.push("🍾 *АЛКОГОЛЬ:*")
      categorized.alcohol.forEach((a) => {
        lines.push(`• ${a.name} — *${a.bottles} бут.* (${a.amount.toFixed(2)} л)`)
      })
      lines.push("")
    }

    if (categorized.non_alcohol.length > 0) {
      lines.push("🥤 *БЕЗАЛКОГОЛЬНОЕ И СОКИ:*")
      categorized.non_alcohol.forEach((na) => {
        lines.push(`• ${na.name} — *${na.amount.toFixed(2)} л*`)
      })
      lines.push("")
    }

    if (
      categorized.syrups.length > 0 ||
      categorized.puree.length > 0 ||
      categorized.concentrate.length > 0
    ) {
      lines.push("🍯 *СИРОПЫ И ПЮРЕ:*")
      categorized.syrups.forEach((s) => {
        lines.push(`• ${s.name} — *${s.bottles} бут.* (${s.amount.toFixed(2)} л)`)
      })
      categorized.puree.forEach((p) => {
        lines.push(`• ${p.name} (пюре) — *${p.amount.toFixed(2)} л*`)
      })
      categorized.concentrate.forEach((c) => {
        lines.push(`• ${c.name} (концентрат) — *${c.amount.toFixed(2)} л*`)
      })
      lines.push("")
    }

    if (categorized.ice_cube.length > 0 || categorized.ice_figurine.length > 0) {
      lines.push("🧊 *ЛЁД:*")
      categorized.ice_cube.forEach((ic) => {
        lines.push(`• ${ic.name} — *${ic.amount} кг*`)
      })
      categorized.ice_figurine.forEach((ifig) => {
        lines.push(`• ${ifig.name} — *${ifig.amount} шт.*`)
      })
      lines.push("")
    }

    if (
      categorized.decorations_pcs.length > 0 ||
      categorized.decorations_gr.length > 0 ||
      categorized.dry_gr.length > 0
    ) {
      lines.push("🌿 *УКРАШЕНИЯ И СПЕЦИИ:*")
      categorized.decorations_pcs.forEach((dp) => {
        lines.push(`• ${dp.name} — *${dp.amount} шт.*`)
      })
      categorized.decorations_gr.forEach((dg) => {
        lines.push(`• ${dg.name} — *${dg.displayWeight}*`)
      })
      categorized.dry_gr.forEach((d) => {
        lines.push(`• ${d.name} — *${d.displayWeight}*`)
      })
      lines.push("")
    }

    if (categorized.pf_to_make.length > 0) {
      lines.push("🥣 *ПОЛУФАБРИКАТЫ ДЛЯ ВАРКИ:*")
      categorized.pf_to_make.forEach((pf) => {
        lines.push(`• ${pf.name} — *${pf.volume} ${pf.unit}*`)
      })
      lines.push("")
    }

    if (categorized.glassware.length > 0) {
      lines.push("🍷 *ПОСУДА И БОКАЛЫ:*")
      categorized.glassware.forEach((g) => {
        lines.push(`• ${g.name} — *${g.count} шт.*`)
      })
      lines.push("")
    }

    lines.push(
      `💰 *ОРИЕНТИРОВОЧНАЯ СУММА ЗАКУПКИ: ${calculation.grandTotalCost.toLocaleString()} ₽*`
    )

    return lines.join("\n")
  }, [selected, eventName, eventDate, calculation, bufferPercent])

  // Генерация текста сводного отчета
  const reportText = useMemo(() => {
    if (selected.length === 0) return "Нет выбранных позиций"
    const lines: string[] = []
    lines.push("==================================================")
    lines.push(`ОТЧЁТ: ${eventName ? eventName.toUpperCase() : "КАЛЬКУЛЯТОР БАРА"}`)
    if (eventDate) {
      lines.push(`Дата проведения: ${new Date(eventDate).toLocaleDateString("ru-RU")}`)
    }
    lines.push(`Всего порций: ${calculation.totalPortions} шт.`)
    if (bufferPercent > 0) {
      lines.push(`Коэффициент запаса: +${bufferPercent}%`)
    }
    lines.push("==================================================")
    lines.push("")
    lines.push("МЕНЮ МЕРОПРИЯТИЯ:")
    selected.forEach((c) => {
      lines.push(`  • ${c.name}: ${c.qty} шт.`)
    })
    lines.push("")
    lines.push("ИТОГОВАЯ СМЕТА ЗАКУПКИ:")
    lines.push("--------------------------------------------------")

    const { categorized } = calculation
    if (categorized.alcohol.length > 0) {
      lines.push("АЛКОГОЛЬ:")
      categorized.alcohol.forEach((a) => {
        lines.push(
          `  • ${a.name.padEnd(30)} ${a.amount.toFixed(3)} л (${a.bottles} бут.) — ${a.cost.toLocaleString()} ₽`
        )
      })
    }
    if (categorized.non_alcohol.length > 0) {
      lines.push("БЕЗАЛКОГОЛЬНОЕ:")
      categorized.non_alcohol.forEach((na) => {
        lines.push(
          `  • ${na.name.padEnd(30)} ${na.amount.toFixed(3)} л — ${na.cost.toLocaleString()} ₽`
        )
      })
    }
    if (categorized.syrups.length > 0) {
      lines.push("СИРОПЫ:")
      categorized.syrups.forEach((s) => {
        lines.push(
          `  • ${s.name.padEnd(30)} ${s.amount.toFixed(3)} л (${s.bottles} бут.) — ${s.cost.toLocaleString()} ₽`
        )
      })
    }
    if (categorized.puree.length > 0) {
      lines.push("ПЮРЕ:")
      categorized.puree.forEach((p) => {
        lines.push(
          `  • ${p.name.padEnd(30)} ${p.amount.toFixed(3)} л — ${p.cost.toLocaleString()} ₽`
        )
      })
    }
    if (categorized.concentrate.length > 0) {
      lines.push("КОНЦЕНТРАТЫ:")
      categorized.concentrate.forEach((c) => {
        lines.push(
          `  • ${c.name.padEnd(30)} ${c.amount.toFixed(3)} л — ${c.cost.toLocaleString()} ₽`
        )
      })
    }
    if (categorized.ice_cube.length > 0 || categorized.ice_figurine.length > 0) {
      lines.push("ЛЁД:")
      categorized.ice_cube.forEach((ic) => {
        lines.push(`  • ${ic.name.padEnd(30)} ${ic.amount} кг — ${ic.cost.toLocaleString()} ₽`)
      })
      categorized.ice_figurine.forEach((ifig) => {
        lines.push(
          `  • ${ifig.name.padEnd(30)} ${ifig.amount} шт. — ${ifig.cost.toLocaleString()} ₽`
        )
      })
    }
    if (
      categorized.decorations_pcs.length > 0 ||
      categorized.decorations_gr.length > 0 ||
      categorized.dry_gr.length > 0
    ) {
      lines.push("УКРАШЕНИЯ И СПЕЦИИ:")
      categorized.decorations_pcs.forEach((dp) => {
        lines.push(`  • ${dp.name.padEnd(30)} ${dp.amount} шт. — ${dp.cost.toLocaleString()} ₽`)
      })
      categorized.decorations_gr.forEach((dg) => {
        lines.push(`  • ${dg.name.padEnd(30)} ${dg.displayWeight} — ${dg.cost.toLocaleString()} ₽`)
      })
      categorized.dry_gr.forEach((d) => {
        lines.push(`  • ${d.name.padEnd(30)} ${d.displayWeight} — ${d.cost.toLocaleString()} ₽`)
      })
    }
    if (categorized.pf_to_make.length > 0) {
      lines.push("ПОЛУФАБРИКАТЫ К ПРИГОТОВЛЕНИЮ:")
      categorized.pf_to_make.forEach((pf) => {
        lines.push(`  • ${pf.name.padEnd(30)} ${pf.volume} ${pf.unit}`)
      })
    }
    if (categorized.glassware.length > 0) {
      lines.push("ПОСУДА:")
      categorized.glassware.forEach((g) => {
        lines.push(`  • ${g.name.padEnd(30)} ${g.count} шт.`)
      })
    }

    lines.push("--------------------------------------------------")
    lines.push(`ИТОГО СУММА ЗАКУПКИ: ${calculation.grandTotalCost.toLocaleString()} ₽`)
    lines.push("==================================================")
    return lines.join("\n")
  }, [selected, eventName, eventDate, calculation, bufferPercent])

  // Генерация текста ТТК
  const ttkText = useMemo(() => {
    if (selected.length === 0) return "Нет выбранных позиций"
    const lines: string[] = []
    lines.push("==================================================")
    lines.push("ТЕХНОЛОГИЧЕСКИЕ КАРТЫ (ТТК) КОКТЕЙЛЕЙ")
    lines.push("==================================================")
    lines.push("")

    calculation.ttkList.forEach((c) => {
      lines.push(`🍸 ${c.name.toUpperCase()} (${c.count} порций)`)
      lines.push("--------------------------------------------------")
      if (c.recipeItems?.length > 0) {
        lines.push("  Ингредиенты:")
        c.recipeItems.forEach((item) => {
          lines.push(`    • ${item.name.padEnd(25)} ${item.displayFormula} = ${item.displayTotal}`)
        })
      }
      if (c.iceItems?.length > 0) {
        lines.push("  Лёд:")
        c.iceItems.forEach((item) => {
          lines.push(`    • ${item.name.padEnd(25)} ${item.displayFormula} = ${item.displayTotal}`)
        })
      }
      if (c.decorationItems?.length > 0) {
        lines.push("  Украшение:")
        c.decorationItems.forEach((item) => {
          lines.push(`    • ${item.name.padEnd(25)} ${item.displayFormula} = ${item.displayTotal}`)
        })
      }
      if (c.glasswareItems?.length > 0) {
        lines.push("  Посуда:")
        c.glasswareItems.forEach((item) => {
          lines.push(`    • ${item.name.padEnd(25)} ${item.displayFormula} = ${item.displayTotal}`)
        })
      }
      lines.push("")
    })

    if (calculation.categorized.pf_to_make.length > 0) {
      lines.push("==================================================")
      lines.push("ТТК ПОЛУФАБРИКАТОВ К ПРИГОТОВЛЕНИЮ")
      lines.push("==================================================")
      lines.push("")
      calculation.categorized.pf_to_make.forEach((pf) => {
        lines.push(`🍯 ${pf.name.toUpperCase()} (Приготовить: ${pf.volume} ${pf.unit})`)
        lines.push("--------------------------------------------------")
        if (pf.items?.length > 0) {
          pf.items.forEach((item) => {
            lines.push(
              `    • ${item.name.padEnd(25)} ${item.displayFormula} = ${item.displayTotal}`
            )
          })
        }
        lines.push("")
      })
    }

    return lines.join("\n")
  }, [selected, calculation])

  return { messengerText, reportText, ttkText }
}
