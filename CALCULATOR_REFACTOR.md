# 📋 ТЗ: Дорефакторить Calculator.tsx (673 → ~150 строк)

> Gemini хорошо поработал, но Calculator.tsx ещё 673 строк. Нужно вынести оставшуюся логику в подкомпоненты и хуки.

---

## ПРАВИЛА
- Те же что в AGENTS.md: не коммитить, не трогать сервер, микроправки, русский язык.
- После каждого шага проверяй `npx tsc --noEmit`.
- **Не ломай существующую функциональность** — всё должно работать как раньше.

---

## ШАГ 1: Вынести генерацию текстов в хук `useFormattedTexts.ts`

В `Calculator.tsx` строки 104-380 — три огромных `useMemo` для генерации текстов:
- `formattedMessengerText` (строки 104-209) — текст для WhatsApp/Telegram
- `formattedReportText` (строки 212-319) — текст сводного отчёта
- `formattedTtkText` (строки 322-380) — текст ТТК

### Создать: `src/components/calculator/useFormattedTexts.ts`

```typescript
interface FormattedTextsParams {
  selected: SelectedCocktail[]
  eventName: string
  eventDate: string
  bufferPercent: number
  calculation: CalculatorResult  // тип из useCalculator
}

interface FormattedTexts {
  messengerText: string
  reportText: string
  ttkText: string
}

export function useFormattedTexts(params: FormattedTextsParams): FormattedTexts {
  const messengerText = useMemo(() => { /* из строк 104-209 */ }, [...])
  const reportText = useMemo(() => { /* из строк 212-319 */ }, [...])
  const ttkText = useMemo(() => { /* из строк 322-380 */ }, [...])
  
  return { messengerText, reportText, ttkText }
}
```

### В `Calculator.tsx` заменить три useMemo на:
```typescript
const { messengerText, reportText, ttkText } = useFormattedTexts({
  selected, eventName, eventDate, bufferPercent, calculation
})
```

**Результат:** ~270 строк убрано из Calculator.tsx.

---

## ШАГ 2: Вынести панель экспорта в `ExportToolbar.tsx`

В `Calculator.tsx` строки 503-590 — блок с кнопками экспорта (WhatsApp, PDF, Печать, Копировать, TXT, Копировать ТТК).

### Создать: `src/components/calculator/ExportToolbar.tsx`

```typescript
interface ExportToolbarProps {
  activeTab: CalcResultTab
  onCopyMessenger: () => void
  onCopyReport: () => void
  onCopyTtk: () => void
  onDownloadPdf: () => void
  onDownloadTxt: () => void
  onPrint: () => void
  copiedMessenger: boolean
  copiedReport: boolean
  copiedTtk: boolean
  isGeneratingPdf: boolean
}

export const ExportToolbar = React.memo(function ExportToolbar(props: ExportToolbarProps) {
  // JSX с кнопками из строк 503-590
})
```

**Результат:** ~90 строк убрано.

---

## ШАГ 3: Вынести переключатель табов в `CalcTabs.tsx`

Строки 461-501 — три кнопки переключения табов (Смета, ТТК, Отчёт).

### Создать: `src/components/calculator/CalcTabs.tsx`

```typescript
interface CalcTabsProps {
  activeTab: CalcResultTab
  onTabChange: (tab: CalcResultTab) => void
}

export const CalcTabs = React.memo(function CalcTabs({ activeTab, onTabChange }: CalcTabsProps) {
  // JSX с тремя кнопками-табами
})
```

**Результат:** ~40 строк убрано.

---

## ШАГ 4: Вынести copy/download хелперы в утилиту

Строки 382-425 — 6 функций-обработчиков (`handleCopyMessenger`, `handleCopyReport`, `handleCopyTtk`, `handleDownloadTxt`, `handleDownloadPdf`, `handlePrint`).

### Создать: `src/utils/clipboard.ts`

```typescript
export function copyToClipboard(
  text: string, 
  setCopied: (v: boolean) => void, 
  timeout = 2000
) {
  navigator.clipboard.writeText(text)
  setCopied(true)
  setTimeout(() => setCopied(false), timeout)
}

export function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```

В `Calculator.tsx` хэндлеры станут однострочниками:
```typescript
const handleCopyMessenger = () => copyToClipboard(messengerText, setCopiedMessenger, 2500)
const handleCopyReport = () => copyToClipboard(reportText, setCopiedReport)
const handleDownloadTxt = () => downloadTextFile(reportText, `smeta_${...}.txt`)
```

**Результат:** ~30 строк убрано.

---

## ШАГ 5: Финальная проверка

После всех шагов:
1. `Calculator.tsx` должен быть **~150 строк** — только стейт + рендер подкомпонентов
2. Запустить `npx tsc --noEmit` — ноль ошибок
3. Запустить `npm run test:run` — все тесты проходят
4. Открыть в браузере и проверить что калькулятор работает как раньше: выбор коктейлей, смета, ТТК, отчёт, копирование, PDF, печать

---

## Итого: новые файлы

| Файл | Что содержит | Примерный размер |
|------|-------------|-----------------|
| `useFormattedTexts.ts` | Генерация текстов для мессенджеров/отчётов/ТТК | ~300 строк |
| `ExportToolbar.tsx` | Кнопки экспорта (PDF, TXT, копировать, печать) | ~100 строк |
| `CalcTabs.tsx` | Переключатель вкладок Смета/ТТК/Отчёт | ~50 строк |
| `utils/clipboard.ts` | Хелперы copyToClipboard и downloadTextFile | ~25 строк |
