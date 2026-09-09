import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Event, EventDetails, EventStage } from "@/types"
import { useActivities } from "./ActivitiesContext"
import { useAuth } from "./AuthContext"
import { CURRENT_USER } from "@/constants"

interface EventsContextType {
  events: Event[]
  isLoading: boolean
  addEvent: (event: Omit<Event, "id" | "createdAt" | "updatedAt">) => Promise<Event | null>
  updateEvent: (id: string, updates: Partial<Event>) => Promise<boolean>
  removeEvent: (id: string) => Promise<boolean>
  refreshEvents: () => Promise<void>
}

const EventsContext = createContext<EventsContextType | undefined>(undefined)

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
  const { user, profile } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { addActivity } = useActivities()

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("events").select("*")
      if (profile?.companyId && !profile.companyId.startsWith("demo-")) {
        query = query.eq("company_id", profile.companyId)
      }
      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase events fetch error:", error.message)
      } else if (data) {
        const mapped = (data as DbEventRow[]).map(mapFromDb)
        setEvents(mapped)
      }
    } catch (err) {
      console.error("Events fetch fallback error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.companyId])

  useEffect(() => {
    setEvents([])
    fetchEvents()
  }, [user?.id, fetchEvents])

  useEffect(() => {
    // Realtime subscription
    const channel = supabase
      .channel("realtime-events")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newEvent = mapFromDb(payload.new as DbEventRow)
          setEvents((prev) => {
            if (prev.some((e) => e.id === newEvent.id)) return prev
            return [newEvent, ...prev]
          })
        } else if (payload.eventType === "UPDATE") {
          const updated = mapFromDb(payload.new as DbEventRow)
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
        } else if (payload.eventType === "DELETE") {
          const deletedId = (payload.old as { id: string }).id
          setEvents((prev) => prev.filter((e) => e.id !== deletedId))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchEvents])

  const addEvent = useCallback(
    async (eventData: Omit<Event, "id" | "createdAt" | "updatedAt">): Promise<Event | null> => {
      const now = new Date().toISOString()
      const newId = crypto.randomUUID()
      const newEvent: Event = {
        ...eventData,
        id: newId,
        createdAt: now,
        updatedAt: now,
      }

      try {
        const { error } = await supabase.from("events").insert({
          id: newId,
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
          created_at: now,
          updated_at: now,
          created_by: user?.id || null,
          company_id: profile?.companyId || null,
        })

        if (error) {
          console.error("Supabase event insert error:", error.message)
          return null
        }

        addActivity({
          type: "event_created",
          description: `Создано мероприятие «${newEvent.title}»`,
          user: CURRENT_USER,
        })

        await fetchEvents()
        return newEvent
      } catch (err) {
        console.error("Failed to add event:", err)
        return null
      }
    },
    [profile?.companyId, user?.id, addActivity, fetchEvents]
  )

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Event>): Promise<boolean> => {
      const now = new Date().toISOString()
      const target = events.find((e) => e.id === id)
      if (target && updates.stage && updates.stage !== target.stage) {
        const stageName = STAGE_LABELS[updates.stage] || updates.stage
        addActivity({
          type: "event_moved",
          description: `«${target.title}» → ${stageName}`,
          user: CURRENT_USER,
        })
      }

      const dbPayload: Record<string, unknown> = {
        updated_at: now,
      }
      if (updates.title !== undefined) dbPayload.title = updates.title
      if (updates.clientId !== undefined) dbPayload.client_id = updates.clientId || null
      if (updates.clientName !== undefined) dbPayload.client_name = updates.clientName
      if (updates.date !== undefined) dbPayload.date = updates.date
      if (updates.address !== undefined) dbPayload.address = updates.address
      if (updates.bartendersCount !== undefined) dbPayload.bartenders_count = updates.bartendersCount
      if (updates.stage !== undefined) dbPayload.stage = updates.stage
      if (updates.value !== undefined) dbPayload.value = updates.value
      if (updates.comment !== undefined) dbPayload.comment = updates.comment
      if (updates.details !== undefined) dbPayload.details = updates.details

      try {
        const { error } = await supabase.from("events").update(dbPayload).eq("id", id)
        if (error) {
          console.error("Supabase event update error:", error.message)
          return false
        }
        await fetchEvents()
        return true
      } catch (err) {
        console.error("Failed to update event:", err)
        return false
      }
    },
    [events, addActivity, fetchEvents]
  )

  const removeEvent = useCallback(
    async (id: string): Promise<boolean> => {
      const target = events.find((e) => e.id === id)
      try {
        const { error } = await supabase.from("events").delete().eq("id", id)
        if (error) {
          console.error("Supabase event delete error:", error.message)
          return false
        }

        if (target) {
          addActivity({
            type: "note_added",
            description: `Удалено мероприятие «${target.title}»`,
            user: CURRENT_USER,
          })
        }

        await fetchEvents()
        return true
      } catch (err) {
        console.error("Failed to delete event:", err)
        return false
      }
    },
    [events, addActivity, fetchEvents]
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

// eslint-disable-next-line react-refresh/only-export-components
export function useEvents() {
  const context = useContext(EventsContext)
  if (!context) {
    throw new Error("useEvents must be used within EventsProvider")
  }
  return context
}
