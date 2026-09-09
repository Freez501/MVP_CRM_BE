import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

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

interface DbIngredientRow {
  key: string
  name: string
  category: string
  unit: string
  price_per_unit: number | string
  bottle_volume?: number | string | null
}

const IngredientsContext = createContext<IngredientsContextType | undefined>(undefined)

export function IngredientsProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [ingredientInfo, setIngredientInfo] = useState<
    Record<string, { display_name?: string; unit?: string }>
  >({})
  const [bottleVolumes, setBottleVolumes] = useState<Record<string, number>>({})

  const { addActivity } = useActivities()

  const getDefaultUnit = useCallback((category: string): string => {
    switch (category) {
      case "Зелень и украшения":
      case "Фрукты и ягоды":
      case "Яйца и молочные":
      case "Бакалея":
        return "г"
      case "Расходники":
        return "шт"
      default:
        return "мл"
    }
  }, [])

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

          for (const row of data as DbIngredientRow[]) {
            pricesMap[row.key] = Number(row.price_per_unit || 0)
            catMap[row.key] = row.category
            infoMap[row.key] = { display_name: row.name, unit: row.unit }
            if (row.bottle_volume) bottleMap[row.key] = Number(row.bottle_volume)
          }

          setPrices(pricesMap)
          setCategories(catMap)
          setIngredientInfo(infoMap)
          setBottleVolumes(bottleMap)
        } else if (error) {
          console.warn("Supabase ingredients fetch error:", error.message)
        }
      })

    // Realtime channel
    const channel = supabase
      .channel("realtime-ingredients")
      .on("postgres_changes", { event: "*", schema: "public", table: "ingredients" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const row = payload.new as DbIngredientRow
          setPrices((prev) => ({ ...prev, [row.key]: Number(row.price_per_unit || 0) }))
          setCategories((prev) => ({ ...prev, [row.key]: row.category }))
          setIngredientInfo((prev) => ({
            ...prev,
            [row.key]: { display_name: row.name, unit: row.unit },
          }))
          if (row.bottle_volume) {
            setBottleVolumes((prev) => ({ ...prev, [row.key]: Number(row.bottle_volume) }))
          }
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as { key: string }
          setPrices((prev) => {
            const copy = { ...prev }
            delete copy[row.key]
            return copy
          })
          setCategories((prev) => {
            const copy = { ...prev }
            delete copy[row.key]
            return copy
          })
          setIngredientInfo((prev) => {
            const copy = { ...prev }
            delete copy[row.key]
            return copy
          })
          setBottleVolumes((prev) => {
            const copy = { ...prev }
            delete copy[row.key]
            return copy
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addIngredient = useCallback(
    async (data: IngredientData) => {
      const cleanKey = data.key.trim().toLowerCase()

      setPrices((prev) => ({ ...prev, [cleanKey]: data.price }))
      setCategories((prev) => ({ ...prev, [cleanKey]: data.category }))
      setIngredientInfo((prev) => ({
        ...prev,
        [cleanKey]: { display_name: data.name.trim(), unit: data.unit },
      }))
      if (data.bottle !== undefined) {
        setBottleVolumes((prev) => ({ ...prev, [cleanKey]: data.bottle || 0 }))
      }

      addActivity({
        type: "note_added",
        description: `Добавлен ингредиент «${data.name}» (${data.category})`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("ingredients").upsert({
        key: cleanKey,
        name: data.name.trim(),
        category: data.category,
        unit: data.unit,
        price_per_unit: data.price,
        bottle_volume: data.bottle ?? null,
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.warn("Supabase ingredient upsert warning:", error.message)
      }
    },
    [addActivity]
  )

  const updateIngredient = useCallback(
    async (key: string, updates: Partial<IngredientData>) => {
      const cleanKey = key.trim().toLowerCase()

      setPrices((prev) =>
        updates.price !== undefined ? { ...prev, [cleanKey]: updates.price } : prev
      )
      setCategories((prev) =>
        updates.category !== undefined ? { ...prev, [cleanKey]: updates.category } : prev
      )
      setIngredientInfo((prev) => {
        if (updates.name === undefined && updates.unit === undefined) return prev
        const existing = prev[cleanKey] || {}
        return {
          ...prev,
          [cleanKey]: {
            ...existing,
            display_name: updates.name !== undefined ? updates.name.trim() : existing.display_name,
            unit: updates.unit !== undefined ? updates.unit : existing.unit || "мл",
          },
        }
      })
      if (updates.bottle !== undefined) {
        setBottleVolumes((prev) => ({ ...prev, [cleanKey]: updates.bottle || 0 }))
      }

      addActivity({
        type: "note_added",
        description: `Обновлён ингредиент «${updates.name || cleanKey}»`,
        user: CURRENT_USER,
      })

      const dbUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      }
      if (updates.name !== undefined) dbUpdates.name = updates.name.trim()
      if (updates.category !== undefined) dbUpdates.category = updates.category
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit
      if (updates.price !== undefined) dbUpdates.price_per_unit = updates.price
      if (updates.bottle !== undefined) dbUpdates.bottle_volume = updates.bottle

      const { error } = await supabase.from("ingredients").update(dbUpdates).eq("key", cleanKey)
      if (error) {
        console.warn("Supabase ingredient update warning:", error.message)
      }
    },
    [addActivity]
  )

  const removeIngredient = useCallback(
    async (key: string) => {
      const cleanKey = key.trim().toLowerCase()
      const currentName = ingredientInfo[cleanKey]?.display_name || cleanKey

      setPrices((prev) => {
        const copy = { ...prev }
        delete copy[cleanKey]
        return copy
      })
      setCategories((prev) => {
        const copy = { ...prev }
        delete copy[cleanKey]
        return copy
      })
      setIngredientInfo((prev) => {
        const copy = { ...prev }
        delete copy[cleanKey]
        return copy
      })
      setBottleVolumes((prev) => {
        const copy = { ...prev }
        delete copy[cleanKey]
        return copy
      })

      addActivity({
        type: "note_added",
        description: `Удалён ингредиент «${currentName}» из базы`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("ingredients").delete().eq("key", cleanKey)
      if (error) {
        console.warn("Supabase ingredient delete warning:", error.message)
      }
    },
    [ingredientInfo, addActivity]
  )

  return (
    <IngredientsContext.Provider
      value={{
        prices,
        categories,
        ingredientInfo,
        bottleVolumes,
        deletedIngredientKeys: [],
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

// eslint-disable-next-line react-refresh/only-export-components
export function useIngredients() {
  const context = useContext(IngredientsContext)
  if (!context) {
    throw new Error("useIngredients must be used within IngredientsProvider")
  }
  return context
}
