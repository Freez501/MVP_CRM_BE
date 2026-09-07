import React from "react"
import { Layers, Sparkles, FileText } from "lucide-react"
import { CalcResultTab } from "./ExportToolbar"

export interface CalcTabsProps {
  activeTab: CalcResultTab
  onTabChange: (tab: CalcResultTab) => void
}

export const CalcTabs = React.memo(function CalcTabs({ activeTab, onTabChange }: CalcTabsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onTabChange("smeta")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-tenor text-xs uppercase tracking-leif transition-all border ${
          activeTab === "smeta"
            ? "bg-accent-primary border-accent-primary text-text-primary font-semibold shadow-sm"
            : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
        }`}
      >
        <Layers className="w-3.5 h-3.5" />
        Смета закупки
      </button>

      <button
        type="button"
        onClick={() => onTabChange("ttk")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-tenor text-xs uppercase tracking-leif transition-all border ${
          activeTab === "ttk"
            ? "bg-accent-primary border-accent-primary text-text-primary font-semibold shadow-sm"
            : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        ТТК коктейлей
      </button>

      <button
        type="button"
        onClick={() => onTabChange("report")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-tenor text-xs uppercase tracking-leif transition-all border ${
          activeTab === "report"
            ? "bg-accent-primary border-accent-primary text-text-primary font-semibold shadow-sm"
            : "bg-bg-app border-border-sketch text-text-secondary hover:border-brand"
        }`}
      >
        <FileText className="w-3.5 h-3.5" />
        Отчёт
      </button>
    </div>
  )
})
