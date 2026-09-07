import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useCalculator } from "../useCalculator"
import { Cocktail } from "@/types/db"

describe("useCalculator", () => {
  const mockCocktails: Record<string, Cocktail> = {
    margarita: {
      name: "Маргарита",
      category: "classic",
      recipe: {
        текила: 0.05,
        "трипл сек": 0.025,
        "сок лайма": 0.025,
      },
      decorations: {
        "лайм долька": 1,
      },
      glassware: {
        шале: 1,
      },
    },
  }

  const mockPrices: Record<string, number> = {
    текила: 2000,
    "трипл сек": 1500,
    "сок лайма": 400,
    "лайм долька": 20,
    шале: 150,
  }

  const mockCategories: Record<string, string> = {
    текила: "алкоголь",
    "трипл сек": "алкоголь",
    "сок лайма": "безалкогольное",
    "лайм долька": "украшение_шт",
    шале: "посуда",
  }

  const mockIngredientInfo = {
    текила: { display_name: "Текила", unit: "л" },
    "трипл сек": { display_name: "Трипл Сек", unit: "л" },
    "сок лайма": { display_name: "Сок Лайма", unit: "л" },
    "лайм долька": { display_name: "Лайм долька", unit: "шт" },
    шале: { display_name: "Шале", unit: "шт" },
  }

  it("calculates totals correctly for selected cocktails", () => {
    const { result } = renderHook(() =>
      useCalculator({
        selected: [{ key: "margarita", name: "Маргарита", qty: 20 }],
        bufferPercent: 0,
        cocktails: mockCocktails,
        semiProducts: {},
        prices: mockPrices,
        categories: mockCategories,
        ingredientInfo: mockIngredientInfo,
        bottleVolumes: { текила: 0.7, "трипл сек": 0.7 },
      })
    )

    expect(result.current.totalPortions).toBe(20)
    expect(result.current.ttkList.length).toBe(1)
    expect(result.current.ttkList[0].name).toBe("Маргарита")
    expect(result.current.ttkList[0].count).toBe(20)

    // Текила: 20 * 0.05 = 1.0 л -> 2 бутылки по 0.7 л = 4000 руб
    // Трипл сек: 20 * 0.025 = 0.5 л -> 1 бутылка по 0.7 л = 1500 руб
    // Сок лайма: 20 * 0.025 = 0.5 л -> 0.5 * 400 = 200 руб
    // Украшение: 20 шт * 20 руб = 400 руб
    // Посуда не добавляется в grandTotalCost (только в categorized.glassware)
    // Итого: 4000 + 1500 + 200 + 400 = 6100 руб
    expect(result.current.grandTotalCost).toBe(6100)
    expect(result.current.categorized.alcohol.length).toBe(2)
    expect(result.current.categorized.glassware.length).toBe(1)
    expect(result.current.categorized.glassware[0].count).toBe(20)
  })

  it("applies buffer percentage multiplier", () => {
    const { result } = renderHook(() =>
      useCalculator({
        selected: [{ key: "margarita", name: "Маргарита", qty: 10 }],
        bufferPercent: 20, // +20%
        cocktails: mockCocktails,
        semiProducts: {},
        prices: mockPrices,
        categories: mockCategories,
        ingredientInfo: mockIngredientInfo,
        bottleVolumes: { текила: 0.7, "трипл сек": 0.7 },
      })
    )

    expect(result.current.totalPortions).toBe(10)
    expect(result.current.bufferPercent).toBe(20)
    // 10 * 1.2 = 12 порций для закупки
    // Текила: 12 * 0.05 = 0.6 л -> 1 бутылка (2000 руб)
    // Трипл сек: 12 * 0.025 = 0.3 л -> 1 бутылка (1500 руб)
    // Сок лайма: 12 * 0.025 = 0.3 л -> 0.3 * 400 = 120 руб
    // Украшение: 12 шт -> 12 * 20 = 240 руб
    // Итого: 2000 + 1500 + 120 + 240 = 3860 руб
    expect(result.current.grandTotalCost).toBe(3860)
  })
})
