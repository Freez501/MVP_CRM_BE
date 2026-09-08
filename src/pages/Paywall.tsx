import { Lock, Sparkles, Send, LogOut, ShieldAlert } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useCompany } from "@/context/CompanyContext"
import { Button } from "@/components/ui/button"
import logoImg from "@/assets/logo.png"

export default function Paywall() {
  const { signOut, user } = useAuth()
  const { company } = useCompany()

  const companyName = company?.name || "Ваша компания"

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 relative overflow-hidden">
      {/* Атмосферные градиентные пятна */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-lg bg-bg-card/90 border border-brand/30 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-10 relative z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Логотип */}
        <div className="mb-6">
          <img
            src={logoImg}
            alt="Brilliant Event"
            className="w-full max-w-[240px] h-auto mx-auto object-contain mb-3"
          />
        </div>

        {/* Иконка замка */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand/20 via-amber-500/15 to-transparent border border-brand/40 flex items-center justify-center shadow-lg shadow-brand/10">
            <Lock className="w-10 h-10 text-brand" />
          </div>
          <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          </div>
        </div>

        {/* Компания */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-secondary/60 border border-border text-xs font-montserrat text-text-secondary mb-4">
          <Sparkles className="w-3.5 h-3.5 text-brand" />
          <span>Пространство: <strong className="text-text-primary font-medium">{companyName}</strong></span>
        </div>

        {/* Заголовок */}
        <h1 className="font-cormorant italic text-3xl sm:text-4xl text-text-primary font-semibold mb-3">
          Пробный период завершён
        </h1>

        {/* Поясняющий текст */}
        <p className="font-montserrat text-sm text-text-secondary leading-relaxed max-w-md mx-auto mb-8">
          Время пробного периода истекло. Ваш 7-дневный доступ к Brilliant CRM завершен. Чтобы продолжить работу и сохранить все накопленные данные, пожалуйста, активируйте постоянную подписку.
        </p>

        {/* Действия */}
        <div className="space-y-3 max-w-sm mx-auto">
          <a
            href="https://t.me/brilliant_event_crm"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-5 rounded-xl bg-gradient-to-r from-brand to-amber-500 hover:from-brand-hover hover:to-amber-600 text-bg-app font-montserrat font-semibold text-sm shadow-lg shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.99]"
          >
            <Send className="w-4 h-4" />
            <span>Связаться с администратором</span>
          </a>

          <Button
            type="button"
            variant="ghost"
            onClick={() => signOut()}
            className="w-full py-3 flex items-center justify-center gap-2 text-text-tertiary hover:text-text-primary text-xs font-montserrat"
          >
            <LogOut className="w-4 h-4" />
            <span>Выйти из аккаунта ({user?.email})</span>
          </Button>
        </div>

        {/* Нижняя подпись */}
        <p className="font-montserrat text-[11px] text-text-tertiary mt-8 tracking-wider uppercase">
          Безопасное облачное хранение данных
        </p>
      </div>
    </div>
  )
}
