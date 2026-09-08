import { useState, FormEvent } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import logoImg from "@/assets/logo.png"
import { Lock, Mail, Sparkles, ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/types"

export default function Login() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const inviteEmail = searchParams.get("email") || ""
  const inviteRole = (searchParams.get("role") as UserRole) || "staff"
  const inviteToken = searchParams.get("invite") || ""
  const isInvite = Boolean(inviteToken || inviteEmail)

  const [isSignUp, setIsSignUp] = useState(isInvite)
  const [email, setEmail] = useState(inviteEmail)
  const [password, setPassword] = useState("")
  const [name, setName] = useState(searchParams.get("name") || "")
  const [companyName, setCompanyName] = useState("")
  const role = inviteRole
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/"

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfoMessage(null)

    if (!email || !password) {
      setError("Пожалуйста, заполните все поля")
      return
    }

    if (password.length < 6) {
      setError("Пароль должен содержать не менее 6 символов")
      return
    }

    if (isSignUp && !isInvite && !companyName.trim()) {
      setError("Пожалуйста, укажите название вашей компании")
      return
    }

    setIsSubmitting(true)
    try {
      if (isSignUp) {
        const res = await signUp(
          email,
          password,
          isInvite ? role : "admin",
          name,
          isInvite ? undefined : companyName.trim()
        )
        if (res.error) {
          setError(res.error)
        } else if (res.requiresEmailConfirmation) {
          setInfoMessage("Проверьте вашу почту для подтверждения аккаунта.")
        } else {
          navigate(from, { replace: true })
        }
      } else {
        const res = await signIn(email, password)
        if (res.error) {
          setError(res.error)
        } else {
          navigate(from, { replace: true })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось выполнить вход")
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleLabels: Record<UserRole, string> = {
    admin: "Владелец",
    partner: "Партнёр",
    staff: "Заготовщик",
  }

  return (
    <div className="min-h-screen bg-bg-app flex items-center justify-center p-4 relative overflow-hidden">
      {/* Атмосферные градиентные пятна на фоне */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-bg-card/90 border border-border-sketch backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Логотип и подпись */}
        <div className="text-center mb-6">
          <img
            src={logoImg}
            alt="Brilliant Event"
            className="w-full max-w-[280px] h-auto mx-auto object-contain mb-3"
          />
          <p className="font-montserrat text-xs text-text-tertiary tracking-wider uppercase">
            Облачная экосистема & База данных
          </p>
        </div>

        {/* Баннер персонального приглашения */}
        {isInvite && (
          <div className="bg-brand/10 border border-brand/30 rounded-xl p-3 mb-5 flex items-center gap-2.5 text-xs font-montserrat text-brand">
            <Sparkles className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-semibold block">Приглашение в команду</span>
              <span className="text-text-secondary text-[11px]">
                Вам назначена роль: <strong className="text-brand">{roleLabels[role] || role}</strong>. Задайте пароль для входа.
              </span>
            </div>
          </div>
        )}

        {/* Переключатель Вход / Регистрация */}
        <div className="flex bg-bg-app border border-border rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false)
              setError(null)
              setInfoMessage(null)
            }}
            className={`flex-1 py-2 text-xs font-montserrat font-semibold rounded-lg transition-all ${
              !isSignUp
                ? "bg-brand text-bg-app shadow-md"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Вход в систему
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true)
              setError(null)
              setInfoMessage(null)
            }}
            className={`flex-1 py-2 text-xs font-montserrat font-semibold rounded-lg transition-all ${
              isSignUp
                ? "bg-brand text-bg-app shadow-md"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Регистрация
          </button>
        </div>

        {/* Сообщения об ошибках и инфо */}
        {error && (
          <div className="bg-rose-500/15 border border-rose-500/40 rounded-xl p-3 mb-4 text-xs font-montserrat text-rose-300">
            {error}
          </div>
        )}
        {infoMessage && (
          <div className="bg-blue-500/15 border border-blue-500/40 rounded-xl p-3 mb-4 text-xs font-montserrat text-blue-300">
            {infoMessage}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block font-montserrat text-xs text-text-secondary mb-1.5 font-medium">
                Ваше имя / ФИО
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Иван Петров"
                className="w-full bg-bg-app border border-border rounded-xl px-3.5 py-2.5 text-sm font-montserrat text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          )}

          {isSignUp && !isInvite && (
            <div>
              <label className="block font-montserrat text-xs text-text-secondary mb-1.5 font-medium">
                Название компании <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Например, Brilliant Bar"
                  className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-montserrat text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-montserrat text-xs text-text-secondary mb-1.5 font-medium">
              Электронная почта
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@brilliant-bar.ru"
                className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-montserrat text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block font-montserrat text-xs text-text-secondary mb-1.5 font-medium">
              Пароль
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-montserrat text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>



          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 mt-2 flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-bg-app/40 border-t-bg-app rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Зарегистрироваться" : "Войти в аккаунт"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
