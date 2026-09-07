import { NavLink } from "react-router-dom"
import {
  Asterisk,
  LayoutDashboard,
  CalendarDays,
  Users,
  Calculator,
  Database,
  UserCheck,
  Settings,
  LogOut,
  Wine,
  GlassWater,
  Coffee,
  Flame,
  Sparkles,
  Crown,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { UserRole } from "@/types"

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  allowedRoles: UserRole[]
}

const PRESET_ICONS: Record<string, typeof Wine> = {
  wine: Wine,
  cocktail: GlassWater,
  coffee: Coffee,
  fire: Flame,
  sparkle: Sparkles,
  crown: Crown,
}

const allNavItems: NavItem[] = [
  { to: "/", label: "Дашборд", icon: LayoutDashboard, allowedRoles: ["admin", "partner"] },
  { to: "/events", label: "Мероприятия", icon: CalendarDays, allowedRoles: ["admin", "partner"] },
  { to: "/clients", label: "Заказчики", icon: Users, allowedRoles: ["admin", "partner"] },
  { to: "/calculator", label: "Калькулятор", icon: Calculator, allowedRoles: ["admin", "partner", "staff"] },
  { to: "/database", label: "База", icon: Database, allowedRoles: ["admin", "partner", "staff"] },
  { to: "/team", label: "Команда", icon: UserCheck, allowedRoles: ["admin"] },
  { to: "/settings", label: "Настройки", icon: Settings, allowedRoles: ["admin", "partner"] },
]

export function Sidebar() {
  const { user, profile, role, name, avatarUrl, signOut } = useAuth()
  const displayEmail = user?.email || "user@brilliant-bar.ru"
  const displayName = name || profile?.name || displayEmail.split("@")[0]
  const roleName =
    role === "admin" ? "Владелец" : role === "partner" ? "Партнёр" : "Заготовщик"

  const navItems = allNavItems.filter((item) => item.allowedRoles.includes(role))

  const renderSidebarAvatar = () => {
    if (avatarUrl?.startsWith("http")) {
      return (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover border border-brand/50 shrink-0"
        />
      )
    }

    if (avatarUrl && PRESET_ICONS[avatarUrl]) {
      const Icon = PRESET_ICONS[avatarUrl]
      return (
        <div className="w-8 h-8 shrink-0 rounded-full bg-brand/20 text-brand border border-brand/40 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      )
    }

    return (
      <div className="w-8 h-8 shrink-0 rounded-full bg-brand text-bg-app flex items-center justify-center text-xs font-semibold font-tenor tracking-wider">
        {displayName.slice(0, 2).toUpperCase()}
      </div>
    )
  }

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
        <NavLink
          to="/profile"
          title="Открыть мой профиль"
          className={({ isActive }) =>
            `flex items-center gap-2.5 overflow-hidden flex-1 p-1.5 -ml-1.5 rounded-xl transition-colors group ${
              isActive ? "bg-surface-secondary/60" : "hover:bg-surface-secondary/40"
            }`
          }
        >
          {renderSidebarAvatar()}
          <div className="truncate">
            <span
              className="block font-montserrat text-xs text-text-primary font-medium truncate group-hover:text-brand transition-colors"
              title={displayName}
            >
              {displayName}
            </span>
            <span className="block font-montserrat text-[10px] text-text-tertiary">{roleName}</span>
          </div>
        </NavLink>
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
