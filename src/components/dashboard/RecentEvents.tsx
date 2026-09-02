import { Badge } from "@/components/ui/badge"
import { Event } from "@/types"

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
  const recent = [...events]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

  return (
    <div className="card overflow-hidden p-0">
      <div className="px-6 pt-6 pb-4">
        <h3 className="font-cormorant italic text-[22px] text-text-primary">Последние мероприятия</h3>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Мероприятие</th>
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Заказчик</th>
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Сумма</th>
            <th className="px-6 py-3 font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">Статус</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((event, i) => (
            <tr
              key={event.id}
              className={`border-b border-border last:border-0 ${i % 2 === 0 ? "bg-bg-card" : "bg-bg-app"}`}
            >
              <td className="px-6 py-4 font-cormorant text-base text-text-primary">{event.title}</td>
              <td className="px-6 py-4 font-montserrat text-sm text-text-secondary">{event.clientName}</td>
              <td className="px-6 py-4 font-montserrat text-sm text-text-primary">{event.value.toLocaleString()} ₽</td>
              <td className="px-6 py-4">
                <Badge variant={stageVariant[event.stage]}>{stageLabel[event.stage]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
