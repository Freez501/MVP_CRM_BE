export type EventStage = "new" | "in_progress" | "confirmed" | "done" | "cancelled"

export interface Event {
  id: string
  title: string
  clientId: string
  clientName: string
  date: string
  address: string
  bartendersCount: number
  stage: EventStage
  value: number
  comment: string
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  createdAt: string
}

export interface Activity {
  id: string
  type: "event_created" | "event_moved" | "client_added" | "note_added"
  description: string
  timestamp: string
  user: string
}
