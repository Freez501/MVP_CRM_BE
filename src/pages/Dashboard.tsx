import { useMemo } from "react"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { RecentEvents } from "@/components/dashboard/RecentEvents"
import { TopCocktailsWidget } from "@/components/dashboard/TopCocktailsWidget"
import { ActivityFeed } from "@/components/dashboard/ActivityFeed"
import { useEvents } from "@/context/EventsContext"
import { useClients } from "@/context/ClientsContext"
import { useCocktails } from "@/context/CocktailsContext"
import { DollarSign, CheckCircle2, Users, Calendar } from "lucide-react"

export default function Dashboard() {
  const { events } = useEvents()
  const { clients } = useClients()
  const { cocktails } = useCocktails()

  const metrics = useMemo(() => {
    const activeEvents = events.filter(
      (e) => e.stage === "new" || e.stage === "in_progress" || e.stage === "confirmed"
    )
    const pipelineSum = activeEvents.reduce((sum, e) => sum + (e.value || 0), 0)
    const doneEvents = events.filter((e) => e.stage === "done")
    const totalRevenue = doneEvents.reduce((sum, e) => sum + (e.value || 0), 0)
    const conversion = events.length ? Math.round((doneEvents.length / events.length) * 100) : 0

    return {
      activeCount: activeEvents.length,
      pipelineSum,
      doneCount: doneEvents.length,
      totalRevenue,
      conversion,
      totalClients: clients.length,
      totalEvents: events.length,
    }
  }, [events, clients])

  return (
    <div className="space-y-8">
      {/* Приветствие / Заголовок дашборда */}
      <div>
        <h1 className="font-cormorant italic text-3xl text-text-primary">Аналитический центр</h1>
        <p className="font-montserrat text-xs text-text-secondary mt-1">
          Сводка по мероприятиям, выручке и активности Brilliant Bar Catering
        </p>
      </div>

      {/* Метрики (Виджеты) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatsCard
          label="Выручка (Проведено)"
          value={`${metrics.totalRevenue.toLocaleString()} ₽`}
          subtext={`${metrics.doneCount} успешно проведённых`}
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />
        <StatsCard
          label="Сумма в воронке"
          value={`${metrics.pipelineSum.toLocaleString()} ₽`}
          subtext={`${metrics.activeCount} активных сделок в работе`}
          icon={<DollarSign className="w-5 h-5 text-brand" />}
        />
        <StatsCard
          label="Заказчиков в базе"
          value={String(metrics.totalClients)}
          subtext="CRM контакты клиентов"
          icon={<Users className="w-5 h-5 text-blue-400" />}
        />
        <StatsCard
          label="Всего мероприятий"
          value={String(metrics.totalEvents)}
          subtext={`Конверсия в успех: ${metrics.conversion}%`}
          icon={<Calendar className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Основная сетка дашборда */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        <div className="xl:col-span-2 space-y-8">
          <RecentEvents events={events} />
          <TopCocktailsWidget events={events} cocktails={cocktails} />
        </div>
        <div className="space-y-8">
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}
