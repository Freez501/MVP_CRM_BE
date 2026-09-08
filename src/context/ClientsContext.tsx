import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { mockClients } from "@/data/mockData"
import { Client } from "@/types"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"

interface ClientsContextType {
  clients: Client[]
  isLoading: boolean
  addClient: (client: Omit<Client, "id" | "createdAt">) => Client
  updateClient: (id: string, updates: Partial<Client>) => void
  removeClient: (id: string) => void
  refreshClients: () => Promise<void>
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

const CLIENTS_CACHE_KEY = "brilliant-clients"

interface DbClientRow {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  notes?: string | null
  created_at: string
  updated_at?: string | null
}

function mapFromDb(row: DbClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? undefined,
  }
}

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => {
    try {
      const cached = localStorage.getItem(CLIENTS_CACHE_KEY)
      return cached ? JSON.parse(cached) : mockClients
    } catch {
      return mockClients
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { addActivity } = useActivities()

  const saveCache = (newClients: Client[]) => {
    try {
      localStorage.setItem(CLIENTS_CACHE_KEY, JSON.stringify(newClients))
    } catch {
      // ignore storage quota issues
    }
  }

  const fetchClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        const mapped = (data as DbClientRow[]).map(mapFromDb)
        setClients(mapped)
        saveCache(mapped)
      }
    } catch (err) {
      console.warn("Clients fetch from Supabase fallback:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClients()

    // Realtime subscription
    const channel = supabase
      .channel("realtime-clients")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newClient = mapFromDb(payload.new as DbClientRow)
          setClients((prev) => {
            if (prev.some((c) => c.id === newClient.id)) return prev
            const next = [newClient, ...prev]
            saveCache(next)
            return next
          })
        } else if (payload.eventType === "UPDATE") {
          const updated = mapFromDb(payload.new as DbClientRow)
          setClients((prev) => {
            const next = prev.map((c) => (c.id === updated.id ? updated : c))
            saveCache(next)
            return next
          })
        } else if (payload.eventType === "DELETE") {
          const deletedId = (payload.old as { id: string }).id
          setClients((prev) => {
            const next = prev.filter((c) => c.id !== deletedId)
            saveCache(next)
            return next
          })
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchClients])

  const addClient = useCallback(
    (data: Omit<Client, "id" | "createdAt" | "updatedAt">): Client => {
      const now = new Date().toISOString()
      const newClient: Client = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }

      setClients((prev) => {
        const next = [newClient, ...prev]
        saveCache(next)
        return next
      })

      addActivity({
        type: "client_added",
        description: `Добавлен заказчик ${newClient.name}`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("clients")
        .insert({
          id: newClient.id,
          name: newClient.name,
          email: newClient.email || null,
          phone: newClient.phone || null,
          company: newClient.company || null,
          notes: newClient.notes || null,
          created_at: newClient.createdAt,
          updated_at: newClient.updatedAt,
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase client insert warning:", error.message)
        })

      return newClient
    },
    [addActivity]
  )

  const updateClient = useCallback((id: string, updates: Partial<Client>) => {
    const now = new Date().toISOString()
    setClients((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: now } : c))
      saveCache(next)
      return next
    })

    // Sync to Supabase
    const dbPayload: Record<string, unknown> = {
      updated_at: now,
    }
    if (updates.name !== undefined) dbPayload.name = updates.name
    if (updates.email !== undefined) dbPayload.email = updates.email || null
    if (updates.phone !== undefined) dbPayload.phone = updates.phone || null
    if (updates.company !== undefined) dbPayload.company = updates.company || null
    if (updates.notes !== undefined) dbPayload.notes = updates.notes || null

    supabase
      .from("clients")
      .update(dbPayload)
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.warn("Supabase client update warning:", error.message)
      })
  }, [])

  const removeClient = useCallback(
    (id: string) => {
      const target = clients.find((c) => c.id === id)
      setClients((prev) => {
        const next = prev.filter((c) => c.id !== id)
        saveCache(next)
        return next
      })

      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалён заказчик ${target.name}`,
          user: CURRENT_USER,
        })
      }

      // Sync to Supabase
      supabase
        .from("clients")
        .delete()
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.warn("Supabase client delete warning:", error.message)
        })
    },
    [clients, addActivity]
  )

  return (
    <ClientsContext.Provider
      value={{
        clients,
        isLoading,
        addClient,
        updateClient,
        removeClient,
        refreshClients: fetchClients,
      }}
    >
      {children}
    </ClientsContext.Provider>
  )
}

export function useClients() {
  const context = useContext(ClientsContext)
  if (!context) {
    throw new Error("useClients must be used within ClientsProvider")
  }
  return context
}
