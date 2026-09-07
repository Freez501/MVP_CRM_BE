import { Bell, Menu, Search, Wine, GlassWater, Coffee, Flame, Sparkles, Crown } from "lucide-react"
import { useLocation, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const titles: Record<string, string> = {
  "/": "Дашборд",
  "/dashboard": "Дашборд",
  "/events": "Мероприятия",
  "/clients": "Заказчики",
  "/calculator": "Калькулятор",
  "/database": "База",
  "/team": "Команда",
  "/settings": "Настройки",
  "/profile": "Мой профиль",
}

const PRESET_ICONS: Record<string, typeof Wine> = {
  wine: Wine,
  cocktail: GlassWater,
  coffee: Coffee,
  fire: Flame,
  sparkle: Sparkles,
  crown: Crown,
}

export function TopBar() {
  const location = useLocation()
  const title = titles[location.pathname] ?? "Dashboard"
  const { user, name, avatarUrl } = useAuth()

  const displayName = name || user?.email?.split("@")[0] || "U"
  const initials = displayName.slice(0, 2).toUpperCase()

  const renderAvatar = () => {
    if (avatarUrl?.startsWith("http")) {
      return (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-8 h-8 rounded-full object-cover border border-brand/50"
        />
      )
    }

    if (avatarUrl && PRESET_ICONS[avatarUrl]) {
      const Icon = PRESET_ICONS[avatarUrl]
      return (
        <div className="w-8 h-8 rounded-full bg-brand/20 text-brand border border-brand/40 flex items-center justify-center">
          <Icon className="w-4 h-4" />
        </div>
      )
    }

    return (
      <div className="w-8 h-8 rounded-full bg-brand text-text-inverse flex items-center justify-center text-xs font-semibold font-tenor tracking-wider">
        {initials}
      </div>
    )
  }

  return (
    <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-text-secondary hover:text-text-primary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-cormorant italic text-[26px] text-text-primary leading-none font-semibold">
          {title}
        </h2>
      </div>
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Поиск по CRM..."
            className="w-full bg-bg-card border border-border-sketch rounded-md pl-11 pr-4 py-2 font-assistant text-sm text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-[#a69c92] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button className="text-text-tertiary hover:text-text-primary transition-colors relative p-2 rounded-full hover:bg-surface-secondary/20">
          <Bell className="w-4 h-4" />
        </button>
        <Link
          to="/profile"
          title={`Мой профиль (${displayName})`}
          className="hover:scale-105 transition-transform"
        >
          {renderAvatar()}
        </Link>
      </div>
    </header>
  )
}
