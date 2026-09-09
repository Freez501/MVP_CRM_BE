import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { UserProfile, UserRole } from "@/types"

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: UserRole
  name: string
  avatarUrl: string
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    role?: UserRole,
    name?: string,
    companyName?: string
  ) => Promise<{ error: string | null; requiresEmailConfirmation?: boolean }>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  loginAsDemo: (role?: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER_KEY = "brilliant-demo-user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [role, setRole] = useState<UserRole>("admin")
  const [name, setName] = useState<string>("")
  const [avatarUrl, setAvatarUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchProfile = async (userId: string, email: string, defaultRole: UserRole = "staff") => {
    // 1. Быстрое чтение из локального кэша, чтобы имя никогда не мигало и не сбрасывалось
    const cachedStr = localStorage.getItem(`brilliant_profile_${userId}`)
    let cached: UserProfile | null = null
    if (cachedStr) {
      try {
        cached = JSON.parse(cachedStr)
        if (cached) {
          setProfile(cached)
          if (cached.role) setRole(cached.role)
          if (cached.name) setName(cached.name)
          if (cached.avatarUrl) setAvatarUrl(cached.avatarUrl)
        }
      } catch {
        // ignore
      }
    }

    // Если это демо-аккаунт, не делаем запросы в Supabase с невалидным UUID
    if (userId.startsWith("demo-")) {
      return
    }

    try {
      // 2. Запрос из таблицы profiles
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      // Также получаем актуальные метаданные пользователя из Supabase Auth
      const { data: authData } = await supabase.auth.getUser()
      const meta = authData?.user?.user_metadata || {}

      const resolvedName =
        (data && data.name) ||
        meta.name ||
        cached?.name ||
        (email ? email.split("@")[0] : "Пользователь")

      const resolvedRole =
        ((data && data.role) as UserRole) ||
        (meta.role as UserRole) ||
        cached?.role ||
        defaultRole

      const resolvedAvatar =
        (data && (data.avatar_url || data.avatarUrl)) ||
        meta.avatar_url ||
        cached?.avatarUrl ||
        ""

      const resolvedPosition =
        (data && data.position) ||
        meta.position ||
        cached?.position ||
        ""

      const resolvedPhone =
        (data && data.phone) ||
        meta.phone ||
        cached?.phone ||
        ""

      const resolvedCompanyId =
        (data && (data.company_id || data.companyId)) ||
        meta.company_id ||
        meta.companyId ||
        cached?.companyId ||
        undefined

      const userProfile: UserProfile = {
        id: userId,
        email,
        role: resolvedRole,
        name: resolvedName,
        avatarUrl: resolvedAvatar,
        phone: resolvedPhone,
        position: resolvedPosition,
        companyId: resolvedCompanyId,
        createdAt: data?.created_at || cached?.createdAt || authData?.user?.created_at,
      }

      setProfile(userProfile)
      setRole(userProfile.role)
      setName(userProfile.name || "")
      setAvatarUrl(userProfile.avatarUrl || "")
      localStorage.setItem(`brilliant_profile_${userId}`, JSON.stringify(userProfile))
    } catch {
      if (!cached) {
        const fallbackProfile: UserProfile = {
          id: userId,
          email,
          role: defaultRole,
          name: email ? email.split("@")[0] : "Пользователь",
          avatarUrl: "",
        }
        setProfile(fallbackProfile)
        setRole(defaultRole)
        setName(fallbackProfile.name || "")
        setAvatarUrl("")
      }
    }
  }

  useEffect(() => {
    let isMounted = true

    // Проверка демо-пользователя в localStorage
    const savedDemo = localStorage.getItem(DEMO_USER_KEY)
    if (savedDemo) {
      try {
        const demoData = JSON.parse(savedDemo)
        setUser(demoData.user)
        setProfile(demoData.profile)
        setRole(demoData.profile?.role ?? "admin")
        setName(demoData.profile?.name ?? demoData.user?.user_metadata?.name ?? "Администратор")
        setAvatarUrl(demoData.profile?.avatarUrl ?? "")
        setIsLoading(false)
        return
      } catch {
        localStorage.removeItem(DEMO_USER_KEY)
      }
    }

    // Проверка сессии Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "user@brilliant-bar.ru")
      }
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "user@brilliant-bar.ru")
      } else {
        // Очистка профиля только если не демо-режим
        if (!localStorage.getItem(DEMO_USER_KEY)) {
          setProfile(null)
          setRole("staff")
          setName("")
          setAvatarUrl("")
        }
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      localStorage.removeItem(DEMO_USER_KEY)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      setSession(data.session)
      setUser(data.user)
      if (data.user) {
        await fetchProfile(data.user.id, data.user.email ?? email)
      }
      return { error: null }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Произошла ошибка при авторизации",
      }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    role: UserRole = "staff",
    name?: string,
    companyName?: string
  ) => {
    try {
      localStorage.removeItem(DEMO_USER_KEY)
      const displayName = name || email.split("@")[0]
      const metadata: Record<string, unknown> = {
        role,
        name: displayName,
      }
      if (companyName && companyName.trim()) {
        metadata.company_name = companyName.trim()
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        return { error: error.message }
      }

      if (data.user) {
        // Try creating profile in database
        try {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email: data.user.email ?? email,
            role,
            name: displayName,
            created_at: new Date().toISOString(),
          })
        } catch {
          // Ignore if table not created yet
        }
        await fetchProfile(data.user.id, data.user.email ?? email, role)
      }

      return {
        error: null,
        requiresEmailConfirmation: !data.session,
      }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Произошла ошибка при регистрации",
      }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const currentId = user?.id || profile?.id || "demo-admin-id"
      const updatedProfile: UserProfile = {
        ...(profile || {
          id: currentId,
          email: user?.email || "user@brilliant-bar.ru",
          role: role || "staff",
        }),
        ...updates,
      }

      // Немедленно обновляем состояние в React
      setProfile(updatedProfile)
      if (updates.role) setRole(updates.role)
      if (updates.name !== undefined) setName(updates.name)
      if (updates.avatarUrl !== undefined) setAvatarUrl(updates.avatarUrl)

      // Сохраняем в кэш профилей браузера
      localStorage.setItem(`brilliant_profile_${currentId}`, JSON.stringify(updatedProfile))

      // Проверяем, демо-режим ли это
      const savedDemo = localStorage.getItem(DEMO_USER_KEY)
      const isDemo = Boolean(savedDemo || currentId.startsWith("demo-"))

      if (isDemo) {
        try {
          const demoData = savedDemo ? JSON.parse(savedDemo) : {}
          demoData.profile = updatedProfile
          if (demoData.user?.user_metadata) {
            demoData.user.user_metadata.name = updatedProfile.name
            demoData.user.user_metadata.role = updatedProfile.role
            demoData.user.user_metadata.avatar_url = updatedProfile.avatarUrl
          }
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoData))
        } catch {
          // ignore
        }
        return { error: null }
      }

      // Для реального пользователя Supabase:
      if (user && !isDemo) {
        // 1. Сохраняем в user_metadata аккаунта Supabase Auth
        try {
          await supabase.auth.updateUser({
            data: {
              name: updatedProfile.name,
              role: updatedProfile.role,
              avatar_url: updatedProfile.avatarUrl,
              phone: updatedProfile.phone,
              position: updatedProfile.position,
            },
          })
        } catch (authErr) {
          console.warn("Supabase auth updateUser notice:", authErr)
        }

        // 2. Делаем upsert в таблицу profiles
        try {
          const { error: fullUpsertError } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email ?? updatedProfile.email,
            name: updatedProfile.name,
            role: updatedProfile.role,
            avatar_url: updatedProfile.avatarUrl,
            phone: updatedProfile.phone,
            position: updatedProfile.position,
            updated_at: new Date().toISOString(),
          })

          // Если таблица в базе ещё не имеет доп. колонок (avatar_url/phone), сохраняем базовые поля
          if (fullUpsertError) {
            console.warn("Profiles full upsert notice:", fullUpsertError.message)
            await supabase.from("profiles").upsert({
              id: user.id,
              email: user.email ?? updatedProfile.email,
              name: updatedProfile.name,
              role: updatedProfile.role,
              updated_at: new Date().toISOString(),
            })
          }
        } catch (dbErr) {
          console.warn("Profiles upsert fallback notice:", dbErr)
        }
      }

      return { error: null }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Не удалось обновить профиль",
      }
    }
  }

  const signOut = async () => {
    try {
      localStorage.clear()
    } catch {
      // ignore
    }
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    setSession(null)
    setUser(null)
    setProfile(null)
    setRole("staff")
    setName("")
    setAvatarUrl("")
  }

  const loginAsDemo = (selectedRole: UserRole = "admin") => {
    const roleLabels: Record<UserRole, string> = {
      admin: "Александр (Владелец)",
      partner: "Дмитрий (Партнёр)",
      staff: "Максим (Заготовщик)",
    }

    const demoUser = {
      id: "demo-admin-id",
      email: `${selectedRole}@brilliant-bar.ru`,
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: { role: selectedRole, name: roleLabels[selectedRole] },
      created_at: new Date().toISOString(),
    } as unknown as User

    const demoProfile: UserProfile = {
      id: "demo-admin-id",
      email: `${selectedRole}@brilliant-bar.ru`,
      role: selectedRole,
      name: roleLabels[selectedRole],
      companyId: "demo-company-id",
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(
      DEMO_USER_KEY,
      JSON.stringify({
        user: demoUser,
        profile: demoProfile,
      })
    )

    setUser(demoUser)
    setProfile(demoProfile)
    setRole(selectedRole)
    setName(roleLabels[selectedRole])
    setAvatarUrl("")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        name,
        avatarUrl,
        isLoading,
        signIn,
        signUp,
        updateProfile,
        signOut,
        loginAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
