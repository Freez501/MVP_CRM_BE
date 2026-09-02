import { Client } from "@/types"
import { Mail, Phone, Building2 } from "lucide-react"

interface ClientCardProps {
  client: Client
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export function ClientCard({ client }: ClientCardProps) {
  return (
    <div className="card card-hover p-6 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-text-tertiary flex items-center justify-center text-text-inverse text-xl font-semibold font-montserrat mb-4">
        {initials(client.name)}
      </div>
      <h3 className="font-cormorant italic text-xl text-text-primary mb-1">{client.name}</h3>
      <div className="space-y-2 mt-2 w-full">
        {client.company && (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Building2 className="w-3.5 h-3.5" />
            <span className="font-montserrat text-sm">{client.company}</span>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-text-secondary">
          <Mail className="w-3.5 h-3.5" />
          <span className="font-montserrat text-sm">{client.email}</span>
        </div>
        {client.phone && (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Phone className="w-3.5 h-3.5" />
            <span className="font-montserrat text-sm">{client.phone}</span>
          </div>
        )}
      </div>
    </div>
  )
}
