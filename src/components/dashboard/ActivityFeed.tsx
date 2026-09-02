import { useActivities } from "@/context/ActivitiesContext"

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return (
      d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) +
      ", " +
      d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    )
  } catch {
    return iso
  }
}

export function ActivityFeed() {
  const { activities } = useActivities()

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-cormorant italic text-[22px] text-text-primary">Activity</h3>
        <span className="font-montserrat text-xs text-text-tertiary">
          {activities.length} {activities.length === 1 ? "запись" : "записей"}
        </span>
      </div>
      <div className="space-y-0 max-h-[480px] overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <p className="font-montserrat text-sm text-text-tertiary py-4 text-center">
            Пока нет действий
          </p>
        ) : (
          activities.slice(0, 15).map((activity, i) => (
            <div key={activity.id} className="flex gap-4 relative pb-6 last:pb-0">
              {i < Math.min(activities.length, 15) - 1 && (
                <div className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
              )}
              <div className="w-[15px] h-[15px] rounded-full bg-accent-secondary border-2 border-bg-card shrink-0 mt-1 relative z-10" />
              <div>
                <p className="font-montserrat text-sm text-text-secondary">{activity.description}</p>
                <p className="font-montserrat text-xs text-text-tertiary mt-1">
                  {formatTime(activity.timestamp)} · {activity.user}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
