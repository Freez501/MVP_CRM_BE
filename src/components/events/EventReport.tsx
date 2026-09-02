import { Event } from "@/types"
import { createPortal } from "react-dom"

const stageLabel: Record<Event["stage"], string> = {
  new: "Новый",
  in_progress: "В работе",
  confirmed: "Подтверждён",
  done: "Проведён",
  cancelled: "Отменён",
}

interface EventReportProps {
  event: Event | null
  onClose: () => void
}

export function EventReport({ event, onClose }: EventReportProps) {
  if (!event) return null

  const details = (event as any).details || {}

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-bg-card hidden print:block overflow-y-auto p-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="border-b border-border pb-6">
          <h1 className="font-cormorant italic text-4xl text-text-primary mb-2">{event.title}</h1>
          <p className="font-montserrat text-text-secondary">
            {event.date} · {event.address}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary">Заказчик</p>
            <p className="font-cormorant text-xl text-text-primary">{event.clientName}</p>
          </div>
          <div>
            <p className="font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary">Статус</p>
            <p className="font-cormorant text-xl text-text-primary">{stageLabel[event.stage]}</p>
          </div>
          <div>
            <p className="font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary">Бармены</p>
            <p className="font-cormorant text-xl text-text-primary">{event.bartendersCount}</p>
          </div>
          <div>
            <p className="font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary">Бюджет</p>
            <p className="font-cormorant text-xl text-text-primary">{event.value.toLocaleString()} ₽</p>
          </div>
        </div>

        {details && (
          <>
            <Section title="Тайминг">
              <Row label="Выезд со склада" value={details.departure} />
              <Row label="Монтаж" value={details.setup} />
              <Row label="Начало" value={details.start} />
              <Row label="Финал" value={details.end} />
            </Section>

            <Section title="Оборудование">
              <Row label="Бар" value={details.bar} />
              <Row label="Комментарий к бару" value={details.barComment} />
              <Row label="Стеллаж" value={details.shelf} />
              <Row label="Комментарий к стеллажу" value={details.shelfComment} />
              <Row label="Пирамида" value={details.pyramid || "Нет"} />
              <Row label="Комментарий к пирамиде" value={details.pyramidComment} />
            </Section>

            <Section title="Украшения">
              <p className="font-montserrat text-text-secondary">
                {details.decorations?.length ? details.decorations.join(", ") : "—"}
              </p>
              <Row label="Комментарий" value={details.decorationComment} />
            </Section>

            <Section title="Меню и коктейли">
              <Row label="Печать меню" value={details.menu === "us" ? "С нас" : "С заказчика"} />
              <div>
                <p className="font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary mb-2">Коктейли</p>
                {details.cocktails?.length ? (
                  <ul className="space-y-1">
                    {details.cocktails.map((c: any) => (
                      <li key={c.name} className="font-montserrat text-text-secondary">
                        {c.name} — {c.qty} шт
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-montserrat text-text-secondary">—</p>
                )}
              </div>
            </Section>

            <Section title="Комментарий">
              <p className="font-montserrat text-text-secondary">{event.comment || "—"}</p>
            </Section>
          </>
        )}
      </div>

      <div className="print:hidden fixed bottom-6 right-6 flex gap-3">
        <button
          onClick={onClose}
          className="px-5 py-2 border border-brand text-brand rounded-md font-montserrat text-sm uppercase tracking-wider hover:bg-brand hover:text-text-inverse transition-colors"
        >
          Закрыть
        </button>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 bg-accent-primary text-text-primary rounded-md font-montserrat text-sm uppercase tracking-wider hover:bg-accent-primary/90 transition-colors"
        >
          Сохранить PDF
        </button>
      </div>
    </div>,
    document.body
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-6">
      <h2 className="font-cormorant italic text-2xl text-text-primary mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between border-b border-border/50 py-2">
      <span className="font-montserrat font-light uppercase tracking-[0.12em] text-xs text-text-tertiary">{label}</span>
      <span className="font-montserrat text-text-secondary">{value}</span>
    </div>
  )
}
