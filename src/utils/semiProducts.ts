// src/utils/semiProducts.ts
import { Recipe, SemiProduct } from "@/types/db"
import { cleanPfKey } from "./formatting"

export function findSemiProduct(
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
export function expandRecipe(
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
