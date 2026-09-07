import { createContext, useContext, ReactNode, useMemo, useCallback, useEffect } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { saveFullDbToDisk } from "./DatabaseSyncService"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

const baseDb = db as CocktailsDb

interface CategoriesContextType {
  categoryNames: Record<string, string>
  addCategory: (key: string, displayName: string) => void
  removeCategory: (key: string) => void
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [customCategoryNames, setCustomCategoryNames] = useLocalStorage<Record<string, string>>(
    "brilliant-custom-category-names",
    {}
  )
  const [deletedCategoryKeys, setDeletedCategoryKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-categories",
    []
  )

  const { addActivity } = useActivities()

  // Load from Supabase on mount
  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const map: Record<string, string> = {}
          for (const row of data as { key: string; name: string }[]) {
            map[row.key] = row.name
          }
          setCustomCategoryNames((prev) => ({ ...prev, ...map }))
        }
      })
  }, [setCustomCategoryNames])

  const categoryNames = useMemo(() => {
    const merged = { ...baseDb.category_names, ...customCategoryNames }
    deletedCategoryKeys.forEach((k) => delete merged[k])
    return merged
  }, [customCategoryNames, deletedCategoryKeys])

  const addCategory = useCallback(
    (key: string, displayName: string) => {
      const cleanKey = key.trim().toLowerCase()
      setCustomCategoryNames((prev) => ({ ...prev, [cleanKey]: displayName.trim() }))
      setDeletedCategoryKeys((prev) => prev.filter((k) => k !== cleanKey))
      saveFullDbToDisk({
        category_names: { ...categoryNames, [cleanKey]: displayName.trim() },
      })
      addActivity({
        type: "note_added",
        description: `Добавлена категория «${displayName}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("categories")
        .upsert({
          key: cleanKey,
          name: displayName.trim(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase category upsert warning:", error.message)
        })
    },
    [categoryNames, setCustomCategoryNames, setDeletedCategoryKeys, addActivity]
  )

  const removeCategory = useCallback(
    (key: string) => {
      const cleanKey = key.trim().toLowerCase()
      const name = categoryNames[cleanKey] || cleanKey
      setDeletedCategoryKeys((prev) => (prev.includes(cleanKey) ? prev : [...prev, cleanKey]))

      const updatedNames = { ...categoryNames }
      delete updatedNames[cleanKey]
      saveFullDbToDisk({ category_names: updatedNames })

      addActivity({
        type: "note_added",
        description: `Удалена категория «${name}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("categories")
        .delete()
        .eq("key", cleanKey)
        .then(({ error }) => {
          if (error) console.warn("Supabase category delete warning:", error.message)
        })
    },
    [categoryNames, setDeletedCategoryKeys, addActivity]
  )

  return (
    <CategoriesContext.Provider
      value={{
        categoryNames,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategories() {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider")
  }
  return context
}
