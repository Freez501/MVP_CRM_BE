import { useMemo, useState, useRef } from "react"
import {
  Search,
  Plus,
  Minus,
  RotateCcw,
  Star,
  Copy,
  Download,
  Check,
  Wine,
  Sparkles,
  Calendar,
  Layers,
  FileText,
  Printer,
  Calculator as CalcIcon,
} from "lucide-react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useDatabase } from "@/context/DatabaseContext"
import { Recipe, SemiProduct } from "@/types/db"
import { exportElementToPdf } from "@/utils/pdfExport"
import { PrintableSmeta } from "@/components/calculator/PrintableSmeta"

interface SelectedCocktail {
  key: string
  name: string
  qty: number
}

type CalcResultTab = "smeta" | "ttk" | "report"
type SortOrder = "name_asc" | "name_desc"

const capitalize = (s: string) => {
  if (!s) return ""
  const trimmed = s.trim()
  if (/^\(?пф\)?/i.test(trimmed)) {
    const cleanName = trimmed.replace(/^(\(?пф\)?[:\s-]*)+/i, "").trim()
    if (!cleanName) return "(ПФ)"
    return `(ПФ) ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function cleanPfKey(key: string): string {
  return key.toLowerCase().replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()
}

function findSemiProduct(
  key: string,
  semiProducts: Record<string, SemiProduct>
): { key: string; semi: SemiProduct } | null {
  if (!key) return null
  if (semiProducts[key]) return { key, semi: semiProducts[key] }
  const clean = cleanPfKey(key)
  for (const [sKey, sVal] of Object.entries(semiProducts)) {
    if (sKey === key || cleanPfKey(sKey) === clean) {
      return { key: sKey, semi: sVal }
    }
  }
  return null
}

// Рекурсивное раскрытие полуфабрикатов
function expandRecipe(
  recipe: Recipe,
  multiplier: number,
  semiProducts: Record<string, SemiProduct>,
  pfToMake: Record<string, number>,
  seen = new Set<string>()
): Record<string, number> {
  const result: Record<string, number> = {}

  Object.entries(recipe).forEach(([ingredient, amount]) => {
    const totalAmount = amount * multiplier
    const foundPf = findSemiProduct(ingredient, semiProducts)

    if (foundPf) {
      const canonicalKey = foundPf.key
      pfToMake[canonicalKey] = (pfToMake[canonicalKey] || 0) + totalAmount

      if (seen.has(canonicalKey)) {
        result[canonicalKey] = (result[canonicalKey] || 0) + totalAmount
        return
      }
      seen.add(canonicalKey)

      const semi = foundPf.semi
      const outputVolume = semi.output_volume || 1
      const semiFactor = totalAmount / outputVolume
      const subExpanded = expandRecipe(semi.recipe || {}, semiFactor, semiProducts, pfToMake, seen)
      seen.delete(canonicalKey)

      Object.entries(subExpanded).forEach(([subIng, subAmount]) => {
        result[subIng] = (result[subIng] || 0) + subAmount
      })
    } else {
      result[ingredient] = (result[ingredient] || 0) + totalAmount
    }
  })

  return result
}



export default function Calculator() {
  const {
    cocktails,
    semiProducts,
    prices,
    categories,
    cocktailCategories,
    ingredientInfo,
    bottleVolumes,
    isStarred,
  } = useDatabase()

  const [query, setQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortOrder, setSortOrder] = useState<SortOrder>("name_asc")
  const [onlyStarred, setOnlyStarred] = useState(false)
  const [activeTab, setActiveTab] = useState<CalcResultTab>("smeta")
  const [copiedReport, setCopiedReport] = useState(false)
  const [copiedTtk, setCopiedTtk] = useState(false)
  const [copiedMessenger, setCopiedMessenger] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Название, дата мероприятия и коэффициент запаса
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bufferPercent, setBufferPercent] = useLocalStorage<number>("brilliant-calc-buffer", 0)

  const printRef = useRef<HTMLDivElement>(null)

  const [selected, setSelected] = useLocalStorage<SelectedCocktail[]>(
    "brilliant-calculator-selected",
    []
  )

  // Список всех коктейлей
  const cocktailsList = useMemo(
    () =>
      Object.entries(cocktails).map(([key, value]) => ({
        key,
        ...value,
      })),
    [cocktails]
  )

  // Фильтрация и сортировка коктейлей слева (выбранные с qty > 0 всегда поднимаются наверх)
  const filteredCocktails = useMemo(() => {
    const q = query.trim().toLowerCase()
    return cocktailsList
      .filter((c) => {
        if (onlyStarred && !isStarred(c.key)) return false
        if (categoryFilter !== "all" && c.category.toLowerCase() !== categoryFilter.toLowerCase()) {
          return false
        }
        if (!q) return true
        return c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const qtyA = selected.find((item) => item.key === a.key)?.qty || 0
        const qtyB = selected.find((item) => item.key === b.key)?.qty || 0

        const isSelectedA = qtyA > 0 ? 1 : 0
        const isSelectedB = qtyB > 0 ? 1 : 0

        // 1. Сначала выбранные коктейли (qty > 0) наверх
        if (isSelectedA !== isSelectedB) {
          return isSelectedB - isSelectedA
        }

        // 2. Внутри каждой группы сортируем по выбранному порядку (А-Я или Я-А)
        if (sortOrder === "name_asc") {
          return a.name.localeCompare(b.name, "ru")
        } else {
          return b.name.localeCompare(a.name, "ru")
        }
      })
  }, [cocktailsList, query, categoryFilter, sortOrder, onlyStarred, isStarred, selected])

  // Управление количеством
  const getQty = (key: string) => {
    const found = selected.find((c) => c.key === key)
    return found ? found.qty : 0
  }

  const setQty = (key: string, name: string, qty: number) => {
    const safeQty = Math.max(0, qty)
    setSelected((prev) => {
      if (safeQty === 0) {
        return prev.filter((c) => c.key !== key)
      }
      const exists = prev.some((c) => c.key === key)
      if (exists) {
        return prev.map((c) => (c.key === key ? { ...c, qty: safeQty } : c))
      }
      return [...prev, { key, name, qty: safeQty }]
    })
  }

  const changeQty = (key: string, name: string, delta: number) => {
    const current = getQty(key)
    setQty(key, name, current + delta)
  }

  // Быстрое массовое добавление порций
  const addBatchToAllSelected = (delta: number) => {
    if (selected.length === 0) return
    setSelected((prev) =>
      prev.map((item) => ({
        ...item,
        qty: Math.max(0, item.qty + delta),
      }))
    )
  }

  const clearSelected = () => {
    setSelected([])
  }

  // ================= ОСНОВНОЙ РАСЧЁТ =================
  const calculation = useMemo(() => {
    const rawTotals: Record<string, number> = {}
    const glasswareTotals: Record<string, number> = {}
    const pfToMake: Record<string, number> = {}
    const bufferMultiplier = 1 + (bufferPercent || 0) / 100

    // ТТК по каждому коктейлю
    interface TtkItem {
      name: string
      norm: number
      total: number
      unit: string
      displayFormula: string
      displayTotal: string
    }

    const ttkList: {
      key: string
      name: string
      count: number
      recipeItems: TtkItem[]
      iceItems: TtkItem[]
      decorationItems: TtkItem[]
      glasswareItems: TtkItem[]
      items: TtkItem[]
    }[] = []

    for (const item of selected) {
      if (item.qty <= 0) continue
      const cocktail = cocktails[item.key]
      if (!cocktail) continue

      const isIce = (key: string, cat?: string) => {
        const k = key.toLowerCase()
        return (
          k.includes("лед") ||
          k.includes("лёд") ||
          k.includes("кубик") ||
          k.includes("фрапе") ||
          k.includes("фраппе") ||
          k.includes("глыба") ||
          (cat && cat.includes("лёд"))
        )
      }

      const recipeItems: any[] = []
      const iceItems: any[] = []
      const decorationItems: any[] = []
      const glasswareItems: any[] = []

      // Форматирование позиции ТТК
      const formatTtkItem = (ing: string, norm: number, isDec = false) => {
        const total = norm * item.qty
        const foundPf = findSemiProduct(ing, semiProducts)
        const cleanKey = cleanPfKey(ing)
        const info = ingredientInfo[ing] || ingredientInfo[cleanKey] || {}
        const cat = categories[ing] || categories[cleanKey] || ""
        const isPf = Boolean(foundPf)
        const isLiquid = isPf
          ? foundPf?.semi?.unit === "л" || foundPf?.semi?.unit === "мл" || !foundPf?.semi?.unit
          : (norm < 1 && (info.unit === "л" || !info.unit)) || info.unit === "л" || info.unit === "мл"

        let displayFormula = ""
        let displayTotal = ""

        if (info.unit === "г" || cat === "сыпучка" || cat === "сухой_гр" || (isDec && norm >= 5)) {
          const gramsNorm = Math.round(norm < 1 ? norm * 1000 : norm)
          const totalGrams = Math.round(total < 1 ? total * 1000 : total * (norm < 1 ? 1000 : 1))
          displayFormula = `${gramsNorm} г × ${item.qty}`
          displayTotal =
            totalGrams >= 1000
              ? `${(totalGrams / 1000).toFixed(2)} кг (${totalGrams} г)`
              : `${totalGrams} г`
        } else if (isIce(ing, cat)) {
          const isFig = ing.includes("шар") || ing.includes("стик") || ing.includes("фигур")
          if (isFig) {
            displayFormula = `${norm} шт × ${item.qty}`
            displayTotal = `${Math.ceil(total)} шт`
          } else {
            const kgNorm = norm >= 1 ? norm / 1000 : norm
            const totalKg = total >= 1 && norm >= 1 ? total / 1000 : total
            displayFormula = `${kgNorm.toFixed(2)} кг × ${item.qty}`
            displayTotal = `${totalKg.toFixed(2)} кг`
          }
        } else if (isLiquid || info.unit === "л" || info.unit === "мл") {
          const mlNorm = Math.round(norm * 1000)
          const mlTotal = Math.round(total * 1000)
          displayFormula = `${norm} л (${mlNorm} мл) × ${item.qty}`
          displayTotal = `${total.toFixed(3)} л (${mlTotal} мл)`
        } else {
          displayFormula = `${norm} ${info.unit || "шт"} × ${item.qty}`
          displayTotal = `${Math.ceil(total)} ${info.unit || "шт"}`
        }

        const displayName = isPf
          ? capitalize(foundPf?.semi?.name || ing)
          : capitalize(info.display_name || ing)

        return {
          name: displayName,
          norm,
          total,
          unit: isLiquid ? "л" : info.unit || "л",
          displayFormula,
          displayTotal,
        }
      }

      // 1. Рецепт (выделяем лед в iceItems)
      Object.entries(cocktail.recipe || {}).forEach(([ing, norm]) => {
        const cat = categories[ing] || ""
        if (isIce(ing, cat)) {
          iceItems.push(formatTtkItem(ing, norm))
        } else {
          recipeItems.push(formatTtkItem(ing, norm))
        }
      })

      // 2. Украшения (выделяем лед в iceItems)
      Object.entries(cocktail.decorations || {}).forEach(([dec, norm]) => {
        const cat = categories[dec] || ""
        if (isIce(dec, cat)) {
          iceItems.push(formatTtkItem(dec, norm, true))
        } else {
          decorationItems.push(formatTtkItem(dec, norm, true))
        }
      })

      // 3. Посуда
      Object.entries(cocktail.glassware || {}).forEach(([glass, norm]) => {
        const total = norm * item.qty
        const info = ingredientInfo[glass] || {}
        glasswareItems.push({
          name: capitalize(info.display_name || glass),
          norm,
          total,
          unit: "шт",
          displayFormula: `${norm} шт × ${item.qty}`,
          displayTotal: `${Math.ceil(total)} шт`,
        })
      })

      ttkList.push({
        key: item.key,
        name: cocktail.name,
        count: item.qty,
        recipeItems,
        iceItems,
        decorationItems,
        glasswareItems,
        items: [...recipeItems, ...iceItems, ...decorationItems, ...glasswareItems],
      })

      // 4. Раскрываем рецепт (с учётом ПФ и коэффициента запаса)
      const effectiveQty = item.qty * bufferMultiplier
      const expanded = expandRecipe(cocktail.recipe || {}, effectiveQty, semiProducts, pfToMake)
      for (const [ing, amount] of Object.entries(expanded)) {
        rawTotals[ing] = (rawTotals[ing] || 0) + amount
      }

      // 5. Украшения (с учётом запаса)
      for (const [dec, amount] of Object.entries(cocktail.decorations || {})) {
        rawTotals[dec] = (rawTotals[dec] || 0) + amount * effectiveQty
      }

      // 6. Посуда (с учётом запаса)
      for (const [glass, amount] of Object.entries(cocktail.glassware || {})) {
        glasswareTotals[glass] = (glasswareTotals[glass] || 0) + amount * effectiveQty
      }
    }

    // Категоризация и расчёт стоимости
    const categorized: {
      alcohol: any[]
      non_alcohol: any[]
      syrups: any[]
      puree: any[]
      concentrate: any[]
      dry_gr: any[]
      ice_cube: any[]
      ice_figurine: any[]
      decorations_pcs: any[]
      decorations_gr: any[]
      glassware: any[]
      pf_to_make: any[]
    } = {
      alcohol: [],
      non_alcohol: [],
      syrups: [],
      puree: [],
      concentrate: [],
      dry_gr: [],
      ice_cube: [],
      ice_figurine: [],
      decorations_pcs: [],
      decorations_gr: [],
      glassware: [],
      pf_to_make: [],
    }

    let grandTotalCost = 0

    Object.entries(rawTotals).forEach(([ing, amount]) => {
      const info = ingredientInfo[ing] || {}
      const cat = categories[ing] || "алкоголь"
      const price = prices[ing] ?? 0
      const bottleVol = bottleVolumes[ing] || (cat === "алкоголь" ? 0.7 : 1.0)
      const displayName = capitalize(info.display_name || ing)

      if (cat === "алкоголь") {
        const bottles = Math.ceil(amount / bottleVol)
        const cost = bottles * price
        grandTotalCost += cost
        categorized.alcohol.push({
          name: displayName,
          amount,
          unit: "л",
          bottleVol,
          bottles,
          price,
          cost,
        })
      } else if (cat === "сироп") {
        const bottles = Math.ceil(amount / bottleVol)
        const cost = bottles * price
        grandTotalCost += cost
        categorized.syrups.push({
          name: displayName,
          amount,
          unit: "л",
          bottleVol,
          bottles,
          price,
          cost,
        })
      } else if (cat === "пюре") {
        const cost = Math.round(amount * price)
        grandTotalCost += cost
        categorized.puree.push({
          name: displayName,
          amount,
          unit: "л",
          price,
          cost,
        })
      } else if (cat === "концентрат") {
        const cost = Math.round(amount * price)
        grandTotalCost += cost
        categorized.concentrate.push({
          name: displayName,
          amount,
          unit: "л",
          price,
          cost,
        })
      } else if (cat === "безалкогольное") {
        const cost = Math.round(amount * price)
        grandTotalCost += cost
        categorized.non_alcohol.push({
          name: displayName,
          amount,
          unit: "л",
          price,
          cost,
        })
      } else if (cat === "сыпучка" || cat === "сухой_гр") {
        // Точный расчёт граммов
        const totalGrams = Math.round(amount < 1 ? amount * 1000 : amount)
        const cost = Math.round((totalGrams / 1000) * price)
        const displayWeight =
          totalGrams >= 1000
            ? `${(totalGrams / 1000).toFixed(2)} кг (${totalGrams} г)`
            : `${totalGrams} г`
        grandTotalCost += cost
        categorized.dry_gr.push({
          name: displayName,
          grams: totalGrams,
          displayWeight,
          unit: "г",
          price,
          cost,
        })
      } else if (cat === "лёд_кубик" || ing.includes("кубик")) {
        const kg = Math.round(amount * 10) / 10
        const cost = Math.round(kg * price)
        grandTotalCost += cost
        categorized.ice_cube.push({
          name: displayName,
          amount: kg,
          unit: "кг",
          price,
          cost,
        })
      } else if (cat === "лёд_фигурный" || ing.includes("шар") || ing.includes("фигур")) {
        const pcs = Math.ceil(amount)
        const cost = pcs * price
        grandTotalCost += cost
        categorized.ice_figurine.push({
          name: displayName,
          amount: pcs,
          unit: "шт",
          price,
          cost,
        })
      } else if (
        cat === "украшение_гр" ||
        cat === "ягоды" ||
        cat === "фрукты" ||
        cat === "травы" ||
        info.unit === "г"
      ) {
        // Точный расчёт граммов для украшений
        const totalGrams = Math.round(amount < 1 ? amount * 1000 : amount)
        const cost = Math.round((totalGrams / 1000) * price)
        const displayWeight =
          totalGrams >= 1000
            ? `${(totalGrams / 1000).toFixed(2)} кг (${totalGrams} г)`
            : `${totalGrams} г`
        grandTotalCost += cost
        categorized.decorations_gr.push({
          name: displayName,
          grams: totalGrams,
          displayWeight,
          unit: "г",
          price,
          cost,
        })
      } else {
        const pcs = Math.ceil(amount)
        const cost = pcs * price
        grandTotalCost += cost
        categorized.decorations_pcs.push({
          name: displayName,
          amount: pcs,
          unit: info.unit || "шт",
          price,
          cost,
        })
      }
    })

    // Посуда
    Object.entries(glasswareTotals).forEach(([glass, count]) => {
      const displayName = capitalize(ingredientInfo[glass]?.display_name || glass)
      categorized.glassware.push({
        name: displayName,
        count: Math.ceil(count),
        unit: "шт",
      })
    })

    // ПФ к приготовлению с детальной ТТК раскладкой
    Object.entries(pfToMake).forEach(([pfKey, volume]) => {
      const foundPf = findSemiProduct(pfKey, semiProducts)
      const semi = foundPf ? foundPf.semi : semiProducts[pfKey]
      const rawName = semi ? semi.name : pfKey
      const name = capitalize(rawName)
      const unit = semi?.unit || "л"
      const outputVol = semi?.output_volume || 1
      const factor = volume / outputVol

      const items: {
        name: string
        norm: number
        total: number
        unit: string
        displayFormula: string
        displayTotal: string
      }[] = []

      if (semi && semi.recipe) {
        Object.entries(semi.recipe).forEach(([ing, baseAmount]) => {
          const needed = baseAmount * factor
          const subPf = findSemiProduct(ing, semiProducts)
          const cleanKey = cleanPfKey(ing)
          const info = ingredientInfo[ing] || ingredientInfo[cleanKey] || {}
          const cat = categories[ing] || categories[cleanKey] || ""

          const isPfSub = Boolean(subPf)
          const isLiquid = isPfSub
            ? subPf?.semi?.unit === "л" || subPf?.semi?.unit === "мл" || !subPf?.semi?.unit
            : (baseAmount < 1 && (info.unit === "л" || !info.unit)) || info.unit === "л" || info.unit === "мл"

          let displayFormula = ""
          let displayTotal = ""

          if (isPfSub) {
            // Вложенный полуфабрикат (например, Базовый кордиал внутри Персикового пюре)
            const subUnit = subPf?.semi?.unit || "л"
            if (subUnit === "л" || subUnit === "мл") {
              const baseMl = Math.round(baseAmount * 1000)
              const neededMl = Math.round(needed * 1000)
              displayFormula = `${baseAmount} л (${baseMl} мл) × ${factor.toFixed(2)}`
              displayTotal = `${needed.toFixed(3)} л (${neededMl} мл)`
            } else {
              displayFormula = `${baseAmount} ${subUnit} × ${factor.toFixed(2)}`
              displayTotal = `${needed.toFixed(2)} ${subUnit}`
            }
          } else if (
            info.unit === "г" ||
            cat === "сыпучка" ||
            cat === "сухой_гр" ||
            (baseAmount < 1 && baseAmount >= 0.001 && !isLiquid)
          ) {
            // Сухие ингредиенты в граммах (например, 20 г кислоты, 900 г сахара)
            const baseGrams = Math.round(baseAmount < 1 ? baseAmount * 1000 : baseAmount)
            const neededGrams = Math.round(
              needed < 1 ? needed * 1000 : needed * (baseAmount < 1 ? 1000 : 1)
            )
            displayFormula = `${baseGrams} г × ${factor.toFixed(2)}`
            displayTotal =
              neededGrams >= 1000
                ? `${(neededGrams / 1000).toFixed(2)} кг (${neededGrams} г)`
                : `${neededGrams} г`
          } else if (
            info.unit === "кг" ||
            cat === "фрукты" ||
            (baseAmount >= 1 && (cat === "ягоды" || ing.includes("персик")))
          ) {
            // Фрукты/ягоды в кг (например, 1.5 кг персиков)
            const neededKg = needed
            displayFormula = `${baseAmount} кг × ${factor.toFixed(2)}`
            displayTotal = `${neededKg.toFixed(2)} кг (${Math.round(neededKg * 1000)} г)`
          } else if (isLiquid) {
            const baseMl = Math.round(baseAmount * 1000)
            const neededMl = Math.round(needed * 1000)
            displayFormula = `${baseAmount} л (${baseMl} мл) × ${factor.toFixed(2)}`
            displayTotal = `${needed.toFixed(3)} л (${neededMl} мл)`
          } else {
            displayFormula = `${baseAmount} ${info.unit || "шт"} × ${factor.toFixed(2)}`
            displayTotal = `${Math.ceil(needed)} ${info.unit || "шт"}`
          }

          const displayName = isPfSub
            ? capitalize(subPf?.semi?.name || ing)
            : capitalize(info.display_name || ing)

          items.push({
            name: displayName,
            norm: baseAmount,
            total: needed,
            unit: isLiquid ? "л" : info.unit || "л",
            displayFormula,
            displayTotal,
          })
        })
      }

      categorized.pf_to_make.push({
        key: pfKey,
        name,
        volume: Math.round(volume * 1000) / 1000,
        unit,
        factor,
        items,
      })
    })

    return {
      ttkList,
      categorized,
      grandTotalCost,
      totalPortions: selected.reduce((sum, s) => sum + s.qty, 0),
      bufferPercent,
    }
  }, [selected, cocktails, semiProducts, ingredientInfo, categories, prices, bottleVolumes, bufferPercent])

  // ================= ГЕНЕРАЦИЯ ТЕКСТА ДЛЯ TELEGRAM / WHATSAPP =================
  const formattedMessengerText = useMemo(() => {
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

    if (categorized.syrups.length > 0 || categorized.puree.length > 0 || categorized.concentrate.length > 0) {
      lines.push("🍯 *СИРОПЫ, ПЮРЕ И КОНЦЕНТРАТЫ:*")
      categorized.syrups.forEach((s) => {
        lines.push(`• ${s.name} — *${s.bottles} бут.* (${s.amount.toFixed(2)} л)`)
      })
      categorized.puree.forEach((p) => {
        lines.push(`• ${p.name} — *${p.amount.toFixed(2)} л*`)
      })
      categorized.concentrate.forEach((c) => {
        lines.push(`• ${c.name} — *${c.amount.toFixed(2)} л*`)
      })
      lines.push("")
    }

    if (categorized.dry_gr.length > 0) {
      lines.push("🧂 *СУХИЕ ИНГРЕДИЕНТЫ:*")
      categorized.dry_gr.forEach((d) => {
        lines.push(`• ${d.name} — *${d.displayWeight}*`)
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

    if (categorized.decorations_pcs.length > 0 || categorized.decorations_gr.length > 0) {
      lines.push("🌿 *УКРАШЕНИЯ И ТРАВЫ:*")
      categorized.decorations_pcs.forEach((dp) => {
        lines.push(`• ${dp.name} — *${dp.amount} шт.*`)
      })
      categorized.decorations_gr.forEach((dg) => {
        lines.push(`• ${dg.name} — *${dg.displayWeight}*`)
      })
      lines.push("")
    }

    if (categorized.pf_to_make.length > 0) {
      lines.push("🥣 *ПОЛУФАБРИКАТЫ ДЛЯ ЗАГОТОВКИ:*")
      categorized.pf_to_make.forEach((pf) => {
        lines.push(`• ${pf.name} — сварить/сделать *${pf.volume} ${pf.unit}*`)
      })
      lines.push("")
    }

    if (categorized.glassware.length > 0) {
      lines.push("🍷 *ПОСУДА / БОКАЛЫ:*")
      categorized.glassware.forEach((g) => {
        lines.push(`• ${g.name} — *${g.count} шт.*`)
      })
      lines.push("")
    }

    lines.push(`💰 *Итого смета:* ${calculation.grandTotalCost.toLocaleString()} ₽`)

    return lines.join("\n")
  }, [selected, calculation, eventName, eventDate, bufferPercent])

  // ================= ГЕНЕРАЦИЯ ТЕКСТОВЫХ ОТЧЁТОВ =================
  const formattedReportText = useMemo(() => {
    if (selected.length === 0) return "Выберите коктейли для формирования отчёта."

    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("ru-RU")

    const lines: string[] = []
    lines.push("╔══════════════════════════════════════════════════╗")
    lines.push(`║  🍹 ${eventName ? eventName.toUpperCase() : "ОТЧЁТ ПО ЗАКУПКАМ КОКТЕЙЛЕЙ"}  ║`)
    lines.push("╚══════════════════════════════════════════════════╝\n")
    lines.push(`📅 Дата мероприятия: ${formattedDate}`)
    if (bufferPercent > 0) {
      lines.push(`📦 Запас на мероприятие: +${bufferPercent}%\n`)
    } else {
      lines.push("")
    }

    lines.push("📋 ЗАКАЗ:")
    calculation.ttkList.forEach((c) => {
      lines.push(`   • ${c.name} — ${c.count} шт.`)
    })
    lines.push(`   Итого коктейлей: ${calculation.totalPortions} шт.\n`)
    lines.push("─".repeat(50) + "\n")

    lines.push("📊 ТЕХНОЛОГИЧЕСКИЕ КАРТЫ (ТТК) НА МЕРОПРИЯТИЕ:")
    calculation.ttkList.forEach((c) => {
      lines.push(`▸ ${c.name} × ${c.count} порций:`)
      c.items.forEach((item) => {
        lines.push(`   • ${item.name}: ${item.displayFormula} = ${item.displayTotal}`)
      })
      lines.push("")
    })
    lines.push("─".repeat(50) + "\n")

    if (calculation.categorized.pf_to_make.length > 0) {
      lines.push("🍯 ПОЛУФАБРИКАТЫ (ТТК приготовления):")
      calculation.categorized.pf_to_make.forEach((pf) => {
        lines.push(`▸ ${pf.name} (нужно приготовить: ${pf.volume} ${pf.unit}):`)
        if (pf.items && pf.items.length > 0) {
          pf.items.forEach((item: any) => {
            lines.push(`   • ${item.name}: ${item.displayFormula} = ${item.displayTotal}`)
          })
        }
        lines.push("")
      })
      lines.push("─".repeat(50) + "\n")
    }

    const { categorized } = calculation

    if (categorized.alcohol.length > 0) {
      lines.push("🥃 АЛКОГОЛЬ (закупить):")
      categorized.alcohol.forEach((a) => {
        lines.push(`   • ${a.name}: ${a.amount.toFixed(3)} л → ${a.bottles} бут. (${a.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.non_alcohol.length > 0) {
      lines.push("🥤 БЕЗАЛКОГОЛЬНОЕ / СОКИ (закупить):")
      categorized.non_alcohol.forEach((na) => {
        lines.push(`   • ${na.name}: ${na.amount.toFixed(3)} л (${na.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.syrups.length > 0) {
      lines.push("🧪 СИРОПЫ (закупить):")
      categorized.syrups.forEach((s) => {
        lines.push(`   • ${s.name}: ${s.amount.toFixed(3)} л → ${s.bottles} бут. (${s.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.puree.length > 0) {
      lines.push("🍑 ПЮРЕ (закупить):")
      categorized.puree.forEach((p) => {
        lines.push(`   • ${p.name}: ${p.amount.toFixed(3)} л (${p.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.concentrate.length > 0) {
      lines.push("🧃 КОНЦЕНТРАТЫ (закупить):")
      categorized.concentrate.forEach((c) => {
        lines.push(`   • ${c.name}: ${c.amount.toFixed(3)} л (${c.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.dry_gr.length > 0) {
      lines.push("🧂 СУХИЕ ИНГРЕДИЕНТЫ (закупить):")
      categorized.dry_gr.forEach((d) => {
        lines.push(`   • ${d.name}: ${d.displayWeight} (${d.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.ice_cube.length > 0) {
      lines.push("🧊 ЛЁД КУБИКОВЫЙ (закупить):")
      categorized.ice_cube.forEach((ic) => {
        lines.push(`   • ${ic.name}: ${ic.amount} кг (${ic.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.ice_figurine.length > 0) {
      lines.push("🧊 ЛЁД ФИГУРНЫЙ (закупить):")
      categorized.ice_figurine.forEach((ifig) => {
        lines.push(`   • ${ifig.name}: ${ifig.amount} шт (${ifig.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.decorations_pcs.length > 0 || categorized.decorations_gr.length > 0) {
      lines.push("🍒 УКРАШЕНИЯ (закупить):")
      categorized.decorations_pcs.forEach((dp) => {
        lines.push(`   • ${dp.name}: ${dp.amount} шт (${dp.cost.toLocaleString()} ₽)`)
      })
      categorized.decorations_gr.forEach((dg) => {
        lines.push(`   • ${dg.name}: ${dg.displayWeight} (${dg.cost.toLocaleString()} ₽)`)
      })
      lines.push("")
    }

    if (categorized.glassware.length > 0) {
      lines.push("🍷 ПОСУДА / БОКАЛЫ:")
      categorized.glassware.forEach((g) => {
        lines.push(`   • ${g.name}: ${g.count} шт.`)
      })
      lines.push("")
    }

    lines.push("═".repeat(50))
    lines.push(`💰 ИТОГО СМЕТА ЗАКУПКИ: ${calculation.grandTotalCost.toLocaleString()} ₽`)
    lines.push("═".repeat(50))

    return lines.join("\n")
  }, [selected, calculation, eventName, eventDate, bufferPercent])

  const handleCopyMessenger = () => {
    navigator.clipboard.writeText(formattedMessengerText)
    setCopiedMessenger(true)
    setTimeout(() => setCopiedMessenger(false), 2500)
  }

  const formattedTtkText = useMemo(() => {
    if (selected.length === 0) return "Нет выбранных коктейлей"

    const formattedDate = eventDate
      ? new Date(eventDate).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("ru-RU")

    const lines: string[] = []
    lines.push(`📋 ТЕХНОЛОГИЧЕСКИЕ КАРТЫ (ТТК)${eventName ? `: ${eventName.toUpperCase()}` : ""}`)
    lines.push(`📅 Дата: ${formattedDate}\n`)
    calculation.ttkList.forEach((c) => {
      lines.push(`${c.name} (${c.count} порций):`)
      c.items.forEach((item) => {
        lines.push(`  • ${item.name}: ${item.displayFormula} = ${item.displayTotal}`)
      })
      lines.push("")
    })

    if (calculation.categorized.pf_to_make.length > 0) {
      lines.push("─".repeat(50) + "\n")
      lines.push("🍯 ТТК ПОЛУФАБРИКАТОВ:\n")
      calculation.categorized.pf_to_make.forEach((pf) => {
        lines.push(`${pf.name} (выход: ${pf.volume} ${pf.unit}):`)
        if (pf.items && pf.items.length > 0) {
          pf.items.forEach((item: any) => {
            lines.push(`  • ${item.name}: ${item.displayFormula} = ${item.displayTotal}`)
          })
        }
        lines.push("")
      })
    }

    return lines.join("\n")
  }, [selected, calculation, eventName, eventDate])

  const handleCopyReport = () => {
    navigator.clipboard.writeText(formattedReportText)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  const handleCopyTtk = () => {
    navigator.clipboard.writeText(formattedTtkText)
    setCopiedTtk(true)
    setTimeout(() => setCopiedTtk(false), 2000)
  }

  const handleDownloadTxt = () => {
    const cleanName = eventName
      ? eventName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, "").trim().replace(/\s+/g, "_")
      : "smeta_zakupok"
    const blob = new Blob([formattedReportText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${cleanName}_${eventDate || new Date().toISOString().slice(0, 10)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadPdf = async () => {
    if (!printRef.current) return
    setIsGeneratingPdf(true)
    try {
      const cleanName = eventName
        ? eventName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, "").trim().replace(/\s+/g, "_")
        : "smeta_cocktails"
      await exportElementToPdf(
        printRef.current,
        `${cleanName}_${eventDate || new Date().toISOString().slice(0, 10)}.pdf`
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Верхняя шапка */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CalcIcon className="w-5 h-5 text-brand" />
            <h1 className="font-cormorant italic text-2xl sm:text-3xl text-text-primary">
              Калькулятор и смета закупок
            </h1>
          </div>
          <p className="font-montserrat text-xs text-text-tertiary mt-1">
            Выберите коктейли и укажите количество порций для мгновенного расчёта сметы, ТТК и закупок
          </p>
        </div>

        <div className="flex items-center gap-4 self-end md:self-center">
          {calculation.totalPortions > 0 && (
            <div className="text-right">
              <span className="block font-montserrat text-[11px] uppercase tracking-wider text-text-tertiary">
                Итого закупка {bufferPercent > 0 ? `(запас +${bufferPercent}%)` : ""}:
              </span>
              <span className="font-montserrat font-bold text-xl sm:text-2xl text-text-primary">
                {calculation.grandTotalCost.toLocaleString()} ₽
              </span>
            </div>
          )}

          {selected.length > 0 && (
            <button
              onClick={clearSelected}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border-sketch hover:border-brand text-xs font-montserrat uppercase tracking-wider text-text-secondary hover:text-brand transition-all"
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
          <label className="block text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary mb-1">
            Название мероприятия / Заказчик
          </label>
          <div className="relative">
            <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand/70" />
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              placeholder="Например: Свадьба Анны и Михаила, Корпоратив VK..."
              className="w-full bg-bg-app border border-border-sketch rounded-lg pl-10 pr-3 py-2 font-montserrat text-xs sm:text-sm text-text-primary placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        {/* Дата проведения */}
        <div className="w-full sm:w-52 shrink-0">
          <label className="block text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary mb-1">
            Дата проведения
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full bg-bg-app border border-border-sketch rounded-lg pl-10 pr-3 py-2 font-montserrat text-xs sm:text-sm text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            />
          </div>
        </div>

        {/* Коэффициент запаса / пролива */}
        <div className="shrink-0">
          <label className="block text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary mb-1">
            Запас на пролив / форс-мажор
          </label>
          <div className="flex items-center gap-1 bg-bg-app border border-border-sketch p-1 rounded-lg">
            {[0, 5, 10, 15, 20].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setBufferPercent(pct)}
                className={`px-2.5 py-1 rounded text-xs font-montserrat font-semibold transition-all ${
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

      {/* Основной двухколоночный блок */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ===================== ЛЕВАЯ ПАНЕЛЬ: ВЫБОР КОКТЕЙЛЕЙ (5 колонок) ===================== */}
        <div className="lg:col-span-5 space-y-4">
          {/* Панель поиска и фильтров */}
          <div className="bg-bg-card border border-border rounded-lg p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск коктейля..."
                className="w-full bg-bg-app border-2 border-border-sketch rounded pl-10 pr-3 py-1.5 font-montserrat text-xs sm:text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 bg-bg-app border border-border-sketch rounded px-2.5 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer truncate"
              >
                <option value="all">Все категории</option>
                {cocktailCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.toUpperCase()}
                  </option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                className="w-24 bg-bg-app border border-border-sketch rounded px-2 py-1.5 font-montserrat text-xs uppercase tracking-wider text-text-primary focus:outline-none focus:border-brand cursor-pointer text-center"
              >
                <option value="name_asc">А → Я</option>
                <option value="name_desc">Я → А</option>
              </select>

              <button
                type="button"
                onClick={() => setOnlyStarred(!onlyStarred)}
                className={`p-1.5 rounded border transition-all ${
                  onlyStarred
                    ? "bg-accent-primary border-accent-primary text-text-primary"
                    : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
                }`}
                title="Только проверенные ⭐"
              >
                <Star className={`w-3.5 h-3.5 ${onlyStarred ? "fill-text-primary" : ""}`} />
              </button>
            </div>

            {/* Быстрые кнопки пачек (+10, +20, +50 на все выбранные) */}
            {selected.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs font-montserrat">
                <span className="text-text-tertiary text-[11px] uppercase tracking-wider">
                  Пакетно к выбранным:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => addBatchToAllSelected(10)}
                    className="px-2 py-0.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-text-primary text-[11px] font-semibold transition-colors"
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => addBatchToAllSelected(20)}
                    className="px-2 py-0.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-text-primary text-[11px] font-semibold transition-colors"
                  >
                    +20
                  </button>
                  <button
                    type="button"
                    onClick={() => addBatchToAllSelected(50)}
                    className="px-2 py-0.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-text-primary text-[11px] font-semibold transition-colors"
                  >
                    +50
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Список компактных карточек коктейлей (без состава) */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredCocktails.length === 0 ? (
              <div className="card py-12 text-center">
                <p className="font-cormorant italic text-xl text-text-primary">Ничего не найдено</p>
                <p className="font-montserrat text-xs text-text-tertiary mt-1">
                  Измените параметры поиска
                </p>
              </div>
            ) : (
              filteredCocktails.map((cocktail) => {
                const qty = getQty(cocktail.key)
                const isSelected = qty > 0

                return (
                  <div
                    key={cocktail.key}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-150 ${
                      isSelected
                        ? "bg-accent-primary/20 border-brand shadow-sm"
                        : "bg-bg-card border-border hover:border-border-sketch"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="font-cormorant italic text-lg text-text-primary leading-tight font-semibold truncate">
                        {cocktail.name}
                      </h4>
                      <span className="inline-block mt-0.5 text-[10px] font-montserrat uppercase tracking-wider text-text-secondary">
                        {cocktail.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Быстрые +10 порций */}
                      <button
                        type="button"
                        onClick={() => changeQty(cocktail.key, cocktail.name, 10)}
                        className="px-1.5 py-0.5 text-[10px] font-montserrat font-semibold text-text-tertiary hover:text-brand hover:bg-surface-secondary/40 rounded transition-colors"
                        title="Добавить +10 порций"
                      >
                        +10
                      </button>

                      {/* Счётчик порций [-] [qty] [+] */}
                      <button
                        type="button"
                        onClick={() => changeQty(cocktail.key, cocktail.name, -1)}
                        disabled={qty === 0}
                        className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
                          qty > 0
                            ? "bg-bg-app border border-border-sketch text-text-primary hover:border-brand active:scale-95"
                            : "opacity-30 cursor-not-allowed text-text-tertiary border border-border"
                        }`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <input
                        type="number"
                        min="0"
                        value={qty === 0 ? "" : qty}
                        placeholder="0"
                        onChange={(e) =>
                          setQty(
                            cocktail.key,
                            cocktail.name,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-12 h-7 bg-bg-app border border-border-sketch rounded font-montserrat text-xs font-semibold text-center text-text-primary focus:outline-none focus:border-brand"
                      />

                      <button
                        type="button"
                        onClick={() => changeQty(cocktail.key, cocktail.name, 1)}
                        className="w-7 h-7 rounded-md bg-accent-primary border border-accent-primary flex items-center justify-center text-text-primary hover:brightness-95 active:scale-95 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ===================== ПРАВАЯ ПАНЕЛЬ: СМЕТА, ТТК И ОТЧЁТ (7 колонок) ===================== */}
        <div className="lg:col-span-7 bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
          {/* Вкладки переключения вида */}
          <div className="flex flex-wrap items-center justify-between p-3 sm:p-4 border-b border-border bg-bg-card gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("smeta")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-montserrat text-xs uppercase tracking-wider transition-all border ${
                  activeTab === "smeta"
                    ? "bg-accent-primary border-accent-primary text-text-primary font-semibold shadow-sm"
                    : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Смета закупки
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("ttk")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-montserrat text-xs uppercase tracking-wider transition-all border ${
                  activeTab === "ttk"
                    ? "bg-accent-primary border-accent-primary text-text-primary font-semibold shadow-sm"
                    : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                ТТК коктейлей
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("report")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-montserrat text-xs uppercase tracking-wider transition-all border ${
                  activeTab === "report"
                    ? "bg-accent-primary border-accent-primary text-text-primary font-semibold shadow-sm"
                    : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Отчёт
              </button>
            </div>

            {/* Кнопки экспорта (WhatsApp/Telegram, PDF, Печать, TXT, Копировать) */}
            {selected.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyMessenger}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-montserrat font-medium transition-all shadow-sm active:scale-95"
                  title="Скопировать список закупки для WhatsApp / Telegram"
                >
                  {copiedMessenger ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Скопировано!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>В WhatsApp / Telegram</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-accent-primary/70 hover:bg-accent-primary border border-accent-primary text-xs font-montserrat font-medium text-text-primary transition-all"
                  title="Скачать отчёт в PDF"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? "Создаю PDF..." : "PDF"}
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-xs font-montserrat text-text-primary transition-all"
                  title="Распечатать смету"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Печать
                </button>

                {activeTab === "report" && (
                  <>
                    <button
                      type="button"
                      onClick={handleCopyReport}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-xs font-montserrat text-text-primary transition-all"
                      title="Скопировать отчёт в буфер"
                    >
                      {copiedReport ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedReport ? "Скопировано!" : "Копировать"}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadTxt}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-xs font-montserrat text-text-primary transition-all"
                      title="Скачать TXT файл"
                    >
                      <Download className="w-3.5 h-3.5" />
                      TXT
                    </button>
                  </>
                )}

                {activeTab === "ttk" && (
                  <button
                    type="button"
                    onClick={handleCopyTtk}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-xs font-montserrat text-text-primary transition-all"
                  >
                    {copiedTtk ? <Check className="w-3.5 h-3.5 text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedTtk ? "Скопировано!" : "Копировать ТТК"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Содержимое правой панели */}
          <div className="p-4 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
            {selected.length === 0 ? (
              <div className="py-24 text-center">
                <CalcIcon className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-40" />
                <p className="font-cormorant italic text-2xl text-text-primary">
                  Коктейли не выбраны
                </p>
                <p className="font-montserrat text-xs text-text-tertiary mt-1 max-w-xs mx-auto">
                  Выберите необходимые позиции из списка слева, чтобы сформировать смету, ТТК и отчёт
                </p>
              </div>
            ) : (
              <>
                {/* 1. СМЕТА ЗАКУПКИ */}
                {activeTab === "smeta" && (
                  <div className="space-y-6">
                    {/* Полуфабрикаты к приготовлению */}
                    {calculation.categorized.pf_to_make.length > 0 && (
                      <div className="border border-border rounded-lg p-3.5 bg-bg-app/50">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary mb-2 flex items-center gap-1.5">
                          🍯 Полуфабрикаты к приготовлению ({calculation.categorized.pf_to_make.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {calculation.categorized.pf_to_make.map((pf) => (
                            <div
                              key={pf.key}
                              className="flex items-center justify-between bg-bg-card px-3 py-2 rounded border border-border text-xs font-montserrat"
                            >
                              <span className="font-medium text-text-primary truncate">{pf.name}</span>
                              <span className="font-semibold text-brand shrink-0 ml-2">
                                {pf.volume} {pf.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Алкоголь */}
                    {calculation.categorized.alcohol.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          🥃 Алкоголь ({calculation.categorized.alcohol.length})
                        </h4>
                        <div className="overflow-x-auto border border-border rounded-lg">
                          <table className="w-full text-left text-xs font-montserrat">
                            <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="px-3 py-2">Позиция</th>
                                <th className="px-3 py-2 text-right">Объём</th>
                                <th className="px-3 py-2 text-right">Бутылки</th>
                                <th className="px-3 py-2 text-right">Сумма, ₽</th>
                              </tr>
                            </thead>
                            <tbody>
                              {calculation.categorized.alcohol.map((a, i) => (
                                <tr key={a.name} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg-app/30"}`}>
                                  <td className="px-3 py-2 font-medium text-text-primary">{a.name}</td>
                                  <td className="px-3 py-2 text-right text-text-secondary">{a.amount.toFixed(3)} л</td>
                                  <td className="px-3 py-2 text-right font-semibold text-text-primary">
                                    {a.bottles} бут. ({a.bottleVol} л)
                                  </td>
                                  <td className="px-3 py-2 text-right font-semibold text-text-primary">{a.cost.toLocaleString()} ₽</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Безалкогольное и соки */}
                    {calculation.categorized.non_alcohol.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          🥤 Безалкогольное / Соки ({calculation.categorized.non_alcohol.length})
                        </h4>
                        <div className="overflow-x-auto border border-border rounded-lg">
                          <table className="w-full text-left text-xs font-montserrat">
                            <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="px-3 py-2">Позиция</th>
                                <th className="px-3 py-2 text-right">Объём</th>
                                <th className="px-3 py-2 text-right">Сумма, ₽</th>
                              </tr>
                            </thead>
                            <tbody>
                              {calculation.categorized.non_alcohol.map((na, i) => (
                                <tr key={na.name} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg-app/30"}`}>
                                  <td className="px-3 py-2 font-medium text-text-primary">{na.name}</td>
                                  <td className="px-3 py-2 text-right text-text-secondary">{na.amount.toFixed(3)} л</td>
                                  <td className="px-3 py-2 text-right font-semibold text-text-primary">{na.cost.toLocaleString()} ₽</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Сиропы, пюре, концентраты */}
                    {(calculation.categorized.syrups.length > 0 ||
                      calculation.categorized.puree.length > 0 ||
                      calculation.categorized.concentrate.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          🧪 Сиропы и пюре
                        </h4>
                        <div className="overflow-x-auto border border-border rounded-lg">
                          <table className="w-full text-left text-xs font-montserrat">
                            <thead className="bg-bg-app border-b border-border text-text-tertiary uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="px-3 py-2">Позиция</th>
                                <th className="px-3 py-2 text-right">Объём / Тара</th>
                                <th className="px-3 py-2 text-right">Сумма, ₽</th>
                              </tr>
                            </thead>
                            <tbody>
                              {calculation.categorized.syrups.map((s) => (
                                <tr key={s.name} className="border-b border-border last:border-0 bg-bg-card">
                                  <td className="px-3 py-2 font-medium text-text-primary">{s.name}</td>
                                  <td className="px-3 py-2 text-right text-text-secondary">{s.amount.toFixed(3)} л ({s.bottles} бут.)</td>
                                  <td className="px-3 py-2 text-right font-semibold text-text-primary">{s.cost.toLocaleString()} ₽</td>
                                </tr>
                              ))}
                              {calculation.categorized.puree.map((p) => (
                                <tr key={p.name} className="border-b border-border last:border-0 bg-bg-card">
                                  <td className="px-3 py-2 font-medium text-text-primary">{p.name} (пюре)</td>
                                  <td className="px-3 py-2 text-right text-text-secondary">{p.amount.toFixed(3)} л</td>
                                  <td className="px-3 py-2 text-right font-semibold text-text-primary">{p.cost.toLocaleString()} ₽</td>
                                </tr>
                              ))}
                              {calculation.categorized.concentrate.map((c) => (
                                <tr key={c.name} className="border-b border-border last:border-0 bg-bg-card">
                                  <td className="px-3 py-2 font-medium text-text-primary">{c.name} (концентрат)</td>
                                  <td className="px-3 py-2 text-right text-text-secondary">{c.amount.toFixed(3)} л</td>
                                  <td className="px-3 py-2 text-right font-semibold text-text-primary">{c.cost.toLocaleString()} ₽</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Лёд */}
                    {(calculation.categorized.ice_cube.length > 0 ||
                      calculation.categorized.ice_figurine.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          🧊 Лёд
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {calculation.categorized.ice_cube.map((ic) => (
                            <div key={ic.name} className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-montserrat">
                              <span className="font-medium text-text-primary">{ic.name}</span>
                              <span className="font-semibold text-text-primary">
                                {ic.amount} кг ({ic.cost.toLocaleString()} ₽)
                              </span>
                            </div>
                          ))}
                          {calculation.categorized.ice_figurine.map((ifig) => (
                            <div key={ifig.name} className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-montserrat">
                              <span className="font-medium text-text-primary">{ifig.name}</span>
                              <span className="font-semibold text-text-primary">
                                {ifig.amount} шт ({ifig.cost.toLocaleString()} ₽)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Украшения и сухие ингредиенты */}
                    {(calculation.categorized.decorations_pcs.length > 0 ||
                      calculation.categorized.decorations_gr.length > 0 ||
                      calculation.categorized.dry_gr.length > 0) && (
                      <div className="space-y-2">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          🍒 Украшения и специи
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {calculation.categorized.decorations_pcs.map((dp) => (
                            <div key={dp.name} className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-montserrat">
                              <span className="font-medium text-text-primary truncate">{dp.name}</span>
                              <span className="font-semibold text-text-primary shrink-0 ml-2">
                                {dp.amount} шт ({dp.cost.toLocaleString()} ₽)
                              </span>
                            </div>
                          ))}
                          {calculation.categorized.decorations_gr.map((dg) => (
                            <div key={dg.name} className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-montserrat">
                              <span className="font-medium text-text-primary truncate">{dg.name}</span>
                              <span className="font-semibold text-text-primary shrink-0 ml-2">
                                {dg.displayWeight} ({dg.cost.toLocaleString()} ₽)
                              </span>
                            </div>
                          ))}
                          {calculation.categorized.dry_gr.map((d) => (
                            <div key={d.name} className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-montserrat">
                              <span className="font-medium text-text-primary truncate">{d.name}</span>
                              <span className="font-semibold text-text-primary shrink-0 ml-2">
                                {d.displayWeight} ({d.cost.toLocaleString()} ₽)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Посуда */}
                    {calculation.categorized.glassware.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          <Wine className="w-3.5 h-3.5 text-brand" />
                          Посуда и бокалы
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {calculation.categorized.glassware.map((g) => (
                            <div key={g.name} className="flex items-center justify-between bg-bg-app px-3 py-2 rounded border border-border text-xs font-montserrat">
                              <span className="font-medium text-text-primary">{g.name}</span>
                              <span className="font-bold text-text-primary">{g.count} шт.</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. ТЕХНОЛОГИЧЕСКИЕ КАРТЫ (ТТК) */}
                {activeTab === "ttk" && (
                  <div className="space-y-4">
                    {calculation.ttkList.map((cocktail) => (
                      <div key={cocktail.key} className="bg-bg-app border border-border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                          <h4 className="font-cormorant italic text-xl text-text-primary font-semibold">
                            {cocktail.name}
                          </h4>
                          <span className="bg-accent-primary/60 text-text-primary font-montserrat text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {cocktail.count} порций
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Слева: Состав */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary block border-b border-border/40 pb-0.5">
                              Ингредиенты / Состав:
                            </span>
                            {cocktail.recipeItems?.length > 0 ? (
                              cocktail.recipeItems.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between font-montserrat text-xs py-0.5 border-b border-border/30 last:border-0"
                                >
                                  <span className="text-text-primary font-medium pr-1 truncate">{item.name}</span>
                                  <div className="text-right shrink-0">
                                    <span className="text-text-tertiary text-[11px]">{item.displayFormula} = </span>
                                    <span className="font-bold text-text-primary">{item.displayTotal}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <span className="text-text-tertiary text-xs italic">—</span>
                            )}
                          </div>

                          {/* Справа: Подача (Лёд, Украшение, Посуда) */}
                          <div className="space-y-2.5 sm:border-l sm:border-border sm:pl-4">
                            {/* Лёд */}
                            <div>
                              <span className="text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary block pb-0.5">
                                Лёд:
                              </span>
                              {cocktail.iceItems?.length > 0 ? (
                                cocktail.iceItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between font-montserrat text-xs py-0.5">
                                    <span className="text-text-primary font-medium pr-1 truncate">{item.name}</span>
                                    <div className="text-right shrink-0">
                                      <span className="text-text-tertiary text-[11px]">{item.displayFormula} = </span>
                                      <span className="font-bold text-text-primary">{item.displayTotal}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-text-tertiary text-[11px] italic">Без льда</span>
                              )}
                            </div>

                            {/* Украшение */}
                            <div>
                              <span className="text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary block pb-0.5">
                                Украшение:
                              </span>
                              {cocktail.decorationItems?.length > 0 ? (
                                cocktail.decorationItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between font-montserrat text-xs py-0.5">
                                    <span className="text-text-primary font-medium pr-1 truncate">{item.name}</span>
                                    <div className="text-right shrink-0">
                                      <span className="text-text-tertiary text-[11px]">{item.displayFormula} = </span>
                                      <span className="font-bold text-text-primary">{item.displayTotal}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-text-tertiary text-[11px] italic">Без украшения</span>
                              )}
                            </div>

                            {/* Посуда */}
                            <div>
                              <span className="text-[10px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary block pb-0.5">
                                Посуда:
                              </span>
                              {cocktail.glasswareItems?.length > 0 ? (
                                cocktail.glasswareItems.map((item: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between font-montserrat text-xs py-0.5">
                                    <span className="text-text-primary font-medium pr-1 truncate">{item.name}</span>
                                    <div className="text-right shrink-0">
                                      <span className="text-text-tertiary text-[11px]">{item.displayFormula} = </span>
                                      <span className="font-bold text-text-primary">{item.displayTotal}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <span className="text-text-tertiary text-[11px] italic">Не указана</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* ТТК Полуфабрикатов к приготовлению */}
                    {calculation.categorized.pf_to_make.length > 0 && (
                      <div className="pt-4 border-t border-border space-y-3">
                        <h4 className="font-montserrat font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                          🍯 ТТК полуфабрикатов к приготовлению ({calculation.categorized.pf_to_make.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {calculation.categorized.pf_to_make.map((pf: any) => (
                            <div
                              key={pf.key}
                              className="bg-bg-app border border-border rounded-lg p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between pb-1.5 border-b border-border">
                                <h4 className="font-cormorant italic text-base text-text-primary font-bold truncate pr-1">
                                  {pf.name}
                                </h4>
                                <span className="bg-accent-primary/60 text-text-primary font-montserrat text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                  Приготовить: {pf.volume} {pf.unit}
                                </span>
                              </div>

                              <div className="space-y-1">
                                <span className="text-[9px] font-bold font-montserrat uppercase tracking-wider text-text-tertiary block border-b border-border/40 pb-0.5">
                                  Ингредиенты / Состав:
                                </span>
                                {pf.items?.length > 0 ? (
                                  pf.items.map((item: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-center justify-between font-montserrat text-xs py-0.5 border-b border-border/30 last:border-0"
                                    >
                                      <span className="text-text-primary font-medium pr-1 truncate">
                                        {item.name}
                                      </span>
                                      <div className="text-right shrink-0">
                                        <span className="text-text-tertiary text-[10px]">
                                          {item.displayFormula} ={" "}
                                        </span>
                                        <span className="font-bold text-text-primary text-[11px]">
                                          {item.displayTotal}
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-text-tertiary text-xs italic">—</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. ГОТОВЫЙ СВОДНЫЙ ОТЧЁТ */}
                {activeTab === "report" && (
                  <div className="relative">
                    <pre className="p-4 bg-bg-app border border-border rounded-lg font-mono text-xs sm:text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap select-all overflow-x-auto">
                      {formattedReportText}
                    </pre>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Футер правой панели с итогом */}
          {selected.length > 0 && (
            <div className="p-3 sm:p-4 bg-bg-card border-t border-border flex items-center justify-between">
              <span className="font-montserrat text-xs text-text-tertiary">
                Выбрано: <strong className="text-text-primary">{calculation.totalPortions}</strong> порций ({selected.length} {selected.length === 1 ? "коктейль" : selected.length < 5 ? "коктейля" : "коктейлей"})
              </span>

              <div className="flex items-center gap-2">
                <span className="font-montserrat text-xs uppercase tracking-wider text-text-tertiary">
                  Итого закупка:
                </span>
                <span className="font-montserrat font-bold text-lg sm:text-xl text-text-primary">
                  {calculation.grandTotalCost.toLocaleString()} ₽
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Контейнер для чистой генерации PDF и печати */}
      <div
        id="printable-smeta-container"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          width: "800px",
          zIndex: -9999,
          backgroundColor: "#ffffff",
          pointerEvents: "none",
        }}
      >
        <PrintableSmeta
          ref={printRef}
          calculation={calculation}
          totalPortions={calculation.totalPortions}
          grandTotalCost={calculation.grandTotalCost}
          selectedCount={selected.length}
          eventName={eventName}
          eventDate={eventDate}
          bufferPercent={bufferPercent}
        />
      </div>
    </div>
  )
}
