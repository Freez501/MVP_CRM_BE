import { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { EventBoard } from "@/components/events/EventBoard"
import { EventCalendar } from "@/components/events/EventCalendar"
import { EventForm } from "@/components/events/EventForm"
import { EventReport } from "@/components/events/EventReport"
import { useEvents } from "@/context/EventsContext"
import { useCocktails } from "@/context/CocktailsContext"
import { Event } from "@/types"
import { SelectedCocktail } from "@/components/calculator/useCalculator"
import {
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  Kanban,
  CalendarDays,
} from "lucide-react"

type PeriodFilter = "all" | "upcoming" | "past"
type ViewMode = "board" | "calendar"

export default function Events() {
  const navigate = useNavigate()
  const { events, addEvent, updateEvent, removeEvent } = useEvents()
  const { cocktails } = useCocktails()

  const [query, setQuery] = useState("")
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("board")

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>(undefined)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [reportEvent, setReportEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)

  // Pipeline Metrics
  const metrics = useMemo(() => {
    const pipelineSum = events
      .filter((e) => e.stage === "new" || e.stage === "in_progress" || e.stage === "confirmed")
      .reduce((sum, e) => sum + (e.value || 0), 0)

    const doneSum = events
      .filter((e) => e.stage === "done")
      .reduce((sum, e) => sum + (e.value || 0), 0)

    const activeCount = events.filter(
      (e) => e.stage === "new" || e.stage === "in_progress" || e.stage === "confirmed"
    ).length

    const doneCount = events.filter((e) => e.stage === "done").length

    return { pipelineSum, doneSum, activeCount, doneCount, totalCount: events.length }
  }, [events])

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    const today = new Date().toISOString().slice(0, 10)

    return events.filter((event) => {
      // Search query filter
      if (q) {
        const matchesQuery =
          event.title.toLowerCase().includes(q) ||
          event.clientName.toLowerCase().includes(q) ||
          event.address.toLowerCase().includes(q) ||
          (event.comment ?? "").toLowerCase().includes(q)
        if (!matchesQuery) return false
      }

      // Period filter (only relevant for board view or specific filter)
      if (periodFilter === "upcoming") {
        if (event.stage === "done" || event.stage === "cancelled") return false
        if (event.date && event.date < today) return false
      } else if (periodFilter === "past") {
        if (event.stage !== "done" && (!event.date || event.date >= today)) return false
      }

      return true
    })
  }, [events, query, periodFilter])

  const handleOpenAdd = () => {
    setEditingEvent(null)
    setFormInitialDate(undefined)
    setIsFormOpen(true)
  }

  const handleCreateOnDate = (dateString: string) => {
    setEditingEvent(null)
    setFormInitialDate(dateString)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (event: Event) => {
    setEditingEvent(event)
    setFormInitialDate(undefined)
    setIsFormOpen(true)
  }

  const handleFormSubmit = (
    eventData: Omit<Event, "id" | "createdAt" | "updatedAt">,
    existingId?: string
  ) => {
    if (existingId) {
      updateEvent(existingId, eventData)
    } else {
      addEvent(eventData)
    }
  }

  const handleOpenCalculator = (event: Event) => {
    if (!event.details?.cocktails || event.details.cocktails.length === 0) return

    // Map event cocktails to SelectedCocktail format
    const selected: SelectedCocktail[] = []
    const cocktailEntries = Object.entries(cocktails)

    for (const ec of event.details.cocktails) {
      if (ec.qty <= 0) continue
      let matchedKey = ec.key
      if (!matchedKey) {
        const found = cocktailEntries.find(
          ([, c]) => c.name.trim().toLowerCase() === ec.name.trim().toLowerCase()
        )
        matchedKey = found ? found[0] : ec.name.toLowerCase().replace(/\s+/g, "_")
      }
      selected.push({
        key: matchedKey,
        name: ec.name,
        qty: ec.qty,
      })
    }

    try {
      localStorage.setItem("brilliant-calculator-selected", JSON.stringify(selected))
    } catch {
      // Ignore storage errors
    }

    navigate("/calculator")
  }

  const handleConfirmDelete = () => {
    if (deletingEvent) {
      removeEvent(deletingEvent.id)
      setDeletingEvent(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Шапка и метрики воронки */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-cormorant italic text-3xl text-text-primary">Воронка мероприятий</h1>
          <p className="font-montserrat text-xs text-text-secondary mt-1">
            Управление статусами, сметы и календарь мероприятий
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить мероприятие
        </Button>
      </div>

      {/* Метрики воронки */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5 text-text-tertiary text-xs font-montserrat uppercase tracking-wider mb-1">
            <DollarSign className="w-3.5 h-3.5 text-brand" />
            <span>В воронке</span>
          </div>
          <div className="font-montserrat font-bold text-xl text-text-primary">
            {metrics.pipelineSum.toLocaleString()} ₽
          </div>
          <div className="text-[11px] text-text-tertiary font-montserrat mt-1">
            {metrics.activeCount} активных сделок
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5 text-text-tertiary text-xs font-montserrat uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Выручка (Проведено)</span>
          </div>
          <div className="font-montserrat font-bold text-xl text-text-primary">
            {metrics.doneSum.toLocaleString()} ₽
          </div>
          <div className="text-[11px] text-text-tertiary font-montserrat mt-1">
            {metrics.doneCount} успешно закрытых
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5 text-text-tertiary text-xs font-montserrat uppercase tracking-wider mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Всего в базе</span>
          </div>
          <div className="font-montserrat font-bold text-xl text-text-primary">
            {metrics.totalCount} меропр.
          </div>
          <div className="text-[11px] text-text-tertiary font-montserrat mt-1">Всех статусов</div>
        </div>

        <div className="bg-bg-card border border-border rounded-xl p-4 shadow-card">
          <div className="flex items-center gap-1.5 text-text-tertiary text-xs font-montserrat uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Отображается</span>
          </div>
          <div className="font-montserrat font-bold text-xl text-text-primary">
            {filteredEvents.length} меропр.
          </div>
          <div className="text-[11px] text-text-tertiary font-montserrat mt-1">
            С учётом фильтров
          </div>
        </div>
      </div>

      {/* Панель поиска, фильтров и переключения Канбан / Календарь */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по названию, заказчику, адресу..."
            className="w-full bg-bg-card border-2 border-border-sketch rounded pl-11 pr-4 py-2 font-montserrat text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-text-tertiary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Фильтр по периодам (в канбане) */}
          {viewMode === "board" && (
            <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg p-1">
              <button
                onClick={() => setPeriodFilter("all")}
                className={`px-3 py-1.5 rounded text-xs font-montserrat uppercase tracking-wider transition-colors ${
                  periodFilter === "all"
                    ? "bg-surface-secondary/50 text-text-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setPeriodFilter("upcoming")}
                className={`px-3 py-1.5 rounded text-xs font-montserrat uppercase tracking-wider transition-colors ${
                  periodFilter === "upcoming"
                    ? "bg-surface-secondary/50 text-text-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Предстоящие
              </button>
              <button
                onClick={() => setPeriodFilter("past")}
                className={`px-3 py-1.5 rounded text-xs font-montserrat uppercase tracking-wider transition-colors ${
                  periodFilter === "past"
                    ? "bg-surface-secondary/50 text-text-primary font-semibold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Прошедшие
              </button>
            </div>
          )}

          {/* Переключатель вида (Канбан / Календарь) */}
          <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg p-1 shadow-2xs">
            <button
              onClick={() => setViewMode("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-montserrat uppercase tracking-wider transition-colors ${
                viewMode === "board"
                  ? "bg-surface-secondary/50 text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/20"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Доска</span>
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-montserrat uppercase tracking-wider transition-colors ${
                viewMode === "calendar"
                  ? "bg-surface-secondary/50 text-text-primary font-semibold shadow-xs"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/20"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Календарь</span>
            </button>
          </div>
        </div>
      </div>

      {/* Основной вид: Kanban доска или Календарная сетка */}
      {viewMode === "board" ? (
        <EventBoard
          events={filteredEvents}
          onChangeStage={(id, stage) => updateEvent(id, { stage })}
          onEdit={handleOpenEdit}
          onPrint={setReportEvent}
          onDelete={setDeletingEvent}
          onOpenCalculator={handleOpenCalculator}
        />
      ) : (
        <EventCalendar
          events={filteredEvents}
          onEdit={handleOpenEdit}
          onCreateOnDate={handleCreateOnDate}
        />
      )}

      {/* Модальное окно добавления / редактирования мероприятия */}
      <EventForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setFormInitialDate(undefined)
        }}
        onSubmit={handleFormSubmit}
        event={editingEvent}
        initialDate={formInitialDate}
        onExport={setReportEvent}
      />

      {/* Модальное окно отчёта / печати */}
      <EventReport event={reportEvent} onClose={() => setReportEvent(null)} />

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        open={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleConfirmDelete}
        title="Удалить мероприятие?"
        description={`Вы действительно хотите удалить мероприятие «${deletingEvent?.title}»? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        danger={true}
      />
    </div>
  )
}
