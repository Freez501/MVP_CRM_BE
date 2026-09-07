import React from "react"
import { Card } from "@/components/ui/card"

interface StatsCardProps {
  label: string
  value: string
  subtext?: string
  icon?: React.ReactNode
}

export function StatsCard({ label, value, subtext, icon }: StatsCardProps) {
  return (
    <Card className="card-hover relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-cormorant italic text-lg text-text-secondary mb-1">{label}</p>
          <p className="font-montserrat font-bold text-2xl sm:text-3xl text-text-primary">
            {value}
          </p>
          {subtext && (
            <p className="font-montserrat text-xs text-text-tertiary mt-1.5">{subtext}</p>
          )}
        </div>
        {icon && (
          <div className="p-2.5 rounded-xl bg-surface-secondary/40 text-brand shrink-0 shadow-sm">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
