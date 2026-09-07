import { Route, Routes } from "react-router-dom"
import { PageWrapper } from "./components/layout/PageWrapper"
import { ErrorBoundary } from "./components/ui/ErrorBoundary"
import { ActivitiesProvider } from "./context/ActivitiesContext"
import { CategoriesProvider } from "./context/CategoriesContext"
import { IngredientsProvider } from "./context/IngredientsContext"
import { SemiProductsProvider } from "./context/SemiProductsContext"
import { CocktailsProvider } from "./context/CocktailsContext"
import { ClientsProvider } from "./context/ClientsContext"
import { EventsProvider } from "./context/EventsContext"
import Dashboard from "./pages/Dashboard"
import Events from "./pages/Events"
import Clients from "./pages/Clients"
import Calculator from "./pages/Calculator"
import Database from "./pages/Database"
import Settings from "./pages/Settings"

export default function App() {
  return (
    <ActivitiesProvider>
      <CategoriesProvider>
        <IngredientsProvider>
          <SemiProductsProvider>
            <CocktailsProvider>
              <ClientsProvider>
                <EventsProvider>
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
                </EventsProvider>
              </ClientsProvider>
            </CocktailsProvider>
          </SemiProductsProvider>
        </IngredientsProvider>
      </CategoriesProvider>
    </ActivitiesProvider>
  )
}
