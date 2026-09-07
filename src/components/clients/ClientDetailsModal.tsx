import { useMemo } from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Client, EventStage } from "@/types"
import { useEvents } from "@/context/EventsContext"
import {
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react"

interface ClientDetailsModalProps {
  client: Client | null
  open: boolean
  onClose: () => void
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

const STAGE_LABELS: Record<EventStage, string> = {
  new: "Новое",
  in_progress: "В работе",
  confirmed: "Подтверждено",
  done: "Проведено",
  cancelled: "Отменено",
}

const STAGE_BADGES: Record<EventStage, string> = {
  new: "bg-surface-secondary text-text-secondary border border-border",
  in_progress: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  confirmed: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  done: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  cancelled: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
}

export function ClientDetailsModal({
  client,
  open,
  onClose,
  onEdit,
  onDelete,
}: ClientDetailsModalProps) {
  const { events } = useEvents()

  const clientEvents = useMemo(() => {
    if (!client) return []
    return events.filter((e) => e.clientId === client.id)
  }, [events, client])

  const ltv = useMemo(() => {
    return clientEvents
      .filter((e) => e.stage === "done")
      .reduce((sum, e) => sum + (e.value || 0), 0)
  }, [clientEvents])

  const activeEventsCount = useMemo(() => {
    return clientEvents.filter(
      (e) => e.stage === "new" || e.stage === "in_progress" || e.stage === "confirmed"
    ).length
  }, [clientEvents])

  if (!client) return null

  const formattedCreated = new Date(client.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <Dialog open={open} onClose={onClose} title="" description="">
      <div className="space-y-6">
        {/* Шапка профиля */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-text-tertiary flex items-center justify-center text-text-inverse text-lg font-semibold font-montserrat shrink-0">
              {initials(client.name)}
            </div>
            <div>
              <h2 className="font-cormorant italic text-2xl text-text-primary leading-tight">
                {client.name}
              </h2>
              {client.company && (
                <div className="flex items-center gap-1.5 text-text-secondary mt-1 font-montserrat text-xs">
                  <Building2 className="w-3.5 h-3.5 text-text-tertiary" />
                  <span>{client.company}</span>
                </div>
              )}
              <div className="text-[11px] text-text-tertiary mt-1 font-montserrat">
                В базе с {formattedCreated}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                onEdit(client)
              }}
              className="gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Изменить</span>
            </Button>
            <button
              onClick={() => {
                onDelete(client)
              }}
              title="Удалить заказчика"
              className="p-2 rounded-md border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Метрики и LTV */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-bg-app border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-text-tertiary text-[11px] font-montserrat uppercase tracking-wider mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>LTV (Выручка)</span>
            </div>
            <div className="font-montserrat font-bold text-lg text-text-primary">
              {ltv.toLocaleString()} ₽
            </div>
          </div>

          <div className="bg-bg-app border border-border rounded-lg p-3">
            <div className="flex items-center gap-1.5 text-text-tertiary text-[11px] font-montserrat uppercase tracking-wider mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Проведено</span>
            </div>
            <div className="font-montserrat font-bold text-lg text-text-primary">
              {clientEvents.filter((e) => e.stage === "done").length} меропр.
            </div>
          </div>

          <div className="bg-bg-app border border-border rounded-lg p-3 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-text-tertiary text-[11px] font-montserrat uppercase tracking-wider mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>В работе</span>
            </div>
            <div className="font-montserrat font-bold text-lg text-text-primary">
              {activeEventsCount} меропр.
            </div>
          </div>
        </div>

        {/* Контакты и Заметки */}
        <div className="space-y-3 bg-bg-app border border-border rounded-lg p-4">
          <h4 className="font-montserrat text-xs uppercase tracking-wider text-text-tertiary font-semibold">
            Контактная информация
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {client.phone ? (
              <a
                href={`tel:${client.phone}`}
                className="flex items-center gap-2 text-text-primary hover:text-brand transition-colors"
              >
                <Phone className="w-4 h-4 text-text-tertiary" />
                <span className="font-montserrat">{client.phone}</span>
              </a>
            ) : (
              <div className="flex items-center gap-2 text-text-tertiary">
                <Phone className="w-4 h-4" />
                <span className="font-montserrat text-xs italic">Телефон не указан</span>
              </div>
            )}

            {client.email ? (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2 text-text-primary hover:text-brand transition-colors"
              >
                <Mail className="w-4 h-4 text-text-tertiary" />
                <span className="font-montserrat">{client.email}</span>
              </a>
            ) : (
              <div className="flex items-center gap-2 text-text-tertiary">
                <Mail className="w-4 h-4" />
                <span className="font-montserrat text-xs italic">Email не указан</span>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-xs text-text-tertiary font-montserrat mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Заметки:</span>
              </div>
              <p className="font-montserrat text-sm text-text-secondary whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </div>

        {/* История мероприятий */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-montserrat text-xs uppercase tracking-wider text-text-tertiary font-semibold">
              История мероприятий ({clientEvents.length})
            </h4>
          </div>

          {clientEvents.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-lg text-text-tertiary text-xs font-montserrat">
              У заказчика пока нет сохранённых мероприятий
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {clientEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 rounded-md bg-bg-app border border-border hover:border-brand/40 transition-colors"
                >
                  <div>
                    <div className="font-montserrat font-medium text-sm text-text-primary">
                      {event.title}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-tertiary font-montserrat mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{event.date}</span>
                      {event.address && <span>· {event.address}</span>}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <span
                      className={`text-[10px] font-montserrat uppercase px-2 py-0.5 rounded-full font-semibold ${STAGE_BADGES[event.stage]}`}
                    >
                      {STAGE_LABELS[event.stage]}
                    </span>
                    <span className="font-montserrat font-semibold text-xs text-text-primary">
                      {event.value.toLocaleString()} ₽
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
