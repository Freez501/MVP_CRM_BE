import { Client } from "@/types"
import { ClientCard } from "./ClientCard"

interface ClientGridProps {
  clients: Client[]
}

export function ClientGrid({ clients }: ClientGridProps) {
  if (clients.length === 0) {
    return (
      <div className="card py-16 text-center">
        <p className="font-cormorant italic text-xl text-text-primary">Ничего не найдено</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {clients.map((client) => (
        <ClientCard key={client.id} client={client} />
      ))}
    </div>
  )
}
