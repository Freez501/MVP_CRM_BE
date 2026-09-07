import db from "@/data/cocktails_db.json"
import { CocktailsDb, Cocktail, SemiProduct } from "@/types/db"

const baseDb = db as CocktailsDb

let lastSavedJson = ""

export async function saveFullDbToDisk(override?: {
  cocktails?: Record<string, Cocktail>
  semi_products?: Record<string, SemiProduct>
  prices?: Record<string, number>
  categories?: Record<string, string>
  category_names?: Record<string, string>
  ingredient_info?: Record<string, { display_name?: string; unit?: string }>
  bottle_volumes?: Record<string, number>
}) {
  try {
    const storedCocktails = JSON.parse(localStorage.getItem("brilliant-custom-cocktails") || "{}")
    const deletedCocktails: string[] = JSON.parse(
      localStorage.getItem("brilliant-deleted-cocktails") || "[]"
    )
    const mergedCocktails = { ...baseDb.cocktails, ...storedCocktails }
    deletedCocktails.forEach((k) => delete mergedCocktails[k])

    const storedSemi = JSON.parse(localStorage.getItem("brilliant-custom-semi-products") || "{}")
    const deletedSemi: string[] = JSON.parse(
      localStorage.getItem("brilliant-deleted-semi-products") || "[]"
    )
    const mergedSemi = { ...baseDb.semi_products, ...storedSemi }
    deletedSemi.forEach((k) => delete mergedSemi[k])

    const storedPrices = JSON.parse(localStorage.getItem("brilliant-custom-prices") || "{}")
    const deletedIngredients: string[] = JSON.parse(
      localStorage.getItem("brilliant-deleted-ingredients") || "[]"
    )
    const mergedPrices = { ...baseDb.prices, ...storedPrices }
    deletedIngredients.forEach((k) => delete mergedPrices[k])

    const storedCatMap = JSON.parse(localStorage.getItem("brilliant-custom-categories-map") || "{}")
    const mergedCatMap = { ...baseDb.categories, ...storedCatMap }
    deletedIngredients.forEach((k) => delete mergedCatMap[k])

    const storedInfo = JSON.parse(localStorage.getItem("brilliant-custom-ingredient-info") || "{}")
    const mergedInfo = { ...baseDb.ingredient_info, ...storedInfo }
    deletedIngredients.forEach((k) => delete mergedInfo[k])

    const storedBottles = JSON.parse(
      localStorage.getItem("brilliant-custom-bottle-volumes") || "{}"
    )
    const mergedBottles = { ...baseDb.bottle_volumes, ...storedBottles }
    deletedIngredients.forEach((k) => delete mergedBottles[k])

    const storedCatNames = JSON.parse(
      localStorage.getItem("brilliant-custom-category-names") || "{}"
    )
    const deletedCats: string[] = JSON.parse(
      localStorage.getItem("brilliant-deleted-categories") || "[]"
    )
    const mergedCatNames = { ...baseDb.category_names, ...storedCatNames }
    deletedCats.forEach((k) => delete mergedCatNames[k])

    const fullDb: CocktailsDb = {
      semi_products: override?.semi_products ?? mergedSemi,
      cocktails: override?.cocktails ?? mergedCocktails,
      categories: override?.categories ?? mergedCatMap,
      bottle_volumes: override?.bottle_volumes ?? mergedBottles,
      prices: override?.prices ?? mergedPrices,
      ingredient_info: (override?.ingredient_info ?? mergedInfo) as Record<
        string,
        { display_name?: string; unit: string }
      >,
      category_names: override?.category_names ?? mergedCatNames,
      cocktail_categories: baseDb.cocktail_categories,
    }

    const jsonStr = JSON.stringify(fullDb)
    if (jsonStr === lastSavedJson) {
      return
    }
    lastSavedJson = jsonStr

    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: jsonStr,
    })
  } catch (err) {
    console.warn("Auto-save to disk unavailable:", err)
  }
}
