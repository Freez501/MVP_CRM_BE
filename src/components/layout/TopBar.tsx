import { Bell, Menu, Search } from "lucide-react"
import { useLocation } from "react-router-dom"

const titles: Record<string, string> = {
  "/": "Дашборд",
  "/events": "Мероприятия",
  "/clients": "Заказчики",
  "/calculator": "Калькулятор",
  "/database": "База",
  "/settings": "Настройки",
}

export function TopBar() {
  const location = useLocation()
  const title = titles[location.pathname] ?? "Dashboard"

  return (
    <header className="h-16 bg-bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button className="lg:hidden text-text-secondary hover:text-text-primary transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="font-cormorant italic text-[28px] text-text-primary leading-none">{title}</h2>
      </div>
      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-bg-card border-2 border-border-sketch rounded pl-11 pr-4 py-2 font-montserrat text-[15px] text-text-primary placeholder:font-cormorant placeholder:italic placeholder:text-[#a69c92] focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-text-tertiary hover:text-text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-text-tertiary flex items-center justify-center text-text-inverse text-sm font-semibold font-montserrat">
          BE
        </div>
      </div>
  </header>
  )
}
