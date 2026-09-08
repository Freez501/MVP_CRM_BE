import { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { saveFullDbToDisk } from "./DatabaseSyncService"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

const baseDb = db as CocktailsDb

export interface IngredientData {
  key: string
  name: string
  category: string
  price: number
  unit: string
  bottle?: number
}

interface IngredientsContextType {
  prices: Record<string, number>
  categories: Record<string, string>
  ingredientInfo: Record<string, { display_name?: string; unit?: string }>
  bottleVolumes: Record<string, number>
  deletedIngredientKeys: string[]
  addIngredient: (data: IngredientData) => void
  updateIngredient: (key: string, updates: Partial<IngredientData>) => void
  removeIngredient: (key: string) => void
  getDefaultUnit: (category: string) => string
}

const IngredientsContext = createContext<IngredientsContextType | undefined>(undefined)

export function IngredientsProvider({ children }: { children: ReactNode }) {
  const [customPrices, setCustomPrices] = useLocalStorage<Record<string, number>>(
    "brilliant-custom-prices",
    {}
  )
  const [customCategoriesMap, setCustomCategoriesMap] = useLocalStorage<Record<string, string>>(
    "brilliant-custom-categories-map",
    {}
  )
  const [customIngredientInfo, setCustomIngredientInfo] = useLocalStorage<
    Record<string, { display_name?: string; unit?: string }>
  >("brilliant-custom-ingredient-info", {})
  const [customBottleVolumes, setCustomBottleVolumes] = useLocalStorage<Record<string, number>>(
    "brilliant-custom-bottle-volumes",
    {}
  )
  const [deletedIngredientKeys, setDeletedIngredientKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-ingredients",
    []
  )

  const { addActivity } = useActivities()

  // Загрузка ингредиентов из Supabase при старте
  useEffect(() => {
    supabase
      .from("ingredients")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) {
          const pricesMap: Record<string, number> = {}
          const catMap: Record<string, string> = {}
          const infoMap: Record<string, { display_name?: string; unit?: string }> = {}
          const bottleMap: Record<string, number> = {}

          for (const row of data) {
            pricesMap[row.key] = Number(row.price_per_unit || 0)
            catMap[row.key] = row.category
            infoMap[row.key] = { display_name: row.name, unit: row.unit }
            if (row.bottle_volume) bottleMap[row.key] = Number(row.bottle_volume)
          }

          setCustomPrices((prev) => ({ ...prev, ...pricesMap }))
          setCustomCategoriesMap((prev) => ({ ...prev, ...catMap }))
          setCustomIngredientInfo((prev) => ({ ...prev, ...infoMap }))
          setCustomBottleVolumes((prev) => ({ ...prev, ...bottleMap }))
        }
      })
  }, [setCustomPrices, setCustomCategoriesMap, setCustomIngredientInfo, setCustomBottleVolumes])

  // Мёрдж цен и фильтрация удалённых
  const prices = useMemo(() => {
    const merged = { ...baseDb.prices, ...customPrices }
    deletedIngredientKeys.forEach((k) => delete merged[k])
    return merged
  }, [customPrices, deletedIngredientKeys])

  // Мёрдж категорий ингредиентов
  const categories = useMemo(() => {
    const merged = { ...baseDb.categories, ...customCategoriesMap }
    deletedIngredientKeys.forEach((k) => delete merged[k])
    return merged
  }, [customCategoriesMap, deletedIngredientKeys])

  // Дефолтные единицы по категории
  const getDefaultUnit = useCallback((category: string) => {
    if (["алкоголь", "безалкогольное", "сироп", "пюре", "концентрат"].includes(category)) return "л"
    if (["посуда", "украшение_шт"].includes(category)) return "шт"
    if (["фрукты", "травы", "сыпучка", "сухой_гр"].includes(category)) return "г"
    if (["лёд_кубик", "лёд_фигурный"].includes(category)) return "кг"
    return "л"
  }, [])

  // Мёрдж информации об ингредиентах с дефолтными единицами
  const ingredientInfo = useMemo(() => {
    const merged: Record<string, { display_name?: string; unit?: string }> = {
      ...baseDb.ingredient_info,
      ...customIngredientInfo,
    }
    // Проставляем дефолтные единицы, если их нет
    Object.keys(prices).forEach((key) => {
      const cat = categories[key] || "алкоголь"
      if (!merged[key]) {
        merged[key] = { display_name: key, unit: getDefaultUnit(cat) }
      } else if (!merged[key].unit || merged[key].unit === "—") {
        merged[key] = { ...merged[key], unit: getDefaultUnit(cat) }
      }
    })
    deletedIngredientKeys.forEach((k) => delete merged[k])
    return merged
  }, [customIngredientInfo, prices, categories, deletedIngredientKeys, getDefaultUnit])

  // Мёрдж объёмов бутылок
  const bottleVolumes = useMemo(() => {
    const merged = { ...baseDb.bottle_volumes, ...customBottleVolumes }
    deletedIngredientKeys.forEach((k) => delete merged[k])
    return merged
  }, [customBottleVolumes, deletedIngredientKeys])

  const addIngredient = useCallback(
    (data: IngredientData) => {
      const cleanKey = data.key.trim().toLowerCase()
      setCustomPrices((prev) => ({ ...prev, [cleanKey]: data.price }))
      setCustomCategoriesMap((prev) => ({ ...prev, [cleanKey]: data.category }))
      setCustomIngredientInfo((prev) => ({
        ...prev,
        [cleanKey]: { display_name: data.name.trim(), unit: data.unit },
      }))
      if (data.bottle !== undefined) {
        setCustomBottleVolumes((prev) => ({ ...prev, [cleanKey]: data.bottle || 0 }))
      }
      setDeletedIngredientKeys((prev) => prev.filter((k) => k !== cleanKey))

      saveFullDbToDisk({
        prices: { ...prices, [cleanKey]: data.price },
        categories: { ...categories, [cleanKey]: data.category },
        ingredient_info: {
          ...ingredientInfo,
          [cleanKey]: { display_name: data.name.trim(), unit: data.unit },
        },
        bottle_volumes:
          data.bottle !== undefined
            ? { ...bottleVolumes, [cleanKey]: data.bottle || 0 }
            : bottleVolumes,
      })

      addActivity({
        type: "note_added",
        description: `Добавлен ингредиент «${data.name}» (${data.category})`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("ingredients")
        .upsert({
          key: cleanKey,
          name: data.name.trim(),
          category: data.category,
          unit: data.unit,
          price_per_unit: data.price,
          bottle_volume: data.bottle ?? null,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase ingredient upsert warning:", error.message)
        })
    },
    [
      prices,
      categories,
      ingredientInfo,
      bottleVolumes,
      setCustomPrices,
      setCustomCategoriesMap,
      setCustomIngredientInfo,
      setCustomBottleVolumes,
      setDeletedIngredientKeys,
      addActivity,
    ]
  )

  const updateIngredient = useCallback(
    (key: string, updates: Partial<IngredientData>) => {
      const cleanKey = key.trim().toLowerCase()
      const updatedPrice = updates.price !== undefined ? updates.price : prices[cleanKey]
      const updatedCategory =
        updates.category !== undefined ? updates.category : categories[cleanKey]
      const updatedInfo = {
        ...ingredientInfo[cleanKey],
        display_name:
          updates.name !== undefined
            ? updates.name.trim()
            : ingredientInfo[cleanKey]?.display_name || cleanKey,
        unit: updates.unit !== undefined ? updates.unit : ingredientInfo[cleanKey]?.unit || "л",
      }
      const updatedBottle = updates.bottle !== undefined ? updates.bottle : bottleVolumes[cleanKey]

      if (updates.price !== undefined) {
        setCustomPrices((prev) => ({ ...prev, [cleanKey]: updates.price! }))
      }
      if (updates.category !== undefined) {
        setCustomCategoriesMap((prev) => ({ ...prev, [cleanKey]: updates.category! }))
      }
      if (updates.name !== undefined || updates.unit !== undefined) {
        setCustomIngredientInfo((prev) => ({
          ...prev,
          [cleanKey]: updatedInfo,
        }))
      }
      if (updates.bottle !== undefined) {
        setCustomBottleVolumes((prev) => ({ ...prev, [cleanKey]: updates.bottle || 0 }))
      }

      saveFullDbToDisk({
        prices: updatedPrice !== undefined ? { ...prices, [cleanKey]: updatedPrice } : prices,
        categories:
          updatedCategory !== undefined
            ? { ...categories, [cleanKey]: updatedCategory }
            : categories,
        ingredient_info: {
          ...ingredientInfo,
          [cleanKey]: updatedInfo,
        },
        bottle_volumes:
          updatedBottle !== undefined
            ? { ...bottleVolumes, [cleanKey]: updatedBottle }
            : bottleVolumes,
      })

      addActivity({
        type: "note_added",
        description: `Обновлён ингредиент «${updates.name || cleanKey}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("ingredients")
        .upsert({
          key: cleanKey,
          name: updatedInfo.display_name || cleanKey,
          category: updatedCategory,
          unit: updatedInfo.unit || "мл",
          price_per_unit: updatedPrice,
          bottle_volume: updatedBottle ?? null,
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase ingredient update warning:", error.message)
        })
    },
    [
      prices,
      categories,
      ingredientInfo,
      bottleVolumes,
      setCustomPrices,
      setCustomCategoriesMap,
      setCustomIngredientInfo,
      setCustomBottleVolumes,
      addActivity,
    ]
  )

  const removeIngredient = useCallback(
    (key: string) => {
      const cleanKey = key.trim().toLowerCase()
      const name = ingredientInfo[cleanKey]?.display_name || cleanKey
      setDeletedIngredientKeys((prev) => (prev.includes(cleanKey) ? prev : [...prev, cleanKey]))

      const updatedPrices = { ...prices }
      delete updatedPrices[cleanKey]
      const updatedCategories = { ...categories }
      delete updatedCategories[cleanKey]
      const updatedInfo = { ...ingredientInfo }
      delete updatedInfo[cleanKey]
      const updatedBottles = { ...bottleVolumes }
      delete updatedBottles[cleanKey]

      saveFullDbToDisk({
        prices: updatedPrices,
        categories: updatedCategories,
        ingredient_info: updatedInfo,
        bottle_volumes: updatedBottles,
      })

      addActivity({
        type: "note_added",
        description: `Удалён ингредиент «${name}» из базы`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("ingredients")
        .delete()
        .eq("key", cleanKey)
        .then(({ error }) => {
          if (error) console.warn("Supabase ingredient delete warning:", error.message)
        })
    },
    [ingredientInfo, prices, categories, bottleVolumes, setDeletedIngredientKeys, addActivity]
  )

  return (
    <IngredientsContext.Provider
      value={{
        prices,
        categories,
        ingredientInfo,
        bottleVolumes,
        deletedIngredientKeys,
        addIngredient,
        updateIngredient,
        removeIngredient,
        getDefaultUnit,
      }}
    >
      {children}
    </IngredientsContext.Provider>
  )
}

export function useIngredients() {
  const context = useContext(IngredientsContext)
  if (!context) {
    throw new Error("useIngredients must be used within IngredientsProvider")
  }
  return context
}
