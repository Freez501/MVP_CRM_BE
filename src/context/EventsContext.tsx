import { createContext, useContext, ReactNode, useCallback } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { mockEvents } from "@/data/mockData"
import { Event } from "@/types"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"

interface EventsContextType {
  events: Event[]
  addEvent: (event: Omit<Event, "id" | "createdAt" | "updatedAt">) => Event
  updateEvent: (id: string, updates: Partial<Event>) => void
  removeEvent: (id: string) => void
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

const STAGE_LABELS: Record<string, string> = {
  new: "Новое",
  in_progress: "В работе",
  confirmed: "Подтверждено",
  done: "Проведено",
  cancelled: "Отменено",
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useLocalStorage<Event[]>("brilliant-events", mockEvents)
  const { addActivity } = useActivities()

  const addEvent = useCallback(
    (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">): Event => {
      const now = new Date().toISOString()
      const newEvent: Event = {
        ...eventData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      setEvents((prev) => [newEvent, ...prev])
      addActivity({
        type: "event_created",
        description: `Создано мероприятие «${newEvent.title}»`,
        user: CURRENT_USER,
      })
      return newEvent
    },
    [setEvents, addActivity]
  )

  const updateEvent = useCallback(
    (id: string, updates: Partial<Event>) => {
      setEvents((prev) => {
        const target = prev.find((e) => e.id === id)
        if (target && updates.stage && updates.stage !== target.stage) {
          const stageName = STAGE_LABELS[updates.stage] || updates.stage
          addActivity({
            type: "event_moved",
            description: `«${target.title}» → ${stageName}`,
            user: CURRENT_USER,
          })
        }
        return prev.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        )
      })
    },
    [setEvents, addActivity]
  )

  const removeEvent = useCallback(
    (id: string) => {
      const target = events.find((e) => e.id === id)
      setEvents((prev) => prev.filter((e) => e.id !== id))
      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалено мероприятие «${target.title}»`,
          user: CURRENT_USER,
        })
      }
    },
    [events, setEvents, addActivity]
  )

  return (
    <EventsContext.Provider value={{ events, addEvent, updateEvent, removeEvent }}>
      {children}
    </EventsContext.Provider>
  )
}

export function useEvents() {
  const context = useContext(EventsContext)
  if (!context) {
    throw new Error("useEvents must be used within EventsProvider")
  }
  return context
}
