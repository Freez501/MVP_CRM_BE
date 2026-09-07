// src/components/calculator/useCalculator.ts
import { useMemo } from "react"
import { Cocktail, SemiProduct } from "@/types/db"
import { capitalize, cleanPfKey } from "@/utils/formatting"
import { findSemiProduct, expandRecipe } from "@/utils/semiProducts"

export interface SelectedCocktail {
  key: string
  name: string
  qty: number
}

export interface TtkItem {
  name: string
  norm: number
  total: number
  unit: string
  displayFormula: string
  displayTotal: string
}

export interface TtkCocktail {
  key: string
  name: string
  count: number
  recipeItems: TtkItem[]
  iceItems: TtkItem[]
  decorationItems: TtkItem[]
  glasswareItems: TtkItem[]
  items: TtkItem[]
}

export interface PfToMakeItem {
  key: string
  name: string
  volume: number
  unit: string
  factor: number
  items: TtkItem[]
}

export interface AlcoholIngredient {
  name: string
  amount: number
  bottles: number
  bottleVol: number
  unit: string
  price: number
  cost: number
}

export interface LiquidIngredient {
  name: string
  amount: number
  unit: string
  price: number
  cost: number
}

export interface SyrupIngredient {
  name: string
  amount: number
  bottles: number
  bottleVol: number
  unit: string
  price: number
  cost: number
}

export interface GramIngredient {
  name: string
  grams: number
  displayWeight: string
  unit: string
  price: number
  cost: number
}

export interface PieceIngredient {
  name: string
  amount: number
  unit: string
  price: number
  cost: number
}

export interface IceCubeIngredient {
  name: string
  amount: number
  unit: string
  price: number
  cost: number
}

export interface IceFigurineIngredient {
  name: string
  amount: number
  unit: string
  price: number
  cost: number
}

export interface GlasswareItem {
  name: string
  count: number
  unit: string
}

export interface CategorizedIngredients {
  alcohol: AlcoholIngredient[]
  non_alcohol: LiquidIngredient[]
  syrups: SyrupIngredient[]
  puree: LiquidIngredient[]
  concentrate: LiquidIngredient[]
  dry_gr: GramIngredient[]
  ice_cube: IceCubeIngredient[]
  ice_figurine: IceFigurineIngredient[]
  decorations_pcs: PieceIngredient[]
  decorations_gr: GramIngredient[]
  glassware: GlasswareItem[]
  pf_to_make: PfToMakeItem[]
}

export interface CalculatorResult {
  ttkList: TtkCocktail[]
  categorized: CategorizedIngredients
  grandTotalCost: number
  totalPortions: number
  bufferPercent: number
}

export interface CalculatorParams {
  selected: SelectedCocktail[]
  bufferPercent: number
  cocktails: Record<string, Cocktail>
  semiProducts: Record<string, SemiProduct>
  prices: Record<string, number>
  categories: Record<string, string>
  ingredientInfo: Record<string, { display_name?: string; unit?: string }>
  bottleVolumes: Record<string, number>
}

export function useCalculator({
  selected,
  bufferPercent,
  cocktails,
  semiProducts,
  prices,
  categories,
  ingredientInfo,
  bottleVolumes,
}: CalculatorParams): CalculatorResult {
  return useMemo(() => {
    const rawTotals: Record<string, number> = {}
    const glasswareTotals: Record<string, number> = {}
    const pfToMake: Record<string, number> = {}
    const bufferMultiplier = 1 + (bufferPercent || 0) / 100

    const ttkList: TtkCocktail[] = []

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

      const recipeItems: TtkItem[] = []
      const iceItems: TtkItem[] = []
      const decorationItems: TtkItem[] = []
      const glasswareItems: TtkItem[] = []

      // Форматирование позиции ТТК
      const formatTtkItem = (ing: string, norm: number, isDec = false): TtkItem => {
        const total = norm * item.qty
        const foundPf = findSemiProduct(ing, semiProducts)
        const cleanKey = cleanPfKey(ing)
        const info = ingredientInfo[ing] || ingredientInfo[cleanKey] || {}
        const cat = categories[ing] || categories[cleanKey] || ""
        const isPf = Boolean(foundPf)
        const isLiquid = isPf
          ? foundPf?.semi?.unit === "л" || foundPf?.semi?.unit === "мл" || !foundPf?.semi?.unit
          : (norm < 1 && (info.unit === "л" || !info.unit)) ||
            info.unit === "л" ||
            info.unit === "мл"

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
    const categorized: CategorizedIngredients = {
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

      const items: TtkItem[] = []

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
            : (baseAmount < 1 && (info.unit === "л" || !info.unit)) ||
              info.unit === "л" ||
              info.unit === "мл"

          let displayFormula = ""
          let displayTotal = ""

          if (isPfSub) {
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
  }, [
    selected,
    cocktails,
    semiProducts,
    ingredientInfo,
    categories,
    prices,
    bottleVolumes,
    bufferPercent,
  ])
}
