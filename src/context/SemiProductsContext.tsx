import {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb, SemiProduct, Recipe } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { saveFullDbToDisk } from "./DatabaseSyncService"
import { CURRENT_USER } from "@/constants"
import { supabase } from "@/lib/supabase"

const baseDb = db as CocktailsDb

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
  const [customSemiProducts, setCustomSemiProducts] = useLocalStorage<Record<string, SemiProduct>>(
    "brilliant-custom-semi-products",
    {}
  )
  const [deletedSemiKeys, setDeletedSemiKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-semi-products",
    []
  )
  const [cloudSemiProducts, setCloudSemiProducts] = useState<Record<string, SemiProduct>>({})

  const { addActivity } = useActivities()

  // Load from Supabase on mount
  useEffect(() => {
    supabase
      .from("semi_products")
      .select("*")
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          const map: Record<string, SemiProduct> = {}
          for (const row of data as DbSemiProductRow[]) {
            map[row.key] = {
              name: row.name,
              output_volume: Number(row.output_volume || 0),
              unit: row.unit || "мл",
              recipe: row.recipe || {},
            }
          }
          setCloudSemiProducts(map)
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
            setCloudSemiProducts((prev) => ({
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
            setCloudSemiProducts((prev) => {
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

  const semiProducts = useMemo(() => {
    const merged = { ...baseDb.semi_products, ...cloudSemiProducts, ...customSemiProducts }
    deletedSemiKeys.forEach((key) => {
      delete merged[key]
    })
    return merged
  }, [cloudSemiProducts, customSemiProducts, deletedSemiKeys])

  const addSemiProduct = useCallback(
    (key: string, semiProduct: SemiProduct) => {
      const cleanKey = key.trim().toLowerCase()
      setCustomSemiProducts((prev) => ({
        ...prev,
        [cleanKey]: semiProduct,
      }))
      setDeletedSemiKeys((prev) => prev.filter((k) => k !== cleanKey))
      saveFullDbToDisk({
        semi_products: { ...semiProducts, [cleanKey]: semiProduct },
      })
      addActivity({
        type: "note_added",
        description: `Создан новый полуфабрикат «${semiProduct.name}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("semi_products")
        .upsert({
          key: cleanKey,
          name: semiProduct.name,
          output_volume: semiProduct.output_volume,
          unit: semiProduct.unit,
          recipe: semiProduct.recipe || {},
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase semi_product upsert warning:", error.message)
        })
    },
    [semiProducts, setCustomSemiProducts, setDeletedSemiKeys, addActivity]
  )

  const updateSemiProduct = useCallback(
    (key: string, updates: Partial<SemiProduct>) => {
      const current = semiProducts[key]
      if (!current) return
      const updated: SemiProduct = {
        ...current,
        ...updates,
      }
      setCustomSemiProducts((prev) => ({
        ...prev,
        [key]: updated,
      }))
      saveFullDbToDisk({
        semi_products: { ...semiProducts, [key]: updated },
      })
      addActivity({
        type: "note_added",
        description: `Отредактирован полуфабрикат «${updated.name}»`,
        user: CURRENT_USER,
      })

      // Sync to Supabase
      supabase
        .from("semi_products")
        .upsert({
          key,
          name: updated.name,
          output_volume: updated.output_volume,
          unit: updated.unit,
          recipe: updated.recipe || {},
          updated_at: new Date().toISOString(),
        })
        .then(({ error }) => {
          if (error) console.warn("Supabase semi_product update warning:", error.message)
        })
    },
    [semiProducts, setCustomSemiProducts, addActivity]
  )

  const removeSemiProduct = useCallback(
    (key: string) => {
      const target = semiProducts[key]
      setCustomSemiProducts((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
      setDeletedSemiKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
      const updatedSemi = { ...semiProducts }
      delete updatedSemi[key]
      saveFullDbToDisk({ semi_products: updatedSemi })

      if (target) {
        addActivity({
          type: "note_added",
          description: `Удалён полуфабрикат «${target.name}» из базы`,
          user: CURRENT_USER,
        })
      }

      // Sync to Supabase
      supabase
        .from("semi_products")
        .delete()
        .eq("key", key)
        .then(({ error }) => {
          if (error) console.warn("Supabase semi_product delete warning:", error.message)
        })
    },
    [semiProducts, setCustomSemiProducts, setDeletedSemiKeys, addActivity]
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

export function useSemiProducts() {
  const context = useContext(SemiProductsContext)
  if (!context) {
    throw new Error("useSemiProducts must be used within SemiProductsProvider")
  }
  return context
}
