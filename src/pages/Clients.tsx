import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ClientList } from "@/components/clients/ClientList"
import { ClientGrid } from "@/components/clients/ClientGrid"
import { useClients } from "@/context/ClientsContext"
import { List, Grid, Plus, Search } from "lucide-react"

export default function Clients() {
  const { clients, addClient } = useClients()
  const [query, setQuery] = useState("")
  const [view, setView] = useState<"list" | "grid">("list")
  const [isAddOpen, setIsAddOpen] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
    )
  }, [clients, query])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return

    addClient({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      company: company.trim() || undefined,
    })

    setName("")
    setEmail("")
    setPhone("")
    setCompany("")
    setIsAddOpen(false)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <p className="font-cormorant italic text-[22px] text-text-secondary">
          {filtered.length} {filtered.length === 1 ? "заказчик" : filtered.length < 5 ? "заказчика" : "заказчиков"}
        </p>
        <Button variant="primary" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить заказчика
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени, компании, email..."
            className="w-full bg-bg-card border-2 border-border-sketch rounded pl-11 pr-4 py-2 font-montserrat text-[15px] text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 bg-bg-card border border-border rounded-md p-1">
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

      {view === "list" ? <ClientList clients={filtered} /> : <ClientGrid clients={filtered} />}

      {/* Модальное окно добавления заказчика */}
      <Dialog
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Новый заказчик"
        description="Заполните контактную информацию заказчика"
      >
        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
              Имя и Фамилия *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Екатерина Романова"
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@agency.com"
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 000-00-00"
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-1">
              Компания / Агентство
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Event Bureau"
              className="w-full bg-bg-card border-2 border-border-sketch rounded px-3 py-2 font-montserrat text-sm text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsAddOpen(false)}
            >
              Отмена
            </Button>
            <Button type="submit" variant="primary">
              Сохранить
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
