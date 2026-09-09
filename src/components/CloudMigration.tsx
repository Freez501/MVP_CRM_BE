import { useState } from "react"
import { CloudUpload, CheckCircle2, AlertCircle, Loader2, Sparkles, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import db from "@/data/cocktails_db.json"
import { CocktailsDb, Cocktail, SemiProduct } from "@/types/db"

const baseDb = db as CocktailsDb

export function CloudMigration() {
  const { profile } = useAuth()
  const [isMigrating, setIsMigrating] = useState(false)
  const [progressText, setProgressText] = useState<string | null>(null)
  const [successInfo, setSuccessInfo] = useState<{
    categories: number
    ingredients: number
    semi: number
    cocktails: number
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleMigrate = async () => {
    const companyId = profile?.companyId
    if (!companyId) {
      setErrorMsg("Ошибка: Не определён идентификатор компании текущего профиля.")
      return
    }

    setIsMigrating(true)
    setErrorMsg(null)
    setSuccessInfo(null)
    setProgressText("Сбор данных из локальной базы и хранилища браузера...")

    try {
      // 1. Чтение кастомных данных из localStorage
      const storedCocktails: Record<string, Cocktail> = JSON.parse(
        localStorage.getItem("brilliant-custom-cocktails") || "{}"
      )
      const storedSemi: Record<string, SemiProduct> = JSON.parse(
        localStorage.getItem("brilliant-custom-semi-products") || "{}"
      )
      const storedPrices: Record<string, number> = JSON.parse(
        localStorage.getItem("brilliant-custom-prices") || "{}"
      )
      const storedCatMap: Record<string, string> = JSON.parse(
        localStorage.getItem("brilliant-custom-categories-map") || "{}"
      )
      const storedInfo: Record<string, { display_name?: string; unit?: string }> = JSON.parse(
        localStorage.getItem("brilliant-custom-ingredient-info") || "{}"
      )
      const storedBottles: Record<string, number> = JSON.parse(
        localStorage.getItem("brilliant-custom-bottle-volumes") || "{}"
      )
      const storedCatNames: Record<string, string> = JSON.parse(
        localStorage.getItem("brilliant-custom-category-names") || "{}"
      )

      // 2. Слияние с baseDb
      const mergedCatNames = { ...baseDb.category_names, ...storedCatNames }
      const mergedPrices = { ...baseDb.prices, ...storedPrices }
      const mergedCatMap = { ...baseDb.categories, ...storedCatMap }
      const mergedInfo = { ...baseDb.ingredient_info, ...storedInfo }
      const mergedBottles = { ...baseDb.bottle_volumes, ...storedBottles }
      const mergedSemi = { ...baseDb.semi_products, ...storedSemi }
      const mergedCocktails = { ...baseDb.cocktails, ...storedCocktails }

      // 3. Формирование пакетов данных
      const categoriesPayload = Object.entries(mergedCatNames).map(([key, name]) => ({
        key,
        name,
        company_id: companyId,
      }))

      const ingredientsPayload = Object.keys(mergedPrices).map((key) => ({
        key,
        name: mergedInfo[key]?.display_name || key,
        category: mergedCatMap[key] || "Прочее",
        unit: mergedInfo[key]?.unit || "мл",
        price_per_unit: Number(mergedPrices[key] || 0),
        bottle_volume: mergedBottles[key] ? Number(mergedBottles[key]) : null,
        company_id: companyId,
      }))

      const semiProductsPayload = Object.entries(mergedSemi).map(([key, sp]) => ({
        key,
        name: sp.name,
        output_volume: Number(sp.output_volume || 0),
        unit: sp.unit || "мл",
        recipe: sp.recipe || {},
        company_id: companyId,
      }))

      const cocktailsPayload = Object.entries(mergedCocktails).map(([key, c]) => ({
        key,
        name: c.name,
        category: c.category,
        recipe: c.recipe || {},
        decorations: c.decorations || {},
        glassware: c.glassware || {},
        is_starred: false,
        company_id: companyId,
      }))

      // 4. Запись категорий
      setProgressText(`Перенос категорий (${categoriesPayload.length})...`)
      if (categoriesPayload.length > 0) {
        const { error } = await supabase.from("categories").upsert(categoriesPayload, {
          onConflict: "key",
        })
        if (error) throw new Error(`Категории: ${error.message}`)
      }

      // 5. Запись ингредиентов
      setProgressText(`Перенос ингредиентов (${ingredientsPayload.length})...`)
      if (ingredientsPayload.length > 0) {
        // Загружаем пачками по 50 для стабильности
        for (let i = 0; i < ingredientsPayload.length; i += 50) {
          const chunk = ingredientsPayload.slice(i, i + 50)
          const { error } = await supabase.from("ingredients").upsert(chunk, {
            onConflict: "key",
          })
          if (error) throw new Error(`Ингредиенты: ${error.message}`)
        }
      }

      // 6. Запись полуфабрикатов
      setProgressText(`Перенос полуфабрикатов (${semiProductsPayload.length})...`)
      if (semiProductsPayload.length > 0) {
        for (let i = 0; i < semiProductsPayload.length; i += 50) {
          const chunk = semiProductsPayload.slice(i, i + 50)
          const { error } = await supabase.from("semi_products").upsert(chunk, {
            onConflict: "key",
          })
          if (error) throw new Error(`Полуфабрикаты: ${error.message}`)
        }
      }

      // 7. Запись коктейлей
      setProgressText(`Перенос коктейлей (${cocktailsPayload.length})...`)
      if (cocktailsPayload.length > 0) {
        for (let i = 0; i < cocktailsPayload.length; i += 50) {
          const chunk = cocktailsPayload.slice(i, i + 50)
          const { error } = await supabase.from("cocktails").upsert(chunk, {
            onConflict: "key",
          })
          if (error) throw new Error(`Коктейли: ${error.message}`)
        }
      }

      setSuccessInfo({
        categories: categoriesPayload.length,
        ingredients: ingredientsPayload.length,
        semi: semiProductsPayload.length,
        cocktails: cocktailsPayload.length,
      })
      setProgressText(null)
    } catch (err) {
      console.error("Migration error:", err)
      setErrorMsg(err instanceof Error ? err.message : "Не удалось перенести данные в облако")
    } finally {
      setIsMigrating(false)
    }
  }

  return (
    <div className="bg-bg-card/90 border border-brand/30 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
      <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand/20 to-amber-500/10 border border-brand/30 flex items-center justify-center text-brand">
            <CloudUpload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cormorant italic text-2xl text-text-primary font-semibold flex items-center gap-2">
              <span>Миграция базы в облако Supabase</span>
              <Sparkles className="w-4 h-4 text-brand" />
            </h3>
            <p className="font-montserrat text-xs text-text-tertiary">
              Перенос всех базовых рецептур, ингредиентов и сохранённых цен в базу данных вашей компании
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-montserrat uppercase bg-brand/10 text-brand border border-brand/25 shrink-0">
          Admin Tool
        </span>
      </div>

      <p className="font-montserrat text-xs text-text-secondary leading-relaxed">
        Данная операция считывает исходный каталог рецептов (<code className="text-brand font-mono">cocktails_db.json</code>) 
        и ваши персональные изменения из локального хранилища браузера, после чего пакетом загружает их напрямую 
        в таблицы Supabase (<code className="text-text-primary">cocktails</code>, <code className="text-text-primary">ingredients</code>, <code className="text-text-primary">semi_products</code>, <code className="text-text-primary">categories</code>).
      </p>

      {progressText && (
        <div className="bg-brand/10 border border-brand/30 rounded-xl p-3 flex items-center gap-2.5 text-xs font-montserrat text-brand">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{progressText}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2.5 text-xs font-montserrat text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successInfo && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 space-y-2 text-xs font-montserrat text-emerald-200">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>База данных успешно перенесена в облако!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-emerald-100">
            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              Категории: <strong>{successInfo.categories}</strong>
            </div>
            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              Ингредиенты: <strong>{successInfo.ingredients}</strong>
            </div>
            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              Полуфабрикаты: <strong>{successInfo.semi}</strong>
            </div>
            <div className="bg-emerald-950/40 p-2 rounded-lg border border-emerald-500/20">
              Коктейли: <strong>{successInfo.cocktails}</strong>
            </div>
          </div>
        </div>
      )}

      <div className="pt-2 flex items-center justify-between gap-4">
        <div className="text-[11px] font-montserrat text-text-tertiary flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-brand" />
          <span>Привязка к компании: <strong className="text-text-secondary">{profile?.companyId || "—"}</strong></span>
        </div>

        <Button
          variant="primary"
          type="button"
          disabled={isMigrating}
          onClick={handleMigrate}
          className="px-5 py-2.5 text-xs flex items-center gap-2 shadow-lg shadow-brand/15"
        >
          {isMigrating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Миграция...</span>
            </>
          ) : (
            <>
              <CloudUpload className="w-4 h-4" />
              <span>Перенести базу в облако</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
