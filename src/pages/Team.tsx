import { useState, useEffect, useMemo, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { UserRole, TeamInvite } from "@/types"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Users,
  Shield,
  Crown,
  UserCheck,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  Grid,
  List,
  Sparkles,
  UserPlus,
  Edit3,
  Phone,
  Briefcase,
  Copy,
  Check,
  Trash2,
  Clock,
  Send,
} from "lucide-react"

interface ProfileItem {
  id: string
  email: string
  role: UserRole
  name?: string
  phone?: string
  position?: string
  avatarUrl?: string
  created_at?: string
}

export default function Team() {
  const { user, profile: currentProfile } = useAuth()
  const [profiles, setProfiles] = useState<ProfileItem[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [query, setQuery] = useState<string>("")
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Модалка редактирования сотрудника
  const [editingMember, setEditingMember] = useState<ProfileItem | null>(null)
  const [editName, setEditName] = useState("")
  const [editRole, setEditRole] = useState<UserRole>("staff")
  const [editPosition, setEditPosition] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Модалка приглашения сотрудника
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteName, setInviteName] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("staff")
  const [invitePosition, setInvitePosition] = useState("")
  const [generatedInviteLink, setGeneratedInviteLink] = useState("")
  const [hasCopied, setHasCopied] = useState(false)
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  // Загрузка сохранённых инвайтов из Supabase
  const loadInvites = useCallback(async () => {
    try {
      let queryBuilder = supabase.from("invites").select("*")
      if (currentProfile?.companyId && !currentProfile.companyId.startsWith("demo-")) {
        queryBuilder = queryBuilder.eq("company_id", currentProfile.companyId)
      }
      const { data, error } = await queryBuilder.order("created_at", { ascending: false })
      if (!error && data) {
        setInvites(
          data.map((row) => ({
            id: row.id,
            email: row.email,
            role: (row.role as UserRole) || "staff",
            name: row.name || undefined,
            position: row.position || undefined,
            token: row.token,
            status: row.status as "pending" | "accepted" | "revoked",
            createdAt: row.created_at,
            expiresAt: row.expires_at || undefined,
          }))
        )
      } else if (error) {
        console.warn("Load invites notice:", error.message)
      }
    } catch (err) {
      console.warn("Load invites fallback:", err)
    }
  }, [currentProfile?.companyId])

  const fetchProfiles = useCallback(async () => {
    setIsLoading(true)
    try {
      let queryBuilder = supabase.from("profiles").select("*")
      if (currentProfile?.companyId && !currentProfile.companyId.startsWith("demo-")) {
        queryBuilder = queryBuilder.eq("company_id", currentProfile.companyId)
      }
      const { data, error } = await queryBuilder.order("created_at", { ascending: false })

      if (!error && data) {
        setProfiles(
          data.map((p) => ({
            id: p.id,
            email: p.email,
            role: (p.role as UserRole) || "staff",
            name: p.name || "",
            phone: p.phone || "",
            position: p.position || "",
            avatarUrl: p.avatar_url || p.avatarUrl || "",
            created_at: p.created_at,
          }))
        )
      } else {
        // Fallback демо-данные
        const demoProfiles: ProfileItem[] = [
          {
            id: currentProfile?.id || user?.id || "demo-admin-id",
            email: currentProfile?.email || user?.email || "admin@brilliant-bar.ru",
            role: "admin",
            name: currentProfile?.name || "Александр (Владелец)",
            position: "Основатель & Управляющий",
            phone: "+7 (999) 000-11-22",
            created_at: currentProfile?.createdAt || new Date().toISOString(),
          },
          {
            id: "demo-partner-id",
            email: "partner@brilliant-bar.ru",
            role: "partner",
            name: "Дмитрий (Партнёр)",
            position: "Операционный директор",
            phone: "+7 (999) 111-22-33",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          },
          {
            id: "demo-staff-id",
            email: "staff@brilliant-bar.ru",
            role: "staff",
            name: "Максим (Шеф-заготовщик)",
            position: "Шеф-заготовщик лабораторной смены",
            phone: "+7 (999) 222-33-44",
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(),
          },
        ]
        setProfiles(demoProfiles)
      }
    } catch {
      setProfiles([
        {
          id: currentProfile?.id || user?.id || "demo-admin-id",
          email: currentProfile?.email || user?.email || "admin@brilliant-bar.ru",
          role: "admin",
          name: currentProfile?.name || "Александр (Владелец)",
          position: "Основатель",
          created_at: currentProfile?.createdAt || new Date().toISOString(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [currentProfile, user])

  useEffect(() => {
    fetchProfiles()
    loadInvites()
  }, [fetchProfiles, loadInvites])

  // Открытие модалки редактирования
  const handleOpenEdit = (member: ProfileItem) => {
    setEditingMember(member)
    setEditName(member.name || "")
    setEditRole(member.role)
    setEditPosition(member.position || "")
    setEditPhone(member.phone || "")
  }

  // Сохранение отредактированного профиля
  const handleSaveEdit = async () => {
    if (!editingMember) return
    setIsSavingEdit(true)
    try {
      const updates = {
        name: editName.trim(),
        role: editRole,
        position: editPosition.trim(),
        phone: editPhone.trim(),
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", editingMember.id)

      if (error) {
        console.warn("Supabase profile edit notice:", error.message)
      }

      setProfiles((prev) =>
        prev.map((item) =>
          item.id === editingMember.id
            ? {
                ...item,
                name: editName.trim(),
                role: editRole,
                position: editPosition.trim(),
                phone: editPhone.trim(),
              }
            : item
        )
      )

      setEditingMember(null)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Создание приглашения
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    setIsSendingInvite(true)
    try {
      const token = Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      const origin = window.location.origin
      const link = `${origin}/login?invite=${token}&email=${encodeURIComponent(
        inviteEmail.trim()
      )}&role=${inviteRole}&name=${encodeURIComponent(inviteName.trim())}`

      const newInvite: TeamInvite = {
        id: `inv-${Date.now()}`,
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        position: invitePosition.trim() || undefined,
        role: inviteRole,
        token,
        createdAt: new Date().toISOString(),
        status: "pending",
      }

      // Запись в Supabase invites
      try {
        const { error: insertError } = await supabase.from("invites").insert({
          id: newInvite.id,
          email: newInvite.email,
          name: newInvite.name || null,
          position: newInvite.position || null,
          role: newInvite.role,
          token: newInvite.token,
          created_at: newInvite.createdAt,
          status: "pending",
        })
        if (insertError) {
          console.warn("Supabase invite insert notice:", insertError.message)
        }
      } catch (err) {
        console.warn("Invite insert error:", err)
      }

      setInvites((prev) => [newInvite, ...prev.filter((i) => i.email !== newInvite.email)])
      setGeneratedInviteLink(link)

      // Копирование в буфер обмена
      await navigator.clipboard.writeText(link)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 4000)
    } catch {
      // ignore
    } finally {
      setIsSendingInvite(false)
    }
  }

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setHasCopied(true)
      setTimeout(() => setHasCopied(false), 3000)
    } catch {
      // ignore
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId))
    try {
      const { error } = await supabase.from("invites").delete().eq("id", inviteId)
      if (error) {
        console.warn("Supabase invite delete notice:", error.message)
      }
    } catch (err) {
      console.warn("Invite delete error:", err)
    }
  }

  const roleStats = useMemo(() => {
    const total = profiles.length
    const admins = profiles.filter((p) => p.role === "admin").length
    const partners = profiles.filter((p) => p.role === "partner").length
    const staff = profiles.filter((p) => p.role === "staff").length
    return { total, admins, partners, staff }
  }, [profiles])

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase()
    return profiles.filter((item) => {
      const matchesQuery =
        !q ||
        (item.name ?? "").toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.position ?? "").toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q)

      const matchesRole = roleFilter === "all" || item.role === roleFilter
      return matchesQuery && matchesRole
    })
  }, [profiles, query, roleFilter])

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Не указана"
    try {
      const d = new Date(isoString)
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(d)
    } catch {
      return isoString
    }
  }

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-montserrat font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <Crown className="w-3 h-3 text-amber-400" />
            Владелец
          </span>
        )
      case "partner":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-montserrat font-medium bg-purple-500/10 border border-purple-500/30 text-purple-300">
            <Shield className="w-3 h-3 text-purple-400" />
            Партнёр
          </span>
        )
      case "staff":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-montserrat font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <UserCheck className="w-3 h-3 text-emerald-400" />
            Заготовщик
          </span>
        )
    }
  }

  const getDefaultPosition = (role: UserRole) => {
    switch (role) {
      case "admin":
        return "Владелец проекта"
      case "partner":
        return "Управляющий партнёр"
      case "staff":
        return "Заготовщик смены"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Шапка страницы */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/70 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/25 text-brand flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-cormorant italic text-3xl text-text-primary">
                Команда проекта
              </h1>
              <p className="font-montserrat text-xs text-text-tertiary">
                Управление сотрудниками, ролями и персональными приглашениями
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            onClick={() => {
              setInviteEmail("")
              setInviteName("")
              setInviteRole("staff")
              setInvitePosition("")
              setGeneratedInviteLink("")
              setHasCopied(false)
              setIsInviteOpen(true)
            }}
            className="flex items-center gap-2 text-xs py-2 px-3.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Пригласить сотрудника</span>
          </Button>

          <button
            onClick={fetchProfiles}
            disabled={isLoading}
            title="Обновить список"
            className="flex items-center gap-2 px-3 py-2 bg-surface-secondary/40 hover:bg-surface-secondary border border-border rounded-xl text-xs font-montserrat text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand" : ""}`} />
            <span className="hidden sm:inline">Обновить</span>
          </button>
        </div>
      </div>

      {/* Карточки метрик ролей */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-bg-card/70 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-xs text-text-tertiary">Всего в команде</span>
            <Users className="w-4 h-4 text-brand" />
          </div>
          <p className="font-cormorant italic text-2xl sm:text-3xl text-text-primary mt-2">
            {roleStats.total}
          </p>
        </div>

        <div className="bg-bg-card/70 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-xs text-text-tertiary">Владельцы (Admin)</span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <p className="font-cormorant italic text-2xl sm:text-3xl text-amber-300 mt-2">
            {roleStats.admins}
          </p>
        </div>

        <div className="bg-bg-card/70 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-xs text-text-tertiary">Партнёры</span>
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
          <p className="font-cormorant italic text-2xl sm:text-3xl text-purple-300 mt-2">
            {roleStats.partners}
          </p>
        </div>

        <div className="bg-bg-card/70 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-montserrat text-xs text-text-tertiary">Заготовщики</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="font-cormorant italic text-2xl sm:text-3xl text-emerald-300 mt-2">
            {roleStats.staff}
          </p>
        </div>
      </div>

      {/* Ожидающие приглашения */}
      {invites.length > 0 && (
        <div className="bg-bg-card/50 border border-border/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h3 className="font-montserrat font-semibold text-xs text-text-primary">
                Ожидают регистрации ({invites.length})
              </h3>
            </div>
            <span className="text-[11px] font-montserrat text-text-tertiary">
              Ссылки активны для самостоятельной регистрации
            </span>
          </div>

          <div className="divide-y divide-border/60">
            {invites.map((inv) => {
              const link = `${window.location.origin}/login?invite=${inv.token}&email=${encodeURIComponent(
                inv.email
              )}&role=${inv.role}&name=${encodeURIComponent(inv.name || "")}`

              return (
                <div
                  key={inv.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-montserrat"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      @
                    </div>
                    <div>
                      <div className="font-medium text-text-primary flex items-center gap-2">
                        <span>{inv.email}</span>
                        {inv.name && <span className="text-text-tertiary">({inv.name})</span>}
                        {getRoleBadge(inv.role)}
                      </div>
                      <span className="text-[11px] text-text-tertiary flex items-center gap-1 mt-0.5">
                        <Send className="w-3 h-3" /> Приглашён {formatDate(inv.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => handleCopyLink(link)}
                      title="Скопировать ссылку приглашения"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface-secondary/40 hover:bg-surface-secondary border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors text-[11px]"
                    >
                      {hasCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Скопировано!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-brand" />
                          <span>Копировать ссылку</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      title="Отозвать приглашение"
                      className="p-1.5 text-text-tertiary hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Панель фильтров и поиска */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-bg-card/40 p-3 rounded-xl border border-border/80">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по имени, должности или почте..."
            className="w-full bg-bg-app border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs font-montserrat text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex bg-bg-app border border-border rounded-lg p-0.5 text-xs font-montserrat">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                roleFilter === "all"
                  ? "bg-brand text-bg-app font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Все ({roleStats.total})
            </button>
            <button
              onClick={() => setRoleFilter("admin")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                roleFilter === "admin"
                  ? "bg-brand text-bg-app font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Владельцы
            </button>
            <button
              onClick={() => setRoleFilter("partner")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                roleFilter === "partner"
                  ? "bg-brand text-bg-app font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Партнёры
            </button>
            <button
              onClick={() => setRoleFilter("staff")}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                roleFilter === "staff"
                  ? "bg-brand text-bg-app font-semibold"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Заготовщики
            </button>
          </div>

          <div className="flex bg-bg-app border border-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              title="Таблица"
              className={`p-1 rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-surface-secondary text-brand"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              title="Сетка"
              className={`p-1 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-surface-secondary text-brand"
                  : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Список сотрудников */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin mb-3" />
          <p className="text-xs font-montserrat text-text-tertiary">Загрузка команды...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border rounded-2xl p-8">
          <Users className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-40" />
          <h3 className="font-cormorant italic text-xl text-text-primary">Никого не найдено</h3>
          <p className="font-montserrat text-xs text-text-tertiary mt-1">
            Попробуйте изменить поисковый запрос или фильтр по ролям.
          </p>
        </div>
      ) : viewMode === "table" ? (
        <div className="bg-bg-card/70 border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-surface-secondary/20">
                  <th className="py-3 px-4 text-[11px] font-tenor uppercase tracking-wider text-text-tertiary font-medium">
                    Сотрудник
                  </th>
                  <th className="py-3 px-4 text-[11px] font-tenor uppercase tracking-wider text-text-tertiary font-medium">
                    Контакты
                  </th>
                  <th className="py-3 px-4 text-[11px] font-tenor uppercase tracking-wider text-text-tertiary font-medium">
                    Роль & Доступ
                  </th>
                  <th className="py-3 px-4 text-[11px] font-tenor uppercase tracking-wider text-text-tertiary font-medium">
                    В команде с
                  </th>
                  <th className="py-3 px-4 text-[11px] font-tenor uppercase tracking-wider text-text-tertiary font-medium text-right">
                    Действие
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProfiles.map((member) => {
                  const isCurrent = member.id === (currentProfile?.id || user?.id)
                  const displayName = member.name || member.email.split("@")[0]
                  const position = member.position || getDefaultPosition(member.role)

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-surface-secondary/30 transition-colors font-montserrat text-xs"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center font-tenor font-bold text-sm shrink-0">
                            {displayName[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary flex items-center gap-2">
                              <span>{displayName}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/20 text-brand border border-brand/30 font-medium">
                                  Вы
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-text-tertiary flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 text-brand/70" />
                              {position}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-text-primary">
                            <Mail className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                            <span className="truncate max-w-[200px]">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-text-tertiary">
                              <Phone className="w-3 h-3 text-text-tertiary shrink-0" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{getRoleBadge(member.role)}</td>

                      <td className="py-3.5 px-4 text-text-tertiary">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                          <span>{formatDate(member.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          onClick={() => handleOpenEdit(member)}
                          className="px-2.5 py-1 text-xs font-montserrat flex items-center gap-1.5 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-brand" />
                          <span>Редактировать</span>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProfiles.map((member) => {
            const isCurrent = member.id === (currentProfile?.id || user?.id)
            const displayName = member.name || member.email.split("@")[0]
            const position = member.position || getDefaultPosition(member.role)

            return (
              <div
                key={member.id}
                className="bg-bg-card/80 border border-border rounded-2xl p-5 flex flex-col justify-between hover:border-border-sketch transition-all shadow-sm group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-brand/15 text-brand border border-brand/30 flex items-center justify-center font-tenor font-bold text-base">
                        {displayName[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-montserrat font-semibold text-sm text-text-primary flex items-center gap-1.5">
                          <span>{displayName}</span>
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/20 text-brand border border-brand/30 font-normal">
                              Вы
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-1 text-text-tertiary text-xs mt-0.5">
                          <Briefcase className="w-3 h-3 text-brand/70" />
                          <span>{position}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t border-border/60 pt-3 mt-3 text-xs font-montserrat">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Mail className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.phone && (
                      <div className="flex items-center gap-1.5 text-text-tertiary">
                        <Phone className="w-3.5 h-3.5 text-text-tertiary shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-3">
                    <span className="text-xs font-montserrat text-text-tertiary">Роль:</span>
                    <div>{getRoleBadge(member.role)}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-montserrat text-text-tertiary pt-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> В команде с:
                    </span>
                    <span>{formatDate(member.created_at)}</span>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => handleOpenEdit(member)}
                    className="w-full py-1.5 text-xs flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand" />
                    <span>Редактировать профиль</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Информационный блок о правах доступа */}
      <div className="bg-surface-secondary/20 border border-border/80 rounded-xl p-4 flex items-start gap-3 text-xs font-montserrat text-text-secondary">
        <Sparkles className="w-4 h-4 text-brand shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-text-primary block mb-0.5">
            Модель разграничения доступа (RBAC):
          </span>
          <ul className="space-y-1 text-text-tertiary list-disc list-inside mt-1">
            <li>
              <strong className="text-text-secondary">Владелец (Admin)</strong>: полный доступ ко всем разделам, включая управление командой, инвайты и настройку системы.
            </li>
            <li>
              <strong className="text-text-secondary">Партнёр (Partner)</strong>: доступ к аналитике, воронке мероприятий, заказчикам, калькулятору и базе рецептур.
            </li>
            <li>
              <strong className="text-text-secondary">Заготовщик (Staff)</strong>: защищённая изолированная зона — только калькулятор смет и база рецептур без доступа к финансам и клиентам.
            </li>
          </ul>
        </div>
      </div>

      {/* Модалка редактирования сотрудника */}
      <Dialog
        open={Boolean(editingMember)}
        onClose={() => setEditingMember(null)}
        title="Редактирование сотрудника"
        description={editingMember ? `Профиль: ${editingMember.email}` : ""}
        maxWidth="md"
      >
        <div className="space-y-4 pt-1">
          <div>
            <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
              Имя сотрудника / ФИО
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Иван Петров"
              className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
              Должность / Специализация
            </label>
            <input
              type="text"
              value={editPosition}
              onChange={(e) => setEditPosition(e.target.value)}
              placeholder="Шеф-заготовщик, Бар-менеджер..."
              className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
              Номер телефона
            </label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+7 (999) 000-00-00"
              className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
              Роль в системе
            </label>
            <select
              value={editRole}
              onChange={(e) => setEditRole(e.target.value as UserRole)}
              className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand cursor-pointer"
            >
              <option value="admin">Владелец (Admin) — полный доступ</option>
              <option value="partner">Партнёр (Partner) — доступ к клиентам и сметам</option>
              <option value="staff">Заготовщик (Staff) — только калькулятор и база</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setEditingMember(null)}
              disabled={isSavingEdit}
              className="px-3 py-1.5 text-xs"
            >
              Отмена
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="px-4 py-1.5 text-xs"
            >
              {isSavingEdit ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Модалка создания приглашения (Инвайт) */}
      <Dialog
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        title="Пригласить сотрудника"
        description="Сгенерируйте персональную ссылку для мгновенной регистрации с нужной ролью"
        maxWidth="md"
      >
        {!generatedInviteLink ? (
          <form onSubmit={handleCreateInvite} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                Электронная почта сотрудника *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="employee@brilliant-bar.ru"
                  className="w-full bg-bg-app border border-border rounded-xl pl-9 pr-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                Имя сотрудника (необязательно)
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Иван"
                className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                Должность / Специализация (необязательно)
              </label>
              <input
                type="text"
                value={invitePosition}
                onChange={(e) => setInvitePosition(e.target.value)}
                placeholder="Шеф-заготовщик, Бар-менеджер..."
                className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-montserrat text-text-primary focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label className="block text-xs font-montserrat text-text-secondary mb-1.5 font-medium">
                Роль в CRM *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setInviteRole("staff")}
                  className={`p-2 rounded-xl border text-xs font-montserrat text-center transition-all ${
                    inviteRole === "staff"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold"
                      : "border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Заготовщик
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole("partner")}
                  className={`p-2 rounded-xl border text-xs font-montserrat text-center transition-all ${
                    inviteRole === "partner"
                      ? "border-purple-500 bg-purple-500/10 text-purple-300 font-semibold"
                      : "border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Партнёр
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole("admin")}
                  className={`p-2 rounded-xl border text-xs font-montserrat text-center transition-all ${
                    inviteRole === "admin"
                      ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold"
                      : "border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  Владелец
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="px-3 py-1.5 text-xs"
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={isSendingInvite || !inviteEmail.trim()}
                className="px-4 py-1.5 text-xs flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isSendingInvite ? "Создание..." : "Создать и скопировать ссылку"}</span>
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2 text-xs font-montserrat">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-300">
              <Check className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-semibold block">Ссылка успешно создана и скопирована!</span>
                <span className="text-[11px] text-emerald-400/80">
                  Отправьте её сотруднику в Telegram, WhatsApp или на почту.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-text-tertiary mb-1 font-medium">
                Персональная ссылка приглашения:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedInviteLink}
                  className="w-full bg-bg-app border border-border rounded-xl px-3 py-2 text-xs font-mono text-text-secondary select-all"
                />
                <Button
                  variant="secondary"
                  onClick={() => handleCopyLink(generatedInviteLink)}
                  className="px-3 py-2 shrink-0 flex items-center gap-1.5"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Скопировано</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-brand" />
                      <span>Копировать</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setIsInviteOpen(false)
                  setGeneratedInviteLink("")
                }}
                className="px-4 py-1.5 text-xs"
              >
                Готово
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
