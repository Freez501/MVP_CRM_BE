// src/components/calculator/ReportTab.tsx
import React from "react"

interface ReportTabProps {
  reportText: string
}

export const ReportTab = React.memo(function ReportTab({ reportText }: ReportTabProps) {
  return (
    <div className="relative">
      <pre className="p-4 bg-bg-app border border-border rounded-lg font-mono text-xs sm:text-[13px] text-text-primary leading-relaxed whitespace-pre-wrap select-all overflow-x-auto">
        {reportText}
      </pre>
    </div>
  )
})
