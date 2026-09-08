import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Event } from "@/types"
import { exportElementToPdf } from "@/utils/pdfExport"
import { formatEventTelegramText } from "@/utils/eventTextFormat"
import { getBarLabel, getShelfLabel, getPyramidLabel } from "@/constants/eventOptions"
import logoImg from "@/assets/logo.png"
import {
  FileDown,
  Check,
  X,
  Calendar,
  MapPin,
  Clock,
  Wine,
  Package,
  Sparkles,
  MessageSquare,
  Send,
  Phone,
} from "lucide-react"

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
  const [isExporting, setIsExporting] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  if (!event) return null

  const details = event.details || {}
  const managerContact = details.managerContact

  const handleDownloadPdf = async () => {
    if (!reportRef.current || isExporting) return
    setIsExporting(true)
    try {
      const sanitizedTitle = (event.title || "Мероприятие").replace(/[/\\?%*:|"<>]/g, "_")
      const fileName = `Бриф_${sanitizedTitle}_${event.date || "дата"}.pdf`
      await exportElementToPdf(reportRef.current, fileName)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopyText = async () => {
    try {
      const text = formatEventTelegramText(event)
      await navigator.clipboard.writeText(text)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 3000)
    } catch {
      // ignore
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      {/* Верхняя панель управления */}
      <div className="w-full max-w-3xl bg-bg-card border-2 border-border-sketch rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3 bg-bg-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 text-brand flex items-center justify-center">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-cormorant italic text-2xl text-text-primary leading-tight">
                Бриф мероприятия
              </h3>
              <p className="font-montserrat text-[11px] text-text-tertiary">
                Экспорт в PDF и копирование для чатов команды
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              title="Скопировать для Telegram / WhatsApp"
              className="flex items-center gap-1.5 px-3 py-2 bg-surface-secondary/40 hover:bg-surface-secondary border border-border rounded-xl text-xs font-montserrat text-text-primary transition-colors"
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Скопировано!</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-brand" />
                  <span className="hidden sm:inline">Для Telegram/WhatsApp</span>
                  <span className="sm:hidden">Копировать</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              title="Скачать PDF файл"
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-text-inverse hover:bg-brand/90 rounded-xl text-xs font-montserrat font-medium transition-colors disabled:opacity-50 shadow-sm"
            >
              <FileDown className={`w-4 h-4 ${isExporting ? "animate-bounce" : ""}`} />
              <span>{isExporting ? "Генерация..." : "Скачать PDF"}</span>
            </button>

            <button
              onClick={onClose}
              title="Закрыть"
              className="p-2 text-text-tertiary hover:text-text-primary hover:bg-surface-secondary/40 rounded-xl transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Область предпросмотра документа (Лист А4) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-12 bg-neutral-200/60 dark:bg-neutral-900/60 flex justify-center items-start">
          <div
            ref={reportRef}
            className="w-full max-w-[780px] bg-white text-[#141414] p-6 sm:p-8 rounded-xl shadow-xl border border-neutral-300/80 font-montserrat text-xs space-y-6 my-2 shrink-0"
          >
            {/* Шапка документа */}
            <div
              data-pdf-block="true"
              className="flex items-center justify-between border-b-2 border-neutral-800 pb-4"
            >
              <img
                src={logoImg}
                alt="Brilliant Event"
                className="h-12 w-auto object-contain"
              />
              <div className="text-right">
                <span className="font-tenor uppercase tracking-wider text-[11px] text-neutral-500 block">
                  Бриф смены
                </span>
                <span className="font-semibold text-sm text-neutral-800">
                  {stageLabel[event.stage] || "Мероприятие"}
                </span>
              </div>
            </div>

            {/* Название и основные реквизиты */}
            <div data-pdf-block="true" className="space-y-2">
              <h1 className="font-cormorant italic text-3xl font-bold text-neutral-900 leading-tight">
                {event.title}
              </h1>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-neutral-600 pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-neutral-700" />
                  {event.date || "Дата не указана"}
                </span>
                {event.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-700" />
                    {event.address}
                  </span>
                )}
                {managerContact && (
                  <span className="flex items-center gap-1.5 font-medium text-neutral-800">
                    <Phone className="w-3.5 h-3.5 text-neutral-700" />
                    <span>Менеджер: {managerContact}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Сводка параметров */}
            <div
              data-pdf-block="true"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-3.5"
            >
              <div>
                <span className="text-[10px] font-tenor uppercase tracking-wider text-neutral-500 block">
                  Заказчик
                </span>
                <span className="font-semibold text-neutral-800 text-sm truncate block mt-0.5">
                  {event.clientName || "Не указан"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-tenor uppercase tracking-wider text-neutral-500 block">
                  Статус смены
                </span>
                <span className="font-semibold text-neutral-800 text-sm truncate block mt-0.5">
                  {stageLabel[event.stage]}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-tenor uppercase tracking-wider text-neutral-500 block">
                  Бармены
                </span>
                <span className="font-semibold text-neutral-800 text-sm block mt-0.5">
                  {event.bartendersCount} чел.
                </span>
              </div>
              <div>
                <span className="text-[10px] font-tenor uppercase tracking-wider text-neutral-500 block">
                  Бюджет
                </span>
                <span className="font-semibold text-neutral-900 text-sm block mt-0.5">
                  {event.value ? `${event.value.toLocaleString("ru-RU")} ₽` : "По смете"}
                </span>
              </div>
            </div>

            {/* Тайминг */}
            {(details.departure || details.setup || details.start || details.end) && (
              <div data-pdf-block="true" className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
                  <Clock className="w-4 h-4 text-neutral-700" />
                  <span>Тайминг смены</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-500 block">Выезд со склада</span>
                    <span className="font-medium text-neutral-800">{details.departure || "—"}</span>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-500 block">Монтаж</span>
                    <span className="font-medium text-neutral-800">{details.setup || "—"}</span>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-500 block">Начало работы</span>
                    <span className="font-medium text-neutral-800">{details.start || "—"}</span>
                  </div>
                  <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200">
                    <span className="text-[10px] text-neutral-500 block">Финал / Демонтаж</span>
                    <span className="font-medium text-neutral-800">{details.end || "—"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Оборудование и форма */}
            {((details.bar && details.bar !== "none") ||
              (details.shelf && details.shelf !== "none") ||
              (details.pyramid && details.pyramid !== "none") ||
              details.clothing) && (
              <div data-pdf-block="true" className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
                  <Package className="w-4 h-4 text-neutral-700" />
                  <span>Оборудование и форма</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {details.bar && details.bar !== "none" && (
                    <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                      <span className="text-neutral-500">Барная стойка:</span>
                      <span className="font-medium text-neutral-800 text-right">
                        {getBarLabel(details.bar)}
                        {details.barComment ? ` (${details.barComment})` : ""}
                      </span>
                    </div>
                  )}
                  {details.shelf && details.shelf !== "none" && (
                    <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                      <span className="text-neutral-500">Стеллаж:</span>
                      <span className="font-medium text-neutral-800 text-right">
                        {getShelfLabel(details.shelf)}
                        {details.shelfComment ? ` (${details.shelfComment})` : ""}
                      </span>
                    </div>
                  )}
                  {details.pyramid && details.pyramid !== "none" && (
                    <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                      <span className="text-neutral-500">Пирамида бокалов:</span>
                      <span className="font-medium text-neutral-800 text-right">
                        {getPyramidLabel(details.pyramid)}
                        {details.pyramidComment ? ` (${details.pyramidComment})` : ""}
                      </span>
                    </div>
                  )}
                  {details.clothing && (
                    <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                      <span className="text-neutral-500">Форма одежды:</span>
                      <span className="font-medium text-neutral-800 text-right">{details.clothing}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Украшения */}
            {(details.decorations?.length || details.decorationComment) && (
              <div data-pdf-block="true" className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
                  <Sparkles className="w-4 h-4 text-neutral-700" />
                  <span>Украшения и оформление</span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 space-y-1">
                  <p className="font-medium text-neutral-800">
                    {details.decorations?.length ? details.decorations.join(", ") : "Базовые"}
                  </p>
                  {details.decorationComment && (
                    <p className="text-neutral-600 text-[11px] italic">
                      {details.decorationComment}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Меню и коктейли */}
            {details.cocktails && details.cocktails.length > 0 && (
              <div data-pdf-block="true" className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center justify-between text-neutral-800 font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <Wine className="w-4 h-4 text-neutral-700" />
                    <span>Меню коктейлей</span>
                  </div>
                  <span className="text-xs text-neutral-500 font-normal">
                    Печать меню: {details.menu === "us" ? "С нас" : "С заказчика"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {details.cocktails.map((c: { name: string; qty: number }) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 border border-neutral-200"
                    >
                      <span className="font-medium text-neutral-800">{c.name}</span>
                      <span className="font-bold text-neutral-900 px-2 py-0.5 bg-white border border-neutral-300 rounded text-[11px]">
                        {c.qty} шт.
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Комментарий */}
            {event.comment && event.comment.trim() && (
              <div data-pdf-block="true" className="space-y-2 border-t border-neutral-200 pt-4">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold text-sm">
                  <MessageSquare className="w-4 h-4 text-neutral-700" />
                  <span>Комментарий к смене</span>
                </div>
                <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 text-neutral-700 whitespace-pre-wrap break-words [word-break:break-word] text-xs leading-relaxed">
                  {event.comment.trim()}
                </div>
              </div>
            )}

            {/* Подвал брифа */}
            <div
              data-pdf-block="true"
              className="border-t border-neutral-300 pt-3 flex justify-between items-center text-[10px] text-neutral-500 font-mono"
            >
              <span>Brilliant Event — Выездной барный кейтеринг</span>
              <span>Сформировано: {new Date().toLocaleDateString("ru-RU")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
