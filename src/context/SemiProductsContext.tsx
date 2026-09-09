import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  useEffect,
} from "react"
import { SemiProduct, Recipe } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

interface SemiProductsContextType {
  semiProducts: Record<string, SemiProduct>
  addSemiProduct: (key: string, semiProduct: SemiProduct) => void
  updateSemiProduct: (key: string, updates: Partial<SemiProduct>) => void
  removeSemiProduct: (key: string) => void
}

const SemiProductsContext = createContext<SemiProductsContextType | undefined>(undefined)

interface DbSemiProductRow {
  key: string
  name: string
  output_volume: number
  unit: string
  recipe?: Recipe | null
}

export function SemiProductsProvider({ children }: { children: ReactNode }) {
  const [semiProducts, setSemiProducts] = useState<Record<string, SemiProduct>>({})
  const { addActivity } = useActivities()

  // Load from Supabase on mount
  useEffect(() => {
    supabase
      .from("semi_products")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data) {
          const map: Record<string, SemiProduct> = {}
          for (const row of data as DbSemiProductRow[]) {
            map[row.key] = {
              name: row.name,
              output_volume: Number(row.output_volume || 0),
              unit: row.unit || "мл",
              recipe: row.recipe || {},
            }
          }
          setSemiProducts(map)
        } else if (error) {
          console.warn("Supabase semi_products fetch error:", error.message)
        }
      })

    const channel = supabase
      .channel("realtime-semi-products")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "semi_products" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const row = payload.new as DbSemiProductRow
            setSemiProducts((prev) => ({
              ...prev,
              [row.key]: {
                name: row.name,
                output_volume: Number(row.output_volume || 0),
                unit: row.unit || "мл",
                recipe: row.recipe || {},
              },
            }))
          } else if (payload.eventType === "DELETE") {
            const row = payload.old as { key: string }
            setSemiProducts((prev) => {
              const copy = { ...prev }
              delete copy[row.key]
              return copy
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addSemiProduct = useCallback(
    async (key: string, semiProduct: SemiProduct) => {
      const cleanKey = key.trim().toLowerCase()
      setSemiProducts((prev) => ({
        ...prev,
        [cleanKey]: semiProduct,
      }))

      addActivity({
        type: "note_added",
        description: `Создан новый полуфабрикат «${semiProduct.name}»`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("semi_products").upsert({
        key: cleanKey,
        name: semiProduct.name,
        output_volume: semiProduct.output_volume,
        unit: semiProduct.unit,
        recipe: semiProduct.recipe || {},
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.warn("Supabase semi_product upsert warning:", error.message)
      }
    },
    [addActivity]
  )

  const updateSemiProduct = useCallback(
    async (key: string, updates: Partial<SemiProduct>) => {
      const current = semiProducts[key]
      if (!current) return
      const updated: SemiProduct = {
        ...current,
        ...updates,
      }
      setSemiProducts((prev) => ({
        ...prev,
        [key]: updated,
      }))

      addActivity({
        type: "note_added",
        description: `Отредактирован полуфабрикат «${updated.name}»`,
        user: CURRENT_USER,
      })

      const { error } = await supabase.from("semi_products").upsert({
        key,
        name: updated.name,
        output_volume: updated.output_volume,
        unit: updated.unit,
        recipe: updated.recipe || {},
        updated_at: new Date().toISOString(),
      })

      if (error) {
        console.warn("Supabase semi_product update warning:", error.message)
      }
    },
    [semiProducts, addActivity]
  )

  const removeSemiProduct = useCallback(
    async (key: string) => {
      const target = semiProducts[key]
      setSemiProducts((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })

      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалён полуфабрикат «${target.name}» из базы`,
          user: CURRENT_USER,
        })
      }

      const { error } = await supabase.from("semi_products").delete().eq("key", key)
      if (error) {
        console.warn("Supabase semi_product delete warning:", error.message)
      }
    },
    [semiProducts, addActivity]
  )

  return (
    <SemiProductsContext.Provider
      value={{
        semiProducts,
        addSemiProduct,
        updateSemiProduct,
        removeSemiProduct,
      }}
    >
      {children}
    </SemiProductsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSemiProducts() {
  const context = useContext(SemiProductsContext)
  if (!context) {
    throw new Error("useSemiProducts must be used within SemiProductsProvider")
  }
  return context
}
