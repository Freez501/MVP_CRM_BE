export type EventStage = "new" | "in_progress" | "confirmed" | "done" | "cancelled"

export interface EventDetails {
  departure?: string
  setup?: string
  start?: string
  end?: string
  clothing?: string
  bar?: string
  barComment?: string
  shelf?: string
  shelfComment?: string
  pyramid?: string
  pyramidComment?: string
  decorations?: string[]
  decorationComment?: string
  menu?: "us" | "client"
  cocktails?: { name: string; qty: number; key?: string }[]
  managerContact?: string
}

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
  details?: EventDetails
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  notes?: string
  createdAt: string
  updatedAt?: string
}

export interface Activity {
  id: string
  type: "event_created" | "event_moved" | "client_added" | "note_added"
  description: string
  timestamp: string
  user: string
}

export type UserRole = "admin" | "partner" | "staff"

export interface Company {
  id: string
  name: string
  logoUrl?: string
  defaultCurrency: string
}

export interface UserProfile {
  id: string
  email: string
  role: UserRole
  name?: string
  avatarUrl?: string
  phone?: string
  position?: string
  companyId?: string
  createdAt?: string
}

export interface TeamInvite {
  id: string
  email: string
  role: UserRole
  name?: string
  position?: string
  token: string
  createdAt: string
  expiresAt?: string
  status: "pending" | "accepted" | "revoked"
}

