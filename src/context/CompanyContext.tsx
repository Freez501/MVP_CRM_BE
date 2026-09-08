import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext"
import { Company } from "@/types"

interface CompanyContextType {
  company: Company | null
  isLoading: boolean
  updateCompany: (updates: Partial<Company>) => Promise<{ error: string | null }>
  refreshCompany: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const DEFAULT_COMPANY: Company = {
  id: "demo-company-id",
  name: "Brilliant Event",
  defaultCurrency: "RUB",
}

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [company, setCompany] = useState<Company | null>(() => {
    try {
      const cached = localStorage.getItem("brilliant_company")
      return cached ? JSON.parse(cached) : DEFAULT_COMPANY
    } catch {
      return DEFAULT_COMPANY
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchCompany = useCallback(async () => {
    const companyId = profile?.companyId

    if (!companyId || companyId === "demo-company-id") {
      const demoComp: Company = {
        id: "demo-company-id",
        name: "Brilliant Event",
        defaultCurrency: "RUB",
      }
      setCompany((prev) => prev || demoComp)
      setIsLoading(false)
      return
    }

    // Проверяем локальный кэш
    const cacheKey = `brilliant_company_${companyId}`
    const cachedStr = localStorage.getItem(cacheKey)
    if (cachedStr) {
      try {
        setCompany(JSON.parse(cachedStr))
      } catch {
        // ignore
      }
    }

    try {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId)
        .maybeSingle()

      if (!error && data) {
        const loaded: Company = {
          id: data.id,
          name: data.name || "Brilliant Event",
          logoUrl: data.logo_url || undefined,
          defaultCurrency: data.default_currency || "RUB",
        }
        setCompany(loaded)
        localStorage.setItem(cacheKey, JSON.stringify(loaded))
        localStorage.setItem("brilliant_company", JSON.stringify(loaded))
      }
    } catch (err) {
      console.warn("Fetch company error:", err)
    } finally {
      setIsLoading(false)
    }
  }, [profile?.companyId])

  useEffect(() => {
    fetchCompany()
  }, [fetchCompany])

  const updateCompany = async (updates: Partial<Company>): Promise<{ error: string | null }> => {
    if (!company) {
      return { error: "Компания не найдена" }
    }

    const updated: Company = {
      ...company,
      ...updates,
    }

    // Немедленно обновляем стейт в React
    setCompany(updated)

    // Сохраняем в кэш
    try {
      localStorage.setItem(`brilliant_company_${company.id}`, JSON.stringify(updated))
      localStorage.setItem("brilliant_company", JSON.stringify(updated))
    } catch {
      // ignore
    }

    // Если это не демо-режим, отправляем запрос в Supabase
    if (company.id && !company.id.startsWith("demo-")) {
      try {
        const dbPayload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        }
        if (updates.name !== undefined) dbPayload.name = updates.name.trim()
        if (updates.defaultCurrency !== undefined) dbPayload.default_currency = updates.defaultCurrency
        if (updates.logoUrl !== undefined) dbPayload.logo_url = updates.logoUrl

        const { error } = await supabase
          .from("companies")
          .update(dbPayload)
          .eq("id", company.id)

        if (error) {
          console.warn("Supabase company update warning:", error.message)
          return { error: error.message }
        }
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Ошибка обновления компании",
        }
      }
    }

    return { error: null }
  }

  return (
    <CompanyContext.Provider
      value={{
        company,
        isLoading,
        updateCompany,
        refreshCompany: fetchCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompany() {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider")
  }
  return context
}
