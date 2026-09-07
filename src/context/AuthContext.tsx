import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { UserProfile, UserRole } from "@/types"

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  role: UserRole
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    role?: UserRole
  ) => Promise<{ error: string | null; requiresEmailConfirmation?: boolean }>
  signOut: () => Promise<void>
  loginAsDemo: (role?: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEMO_USER_KEY = "brilliant-demo-user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchProfile = async (userId: string, email: string, defaultRole: UserRole = "admin") => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()

      if (data && !error) {
        setProfile(data as UserProfile)
      } else {
        setProfile({
          id: userId,
          email,
          role: defaultRole,
        })
      }
    } catch {
      setProfile({
        id: userId,
        email,
        role: defaultRole,
      })
    }
  }

  useEffect(() => {
    let isMounted = true

    // Check for demo user first if present in localStorage
    const savedDemo = localStorage.getItem(DEMO_USER_KEY)
    if (savedDemo) {
      try {
        const demoData = JSON.parse(savedDemo)
        setUser(demoData.user)
        setProfile(demoData.profile)
        setIsLoading(false)
        return
      } catch {
        localStorage.removeItem(DEMO_USER_KEY)
      }
    }

    // Check Supabase session
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
        // Only clear profile if not in demo mode
        if (!localStorage.getItem(DEMO_USER_KEY)) {
          setProfile(null)
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

  const signUp = async (email: string, password: string, role: UserRole = "staff") => {
    try {
      localStorage.removeItem(DEMO_USER_KEY)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role,
          },
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

  const signOut = async () => {
    localStorage.removeItem(DEMO_USER_KEY)
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  const loginAsDemo = (role: UserRole = "admin") => {
    const demoUser = {
      id: "demo-admin-id",
      email: "admin@brilliant-bar.ru",
      aud: "authenticated",
      role: "authenticated",
      app_metadata: {},
      user_metadata: { role },
      created_at: new Date().toISOString(),
    } as unknown as User

    const demoProfile: UserProfile = {
      id: "demo-admin-id",
      email: "admin@brilliant-bar.ru",
      role,
      name: "Администратор (Демо)",
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
  }

  const role: UserRole = profile?.role ?? "admin"

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isLoading,
        signIn,
        signUp,
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
