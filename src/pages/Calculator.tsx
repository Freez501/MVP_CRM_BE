import { useState, useRef, useCallback } from "react"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { useCocktails } from "@/context/CocktailsContext"
import { useSemiProducts } from "@/context/SemiProductsContext"
import { useIngredients } from "@/context/IngredientsContext"
import { exportElementToPdf } from "@/utils/pdfExport"
import { copyToClipboard, downloadTextFile } from "@/utils/clipboard"
import { PrintableSmeta } from "@/components/calculator/PrintableSmeta"
import { useCalculator, SelectedCocktail } from "@/components/calculator/useCalculator"
import { CalculatorHeader } from "@/components/calculator/CalculatorHeader"
import { CocktailSelector } from "@/components/calculator/CocktailSelector"
import { SmetaTab } from "@/components/calculator/SmetaTab"
import { TtkTab } from "@/components/calculator/TtkTab"
import { ReportTab } from "@/components/calculator/ReportTab"
import { useFormattedTexts } from "@/components/calculator/useFormattedTexts"
import { CalcTabs } from "@/components/calculator/CalcTabs"
import { ExportToolbar, CalcResultTab } from "@/components/calculator/ExportToolbar"

export default function Calculator() {
  const { cocktails, cocktailCategories, isStarred } = useCocktails()
  const { semiProducts } = useSemiProducts()
  const { prices, categories, ingredientInfo, bottleVolumes } = useIngredients()

  const [activeTab, setActiveTab] = useState<CalcResultTab>("smeta")
  const [copiedReport, setCopiedReport] = useState(false)
  const [copiedTtk, setCopiedTtk] = useState(false)
  const [copiedMessenger, setCopiedMessenger] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Название, дата мероприятия и коэффициент запаса
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [bufferPercent, setBufferPercent] = useLocalStorage<number>("brilliant-calc-buffer", 0)

  const printRef = useRef<HTMLDivElement>(null)

  const [selected, setSelected] = useLocalStorage<SelectedCocktail[]>(
    "brilliant-calculator-selected",
    []
  )

  const calculation = useCalculator({
    selected,
    bufferPercent,
    cocktails,
    semiProducts,
    prices,
    categories,
    ingredientInfo,
    bottleVolumes,
  })

  // Управление количеством
  const getQty = useCallback(
    (key: string) => {
      const found = selected.find((c) => c.key === key)
      return found ? found.qty : 0
    },
    [selected]
  )

  const setQty = useCallback(
    (key: string, name: string, qty: number) => {
      const safeQty = Math.max(0, qty)
      setSelected((prev) => {
        if (safeQty === 0) {
          return prev.filter((c) => c.key !== key)
        }
        const exists = prev.some((c) => c.key === key)
        if (exists) {
          return prev.map((c) => (c.key === key ? { ...c, qty: safeQty } : c))
        }
        return [...prev, { key, name, qty: safeQty }]
      })
    },
    [setSelected]
  )

  const changeQty = useCallback(
    (key: string, name: string, delta: number) => {
      const current = getQty(key)
      setQty(key, name, current + delta)
    },
    [getQty, setQty]
  )

  const addBatchToAllSelected = useCallback(
    (delta: number) => {
      if (selected.length === 0) return
      setSelected((prev) =>
        prev.map((item) => ({
          ...item,
          qty: Math.max(0, item.qty + delta),
        }))
      )
    },
    [selected.length, setSelected]
  )

  const clearSelected = useCallback(() => {
    setSelected([])
  }, [setSelected])

  const { messengerText, reportText, ttkText } = useFormattedTexts({
    selected,
    eventName,
    eventDate,
    bufferPercent,
    calculation,
  })

  const handleCopyMessenger = () => copyToClipboard(messengerText, setCopiedMessenger, 2500)
  const handleCopyReport = () => copyToClipboard(reportText, setCopiedReport)
  const handleCopyTtk = () => copyToClipboard(ttkText, setCopiedTtk)

  const handleDownloadTxt = () => {
    const filename = `smeta_${eventName ? eventName.replace(/\s+/g, "_") : "bar"}_${eventDate}.txt`
    downloadTextFile(reportText, filename)
  }

  const handleDownloadPdf = async () => {
    if (!printRef.current) return
    try {
      setIsGeneratingPdf(true)
      const filename = `smeta_${eventName ? eventName.replace(/\s+/g, "_") : "bar"}_${eventDate}.pdf`
      await exportElementToPdf(printRef.current, filename)
    } catch (err) {
      console.error("Failed to generate PDF:", err)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <CalculatorHeader
        eventName={eventName}
        setEventName={setEventName}
        eventDate={eventDate}
        setEventDate={setEventDate}
        bufferPercent={bufferPercent}
        setBufferPercent={setBufferPercent}
        grandTotalCost={calculation.grandTotalCost}
        totalPortions={calculation.totalPortions}
        hasSelected={selected.length > 0}
        onClear={clearSelected}
      />

      {/* Основной двухколоночный блок */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ЛЕВАЯ ПАНЕЛЬ: ВЫБОР КОКТЕЙЛЕЙ */}
        <div className="lg:col-span-5">
          <CocktailSelector
            cocktails={cocktails}
            cocktailCategories={cocktailCategories}
            isStarred={isStarred}
            selected={selected}
            getQty={getQty}
            setQty={setQty}
            changeQty={changeQty}
            addBatchToAllSelected={addBatchToAllSelected}
          />
        </div>

        {/* ПРАВАЯ ПАНЕЛЬ: СМЕТА, ТТК И ОТЧЁТ */}
        <div className="lg:col-span-7 bg-bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
          {/* Вкладки переключения вида */}
          <div className="flex flex-wrap items-center justify-between p-3 sm:p-4 border-b border-border bg-bg-card gap-2">
            <CalcTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Кнопки экспорта */}
            {selected.length > 0 && (
              <ExportToolbar
                activeTab={activeTab}
                onCopyMessenger={handleCopyMessenger}
                onCopyReport={handleCopyReport}
                onCopyTtk={handleCopyTtk}
                onDownloadPdf={handleDownloadPdf}
                onDownloadTxt={handleDownloadTxt}
                onPrint={handlePrint}
                copiedMessenger={copiedMessenger}
                copiedReport={copiedReport}
                copiedTtk={copiedTtk}
                isGeneratingPdf={isGeneratingPdf}
              />
            )}
          </div>

          {/* Содержимое активной вкладки */}
          <div className="p-4 flex-1">
            {selected.length === 0 ? (
              <div className="py-20 text-center">
                <p className="font-cormorant italic text-2xl text-text-primary">
                  Коктейли не выбраны
                </p>
                <p className="font-assistant text-xs text-text-tertiary mt-1 max-w-xs mx-auto">
                  Выберите необходимые позиции из списка слева, чтобы сформировать смету, ТТК и
                  отчёт
                </p>
              </div>
            ) : (
              <>
                {activeTab === "smeta" && <SmetaTab categorized={calculation.categorized} />}
                {activeTab === "ttk" && (
                  <TtkTab
                    ttkList={calculation.ttkList}
                    pfToMake={calculation.categorized.pf_to_make}
                  />
                )}
                {activeTab === "report" && <ReportTab reportText={reportText} />}
              </>
            )}
          </div>

          {/* Футер правой панели с итогом */}
          {selected.length > 0 && (
            <div className="p-3 sm:p-4 bg-bg-card border-t border-border flex items-center justify-between">
              <span className="font-assistant text-xs text-text-tertiary">
                Выбрано:{" "}
                <strong className="text-text-primary font-semibold">
                  {calculation.totalPortions}
                </strong>{" "}
                порций ({selected.length}{" "}
                {selected.length === 1
                  ? "коктейль"
                  : selected.length < 5
                    ? "коктейля"
                    : "коктейлей"}
                )
              </span>

              <div className="flex items-center gap-2">
                <span className="font-tenor text-xs uppercase tracking-leif text-text-tertiary">
                  Итого закупка:
                </span>
                <span className="font-assistant font-bold text-lg sm:text-xl text-text-primary">
                  {calculation.grandTotalCost.toLocaleString()} ₽
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Контейнер для чистой генерации PDF и печати */}
      <div
        id="printable-smeta-container"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          width: "800px",
          zIndex: -9999,
          backgroundColor: "#ffffff",
          pointerEvents: "none",
        }}
      >
        <PrintableSmeta
          ref={printRef}
          calculation={calculation}
          totalPortions={calculation.totalPortions}
          grandTotalCost={calculation.grandTotalCost}
          selectedCount={selected.length}
          eventName={eventName}
          eventDate={eventDate}
          bufferPercent={bufferPercent}
        />
      </div>
    </div>
  )
}
