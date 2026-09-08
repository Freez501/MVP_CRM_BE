import { lazy, Suspense, useEffect, useRef } from "react"
import { Route, Routes } from "react-router-dom"
import { PageWrapper } from "./components/layout/PageWrapper"
import { ErrorBoundary } from "./components/ui/ErrorBoundary"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { ActivitiesProvider } from "./context/ActivitiesContext"
import { CategoriesProvider } from "./context/CategoriesContext"
import { IngredientsProvider } from "./context/IngredientsContext"
import { SemiProductsProvider } from "./context/SemiProductsContext"
import { CocktailsProvider } from "./context/CocktailsContext"
import { ClientsProvider } from "./context/ClientsContext"
import { EventsProvider } from "./context/EventsContext"
import { CompanyProvider } from "./context/CompanyContext"
import { clearAllLocalCaches } from "./lib/cache"

const Dashboard = lazy(() => import("./pages/Dashboard"))
const Events = lazy(() => import("./pages/Events"))
const Clients = lazy(() => import("./pages/Clients"))
const Calculator = lazy(() => import("./pages/Calculator"))
const Database = lazy(() => import("./pages/Database"))
const Settings = lazy(() => import("./pages/Settings"))
const Team = lazy(() => import("./pages/Team"))
const Profile = lazy(() => import("./pages/Profile"))
const Login = lazy(() => import("./pages/Login"))
const Paywall = lazy(() => import("./pages/Paywall"))

function UserCacheWatcher() {
  const { user } = useAuth()
  const prevUserIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== user?.id) {
      clearAllLocalCaches()
    }
    prevUserIdRef.current = user?.id
  }, [user?.id])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <UserCacheWatcher />
      <CompanyProvider>
        <ActivitiesProvider>
          <CategoriesProvider>
            <IngredientsProvider>
              <SemiProductsProvider>
                <CocktailsProvider>
                  <ClientsProvider>
                    <EventsProvider>
                    <Suspense
                      fallback={
                        <div className="min-h-screen bg-bg-app flex items-center justify-center">
                          <div className="w-8 h-8 border-2 border-brand/20 border-t-brand rounded-full animate-spin mr-3" />
                          <p className="text-text-tertiary font-montserrat text-sm">Загрузка...</p>
                        </div>
                      }
                    >
                      <Routes>
                        {/* Публичные роуты */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/paywall" element={<Paywall />} />

                        {/* Защищённые роуты CRM */}
                        <Route
                          path="/*"
                          element={
                            <ProtectedRoute>
                              <PageWrapper>
                                <Routes>
                                  <Route
                                    path="/"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner"]}>
                                        <ErrorBoundary>
                                          <Dashboard />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/dashboard"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner"]}>
                                        <ErrorBoundary>
                                          <Dashboard />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/events"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner"]}>
                                        <ErrorBoundary>
                                          <Events />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/clients"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner"]}>
                                        <ErrorBoundary>
                                          <Clients />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/calculator"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner", "staff"]}>
                                        <ErrorBoundary>
                                          <Calculator />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/database"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner", "staff"]}>
                                        <ErrorBoundary>
                                          <Database />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/team"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin"]}>
                                        <ErrorBoundary>
                                          <Team />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/settings"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner"]}>
                                        <ErrorBoundary>
                                          <Settings />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/profile"
                                    element={
                                      <ProtectedRoute allowedRoles={["admin", "partner", "staff"]}>
                                        <ErrorBoundary>
                                          <Profile />
                                        </ErrorBoundary>
                                      </ProtectedRoute>
                                    }
                                  />
                                </Routes>
                              </PageWrapper>
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Suspense>
                  </EventsProvider>
                </ClientsProvider>
              </CocktailsProvider>
              </SemiProductsProvider>
            </IngredientsProvider>
          </CategoriesProvider>
        </ActivitiesProvider>
      </CompanyProvider>
    </AuthProvider>
  )
}
