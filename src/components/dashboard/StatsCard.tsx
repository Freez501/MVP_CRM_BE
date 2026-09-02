import { Card } from "@/components/ui/card"

interface StatsCardProps {
  label: string
  value: string
}

export function StatsCard({ label, value }: StatsCardProps) {
  return (
    <Card className="card-hover">
      <p className="font-cormorant italic text-[22px] text-text-primary mb-2">{label}</p>
      <p className="font-montserrat font-semibold text-3xl text-text-primary">{value}</p>
    </Card>
  )
}
