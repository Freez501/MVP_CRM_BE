import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { Client } from "@/types"
import { useActivities } from "./ActivitiesContext"
import { useAuth } from "./AuthContext"
import { CURRENT_USER } from "@/constants"

interface ClientsContextType {
  clients: Client[]
  isLoading: boolean
  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => Promise<Client | null>
  updateClient: (id: string, updates: Partial<Client>) => Promise<boolean>
  removeClient: (id: string) => Promise<boolean>
  refreshClients: () => Promise<void>
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

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
  const { user, profile } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { addActivity } = useActivities()

  const fetchClients = useCallback(async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("clients").select("*")
      if (profile?.companyId && !profile.companyId.startsWith("demo-")) {
        query = query.eq("company_id", profile.companyId)
      }
      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        console.error("Supabase clients fetch error:", error.message)
      } else if (data) {
        const mapped = (data as DbClientRow[]).map(mapFromDb)
        setClients(mapped)
      }
    } catch (err) {
      console.error("Clients fetch fallback error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.companyId])

  useEffect(() => {
    setClients([])
    fetchClients()
  }, [user?.id, fetchClients])

  useEffect(() => {
    // Realtime subscription
    const channel = supabase
      .channel("realtime-clients")
      .on("postgres_changes", { event: "*", schema: "public", table: "clients" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newClient = mapFromDb(payload.new as DbClientRow)
          setClients((prev) => {
            if (prev.some((c) => c.id === newClient.id)) return prev
            return [newClient, ...prev]
          })
        } else if (payload.eventType === "UPDATE") {
          const updated = mapFromDb(payload.new as DbClientRow)
          setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        } else if (payload.eventType === "DELETE") {
          const deletedId = (payload.old as { id: string }).id
          setClients((prev) => prev.filter((c) => c.id !== deletedId))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addClient = useCallback(
    async (data: Omit<Client, "id" | "createdAt" | "updatedAt">): Promise<Client | null> => {
      const now = new Date().toISOString()
      const newId = crypto.randomUUID()
      const newClient: Client = {
        ...data,
        id: newId,
        createdAt: now,
        updatedAt: now,
      }

      try {
        const { error } = await supabase.from("clients").insert({
          id: newId,
          company_id: profile?.companyId || null,
          name: newClient.name,
          email: newClient.email || null,
          phone: newClient.phone || null,
          company: newClient.company || null,
          notes: newClient.notes || null,
          created_at: now,
          updated_at: now,
          created_by: user?.id || null,
        })

        if (error) {
          console.error("Supabase client insert error:", error.message)
          return null
        }

        addActivity({
          type: "client_added",
          description: `Добавлен заказчик ${newClient.name}`,
          user: CURRENT_USER,
        })

        await fetchClients()
        return newClient
      } catch (err) {
        console.error("Failed to add client:", err)
        return null
      }
    },
    [profile?.companyId, user?.id, addActivity, fetchClients]
  )

  const updateClient = useCallback(
    async (id: string, updates: Partial<Client>): Promise<boolean> => {
      const now = new Date().toISOString()
      const dbPayload: Record<string, unknown> = {
        updated_at: now,
      }
      if (updates.name !== undefined) dbPayload.name = updates.name
      if (updates.email !== undefined) dbPayload.email = updates.email || null
      if (updates.phone !== undefined) dbPayload.phone = updates.phone || null
      if (updates.company !== undefined) dbPayload.company = updates.company || null
      if (updates.notes !== undefined) dbPayload.notes = updates.notes || null

      try {
        const { error } = await supabase.from("clients").update(dbPayload).eq("id", id)
        if (error) {
          console.error("Supabase client update error:", error.message)
          return false
        }
        await fetchClients()
        return true
      } catch (err) {
        console.error("Failed to update client:", err)
        return false
      }
    },
    [fetchClients]
  )

  const removeClient = useCallback(
    async (id: string): Promise<boolean> => {
      const target = clients.find((c) => c.id === id)
      try {
        const { error } = await supabase.from("clients").delete().eq("id", id)
        if (error) {
          console.error("Supabase client delete error:", error.message)
          return false
        }

        if (target) {
          addActivity({
            type: "note_added",
            description: `Удалён заказчик ${target.name}`,
            user: CURRENT_USER,
          })
        }

        await fetchClients()
        return true
      } catch (err) {
        console.error("Failed to delete client:", err)
        return false
      }
    },
    [clients, addActivity, fetchClients]
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

// eslint-disable-next-line react-refresh/only-export-components
export function useClients() {
  const context = useContext(ClientsContext)
  if (!context) {
    throw new Error("useClients must be used within ClientsProvider")
  }
  return context
}
