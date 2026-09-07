import { Event } from "@/types"
import { EventColumn } from "./EventColumn"

const columns: { title: string; stage: Event["stage"] }[] = [
  { title: "Новый", stage: "new" },
  { title: "В работе", stage: "in_progress" },
  { title: "Подтверждён", stage: "confirmed" },
  { title: "Проведён", stage: "done" },
  { title: "Отменён", stage: "cancelled" },
]

interface EventBoardProps {
  events: Event[]
  onChangeStage: (id: string, stage: Event["stage"]) => void
  onEdit: (event: Event) => void
  onPrint: (event: Event) => void
  onDelete: (event: Event) => void
  onOpenCalculator: (event: Event) => void
}

export function EventBoard({
  events,
  onChangeStage,
  onEdit,
  onPrint,
  onDelete,
  onOpenCalculator,
}: EventBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 flex-col md:flex-row items-stretch">
      {columns.map((col) => (
        <EventColumn
          key={col.stage}
          title={col.title}
          stage={col.stage}
          events={events.filter((e) => e.stage === col.stage)}
          onChangeStage={onChangeStage}
          onEdit={onEdit}
          onPrint={onPrint}
          onDelete={onDelete}
          onOpenCalculator={onOpenCalculator}
        />
      ))}
    </div>
  )
}
