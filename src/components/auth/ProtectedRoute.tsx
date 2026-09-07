import { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { UserRole } from "@/types"

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth()
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

  if (allowedRoles && !allowedRoles.includes(role)) {
    const fallbackPath = role === "staff" ? "/calculator" : "/"
    return <Navigate to={fallbackPath} replace />
  }

  return <>{children}</>
}
