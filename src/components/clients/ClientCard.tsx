import { Client } from "@/types"
import { Mail, Phone, Building2 } from "lucide-react"

interface ClientCardProps {
  client: Client
  onClick?: () => void
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  return (
    <div
      onClick={onClick}
      className="card card-hover p-6 flex flex-col items-center text-center cursor-pointer transition-all hover:border-brand/50 hover:shadow-md"
    >
      <div className="w-16 h-16 rounded-full bg-text-tertiary flex items-center justify-center text-text-inverse text-xl font-semibold font-montserrat mb-4 shadow-sm">
        {initials(client.name)}
      </div>
      <h3 className="font-cormorant italic text-xl text-text-primary mb-1 line-clamp-1">
        {client.name}
      </h3>
      <div className="space-y-2 mt-2 w-full text-center">
        {client.company && (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Building2 className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <span className="font-montserrat text-sm truncate">{client.company}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Mail className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <span className="font-montserrat text-sm truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center justify-center gap-2 text-text-secondary">
            <Phone className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
            <span className="font-montserrat text-sm truncate">{client.phone}</span>
          </div>
        )}
      </div>
    </div>
  )
}
