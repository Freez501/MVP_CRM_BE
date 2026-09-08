import React from "react"
import { Badge } from "@/components/ui/badge"
import { Event } from "@/types"
import {
  CalendarDays,
  MapPin,
  Users,
  FileDown,
  Calculator,
  Trash2,
  GripVertical,
  Phone,
} from "lucide-react"

const stageVariant: Record<Event["stage"], "new" | "active" | "qualified" | "won" | "lost"> = {
  new: "new",
  in_progress: "active",
  confirmed: "qualified",
  done: "won",
  cancelled: "lost",
}

const stageLabel: Record<Event["stage"], string> = {
  new: "Новый",
  in_progress: "В работе",
  confirmed: "Подтверждён",
  done: "Проведён",
  cancelled: "Отменён",
}

const stages: Event["stage"][] = ["new", "in_progress", "confirmed", "done", "cancelled"]

interface EventCardProps {
  event: Event
  onEdit?: (event: Event) => void
  onChangeStage?: (stage: Event["stage"]) => void
  onPrint?: () => void
  onDelete?: (event: Event) => void
  onOpenCalculator?: (event: Event) => void
}

export function EventCard({
  event,
  onEdit,
  onChangeStage,
  onPrint,
  onDelete,
  onOpenCalculator,
}: EventCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", event.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const hasCocktails = event.details?.cocktails && event.details.cocktails.length > 0

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group relative bg-bg-card border border-border/80 rounded-xl p-3.5 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing hover:border-brand/50"
    >
      {/* Шапка карточки */}
      <div className="flex items-start justify-between gap-1.5 mb-1.5">
        <div onClick={() => onEdit && onEdit(event)} className="flex-1 cursor-pointer min-w-0">
          <div className="flex items-center gap-1">
            <GripVertical className="w-3.5 h-3.5 text-text-tertiary shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
            <h4 className="font-cormorant italic text-lg leading-snug text-text-primary hover:text-brand transition-colors truncate">
              {event.title}
            </h4>
          </div>
          <p className="font-montserrat text-xs text-text-secondary font-medium truncate pl-4.5 mt-0.5">
            {event.clientName || "Без заказчика"}
          </p>
        </div>

        {/* Быстрые действия */}
        <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          {hasCocktails && onOpenCalculator && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenCalculator(event)
              }}
              className="p-1 rounded text-text-tertiary hover:text-brand hover:bg-surface-secondary/40 transition-colors"
              title="Рассчитать смету в калькуляторе"
            >
              <Calculator className="w-3.5 h-3.5" />
            </button>
          )}

          {onPrint && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrint()
              }}
              className="p-1 rounded text-text-tertiary hover:text-brand hover:bg-surface-secondary/40 transition-colors"
              title="Смета и бриф (PDF / Telegram)"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(event)
              }}
              className="p-1 rounded text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Удалить мероприятие"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Информация о мероприятии */}
      <div onClick={() => onEdit && onEdit(event)} className="cursor-pointer pl-1">
        <div className="space-y-1 mb-2.5 text-text-tertiary font-montserrat text-xs">
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3 shrink-0" />
            <span>{event.date || "Дата не указана"}</span>
          </div>
          {event.address && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{event.address}</span>
            </div>
          )}
          {event.details?.managerContact && (
            <div className="flex items-center gap-1.5" title="Менеджер на площадке">
              <Phone className="w-3 h-3 shrink-0 text-brand" />
              <span className="truncate text-text-secondary">
                {event.details.managerContact}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 shrink-0" />
            <span>
              {event.bartendersCount} {event.bartendersCount === 1 ? "бармен" : "бармена"}
            </span>
          </div>
        </div>

        {/* Бюджет и статус */}
        <div className="flex items-center justify-between pt-2 border-t border-border/40 mb-2.5">
          <span className="font-montserrat font-bold text-sm text-text-primary">
            {event.value > 0 ? `${event.value.toLocaleString()} ₽` : "Бюджет не указан"}
          </span>
          <Badge variant={stageVariant[event.stage]}>{stageLabel[event.stage]}</Badge>
        </div>
      </div>

      {/* Селектор статуса */}
      {onChangeStage && (
        <select
          value={event.stage}
          onChange={(e) => onChangeStage(e.target.value as Event["stage"])}
          aria-label="Изменить статус мероприятия"
          className="w-full bg-bg-app border border-border/70 rounded-md px-2 py-1 font-montserrat text-xs text-text-secondary focus:outline-none focus:border-brand cursor-pointer hover:border-brand/40 transition-colors"
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              Статус: {stageLabel[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
