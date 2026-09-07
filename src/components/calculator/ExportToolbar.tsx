import React from "react"
import { Download, Printer, Copy, Check } from "lucide-react"

export type CalcResultTab = "smeta" | "ttk" | "report"

export interface ExportToolbarProps {
  activeTab: CalcResultTab
  onCopyMessenger: () => void
  onCopyReport: () => void
  onCopyTtk: () => void
  onDownloadPdf: () => void
  onDownloadTxt: () => void
  onPrint: () => void
  copiedMessenger: boolean
  copiedReport: boolean
  copiedTtk: boolean
  isGeneratingPdf: boolean
}

export const ExportToolbar = React.memo(function ExportToolbar({
  activeTab,
  onCopyMessenger,
  onCopyReport,
  onCopyTtk,
  onDownloadPdf,
  onDownloadTxt,
  onPrint,
  copiedMessenger,
  copiedReport,
  copiedTtk,
  isGeneratingPdf,
}: ExportToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={onCopyMessenger}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-tenor font-semibold uppercase tracking-leif transition-all shadow-sm active:scale-95"
        title="Скопировать список закупки для WhatsApp / Telegram"
      >
        {copiedMessenger ? (
          <>
            <Check className="w-3.5 h-3.5 text-white" />
            <span>Скопировано!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5" />
            <span>В WhatsApp / Telegram</span>
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onDownloadPdf}
        disabled={isGeneratingPdf}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-accent-primary/70 hover:bg-accent-primary border border-accent-primary text-[11px] font-tenor uppercase tracking-leif font-semibold text-text-primary transition-all"
        title="Скачать отчёт в PDF"
      >
        <Download className="w-3.5 h-3.5" />
        {isGeneratingPdf ? "Создаю PDF..." : "PDF"}
      </button>

      <button
        type="button"
        onClick={onPrint}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-[11px] font-tenor uppercase tracking-leif text-text-primary transition-all"
        title="Распечатать смету"
      >
        <Printer className="w-3.5 h-3.5" />
        Печать
      </button>

      {activeTab === "report" && (
        <>
          <button
            type="button"
            onClick={onCopyReport}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-[11px] font-tenor uppercase tracking-leif text-text-primary transition-all"
            title="Скопировать отчёт в буфер"
          >
            {copiedReport ? (
              <Check className="w-3.5 h-3.5 text-brand" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copiedReport ? "Скопировано!" : "Копировать"}
          </button>
          <button
            type="button"
            onClick={onDownloadTxt}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-[11px] font-tenor uppercase tracking-leif text-text-primary transition-all"
            title="Скачать TXT файл"
          >
            <Download className="w-3.5 h-3.5" />
            TXT
          </button>
        </>
      )}

      {activeTab === "ttk" && (
        <button
          type="button"
          onClick={onCopyTtk}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-bg-app border border-border-sketch hover:border-brand text-[11px] font-tenor uppercase tracking-leif text-text-primary transition-all"
        >
          {copiedTtk ? (
            <Check className="w-3.5 h-3.5 text-brand" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          {copiedTtk ? "Скопировано!" : "Копировать ТТК"}
        </button>
      )}
    </div>
  )
})
