import { ReactNode, lazy, Suspense } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useCompany } from "@/context/CompanyContext"
import { UserRole } from "@/types"

const Paywall = lazy(() => import("@/pages/Paywall"))

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
  checkPaywall?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  checkPaywall = true,
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth()
  const { isTrialExpired, isLoading: isCompanyLoading } = useCompany()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand/20 border-t-brand rounded-full animate-spin mb-4" />
        <p className="text-text-secondary font-montserrat text-sm tracking-wide">
          Загрузка профиля...
        </p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Если компания загрузилась и триал истёк — показываем экран Paywall
  if (checkPaywall && !isCompanyLoading && isTrialExpired) {
    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-bg-app flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin" />
          </div>
        }
      >
        <Paywall />
      </Suspense>
    )
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallbackPath = role === "staff" ? "/calculator" : "/"
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
