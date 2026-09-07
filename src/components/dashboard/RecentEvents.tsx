import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Event } from "@/types"
import { Calendar, ArrowRight, MapPin } from "lucide-react"

const stageVariant: Record<string, "new" | "active" | "qualified" | "won" | "lost"> = {
  new: "new",
  in_progress: "active",
  confirmed: "qualified",
  done: "won",
  cancelled: "lost",
}

const stageLabel: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  confirmed: "Подтверждён",
  done: "Проведён",
  cancelled: "Отменён",
}

interface RecentEventsProps {
  events: Event[]
}

export function RecentEvents({ events }: RecentEventsProps) {
  const navigate = useNavigate()

  // Sort: upcoming confirmed/active first, then latest updated
  const sortedEvents = [...events]
    .sort((a, b) => {
      if (a.date && b.date) {
        return a.date.localeCompare(b.date)
      }
      return b.updatedAt.localeCompare(a.updatedAt)
    })
    .slice(0, 5)

  return (
    <div className="card overflow-hidden p-0">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface-secondary/40 text-brand">
            <Calendar className="w-4 h-4" />
          </div>
          <h3 className="font-cormorant italic text-[22px] text-text-primary">
            Ближайшие и недавние мероприятия
          </h3>
        </div>
        <button
          onClick={() => navigate("/events")}
          className="font-montserrat text-xs text-text-secondary hover:text-brand flex items-center gap-1 transition-colors"
        >
          <span>Вся воронка</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="py-12 text-center text-text-tertiary font-montserrat text-sm">
          Мероприятия пока не добавлены
        </div>
      ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-bg-app">
              <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">
                Мероприятие
              </th>
              <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">
                Дата и локация
              </th>
              <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">
                Заказчик
              </th>
              <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">
                Бюджет
              </th>
              <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">
                Статус
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event, i) => (
              <tr
                key={event.id}
                onClick={() => navigate("/events")}
                className={`border-b border-border last:border-0 cursor-pointer transition-colors hover:bg-surface-secondary/30 ${
                  i % 2 === 0 ? "bg-bg-card" : "bg-bg-app"
                }`}
              >
                <td className="px-6 py-4">
                  <div className="font-cormorant text-base text-text-primary font-medium">
                    {event.title}
                  </div>
                </td>
                <td className="px-6 py-4 font-montserrat text-xs text-text-secondary">
                  <div>{event.date || "—"}</div>
                  {event.address && (
                    <div className="flex items-center gap-1 text-[11px] text-text-tertiary mt-0.5 truncate max-w-[180px]">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{event.address}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 font-montserrat text-sm text-text-secondary">
                  {event.clientName || "—"}
                </td>
                <td className="px-6 py-4 font-montserrat font-semibold text-sm text-text-primary">
                  {event.value > 0 ? `${event.value.toLocaleString()} ₽` : "—"}
                </td>
                <td className="px-6 py-4">
                  <Badge variant={stageVariant[event.stage]}>{stageLabel[event.stage]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
