import { Event } from "@/types"
import { EventCard } from "./EventCard"

interface EventColumnProps {
  title: string
  events: Event[]
  onChangeStage: (id: string, stage: Event["stage"]) => void
  onPrint: (event: Event) => void
}

export function EventColumn({ title, events, onChangeStage, onPrint }: EventColumnProps) {
  return (
    <div className="flex-1 min-w-[260px]">
      <div className="mb-4 flex items-center justify-between px-1">
        <h3 className="font-montserrat font-light uppercase tracking-[0.15em] text-xs text-text-tertiary">
          {title}
        </h3>
        <span className="font-montserrat text-xs text-text-tertiary bg-surface-secondary/40 rounded-full px-2 py-0.5">
          {events.length}
        </span>
      </div>
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border-sketch rounded-lg">
            <p className="font-cormorant italic text-xl text-text-primary">Пока пусто</p>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onChangeStage={(stage) => onChangeStage(event.id, stage)}
              onPrint={() => onPrint(event)}
            />
          ))
        )}
      </div>
    </div>
  )
}
