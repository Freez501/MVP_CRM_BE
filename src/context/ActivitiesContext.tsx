import { createContext, useContext, ReactNode } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { mockActivities } from "@/data/mockData"
import { Activity } from "@/types"

interface ActivitiesContextType {
  activities: Activity[]
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void
  clearActivities: () => void
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined)

export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useLocalStorage<Activity[]>("brilliant-activities", mockActivities)

  const addActivity = (item: Omit<Activity, "id" | "timestamp">) => {
    const newActivity: Activity = {
      ...item,
      id: "act_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    }
    setActivities((prev) => [newActivity, ...prev])
  }

  const clearActivities = () => {
    setActivities([])
  }

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
