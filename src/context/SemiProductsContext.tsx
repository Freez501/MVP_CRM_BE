import { createContext, useContext, ReactNode, useMemo, useCallback } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import db from "@/data/cocktails_db.json"
import { CocktailsDb, SemiProduct } from "@/types/db"
import { useActivities } from "./ActivitiesContext"
import { saveFullDbToDisk } from "./DatabaseSyncService"
import { CURRENT_USER } from "@/constants"

const baseDb = db as CocktailsDb

interface SemiProductsContextType {
  semiProducts: Record<string, SemiProduct>
  addSemiProduct: (key: string, semiProduct: SemiProduct) => void
  updateSemiProduct: (key: string, updates: Partial<SemiProduct>) => void
  removeSemiProduct: (key: string) => void
}

const SemiProductsContext = createContext<SemiProductsContextType | undefined>(undefined)

export function SemiProductsProvider({ children }: { children: ReactNode }) {
  const [customSemiProducts, setCustomSemiProducts] = useLocalStorage<Record<string, SemiProduct>>(
    "brilliant-custom-semi-products",
    {}
  )
  const [deletedSemiKeys, setDeletedSemiKeys] = useLocalStorage<string[]>(
    "brilliant-deleted-semi-products",
    []
  )

  const { addActivity } = useActivities()

  const semiProducts = useMemo(() => {
    const merged = { ...baseDb.semi_products, ...customSemiProducts }
    deletedSemiKeys.forEach((key) => {
      delete merged[key]
    })
    return merged
  }, [customSemiProducts, deletedSemiKeys])

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
