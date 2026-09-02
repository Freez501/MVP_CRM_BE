import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EventBoard } from "@/components/events/EventBoard"
import { EventForm } from "@/components/events/EventForm"
import { EventReport } from "@/components/events/EventReport"
import { useEvents } from "@/context/EventsContext"
import { Event } from "@/types"
import { Plus } from "lucide-react"

export default function Events() {
  const { events, addEvent, updateEvent } = useEvents()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [reportEvent, setReportEvent] = useState<Event | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <p className="font-cormorant italic text-[22px] text-text-secondary">
          Воронка мероприятий
        </p>
        <Button variant="primary" onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Добавить
        </Button>
      </div>
      <EventBoard
        events={events}
        onChangeStage={(id, stage) => updateEvent(id, { stage })}
        onPrint={setReportEvent}
      />
      <EventForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSubmit={addEvent} />
      <EventReport event={reportEvent} onClose={() => setReportEvent(null)} />
    </div>
  )
}
