import { Route, Routes } from "react-router-dom"
import { PageWrapper } from "./components/layout/PageWrapper"
import { ActivitiesProvider } from "./context/ActivitiesContext"
import { ClientsProvider } from "./context/ClientsContext"
import { EventsProvider } from "./context/EventsContext"
import { DatabaseProvider } from "./context/DatabaseContext"
import Dashboard from "./pages/Dashboard"
import Events from "./pages/Events"
import Clients from "./pages/Clients"
import Calculator from "./pages/Calculator"
import Database from "./pages/Database"
import Settings from "./pages/Settings"

export default function App() {
  return (
    <ActivitiesProvider>
      <DatabaseProvider>
        <ClientsProvider>
          <EventsProvider>
            <PageWrapper>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/events" element={<Events />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/calculator" element={<Calculator />} />
                <Route path="/database" element={<Database />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </PageWrapper>
          </EventsProvider>
        </ClientsProvider>
      </DatabaseProvider>
    </ActivitiesProvider>
  )
}
