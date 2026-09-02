import { Event } from "@/types"
import { EventColumn } from "./EventColumn"

const columns: { title: string; stages: Event["stage"][] }[] = [
  { title: "Новый", stages: ["new"] },
  { title: "В работе", stages: ["in_progress"] },
  { title: "Подтверждён", stages: ["confirmed"] },
  { title: "Проведён", stages: ["done"] },
  { title: "Отменён", stages: ["cancelled"] },
]

interface EventBoardProps {
  events: Event[]
  onChangeStage: (id: string, stage: Event["stage"]) => void
  onPrint: (event: Event) => void
}

export function EventBoard({ events, onChangeStage, onPrint }: EventBoardProps) {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 flex-col md:flex-row">
      {columns.map((col) => (
        <EventColumn
          key={col.title}
          title={col.title}
          events={events.filter((e) => col.stages.includes(e.stage))}
          onChangeStage={onChangeStage}
          onPrint={onPrint}
        />
      ))}
    </div>
  )
}
