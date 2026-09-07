import { createContext, useContext, ReactNode, useCallback } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { mockClients } from "@/data/mockData"
import { Client } from "@/types"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"

interface ClientsContextType {
  clients: Client[]
  addClient: (client: Omit<Client, "id" | "createdAt">) => Client
  updateClient: (id: string, updates: Partial<Client>) => void
  removeClient: (id: string) => void
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export function ClientsProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useLocalStorage<Client[]>("brilliant-clients", mockClients)
  const { addActivity } = useActivities()

  const addClient = useCallback(
    (data: Omit<Client, "id" | "createdAt">): Client => {
      const newClient: Client = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      setClients((prev) => [newClient, ...prev])
      addActivity({
        type: "client_added",
        description: `Добавлен заказчик ${newClient.name}`,
        user: CURRENT_USER,
      })
      return newClient
    },
    [setClients, addActivity]
  )

  const updateClient = useCallback(
    (id: string, updates: Partial<Client>) => {
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)))
    },
    [setClients]
  )

  const removeClient = useCallback(
    (id: string) => {
      const target = clients.find((c) => c.id === id)
      setClients((prev) => prev.filter((c) => c.id !== id))
      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалён заказчик ${target.name}`,
          user: CURRENT_USER,
        })
      }
    },
    [clients, setClients, addActivity]
  )

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, removeClient }}>
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
