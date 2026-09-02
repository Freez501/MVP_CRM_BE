import { createContext, useContext, ReactNode } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { mockClients } from "@/data/mockData"
import { Client } from "@/types"
import { useActivities } from "./ActivitiesContext"

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

  const addClient = (data: Omit<Client, "id" | "createdAt">): Client => {
    const newClient: Client = {
      ...data,
      id: "c_" + Date.now(),
      createdAt: new Date().toISOString(),
    }
    setClients((prev) => [newClient, ...prev])
    addActivity({
      type: "client_added",
      description: `Добавлен заказчик ${newClient.name}`,
      user: "Влад",
    })
    return newClient
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  const removeClient = (id: string) => {
    const target = clients.find((c) => c.id === id)
    setClients((prev) => prev.filter((c) => c.id !== id))
    if (target) {
      addActivity({
        type: "note_added",
        description: `Удалён заказчик ${target.name}`,
        user: "Влад",
      })
    }
  }

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
