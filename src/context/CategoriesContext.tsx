import { createContext, useContext, ReactNode, useCallback, useEffect, useState } from "react"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

interface CategoriesContextType {
  categoryNames: Record<string, string>
  addCategory: (key: string, displayName: string) => void
  removeCategory: (key: string) => void
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({})
  const { addActivity } = useActivities()

  // Load from Supabase on mount
  useEffect(() => {
    supabase
      .from("categories")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, string> = {}
          for (const row of data as { key: string; name: string }[]) {
            map[row.key] = row.name
          }
          setCategoryNames(map)
        } else if (error) {
          console.warn("Supabase categories fetch error:", error.message)
        }
      })

    const channel = supabase
      .channel("realtime-categories")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as { key: string; name: string }
            setCategoryNames((prev) => ({ ...prev, [row.key]: row.name }))
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { key: string }
            setCategoryNames((prev) => {
              const copy = { ...prev }
              delete copy[row.key]
              return copy
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addCategory = useCallback(
    async (key: string, displayName: string) => {
      const cleanKey = key.trim().toLowerCase()
      setCategoryNames((prev) => ({ ...prev, [cleanKey]: displayName.trim() }))

      addActivity({
        type: "note_added",
        description: `Добавлена категория «${displayName}»`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("categories").upsert({
        key: cleanKey,
        name: displayName.trim(),
      })

      if (error) {
        console.warn("Supabase category upsert warning:", error.message)
      }
    },
    [addActivity]
  )

  const removeCategory = useCallback(
    async (key: string) => {
      const cleanKey = key.trim().toLowerCase()
      const name = categoryNames[cleanKey] || cleanKey

      setCategoryNames((prev) => {
        const copy = { ...prev }
        delete copy[cleanKey]
        return copy
      })

      addActivity({
        type: "note_added",
        description: `Удалена категория «${name}»`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("categories").delete().eq("key", cleanKey)
      if (error) {
        console.warn("Supabase category delete warning:", error.message)
      }
    },
    [categoryNames, addActivity]
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

// eslint-disable-next-line react-refresh/only-export-components
export function useCategories() {
  const context = useContext(CategoriesContext)
  if (!context) {
    throw new Error("useCategories must be used within CategoriesProvider")
  }
  return context
}
