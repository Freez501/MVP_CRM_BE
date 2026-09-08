import { useState, useEffect, FormEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import { useCompany } from "@/context/CompanyContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { UserRole } from "@/types"
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Lock,
  Shield,
  Crown,
  UserCheck,
  Calendar,
  Sparkles,
  Check,
  KeyRound,
  Wine,
  Flame,
  Coffee,
  GlassWater,
  Save,
  LogOut,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
} from "lucide-react"

// Набор фирменных барных иконок для быстрого выбора аватара
const PRESET_AVATARS = [
  { id: "wine", label: "Бокал вина", icon: Wine, bg: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
  { id: "cocktail", label: "Коктейль", icon: GlassWater, bg: "bg-brand/20 text-brand border-brand/40" },
  { id: "coffee", label: "Кофе/Кордиал", icon: Coffee, bg: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { id: "fire", label: "Твист/Огонь", icon: Flame, bg: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
  { id: "sparkle", label: "Премиум", icon: Sparkles, bg: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { id: "crown", label: "Владелец", icon: Crown, bg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
]

export default function Profile() {
  const { user, profile, role, name, avatarUrl, updateProfile, signOut } = useAuth()
  const { company } = useCompany()

  // Форма личных данных
  const [displayName, setDisplayName] = useState(name || profile?.name || "")
  const [position, setPosition] = useState(profile?.position || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [selectedAvatar, setSelectedAvatar] = useState(avatarUrl || "")
  const [customAvatarUrl, setCustomAvatarUrl] = useState(
    avatarUrl?.startsWith("http") ? avatarUrl : ""
  )
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null)

  // Синхронизация при загрузке или смене профиля
  useEffect(() => {
    if (name) setDisplayName(name)
  }, [name])

  useEffect(() => {
    if (profile?.name && !name) setDisplayName(profile.name)
    if (profile?.position !== undefined) setPosition(profile.position || "")
    if (profile?.phone !== undefined) setPhone(profile.phone || "")
  }, [profile, name])

  useEffect(() => {
    if (avatarUrl) {
      if (avatarUrl.startsWith("http")) {
        setCustomAvatarUrl(avatarUrl)
        setSelectedAvatar("")
      } else {
        setSelectedAvatar(avatarUrl)
        setCustomAvatarUrl("")
      }
    }
  }, [avatarUrl])

  // Форма смены пароля
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)

  const roleName =
    role === "admin" ? "Владелец" : role === "partner" ? "Партнёр" : "Заготовщик"

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileSuccessMsg(null)
    setProfileErrorMsg(null)

    const trimmedName = displayName.trim()
    const trimmedPosition = position.trim()
    const trimmedPhone = phone.trim()
    const finalAvatar = customAvatarUrl.trim() || selectedAvatar

    try {
      const res = await updateProfile({
        name: trimmedName,
        position: trimmedPosition,
        phone: trimmedPhone,
        avatarUrl: finalAvatar,
      })

      if (res.error) {
        setProfileErrorMsg(res.error)
      } else {
        setDisplayName(trimmedName)
        setProfileSuccessMsg("Профиль успешно сохранён!")
        setTimeout(() => setProfileSuccessMsg(null), 3500)
      }
    } catch (err) {
      setProfileErrorMsg(err instanceof Error ? err.message : "Ошибка сохранения")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleUpdatePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordSuccessMsg(null)
    setPasswordErrorMsg(null)

    if (newPassword.length < 6) {
      setPasswordErrorMsg("Пароль должен быть не менее 6 символов")
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("Пароли не совпадают")
      return
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        setPasswordErrorMsg(error.message)
      } else {
        setPasswordSuccessMsg("Пароль успешно обновлён!")
        setNewPassword("")
        setConfirmPassword("")
        setTimeout(() => setPasswordSuccessMsg(null), 3500)
      }
    } catch (err) {
      setPasswordErrorMsg(err instanceof Error ? err.message : "Не удалось обновить пароль")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Не указана"
    try {
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(isoString))
    } catch {
      return isoString
    }
  }

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-montserrat font-medium bg-amber-500/15 border border-amber-500/30 text-amber-300">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Владелец (Admin)
          </span>
        )
      case "partner":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-montserrat font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300">
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            Партнёр (Partner)
          </span>
        )
      case "staff":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-montserrat font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            Заготовщик (Staff)
          </span>
        )
    }
  }

  // Рендер текущего аватара в шапке
  const renderAvatarPreview = () => {
    const activeAvatar = customAvatarUrl.trim() || selectedAvatar
    if (activeAvatar.startsWith("http")) {
      return (
        <img
          src={activeAvatar}
          alt={displayName}
          className="w-20 h-20 rounded-2xl object-cover border-2 border-brand/40 shadow-md"
        />
      )
    }

    const preset = PRESET_AVATARS.find((p) => p.id === activeAvatar)
    if (preset) {
      const Icon = preset.icon
      return (
        <div
          className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center shadow-md ${preset.bg}`}
        >
          <Icon className="w-10 h-10" />
        </div>
      )
    }

    return (
      <div className="w-20 h-20 rounded-2xl bg-brand/15 text-brand border-2 border-brand/40 flex items-center justify-center text-2xl font-tenor font-bold shadow-md">
        {(displayName || user?.email || "U")[0].toUpperCase()}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Карточка заголовка профиля */}
      <div className="bg-bg-card/90 border border-border-sketch rounded-2xl p-6 relative overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-4">
            {renderAvatarPreview()}
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-cormorant italic text-3xl sm:text-4xl text-text-primary">
                  {displayName || "Пользователь CRM"}
                </h1>
              </div>
              <p className="font-montserrat text-xs text-text-tertiary flex items-center gap-2 mt-1">
                <span>{user?.email}</span>
                {profile?.position && (
                  <>
                    <span>•</span>
                    <span className="text-text-secondary">{profile.position}</span>
                  </>
                )}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                {getRoleBadge(role)}
                {company?.name && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-montserrat font-medium bg-surface-secondary/40 border border-border text-text-secondary">
                    <Building2 className="w-3 h-3 text-brand" />
                    {company.name}
                  </span>
                )}
                <span className="text-[11px] font-montserrat text-text-tertiary flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                  В системе с {formatDate(profile?.createdAt || user?.created_at)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={() => signOut()}
            className="flex items-center gap-2 text-xs py-2 px-3 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </Button>
        </div>
      </div>

      {/* Основная сетка: Личные данные + Аватары */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка: форма данных */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-card/80 border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border/70 pb-4 mb-5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-cormorant italic text-2xl text-text-primary">Личные данные</h2>
                <p className="font-montserrat text-xs text-text-tertiary">
                  Отображаются в сметах, чатах и в списке команды
                </p>
              </div>
            </div>

            {profileSuccessMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-xs font-montserrat text-emerald-300">
                <Check className="w-4 h-4 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-xs font-montserrat text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                  Имя и Фамилия (ФИО) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Александр Смирнов"
                    className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                  Должность / Специализация
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Шеф-заготовщик, Бар-менеджер..."
                    className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                    Номер телефона
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+7 (999) 000-00-00"
                      className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                    Email аккаунта
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full bg-surface-secondary/30 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-tertiary cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* Выбор барного аватара */}
              <div className="pt-2">
                <label className="block text-xs font-montserrat text-text-secondary mb-2 font-medium">
                  Выберите стиль аватара:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {PRESET_AVATARS.map((item) => {
                    const Icon = item.icon
                    const isSelected =
                      selectedAvatar === item.id && !customAvatarUrl.trim()
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(item.id)
                          setCustomAvatarUrl("")
                        }}
                        title={item.label}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          item.bg
                        } ${
                          isSelected
                            ? "ring-2 ring-brand scale-105 shadow-md"
                            : "opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-[10px] font-montserrat truncate max-w-full">
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-3">
                  <label className="block text-[11px] font-montserrat text-text-tertiary mb-1">
                    Или ссылка на фото / аватар (URL):
                  </label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => {
                      setCustomAvatarUrl(e.target.value)
                      if (e.target.value) setSelectedAvatar("")
                    }}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2 text-xs flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingProfile ? "Сохранение..." : "Сохранить профиль"}</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Блок безопасности: смена пароля */}
          <div className="bg-bg-card/80 border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 border-b border-border/70 pb-4 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-cormorant italic text-2xl text-text-primary">Безопасность</h2>
                <p className="font-montserrat text-xs text-text-tertiary">
                  Обновление пароля для входа в аккаунт
                </p>
              </div>
            </div>

            {passwordSuccessMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-xs font-montserrat text-emerald-300">
                <Check className="w-4 h-4 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}
            {passwordErrorMsg && (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-xs font-montserrat text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                    Новый пароль
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Минимум 6 символов"
                      className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-10 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                    Повторите новый пароль
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Повторите пароль"
                      className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword}
                  className="px-4 py-2 text-xs flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-brand" />
                  <span>{isUpdatingPassword ? "Обновление..." : "Обновить пароль"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Правая колонка: Права и роль в CRM */}
        <div className="space-y-6">
          <div className="bg-bg-card/80 border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
              <Shield className="w-4 h-4 text-brand" />
              <h3 className="font-cormorant italic text-xl text-text-primary">
                Ваша роль: {roleName}
              </h3>
            </div>

            <div className="text-xs font-montserrat text-text-secondary space-y-3">
              <p>
                Ваша текущая учётная запись имеет статус{" "}
                <strong className="text-brand font-semibold">{roleName}</strong>.
              </p>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-tenor uppercase tracking-wider text-text-tertiary block">
                  Доступные разделы:
                </span>
                <ul className="space-y-1.5 text-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Калькулятор смет и расчёты</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>База рецептур, п/ф и ингредиентов</span>
                  </li>
                  <li className="flex items-center gap-2">
                    {role === "staff" ? (
                      <span className="w-3.5 h-3.5 text-text-tertiary flex items-center justify-center font-bold">
                        ✕
                      </span>
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className={role === "staff" ? "text-text-tertiary line-through" : ""}>
                      Воронка мероприятий и смета
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {role === "staff" ? (
                      <span className="w-3.5 h-3.5 text-text-tertiary flex items-center justify-center font-bold">
                        ✕
                      </span>
                    ) : (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                    <span className={role === "staff" ? "text-text-tertiary line-through" : ""}>
                      База заказчиков и контакты
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    {role === "admin" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 text-text-tertiary flex items-center justify-center font-bold">
                        ✕
                      </span>
                    )}
                    <span className={role !== "admin" ? "text-text-tertiary line-through" : ""}>
                      Управление командой и инвайты
                    </span>
                  </li>
                </ul>
              </div>

              {role !== "admin" && (
                <div className="bg-surface-secondary/20 p-3 rounded-xl border border-border text-[11px] text-text-tertiary">
                  Для расширения прав доступа обратитесь к Владельцу CRM.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
