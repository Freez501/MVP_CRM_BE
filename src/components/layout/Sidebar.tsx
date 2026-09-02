import { NavLink } from "react-router-dom"
import {
  Asterisk,
  LayoutDashboard,
  CalendarDays,
  Users,
  Calculator,
  Database,
  Settings,
} from "lucide-react"

const navItems = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard },
  { to: "/events", label: "Мероприятия", icon: CalendarDays },
  { to: "/clients", label: "Заказчики", icon: Users },
  { to: "/calculator", label: "Калькулятор", icon: Calculator },
  { to: "/database", label: "База", icon: Database },
  { to: "/settings", label: "Настройки", icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-bg-sidebar border-r border-border hidden lg:flex flex-col">
      <div className="px-6 py-6 flex items-center gap-2">
        <Asterisk className="w-6 h-6 text-brand" />
        <span className="font-script text-[28px] text-brand leading-none">crm</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md font-montserrat font-light uppercase tracking-[0.15em] text-xs transition-colors ${
                isActive
                  ? "bg-surface-secondary/40 text-text-primary border-l-[3px] border-brand"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/30"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-6 border-t border-border flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-text-tertiary flex items-center justify-center text-text-inverse text-sm font-semibold font-montserrat">
          BE
        </div>
        <span className="font-montserrat text-sm text-text-secondary">Brilliant Event</span>
      </div>
    </aside>
  )
}
