import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"
import { TopBar } from "./TopBar"

interface PageWrapperProps {
  children: ReactNode
}

export function PageWrapper({ children }: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-bg-app">
      <Sidebar />
      <div className="lg:pl-60">
        <TopBar />
        <main className="px-10 py-8">{children}</main>
      </div>
    </div>
  )
}
