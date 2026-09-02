import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentEvents } from "@/components/dashboard/RecentEvents"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { useEvents } from "@/context/EventsContext"
import { useClients } from "@/context/ClientsContext"

export default function Dashboard() {
  const { events } = useEvents()
  const { clients } = useClients()

  const activeEvents = events.filter(
    (e) => e.stage !== "done" && e.stage !== "cancelled"
  )
  const totalRevenue = events
    .filter((e) => e.stage === "done")
    .reduce((sum, e) => sum + e.value, 0)
  const doneCount = events.filter((e) => e.stage === "done").length
  const conversion = events.length
    ? Math.round((doneCount / events.length) * 100)
    : 0

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatsCard label="Активные мероприятия" value={String(activeEvents.length)} />
        <StatsCard label="Выручка" value={`${totalRevenue.toLocaleString()} ₽`} />
        <StatsCard label="Заказчики" value={String(clients.length)} />
        <StatsCard label="Конверсия" value={`${conversion}%`} />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <RecentEvents events={events} />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
