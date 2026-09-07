import { Badge } from "@/components/ui/badge"
import { Event } from "@/types"
import { CalendarDays, MapPin, Users, Printer } from "lucide-react"

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
  onChangeStage?: (stage: Event["stage"]) => void
  onPrint?: () => void
}

export function EventCard({ event, onChangeStage, onPrint }: EventCardProps) {
  return (
    <div className="bg-bg-card border border-border rounded-lg p-4 shadow-card hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-cormorant italic text-lg text-text-primary">{event.title}</h4>
        {onPrint && (
          <button
            onClick={onPrint}
            className="text-text-tertiary hover:text-brand transition-colors"
            title="Печать / PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="font-montserrat text-sm text-text-secondary mb-3">{event.clientName}</p>
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2 text-text-tertiary">
          <CalendarDays className="w-3.5 h-3.5" />
          <span className="font-montserrat text-xs">{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-text-tertiary">
          <MapPin className="w-3.5 h-3.5" />
          <span className="font-montserrat text-xs truncate">{event.address}</span>
        </div>
        <div className="flex items-center gap-2 text-text-tertiary">
          <Users className="w-3.5 h-3.5" />
          <span className="font-montserrat text-xs">{event.bartendersCount} бармена</span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-montserrat font-semibold text-text-primary">
          {event.value.toLocaleString()} ₽
        </span>
        <Badge variant={stageVariant[event.stage]}>{stageLabel[event.stage]}</Badge>
      </div>
      {onChangeStage && (
        <select
          value={event.stage}
          onChange={(e) => onChangeStage(e.target.value as Event["stage"])}
          className="w-full bg-bg-app border-2 border-border-sketch rounded px-3 py-1.5 font-montserrat text-xs text-text-primary focus:outline-none focus:border-brand"
        >
          {stages.map((s) => (
            <option key={s} value={s}>
              {stageLabel[s]}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
