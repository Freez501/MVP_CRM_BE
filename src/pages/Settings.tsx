import { useState, useEffect, FormEvent } from "react"
import { useAuth } from "@/context/AuthContext"
import { useCompany } from "@/context/CompanyContext"
import { Button } from "@/components/ui/button"
import { CloudMigration } from "@/components/CloudMigration"
import {
  Building2,
  Coins,
  Save,
  Check,
  AlertCircle,
  FolderKanban,
  ShieldAlert,
  Sparkles,
  Layers,
} from "lucide-react"

type SettingsTab = "company" | "directories"

const CURRENCIES = [
  { code: "RUB", symbol: "₽", label: "Российский рубль (RUB, ₽)" },
  { code: "USD", symbol: "$", label: "Доллар США (USD, $)" },
  { code: "EUR", symbol: "€", label: "Евро (EUR, €)" },
  { code: "KZT", symbol: "₸", label: "Казахстанский тенге (KZT, ₸)" },
  { code: "BYN", symbol: "Br", label: "Белорусский рубль (BYN, Br)" },
  { code: "AMD", symbol: "֏", label: "Армянский драм (AMD, ֏)" },
  { code: "GEL", symbol: "₾", label: "Грузинский лари (GEL, ₾)" },
]

export default function Settings() {
  const { role } = useAuth()
  const { company, updateCompany, isLoading: isCompanyLoading } = useCompany()

  const [activeTab, setActiveTab] = useState<SettingsTab>("company")

  // Поля формы компании
  const [companyName, setCompanyName] = useState(company?.name || "")
  const [defaultCurrency, setDefaultCurrency] = useState(company?.defaultCurrency || "RUB")
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const isAdmin = role === "admin"

  useEffect(() => {
    if (company) {
      setCompanyName(company.name || "")
      setDefaultCurrency(company.defaultCurrency || "RUB")
    }
  }, [company])

  const handleSaveCompany = async (e: FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    setIsSaving(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const trimmedName = companyName.trim()
    if (!trimmedName) {
      setErrorMsg("Укажите название компании")
      setIsSaving(false)
      return
    }

    try {
      const res = await updateCompany({
        name: trimmedName,
        defaultCurrency,
      })

      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setSuccessMsg("Настройки компании успешно сохранены!")
        setTimeout(() => setSuccessMsg(null), 3500)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Не удалось сохранить настройки")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Шапка страницы */}
      <div className="border-b border-border/70 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 text-brand flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-cormorant italic text-3xl sm:text-4xl text-text-primary">
              Настройки системы
            </h1>
            <p className="font-montserrat text-xs text-text-tertiary">
              Параметры рабочего пространства компании и конфигурация справочников
            </p>
          </div>
        </div>

        {/* Навигационные табы */}
        <div className="flex items-center gap-2 mt-6">
          <button
            type="button"
            onClick={() => setActiveTab("company")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-montserrat text-xs font-medium transition-all ${
              activeTab === "company"
                ? "bg-brand text-bg-app shadow-md"
                : "bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Компания</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("directories")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-montserrat text-xs font-medium transition-all ${
              activeTab === "directories"
                ? "bg-brand text-bg-app shadow-md"
                : "bg-surface-secondary/40 text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Справочники</span>
          </button>
        </div>
      </div>

      {/* Таб 1: Настройки компании */}
      {activeTab === "company" && (
        <div className="space-y-6">
          {!isAdmin && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex items-start gap-3 text-xs font-montserrat text-amber-200">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Режим только для чтения</span>
                <span>
                  Редактирование реквизитов компании и базовой валюты доступно только пользователю с
                  ролью Владелец (Admin).
                </span>
              </div>
            </div>
          )}

          <div className="bg-bg-card/85 border border-border-sketch rounded-2xl p-6 sm:p-7 shadow-lg backdrop-blur-sm space-y-6">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div>
                <h2 className="font-cormorant italic text-2xl text-text-primary">
                  Профиль компании
                </h2>
                <p className="font-montserrat text-xs text-text-tertiary">
                  Эти данные используются в сметах, расчётах и в шапке экспортируемых брифов
                </p>
              </div>

              <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center font-tenor font-bold text-sm">
                {(companyName || "B")[0].toUpperCase()}
              </div>
            </div>

            {successMsg && (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-montserrat text-emerald-300">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-montserrat text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveCompany} className="space-y-5">
              <div>
                <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                  Название компании / Проекта *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    disabled={!isAdmin || isCompanyLoading}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Brilliant Event"
                    className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                  Основная валюта смет и калькулятора *
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    disabled={!isAdmin || isCompanyLoading}
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className="w-full bg-bg-app border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] font-montserrat text-text-tertiary mt-1.5">
                  Валюта по умолчанию для всех новых смет, расчётов себестоимости и воронки
                  мероприятий
                </p>
              </div>

              {isAdmin && (
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isSaving || isCompanyLoading}
                    className="px-5 py-2 text-xs flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? "Сохранение..." : "Сохранить изменения"}</span>
                  </Button>
                </div>
              )}
            </form>
          </div>

          {isAdmin && <CloudMigration />}
        </div>
      )}

      {/* Таб 2: Справочники (Заглушка) */}
      {activeTab === "directories" && (
        <div className="bg-bg-card/70 border border-border-sketch rounded-2xl p-10 sm:p-14 text-center shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-montserrat font-medium bg-surface-secondary/50 border border-border text-text-tertiary mb-3">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>В разработке</span>
          </div>

          <h3 className="font-cormorant italic text-2xl sm:text-3xl text-text-primary">
            Справочники системы
          </h3>

          <p className="font-montserrat text-xs text-text-secondary max-w-md mx-auto mt-2 leading-relaxed">
            Раздел в разработке. Здесь будет настройка статусов и категорий.
          </p>
        </div>
      )}
    </div>
  )
}
