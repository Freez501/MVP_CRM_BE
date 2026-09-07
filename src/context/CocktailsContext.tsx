import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb, Cocktail, Recipe } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { saveFullDbToDisk } from "./DatabaseSyncService"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

const baseDb = db as CocktailsDb

interface CocktailsContextType {
  cocktails: Record<string, Cocktail>
  cocktailCategories: string[]
  starredKeys: string[]
  toggleStar: (key: string) => void
  isStarred: (key: string) => boolean
  addCocktail: (key: string, cocktail: Cocktail) => void
  updateCocktail: (key: string, updates: Partial<Cocktail>) => void
  removeCocktail: (key: string) => void
}

const CocktailsContext = createContext<CocktailsContextType | undefined>(undefined)

interface DbCocktailRow {
  key: string
  name: string
  category: string
  recipe?: Recipe | null
  decorations?: Recipe | null
  glassware?: Recipe | null
  is_starred?: boolean
}

export function CocktailsProvider({ children }: { children: ReactNode }) {
  const [customCocktails, setCustomCocktails] = useLocalStorage<Record<string, Cocktail>>(
    "brilliant-custom-cocktails",
    {}
  )
  const [deletedKeys, setDeletedKeys] = useLocalStorage<string[]>("brilliant-deleted-cocktails", [])
  const [starredKeys, setStarredKeys] = useLocalStorage<string[]>("brilliant-starred-cocktails", [])
  const [cloudCocktails, setCloudCocktails] = useState<Record<string, Cocktail>>({})

  const { addActivity } = useActivities()

  // Load from Supabase on mount
  useEffect(() => {
    supabase
      .from("cocktails")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const map: Record<string, Cocktail> = {}
          const starred: string[] = []
          for (const row of data as DbCocktailRow[]) {
            map[row.key] = {
              name: row.name,
              category: row.category,
              recipe: row.recipe || {},
              decorations: row.decorations || {},
              glassware: row.glassware || {},
            }
            if (row.is_starred) starred.push(row.key)
          }
          setCloudCocktails(map)
          if (starred.length > 0) {
            setStarredKeys((prev) => Array.from(new Set([...prev, ...starred])))
          }
        }
      })

    // Realtime channel
    const channel = supabase
      .channel("realtime-cocktails")
      .on("postgres_changes", { event: "*", schema: "public", table: "cocktails" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const row = payload.new as DbCocktailRow
          setCloudCocktails((prev) => ({
            ...prev,
            [row.key]: {
              name: row.name,
              category: row.category,
              recipe: row.recipe || {},
              decorations: row.decorations || {},
              glassware: row.glassware || {},
            },
          }))
          if (row.is_starred) {
            setStarredKeys((prev) => (prev.includes(row.key) ? prev : [...prev, row.key]))
          }
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as { key: string }
          setCloudCocktails((prev) => {
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
  }, [setStarredKeys])

  const cocktails = useMemo(() => {
    const merged = { ...baseDb.cocktails, ...cloudCocktails, ...customCocktails }
    deletedKeys.forEach((key) => {
      delete merged[key]
    })
    return merged
  }, [cloudCocktails, customCocktails, deletedKeys])

  const toggleStar = useCallback(
    (key: string) => {
      setStarredKeys((prev) => {
        const exists = prev.includes(key)
        const next = exists ? prev.filter((k) => k !== key) : [...prev, key]
        const cocktailName = cocktails[key]?.name || key
        if (!exists) {
          addActivity({
            type: "note_added",
            description: `Коктейль «${cocktailName}» отмечен как проверенный ⭐`,
            user: CURRENT_USER,
          })
        }

        // Sync star state to Supabase
        supabase
          .from("cocktails")
          .update({ is_starred: !exists })
          .eq("key", key)
          .then(() => {})

        return next
      })
    },
    [cocktails, setStarredKeys, addActivity]
  )

  const isStarred = useCallback((key: string) => starredKeys.includes(key), [starredKeys])

  const addCocktail = useCallback(
    (key: string, cocktail: Cocktail) => {
      const cleanKey = key.trim().toLowerCase()
      setCustomCocktails((prev) => ({
        ...prev,
        [cleanKey]: cocktail,
      }))
      setDeletedKeys((prev) => prev.filter((k) => k !== cleanKey))
      saveFullDbToDisk({
        cocktails: { ...cocktails, [cleanKey]: cocktail },
      })
      addActivity({
        type: "note_added",
        description: `Создан новый коктейль «${cocktail.name}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("cocktails")
        .upsert({
          key: cleanKey,
          name: cocktail.name,
          category: cocktail.category,
          recipe: cocktail.recipe || {},
          decorations: cocktail.decorations || {},
          glassware: cocktail.glassware || {},
          is_starred: starredKeys.includes(cleanKey),
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cocktail upsert warning:", error.message)
        })
    },
    [cocktails, starredKeys, setCustomCocktails, setDeletedKeys, addActivity]
  )

  const updateCocktail = useCallback(
    (key: string, updates: Partial<Cocktail>) => {
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
      saveFullDbToDisk({
        cocktails: { ...cocktails, [key]: updated },
      })
      addActivity({
        type: "note_added",
        description: `Отредактирован коктейль «${updated.name}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("cocktails")
        .upsert({
          key,
          name: updated.name,
          category: updated.category,
          recipe: updated.recipe || {},
          decorations: updated.decorations || {},
          glassware: updated.glassware || {},
          is_starred: starredKeys.includes(key),
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase cocktail update warning:", error.message)
        })
    },
    [cocktails, starredKeys, setCustomCocktails, addActivity]
  )

  const removeCocktail = useCallback(
    (key: string) => {
      const target = cocktails[key]
      setCustomCocktails((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      setDeletedKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
      const updatedCocktails = { ...cocktails }
      delete updatedCocktails[key]
      saveFullDbToDisk({ cocktails: updatedCocktails })

      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалён коктейль «${target.name}» из базы`,
          user: CURRENT_USER,
        })
      }

      // Sync to Supabase
      supabase
        .from("cocktails")
        .delete()
        .eq("key", key)
        .then(({ error }) => {
          if (error) console.warn("Supabase cocktail delete warning:", error.message)
        })
    },
    [cocktails, setCustomCocktails, setDeletedKeys, addActivity]
  )

  return (
    <CocktailsContext.Provider
      value={{
        cocktails,
        cocktailCategories: baseDb.cocktail_categories,
        starredKeys,
        toggleStar,
        isStarred,
        addCocktail,
        updateCocktail,
        removeCocktail,
      }}
    >
      {children}
    </CocktailsContext.Provider>
  )
}

export function useCocktails() {
  const context = useContext(CocktailsContext)
  if (!context) {
    throw new Error("useCocktails must be used within CocktailsProvider")
  }
  return context
}
