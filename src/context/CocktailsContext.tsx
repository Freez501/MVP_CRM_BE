import { createContext, useContext, ReactNode, useMemo, useCallback } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb, Cocktail } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { saveFullDbToDisk } from "./DatabaseSyncService"
import { CURRENT_USER } from "@/constants"

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

export function CocktailsProvider({ children }: { children: ReactNode }) {
  const [customCocktails, setCustomCocktails] = useLocalStorage<Record<string, Cocktail>>(
    "brilliant-custom-cocktails",
    {}
  )
  const [deletedKeys, setDeletedKeys] = useLocalStorage<string[]>("brilliant-deleted-cocktails", [])
  const [starredKeys, setStarredKeys] = useLocalStorage<string[]>("brilliant-starred-cocktails", [])

  const { addActivity } = useActivities()

  const cocktails = useMemo(() => {
    const merged = { ...baseDb.cocktails, ...customCocktails }
    deletedKeys.forEach((key) => {
      delete merged[key]
    })
    return merged
  }, [customCocktails, deletedKeys])

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
    },
    [cocktails, setCustomCocktails, setDeletedKeys, addActivity]
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
    },
    [cocktails, setCustomCocktails, addActivity]
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
