import React, { useState } from "react"
import { Event } from "@/types"
import { EventCard } from "./EventCard"

interface EventColumnProps {
  title: string
  stage: Event["stage"]
  events: Event[]
  onChangeStage: (id: string, stage: Event["stage"]) => void
  onEdit: (event: Event) => void
  onPrint: (event: Event) => void
  onDelete: (event: Event) => void
  onOpenCalculator: (event: Event) => void
}

export function EventColumn({
  title,
  stage,
  events,
  onChangeStage,
  onEdit,
  onPrint,
  onDelete,
  onOpenCalculator,
}: EventColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only turn off if leaving the column element itself
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const eventId = e.dataTransfer.getData("text/plain")
    if (eventId) {
      onChangeStage(eventId, stage)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[260px] rounded-xl p-3 transition-all duration-200 ${
        isDragOver
          ? "bg-accent-primary/10 border-2 border-dashed border-brand shadow-inner"
          : "bg-surface-secondary/20 border border-border/40"
      }`}
    >
      {/* Заголовок колонки */}
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="font-montserrat font-semibold uppercase tracking-[0.15em] text-xs text-text-primary">
          {title}
        </h3>
        <span className="font-montserrat text-xs font-bold text-text-secondary bg-surface-secondary/60 rounded-full px-2.5 py-0.5">
          {events.length}
        </span>
      </div>

      {/* Список карточек в колонке */}
      <div className="space-y-3 min-h-[150px]">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border-sketch/60 rounded-lg">
            <p className="font-cormorant italic text-lg text-text-tertiary">Пока пусто</p>
            <span className="font-montserrat text-[11px] text-text-tertiary mt-1">
              Перетащите карточку сюда
            </span>
          </div>
        ) : (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={onEdit}
              onChangeStage={(newStage) => onChangeStage(event.id, newStage)}
              onPrint={() => onPrint(event)}
              onDelete={onDelete}
              onOpenCalculator={onOpenCalculator}
            />
          ))
        )}
      </div>
    </div>
  )
}
