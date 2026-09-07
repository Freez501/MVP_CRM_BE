import { lazy, Suspense } from "react"
import { Route, Routes } from "react-router-dom"
import { PageWrapper } from "./components/layout/PageWrapper"
import { ErrorBoundary } from "./components/ui/ErrorBoundary"
import { AuthProvider } from "./context/AuthContext"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { ActivitiesProvider } from "./context/ActivitiesContext"
import { CategoriesProvider } from "./context/CategoriesContext"
import { IngredientsProvider } from "./context/IngredientsContext"
import { SemiProductsProvider } from "./context/SemiProductsContext"
import { CocktailsProvider } from "./context/CocktailsContext"
import { ClientsProvider } from "./context/ClientsContext"
import { EventsProvider } from "./context/EventsContext"

const Dashboard = lazy(() => import("./pages/Dashboard"))
const Events = lazy(() => import("./pages/Events"))
const Clients = lazy(() => import("./pages/Clients"))
const Calculator = lazy(() => import("./pages/Calculator"))
const Database = lazy(() => import("./pages/Database"))
const Settings = lazy(() => import("./pages/Settings"))
const Login = lazy(() => import("./pages/Login"))

export default function App() {
  return (
    <AuthProvider>
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
                        {/* Публичный роут авторизации */}
                        <Route path="/login" element={<Login />} />

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
                                      <ErrorBoundary>
                                        <Dashboard />
                                      </ErrorBoundary>
                                    }
                                  />
                                  <Route
                                    path="/events"
                                    element={
                                      <ErrorBoundary>
                                        <Events />
                                      </ErrorBoundary>
                                    }
                                  />
                                  <Route
                                    path="/clients"
                                    element={
                                      <ErrorBoundary>
                                        <Clients />
                                      </ErrorBoundary>
                                    }
                                  />
                                  <Route
                                    path="/calculator"
                                    element={
                                      <ErrorBoundary>
                                        <Calculator />
                                      </ErrorBoundary>
                                    }
                                  />
                                  <Route
                                    path="/database"
                                    element={
                                      <ErrorBoundary>
                                        <Database />
                                      </ErrorBoundary>
                                    }
                                  />
                                  <Route
                                    path="/settings"
                                    element={
                                      <ErrorBoundary>
                                        <Settings />
                                      </ErrorBoundary>
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
    </AuthProvider>
  )
}
