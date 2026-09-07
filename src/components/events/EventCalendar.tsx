import { useState, useMemo } from "react"
import { Event, EventStage } from "@/types"
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin } from "lucide-react"

interface EventCalendarProps {
  events: Event[]
  onEdit: (event: Event) => void
  onCreateOnDate?: (dateString: string) => void
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
]

const STAGE_DOT_COLORS: Record<EventStage, string> = {
  new: "bg-surface-secondary border-text-tertiary",
  in_progress: "bg-blue-400",
  confirmed: "bg-amber-400",
  done: "bg-emerald-400",
  cancelled: "bg-rose-400",
}

const STAGE_BG_STYLES: Record<EventStage, string> = {
  new: "bg-surface-secondary/40 hover:bg-surface-secondary/70 border-border",
  in_progress: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-300",
  confirmed: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300",
  done: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
  cancelled: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-300",
}

function formatDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  return `${year}-${m}-${d}`
}

export function EventCalendar({ events, onEdit, onCreateOnDate }: EventCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Group events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>()
    for (const event of events) {
      if (!event.date) continue
      // Ensure date is normalized to YYYY-MM-DD
      const dateKey = event.date.slice(0, 10)
      const list = map.get(dateKey) || []
      list.push(event)
      map.set(dateKey, list)
    }
    return map
  }, [events])

  // Compute calendar grid days
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const currentMonthDays = lastDayOfMonth.getDate()

    // Day of week for 1st day (0 = Sunday, 1 = Monday, ... 6 = Saturday)
    // Convert to Monday = 0: (day + 6) % 7
    const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7

    // Previous month days
    const prevMonthDays = new Date(year, month, 0).getDate()

    const cells: {
      dateString: string
      dayNumber: number
      isCurrentMonth: boolean
      isToday: boolean
      events: Event[]
    }[] = []

    const todayStr = new Date().toISOString().slice(0, 10)

    // Fill days from previous month
    for (let i = startDayOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i
      const prevYear = month === 0 ? year - 1 : year
      const prevMonth = month === 0 ? 11 : month - 1
      const dateKey = formatDateKey(prevYear, prevMonth, dayNum)
      cells.push({
        dateString: dateKey,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        events: eventsByDate.get(dateKey) || [],
      })
    }

    // Fill days of current month
    for (let d = 1; d <= currentMonthDays; d++) {
      const dateKey = formatDateKey(year, month, d)
      cells.push({
        dateString: dateKey,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
        events: eventsByDate.get(dateKey) || [],
      })
    }

    // Fill days of next month to complete standard weeks
    const remaining = (7 - (cells.length % 7)) % 7
    const nextMonthYear = month === 11 ? year + 1 : year
    const nextMonthVal = month === 11 ? 0 : month + 1
    for (let d = 1; d <= remaining; d++) {
      const dateKey = formatDateKey(nextMonthYear, nextMonthVal, d)
      cells.push({
        dateString: dateKey,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
        events: eventsByDate.get(dateKey) || [],
      })
    }

    return cells
  }, [year, month, eventsByDate])

  // Statistics for current month
  const monthStats = useMemo(() => {
    let count = 0
    let totalValue = 0

    for (const cell of calendarCells) {
      if (!cell.isCurrentMonth) continue
      for (const ev of cell.events) {
        count++
        totalValue += ev.value || 0
      }
    }

    return { count, totalValue }
  }, [calendarCells])

  return (
    <div className="card p-0 overflow-hidden shadow-card border border-border">
      {/* Шапка календаря: переключение месяцев и сводка */}
      <div className="p-4 sm:p-5 border-b border-border bg-bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-bg-app border border-border rounded-lg p-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-montserrat font-semibold text-text-secondary hover:text-text-primary rounded hover:bg-surface-secondary/40 transition-colors"
            >
              Сегодня
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface-secondary/40 transition-colors"
              title="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="font-cormorant italic text-2xl sm:text-3xl text-text-primary">
            {MONTH_NAMES[month]} {year}
          </h2>
        </div>

        {/* Метрики месяца */}
        <div className="flex items-center gap-4 text-xs font-montserrat">
          <div className="flex items-center gap-1.5 text-text-secondary bg-bg-app border border-border/60 rounded-lg px-3 py-1.5">
            <span className="text-text-tertiary">Мероприятий:</span>
            <span className="font-bold text-text-primary">{monthStats.count}</span>
          </div>
          <div className="flex items-center gap-1.5 text-text-secondary bg-bg-app border border-border/60 rounded-lg px-3 py-1.5">
            <span className="text-text-tertiary">Оборот:</span>
            <span className="font-bold text-text-primary">
              {monthStats.totalValue.toLocaleString()} ₽
            </span>
          </div>
        </div>
      </div>

      {/* Сетка календаря */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Дни недели (Пн - Вс) */}
          <div className="grid grid-cols-7 border-b border-border bg-bg-app">
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={`py-2.5 text-center font-montserrat text-xs uppercase tracking-widest font-semibold ${
                  idx >= 5 ? "text-brand/80" : "text-text-tertiary"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Ячейки сетки дней */}
          <div className="grid grid-cols-7 divide-x divide-y divide-border/60 bg-border/20">
            {calendarCells.map((cell) => {
              const hasEvents = cell.events.length > 0

              return (
                <div
                  key={cell.dateString}
                  className={`min-h-[120px] p-2 flex flex-col justify-between transition-colors relative group ${
                    cell.isCurrentMonth
                      ? hasEvents
                        ? "bg-bg-card hover:bg-surface-secondary/20"
                        : "bg-bg-card/70 hover:bg-surface-secondary/15"
                      : "bg-bg-app/40 text-text-tertiary/60"
                  }`}
                >
                  {/* Верхняя строка ячейки (номер дня + кнопка создания) */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex items-center justify-center font-montserrat text-xs transition-colors ${
                        cell.isToday
                          ? "w-6 h-6 rounded-full bg-brand text-text-inverse font-bold shadow-sm"
                          : cell.isCurrentMonth
                            ? "font-semibold text-text-primary"
                            : "font-normal text-text-tertiary/50"
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {onCreateOnDate && cell.isCurrentMonth && (
                      <button
                        onClick={() => onCreateOnDate(cell.dateString)}
                        title={`Добавить мероприятие на ${cell.dayNumber} ${MONTH_NAMES[month]}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-surface-secondary/50 text-text-tertiary hover:text-brand transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Список карточек мероприятий внутри дня */}
                  <div className="space-y-1.5 flex-1 overflow-y-auto max-h-[140px] pr-0.5">
                    {cell.events.map((event) => {
                      const startTime = event.details?.start
                      const hasValue = event.value > 0

                      return (
                        <div
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(event)
                          }}
                          className={`p-1.5 rounded-md border text-left cursor-pointer transition-all duration-150 shadow-2xs hover:scale-[1.02] ${
                            STAGE_BG_STYLES[event.stage] || "bg-bg-card border-border"
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                STAGE_DOT_COLORS[event.stage] || "bg-text-tertiary"
                              }`}
                            />
                            <span className="font-montserrat font-semibold text-xs text-text-primary truncate">
                              {event.title}
                            </span>
                          </div>

                          {event.clientName && (
                            <p className="font-montserrat text-[10px] text-text-secondary truncate mt-0.5 pl-3">
                              {event.clientName}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-text-tertiary mt-1 pl-3 font-montserrat">
                            {startTime ? (
                              <span className="flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {startTime}
                              </span>
                            ) : event.address ? (
                              <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{event.address}</span>
                              </span>
                            ) : (
                              <span />
                            )}

                            {hasValue && (
                              <span className="font-semibold text-text-primary ml-auto">
                                {event.value.toLocaleString()} ₽
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Итог за день при наличии нескольких мероприятий */}
                  {cell.events.length > 2 && (
                    <div className="text-[10px] font-montserrat text-text-tertiary text-right pt-1 border-t border-border/30 mt-1">
                      Всего: {cell.events.length}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
