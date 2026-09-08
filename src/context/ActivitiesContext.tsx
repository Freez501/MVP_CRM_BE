import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { mockActivities } from "@/data/mockData"
import { Activity } from "@/types"

interface ActivitiesContextType {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
  clearActivities: () => void
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

const ACTIVITIES_CACHE_KEY = "brilliant-activities"

interface DbActivityRow {
  id: string
  type: string
  description: string
  timestamp: string
  user: string
}

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(() => {
    try {
      const cached = localStorage.getItem(ACTIVITIES_CACHE_KEY)
      return cached ? JSON.parse(cached) : mockActivities
    } catch {
      return mockActivities
    }
  })

  const saveCache = (list: Activity[]) => {
    try {
      localStorage.setItem(ACTIVITIES_CACHE_KEY, JSON.stringify(list.slice(0, 100)))
    } catch {
      // ignore
    }
  }

  const fetchActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50)

      if (!error && data) {
        const mapped = (data as DbActivityRow[]).map((r) => ({
          id: r.id,
          type: r.type as Activity["type"],
          description: r.description,
          timestamp: r.timestamp,
          user: r.user,
        }))
        setActivities(mapped)
        saveCache(mapped)
      }
    } catch {
      // fallback to cache
    }
  }, [])

  useEffect(() => {
    fetchActivities()

    const channel = supabase
      .channel("realtime-activities")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activities" },
        (payload) => {
          const row = payload.new as DbActivityRow
          const newAct: Activity = {
            id: row.id,
            type: row.type as Activity["type"],
            description: row.description,
            timestamp: row.timestamp,
            user: row.user,
          }
          setActivities((prev) => {
            if (prev.some((a) => a.id === newAct.id)) return prev
            const next = [newAct, ...prev]
            saveCache(next)
            return next
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActivities])

  const addActivity = useCallback((item: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }
    setActivities((prev) => {
      const next = [newActivity, ...prev]
      saveCache(next)
      return next
    })

    supabase
      .from("activities")
      .insert({
        id: newActivity.id,
        type: newActivity.type,
        description: newActivity.description,
        timestamp: newActivity.timestamp,
        user: newActivity.user,
      })
      .then(({ error }) => {
        if (error) console.warn("Supabase activity insert warning:", error.message)
      })
  }, [])

  const clearActivities = useCallback(() => {
    setActivities([])
    saveCache([])
    supabase
      .from("activities")
      .delete()
      .neq("id", "")
      .then(() => {})
  }, [])

  return (
    <ActivitiesContext.Provider value={{ activities, addActivity, clearActivities }}>
      {children}
    </ActivitiesContext.Provider>
  )
}

export function useActivities() {
  const context = useContext(ActivitiesContext)
  if (!context) {
    throw new Error("useActivities must be used within ActivitiesProvider")
  }
  return context
}
