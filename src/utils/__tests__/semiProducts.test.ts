import { describe, it, expect } from "vitest"
import { findSemiProduct, expandRecipe } from "../semiProducts"

describe("findSemiProduct", () => {
  const semiProducts = {
    "сауэр микс": { name: "Сауэр Микс", output_volume: 1, unit: "л", recipe: {} },
  }

  it("finds by exact key", () => {
    expect(findSemiProduct("сауэр микс", semiProducts)).toBeTruthy()
  })
  it("returns null for unknown key", () => {
    expect(findSemiProduct("неизвестный", semiProducts)).toBeNull()
  })
  it("returns null for empty key", () => {
    expect(findSemiProduct("", semiProducts)).toBeNull()
  })
})

describe("expandRecipe", () => {
  const semiProducts = {
    "сауэр микс": {
      name: "Сауэр Микс",
      output_volume: 1,
      unit: "л",
      recipe: {
        "сок лимона": 0.5,
        "сахарный сироп": 0.5,
      },
    },
  }

  it("expands recipe without semi products", () => {
    const recipe = { водка: 0.05, тоник: 0.15 }
    const result = expandRecipe(recipe, 2, semiProducts, {})
    expect(result["водка"]).toBeCloseTo(0.1)
    expect(result["тоник"]).toBeCloseTo(0.3)
  })

  it("expands recipe with semi products", () => {
    const recipe = { "пф: сауэр микс": 0.05, водка: 0.05 }
    const pfToMake: Record<string, number> = {}
    const result = expandRecipe(recipe, 10, semiProducts, pfToMake)
    expect(result["водка"]).toBeCloseTo(0.5)
    expect(result["сок лимона"]).toBeCloseTo(0.25)
    expect(result["сахарный сироп"]).toBeCloseTo(0.25)
    expect(pfToMake["сауэр микс"]).toBeCloseTo(0.5)
  })
})
