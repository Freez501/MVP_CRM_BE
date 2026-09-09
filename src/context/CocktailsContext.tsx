import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from "react"
import { Cocktail, Recipe } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

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

const DEFAULT_CATEGORIES = ["Классические", "Авторские", "Шоты", "Безалкогольные", "Сезонные"]

export function CocktailsProvider({ children }: { children: ReactNode }) {
  const [cocktails, setCocktails] = useState<Record<string, Cocktail>>({})
  const [starredKeys, setStarredKeys] = useState<string[]>([])
  const { addActivity } = useActivities()

  // Load from Supabase on mount
  useEffect(() => {
    supabase
      .from("cocktails")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) {
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
          setCocktails(map)
          setStarredKeys(Array.from(new Set(starred)))
        } else if (error) {
          console.warn("Supabase cocktails fetch error:", error.message)
        }
      })

    // Realtime channel
    const channel = supabase
      .channel("realtime-cocktails")
      .on("postgres_changes", { event: "*", schema: "public", table: "cocktails" }, (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const row = payload.new as DbCocktailRow
          setCocktails((prev) => ({
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
          } else {
            setStarredKeys((prev) => prev.filter((k) => k !== row.key))
          }
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as { key: string }
          setCocktails((prev) => {
            const copy = { ...prev }
            delete copy[row.key]
            return copy
          })
          setStarredKeys((prev) => prev.filter((k) => k !== row.key))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const cocktailCategories = useMemo(() => {
    const cats = Array.from(new Set(Object.values(cocktails).map((c) => c.category))).filter(Boolean)
    return cats.length > 0 ? cats : DEFAULT_CATEGORIES
  }, [cocktails])

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
          .then(({ error }) => {
            if (error) console.warn("Supabase cocktail star update warning:", error.message)
          })

        return next
      })
    },
    [cocktails, addActivity]
  )

  const isStarred = useCallback((key: string) => starredKeys.includes(key), [starredKeys])

  const addCocktail = useCallback(
    async (key: string, cocktail: Cocktail) => {
      const cleanKey = key.trim().toLowerCase()
      setCocktails((prev) => ({
        ...prev,
        [cleanKey]: cocktail,
      }))

      addActivity({
        type: "note_added",
        description: `Создан новый коктейль «${cocktail.name}»`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("cocktails").upsert({
        key: cleanKey,
        name: cocktail.name,
        category: cocktail.category,
        recipe: cocktail.recipe || {},
        decorations: cocktail.decorations || {},
        glassware: cocktail.glassware || {},
        is_starred: starredKeys.includes(cleanKey),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.warn("Supabase cocktail upsert warning:", error.message)
      }
    },
    [starredKeys, addActivity]
  )

  const updateCocktail = useCallback(
    async (key: string, updates: Partial<Cocktail>) => {
      const current = cocktails[key]
      if (!current) return
      const updated: Cocktail = {
        ...current,
        ...updates,
      }
      setCocktails((prev) => ({
        ...prev,
        [key]: updated,
      }))

      addActivity({
        type: "note_added",
        description: `Отредактирован коктейль «${updated.name}»`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("cocktails").upsert({
        key,
        name: updated.name,
        category: updated.category,
        recipe: updated.recipe || {},
        decorations: updated.decorations || {},
        glassware: updated.glassware || {},
        is_starred: starredKeys.includes(key),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.warn("Supabase cocktail update warning:", error.message)
      }
    },
    [cocktails, starredKeys, addActivity]
  )

  const removeCocktail = useCallback(
    async (key: string) => {
      const target = cocktails[key]
      setCocktails((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      setStarredKeys((prev) => prev.filter((k) => k !== key))

      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалён коктейль «${target.name}» из базы`,
          user: CURRENT_USER,
        })
      }

      const { error } = await supabase.from("cocktails").delete().eq("key", key)
      if (error) {
        console.warn("Supabase cocktail delete warning:", error.message)
      }
    },
    [cocktails, addActivity]
  )

  return (
    <CocktailsContext.Provider
      value={{
        cocktails,
        cocktailCategories,
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

// eslint-disable-next-line react-refresh/only-export-components
export function useCocktails() {
  const context = useContext(CocktailsContext)
  if (!context) {
    throw new Error("useCocktails must be used within CocktailsProvider")
  }
  return context
}
