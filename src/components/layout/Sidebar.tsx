import { NavLink } from "react-router-dom"
import {
  Asterisk,
  LayoutDashboard,
  CalendarDays,
  Users,
  Calculator,
  Database,
  Settings,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"

const navItems = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard },
  { to: "/events", label: "Мероприятия", icon: CalendarDays },
  { to: "/clients", label: "Заказчики", icon: Users },
  { to: "/calculator", label: "Калькулятор", icon: Calculator },
  { to: "/database", label: "База", icon: Database },
  { to: "/settings", label: "Настройки", icon: Settings },
]

export function Sidebar() {
  const { user, profile, role, signOut } = useAuth()
  const displayEmail = user?.email || "user@brilliant-bar.ru"
  const roleName =
    role === "admin" ? "Администратор" : role === "partner" ? "Партнёр" : "Заготовщик"

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-bg-sidebar border-r border-border hidden lg:flex flex-col">
      <div className="px-6 py-6 flex items-center justify-between border-b border-border/70">
        <div className="flex items-center gap-2">
          <Asterisk className="w-5 h-5 text-brand" />
          <span className="font-cormorant italic text-2xl font-bold tracking-leif text-brand leading-none">
            CRM
          </span>
        </div>
        <span className="text-[10px] font-tenor uppercase tracking-leif-wide text-text-tertiary">
          PRO
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-md font-tenor uppercase tracking-leif text-[11px] transition-all duration-150 ${
                isActive
                  ? "bg-surface-secondary/50 text-text-primary font-semibold border-l-[3px] border-brand shadow-sm"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-secondary/30"
              }`
            }
          >
            <Icon className="w-4 h-4 text-brand/80" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3.5 border-t border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 shrink-0 rounded-full bg-brand text-bg-app flex items-center justify-center text-xs font-semibold font-tenor tracking-wider">
            {role.slice(0, 2).toUpperCase()}
          </div>
          <div className="truncate">
            <span
              className="block font-montserrat text-xs text-text-primary font-medium truncate"
              title={displayEmail}
            >
              {profile?.name || displayEmail.split("@")[0]}
            </span>
            <span className="block font-montserrat text-[10px] text-text-tertiary">{roleName}</span>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          title="Выйти из системы"
          className="p-1.5 rounded-lg text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
