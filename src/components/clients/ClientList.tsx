import { Client } from "@/types"

interface ClientListProps {
  clients: Client[]
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export function ClientList({ clients }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="card py-16 text-center">
        <p className="font-cormorant italic text-xl text-text-primary">Ничего не найдено</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Заказчик</th>
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Компания</th>
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Email</th>
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Телефон</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client, i) => (
            <tr
              key={client.id}
              className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg-app"}`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-text-tertiary flex items-center justify-center text-text-inverse text-xs font-semibold font-montserrat">
                    {initials(client.name)}
                  </div>
                  <span className="font-cormorant text-base text-text-primary">{client.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-montserrat text-sm text-text-secondary">{client.company ?? "—"}</td>
              <td className="px-6 py-4 font-montserrat text-sm text-text-secondary">{client.email}</td>
              <td className="px-6 py-4 font-montserrat text-sm text-text-secondary">{client.phone ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
