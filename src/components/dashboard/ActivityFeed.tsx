import { useActivities } from "@/context/ActivitiesContext"
import {
  PlusCircle,
  ArrowRightLeft,
  UserPlus,
  FileText,
  Activity as ActivityIcon,
} from "lucide-react"

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()

    if (isToday) {
      return `Сегодня, ${d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`
    }
    return (
      d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) +
      ", " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    )
  } catch {
    return iso
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case "event_created":
      return <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
    case "event_moved":
      return <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
    case "client_added":
      return <UserPlus className="w-3.5 h-3.5 text-brand" />
    case "note_added":
    default:
      return <FileText className="w-3.5 h-3.5 text-amber-400" />
  }
}

export function ActivityFeed() {
  const { activities } = useActivities()

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-surface-secondary/40 text-brand">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <h3 className="font-cormorant italic text-[22px] text-text-primary">Лента активности</h3>
        </div>
        <span className="font-montserrat text-xs text-text-tertiary">
          {activities.length} {activities.length === 1 ? "действие" : "действий"}
        </span>
      </div>

      <div className="space-y-0 max-h-[440px] overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <p className="font-montserrat text-sm text-text-tertiary py-8 text-center border border-dashed border-border-sketch rounded-lg">
            История действий пуста
          </p>
        ) : (
          activities.slice(0, 15).map((activity, i) => (
            <div key={activity.id} className="flex gap-3 relative pb-5 last:pb-0">
              {i < Math.min(activities.length, 15) - 1 && (
                <div className="absolute left-[13px] top-6 bottom-0 w-px bg-border/60" />
              )}
              <div className="w-7 h-7 rounded-full bg-bg-app border border-border flex items-center justify-center shrink-0 relative z-10 shadow-xs">
                {getActivityIcon(activity.type)}
              </div>
              <div className="pt-0.5">
                <p className="font-montserrat text-xs sm:text-sm text-text-primary leading-snug">
                  {activity.description}
                </p>
                <p className="font-montserrat text-[11px] text-text-tertiary mt-1">
                  {formatTime(activity.timestamp)} ·{" "}
                  <span className="text-text-secondary">{activity.user}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
