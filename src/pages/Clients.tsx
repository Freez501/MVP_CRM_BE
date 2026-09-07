import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ClientList } from "@/components/clients/ClientList"
import { ClientGrid } from "@/components/clients/ClientGrid"
import { ClientFormModal } from "@/components/clients/ClientFormModal"
import { ClientDetailsModal } from "@/components/clients/ClientDetailsModal"
import { useClients } from "@/context/ClientsContext"
import { useEvents } from "@/context/EventsContext"
import { Client } from "@/types"
import { List, Grid, Plus, Search, ArrowUpDown } from "lucide-react"

type SortOption = "name-asc" | "date-desc" | "ltv-desc"

export default function Clients() {
  const { clients, removeClient } = useClients()
  const { events } = useEvents()

  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")
  const [sortBy, setSortBy] = useState<SortOption>("name-asc")

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formClient, setFormClient] = useState<Client | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  // Map of client LTV for fast sorting
  const clientLtvMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const client of clients) {
      const clientDoneEvents = events.filter((e) => e.clientId === client.id && e.stage === "done")
      const ltv = clientDoneEvents.reduce((sum, e) => sum + (e.value || 0), 0)
      map.set(client.id, ltv)
    }
    return map
  }, [clients, events])

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = clients

    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.company ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name, "ru")
      }
      if (sortBy === "date-desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === "ltv-desc") {
        const ltvA = clientLtvMap.get(a.id) || 0
        const ltvB = clientLtvMap.get(b.id) || 0
        return ltvB - ltvA
      }
      return 0
    })
  }, [clients, query, sortBy, clientLtvMap])

  // Count events for client to delete to show in confirm modal
  const clientToDeleteEventsCount = useMemo(() => {
    if (!clientToDelete) return 0
    return events.filter((e) => e.clientId === clientToDelete.id).length
  }, [clientToDelete, events])

  const handleOpenAdd = () => {
    setFormClient(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (client: Client) => {
    setSelectedClient(null)
    setFormClient(client)
    setIsFormOpen(true)
  }

  const handleOpenDelete = (client: Client) => {
    setSelectedClient(null)
    setClientToDelete(client)
  }

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      removeClient(clientToDelete.id)
      setClientToDelete(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Шапка страницы */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="font-cormorant italic text-[22px] text-text-secondary">
            {filteredAndSorted.length}{" "}
            {filteredAndSorted.length === 1
              ? "заказчик"
              : filteredAndSorted.length < 5
                ? "заказчика"
                : "заказчиков"}
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить заказчика
        </Button>
      </div>

      {/* Панель поиска, сортировки и переключения вида */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по имени, компании, контактам..."
              className="w-full bg-bg-card border-2 border-border-sketch rounded pl-11 pr-4 py-2 font-montserrat text-[15px] text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-bg-card border border-border rounded-md px-3 py-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-tertiary" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Сортировка заказчиков"
              className="bg-transparent font-montserrat text-xs text-text-primary focus:outline-none cursor-pointer"
            >
              <option value="name-asc">По имени (А-Я)</option>
              <option value="date-desc">Сначала новые</option>
              <option value="ltv-desc">По выручке (LTV)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-bg-card border border-border rounded-md p-1 self-start md:self-auto">
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              view === "list"
                ? "bg-surface-secondary/40 text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/30"
            }`}
          >
            <List className="w-4 h-4" />
            <span className="font-montserrat text-xs uppercase tracking-wider">Таблица</span>
          </button>
          <button
            onClick={() => setView("grid")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
              view === "grid"
                ? "bg-surface-secondary/40 text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/30"
            }`}
          >
            <Grid className="w-4 h-4" />
            <span className="font-montserrat text-xs uppercase tracking-wider">Сетка</span>
          </button>
        </div>
      </div>

      {/* Список или Сетка */}
      {view === "list" ? (
        <ClientList clients={filteredAndSorted} onSelectClient={setSelectedClient} />
      ) : (
        <ClientGrid clients={filteredAndSorted} onSelectClient={setSelectedClient} />
      )}

      {/* Модальное окно добавления / редактирования */}
      <ClientFormModal open={isFormOpen} onClose={() => setIsFormOpen(false)} client={formClient} />

      {/* Модальное окно детального просмотра */}
      <ClientDetailsModal
        open={!!selectedClient}
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
      />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Удалить заказчика?"
        description={
          clientToDeleteEventsCount > 0
            ? `Внимание: у заказчика «${clientToDelete?.name}» есть ${clientToDeleteEventsCount} мероприятий в базе. При удалении заказчика история мероприятий сохранится, но связь с заказчиком будет удалена.`
            : `Вы действительно хотите удалить заказчика «${clientToDelete?.name}»? Это действие нельзя отменить.`
        }
        confirmText="Удалить"
        cancelText="Отмена"
        danger={true}
      />
    </div>
  )
}
