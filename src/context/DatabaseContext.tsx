import { createContext, useContext, ReactNode, useMemo } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb, Cocktail, SemiProduct } from "@/types/db"
import { useActivities } from "./ActivitiesContext"

const baseDb = db as CocktailsDb

export interface IngredientData {
  key: string
  name: string
  category: string
  price: number
  unit: string
  bottle?: number
}

interface DatabaseContextType {
  cocktails: Record<string, Cocktail>
  semiProducts: Record<string, SemiProduct>
  prices: Record<string, number>
  categories: Record<string, string>
  categoryNames: Record<string, string>
  cocktailCategories: string[]
  ingredientInfo: Record<string, { display_name?: string; unit?: string }>
  bottleVolumes: Record<string, number>
  starredKeys: string[]
  toggleStar: (key: string) => void
  isStarred: (key: string) => boolean
  addCocktail: (key: string, cocktail: Cocktail) => void
  updateCocktail: (key: string, updates: Partial<Cocktail>) => void
  removeCocktail: (key: string) => void
  addSemiProduct: (key: string, semiProduct: SemiProduct) => void
  updateSemiProduct: (key: string, updates: Partial<SemiProduct>) => void
  removeSemiProduct: (key: string) => void
  addIngredient: (data: IngredientData) => void
  updateIngredient: (key: string, updates: Partial<IngredientData>) => void
  removeIngredient: (key: string) => void
  addCategory: (key: string, displayName: string) => void
  removeCategory: (key: string) => void
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined)

export function DatabaseProvider({ children }: { children: ReactNode }) {
  // Коктейли
  const [customCocktails, setCustomCocktails] = useLocalStorage<Record<string, Cocktail>>(
    "brilliant-custom-cocktails",
    {}
  )
  const [deletedKeys, setDeletedKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-cocktails",
    []
  )
  const [starredKeys, setStarredKeys] = useLocalStorage<string[]>(
    "brilliant-starred-cocktails",
    []
  )

  // Полуфабрикаты
  const [customSemiProducts, setCustomSemiProducts] = useLocalStorage<Record<string, SemiProduct>>(
    "brilliant-custom-semi-products",
    {}
  )
  const [deletedSemiKeys, setDeletedSemiKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-semi-products",
    []
  )

  // Ингредиенты
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

  // Категории
  const [customCategoryNames, setCustomCategoryNames] = useLocalStorage<Record<string, string>>(
    "brilliant-custom-category-names",
    {}
  )
  const [deletedCategoryKeys, setDeletedCategoryKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-categories",
    []
  )

  const { addActivity } = useActivities()

  // Мёрдж категорий
  const categoryNames = useMemo(() => {
    const merged = { ...baseDb.category_names, ...customCategoryNames }
    deletedCategoryKeys.forEach((k) => delete merged[k])
    return merged
  }, [customCategoryNames, deletedCategoryKeys])

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
  const getDefaultUnit = (category: string) => {
    if (["алкоголь", "безалкогольное", "сироп", "пюре", "концентрат"].includes(category)) return "л"
    if (["посуда", "украшение_шт"].includes(category)) return "шт"
    if (["фрукты", "травы", "сыпучка", "сухой_гр"].includes(category)) return "г"
    if (["лёд_кубик", "лёд_фигурный"].includes(category)) return "кг"
    return "л"
  }

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
  }, [customIngredientInfo, prices, categories, deletedIngredientKeys])

  // Мёрдж объёмов бутылок
  const bottleVolumes = useMemo(() => {
    const merged = { ...baseDb.bottle_volumes, ...customBottleVolumes }
    deletedIngredientKeys.forEach((k) => delete merged[k])
    return merged
  }, [customBottleVolumes, deletedIngredientKeys])

  // Коктейли
  const cocktails = useMemo(() => {
    const merged = { ...baseDb.cocktails, ...customCocktails }
    deletedKeys.forEach((key) => {
      delete merged[key]
    })
    return merged
  }, [customCocktails, deletedKeys])

  // Полуфабрикаты
  const semiProducts = useMemo(() => {
    const merged = { ...baseDb.semi_products, ...customSemiProducts }
    deletedSemiKeys.forEach((key) => {
      delete merged[key]
    })
    return merged
  }, [customSemiProducts, deletedSemiKeys])

  const toggleStar = (key: string) => {
    setStarredKeys((prev) => {
      const exists = prev.includes(key)
      const next = exists ? prev.filter((k) => k !== key) : [...prev, key]
      const cocktailName = cocktails[key]?.name || key
      if (!exists) {
        addActivity({
          type: "note_added",
          description: `Коктейль «${cocktailName}» отмечен как проверенный ⭐`,
          user: "Влад",
        })
      }
      return next
    })
  }

  const isStarred = (key: string) => starredKeys.includes(key)

  const addCocktail = (key: string, cocktail: Cocktail) => {
    const cleanKey = key.trim().toLowerCase()
    setCustomCocktails((prev) => ({
      ...prev,
      [cleanKey]: cocktail,
    }))
    setDeletedKeys((prev) => prev.filter((k) => k !== cleanKey))
    addActivity({
      type: "note_added",
      description: `Создан новый коктейль «${cocktail.name}»`,
      user: "Влад",
    })
  }

  const updateCocktail = (key: string, updates: Partial<Cocktail>) => {
    const current = cocktails[key]
    if (!current) return
    const updated: Cocktail = {
      ...current,
      ...updates,
    }
    setCustomCocktails((prev) => ({
      ...prev,
      [key]: updated,
    }))
    addActivity({
      type: "note_added",
      description: `Отредактирован коктейль «${updated.name}»`,
      user: "Влад",
    })
  }

  const removeCocktail = (key: string) => {
    const target = cocktails[key]
    setCustomCocktails((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
    setDeletedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    if (target) {
      addActivity({
        type: "note_added",
        description: `Удалён коктейль «${target.name}» из базы`,
        user: "Влад",
      })
    }
  }

  const addSemiProduct = (key: string, semiProduct: SemiProduct) => {
    const cleanKey = key.trim().toLowerCase()
    setCustomSemiProducts((prev) => ({
      ...prev,
      [cleanKey]: semiProduct,
    }))
    setDeletedSemiKeys((prev) => prev.filter((k) => k !== cleanKey))
    addActivity({
      type: "note_added",
      description: `Создан новый полуфабрикат «${semiProduct.name}»`,
      user: "Влад",
    })
  }

  const updateSemiProduct = (key: string, updates: Partial<SemiProduct>) => {
    const current = semiProducts[key]
    if (!current) return
    const updated: SemiProduct = {
      ...current,
      ...updates,
    }
    setCustomSemiProducts((prev) => ({
      ...prev,
      [key]: updated,
    }))
    addActivity({
      type: "note_added",
      description: `Отредактирован полуфабрикат «${updated.name}»`,
      user: "Влад",
    })
  }

  const removeSemiProduct = (key: string) => {
    const target = semiProducts[key]
    setCustomSemiProducts((prev) => {
      const copy = { ...prev }
      delete copy[key]
      return copy
    })
    setDeletedSemiKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    if (target) {
      addActivity({
        type: "note_added",
        description: `Удалён полуфабрикат «${target.name}» из базы`,
        user: "Влад",
      })
    }
  }

  // ================= CRUD ИНГРЕДИЕНТОВ =================
  const addIngredient = (data: IngredientData) => {
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
    addActivity({
      type: "note_added",
      description: `Добавлен ингредиент «${data.name}» (${data.category})`,
      user: "Влад",
    })
  }

  const updateIngredient = (key: string, updates: Partial<IngredientData>) => {
    const cleanKey = key.trim().toLowerCase()
    if (updates.price !== undefined) {
      setCustomPrices((prev) => ({ ...prev, [cleanKey]: updates.price! }))
    }
    if (updates.category !== undefined) {
      setCustomCategoriesMap((prev) => ({ ...prev, [cleanKey]: updates.category! }))
    }
    if (updates.name !== undefined || updates.unit !== undefined) {
      setCustomIngredientInfo((prev) => ({
        ...prev,
        [cleanKey]: {
          ...prev[cleanKey],
          display_name: updates.name !== undefined ? updates.name.trim() : prev[cleanKey]?.display_name || cleanKey,
          unit: updates.unit !== undefined ? updates.unit : prev[cleanKey]?.unit || "л",
        },
      }))
    }
    if (updates.bottle !== undefined) {
      setCustomBottleVolumes((prev) => ({ ...prev, [cleanKey]: updates.bottle || 0 }))
    }
    addActivity({
      type: "note_added",
      description: `Обновлён ингредиент «${updates.name || cleanKey}»`,
      user: "Влад",
    })
  }

  const removeIngredient = (key: string) => {
    const cleanKey = key.trim().toLowerCase()
    const name = ingredientInfo[cleanKey]?.display_name || cleanKey
    setDeletedIngredientKeys((prev) => (prev.includes(cleanKey) ? prev : [...prev, cleanKey]))
    addActivity({
      type: "note_added",
      description: `Удалён ингредиент «${name}» из базы`,
      user: "Влад",
    })
  }

  // ================= CRUD КАТЕГОРИЙ =================
  const addCategory = (key: string, displayName: string) => {
    const cleanKey = key.trim().toLowerCase()
    setCustomCategoryNames((prev) => ({ ...prev, [cleanKey]: displayName.trim() }))
    setDeletedCategoryKeys((prev) => prev.filter((k) => k !== cleanKey))
    addActivity({
      type: "note_added",
      description: `Добавлена категория «${displayName}»`,
      user: "Влад",
    })
  }

  const removeCategory = (key: string) => {
    const cleanKey = key.trim().toLowerCase()
    const name = categoryNames[cleanKey] || cleanKey
    setDeletedCategoryKeys((prev) => (prev.includes(cleanKey) ? prev : [...prev, cleanKey]))
    addActivity({
      type: "note_added",
      description: `Удалена категория «${name}»`,
      user: "Влад",
    })
  }

  return (
    <DatabaseContext.Provider
      value={{
        cocktails,
        semiProducts,
        prices,
        categories,
        categoryNames,
        cocktailCategories: baseDb.cocktail_categories,
        ingredientInfo,
        bottleVolumes,
        starredKeys,
        toggleStar,
        isStarred,
        addCocktail,
        updateCocktail,
        removeCocktail,
        addSemiProduct,
        updateSemiProduct,
        removeSemiProduct,
        addIngredient,
        updateIngredient,
        removeIngredient,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error("useDatabase must be used within DatabaseProvider")
  }
  return context
}
