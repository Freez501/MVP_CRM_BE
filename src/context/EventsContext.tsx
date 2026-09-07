import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { mockEvents } from "@/data/mockData"
import { Event, EventDetails, EventStage } from "@/types"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"

interface EventsContextType {
  events: Event[]
  isLoading: boolean
  addEvent: (event: Omit<Event, "id" | "createdAt" | "updatedAt">) => Event
  updateEvent: (id: string, updates: Partial<Event>) => void
  removeEvent: (id: string) => void
  refreshEvents: () => Promise<void>
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

const EVENTS_CACHE_KEY = "brilliant-events"

interface DbEventRow {
  id: string
  title: string
  client_id?: string | null
  client_name: string
  date: string
  address?: string | null
  bartenders_count?: number | null
  stage?: string | null
  value?: number | null
  comment?: string | null
  details?: EventDetails | null
  created_at: string
  updated_at?: string | null
}

function mapFromDb(row: DbEventRow): Event {
  return {
    id: row.id,
    title: row.title,
    clientId: row.client_id ?? "",
    clientName: row.client_name,
    date: row.date,
    address: row.address ?? "",
    bartendersCount: row.bartenders_count ?? 1,
    stage: (row.stage as EventStage) || "new",
    value: Number(row.value ?? 0),
    comment: row.comment ?? "",
    details: row.details ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  }
}

const STAGE_LABELS: Record<string, string> = {
  new: "Новое",
  in_progress: "В работе",
  confirmed: "Подтверждено",
  done: "Проведено",
  cancelled: "Отменено",
}

export function EventsProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const cached = localStorage.getItem(EVENTS_CACHE_KEY)
      return cached ? JSON.parse(cached) : mockEvents
    } catch {
      return mockEvents
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { addActivity } = useActivities()

  const saveCache = (newEvents: Event[]) => {
    try {
      localStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(newEvents))
    } catch {
      // ignore storage quota errors
    }
  }

  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data && data.length > 0) {
        const mapped = (data as DbEventRow[]).map(mapFromDb)
        setEvents(mapped)
        saveCache(mapped)
      }
    } catch (err) {
      console.warn("Events fetch from Supabase fallback:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()

    // Realtime subscription
    const channel = supabase
      .channel("realtime-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newEvent = mapFromDb(payload.new as DbEventRow)
          setEvents((prev) => {
            if (prev.some((e) => e.id === newEvent.id)) return prev
            const next = [newEvent, ...prev]
            saveCache(next)
            return next
          })
        } else if (payload.eventType === "UPDATE") {
          const updated = mapFromDb(payload.new as DbEventRow)
          setEvents((prev) => {
            const next = prev.map((e) => (e.id === updated.id ? updated : e))
            saveCache(next)
            return next
          })
        } else if (payload.eventType === "DELETE") {
          const deletedId = (payload.old as { id: string }).id
          setEvents((prev) => {
            const next = prev.filter((e) => e.id !== deletedId)
            saveCache(next)
            return next
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  const addEvent = useCallback(
    (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">): Event => {
      const now = new Date().toISOString()
      const newEvent: Event = {
        ...eventData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }

      setEvents((prev) => {
        const next = [newEvent, ...prev]
        saveCache(next)
        return next
      })

      addActivity({
        type: "event_created",
        description: `Создано мероприятие «${newEvent.title}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("events")
        .insert({
          id: newEvent.id,
          title: newEvent.title,
          client_id: newEvent.clientId || null,
          client_name: newEvent.clientName,
          date: newEvent.date,
          address: newEvent.address || "",
          bartenders_count: newEvent.bartendersCount || 1,
          stage: newEvent.stage,
          value: newEvent.value || 0,
          comment: newEvent.comment || "",
          details: newEvent.details || {},
          created_at: newEvent.createdAt,
          updated_at: newEvent.updatedAt,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase event insert warning:", error.message)
        })

      return newEvent
    },
    [addActivity]
  )

  const updateEvent = useCallback(
    (id: string, updates: Partial<Event>) => {
      const now = new Date().toISOString()
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
        const next = prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: now } : e))
        saveCache(next)
        return next
      })

      // Sync to Supabase
      const dbPayload: Record<string, unknown> = {
        updated_at: now,
      }
      if (updates.title !== undefined) dbPayload.title = updates.title
      if (updates.clientId !== undefined) dbPayload.client_id = updates.clientId || null
      if (updates.clientName !== undefined) dbPayload.client_name = updates.clientName
      if (updates.date !== undefined) dbPayload.date = updates.date
      if (updates.address !== undefined) dbPayload.address = updates.address
      if (updates.bartendersCount !== undefined)
        dbPayload.bartenders_count = updates.bartendersCount
      if (updates.stage !== undefined) dbPayload.stage = updates.stage
      if (updates.value !== undefined) dbPayload.value = updates.value
      if (updates.comment !== undefined) dbPayload.comment = updates.comment
      if (updates.details !== undefined) dbPayload.details = updates.details

      supabase
        .from("events")
        .update(dbPayload)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase event update warning:", error.message)
        })
    },
    [addActivity]
  )

  const removeEvent = useCallback(
    (id: string) => {
      const target = events.find((e) => e.id === id)
      setEvents((prev) => {
        const next = prev.filter((e) => e.id !== id)
        saveCache(next)
        return next
      })

      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалено мероприятие «${target.title}»`,
          user: CURRENT_USER,
        })
      }

      // Sync to Supabase
      supabase
        .from("events")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase event delete warning:", error.message)
        })
    },
    [events, addActivity]
  )

  return (
    <EventsContext.Provider
      value={{
        events,
        isLoading,
        addEvent,
        updateEvent,
        removeEvent,
        refreshEvents: fetchEvents,
      }}
    >
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
