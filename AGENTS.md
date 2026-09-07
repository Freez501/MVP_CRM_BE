# 🔧 ИНСТРУКЦИЯ ПО РЕФАКТОРИНГУ — CocktailCalc Pro
- [ ] `npm run test:run` — все тесты зелёные
5. **������������ ����� ���������** � ����� ����������� ����� ������ ��������� ����� ��� �� ������ ���� (���� ���� �� ��� ������������ ������������� � ������� ����), ����������� ������ ������� ���� �������� �� ����� � ������� ������ ��������� ������������ �� ������ "���������" ��� "�������". �� ����� ������� �� �������� ����� �������.
# 🔧 ИНСТРУКЦИЯ ПО РЕФАКТОРИНГУ — CocktailCalc Pro

> Эта инструкция предназначена для AI-агента (Gemini / Claude). Выполняй фазы **строго по порядку**, каждая фаза зависит от предыдущей. После каждой фазы убедись, что проект собирается (`npm run build`) и работает.

---

## ОБЩИЕ ПРАВИЛА

### Железные правила (НЕ НАРУШАТЬ)
1. **Строгий запрет на авто-коммиты и авто-пуши в Git.** Никаких `git commit` и `git push` самостоятельно! Команды Git выполняются **ТОЛЬКО** по прямому, явному запросу пользователя в чате.
2. **Сервер не трогать.** Не запускать, не останавливать и не перезапускать веб-сервер самостоятельно. Пользователь запускает сервер сам через `start_server.bat` (Windows) или `start_server.command` (macOS).
3. **Микроправки вместо переписывания.** Не переписывать код целиком без необходимости. Точечные и аккуратные правки — только то, что нужно для поставленной задачи.
4. **Общение** — отвечать на русском языке, понятно, коротко и по делу.

### Технические правила
5. **Проверка** — после каждой фазы запусти `npx tsc --noEmit` для проверки типов. Убедись, что нет ошибок.
6. **Импорты** — используй алиас `@/` для путей (настроен в `vite.config.ts` и `tsconfig.json`).
7. **Стиль кода** — сохраняй существующий стиль: функциональные компоненты, именованные экспорты для хуков, дефолтные экспорты для страниц.
8. **Не удалять комментарии** — сохраняй все существующие комментарии, если они не относятся к удаляемому коду.

---

## ФАЗА 1: ESLint + Prettier (Сначала линтер!)

### 1.1 Установить зависимости
```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-react-refresh prettier eslint-config-prettier eslint-plugin-prettier
```

### 1.2 Создать `.eslintrc.cjs` в корне проекта
```js
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-refresh', '@typescript-eslint', 'prettier'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'react/prop-types': 'off',
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
```

### 1.3 Создать `.prettierrc` в корне
```json
{
  "semi": false,
  "singleQuote": false,
  "trailingComma": "es5",
  "tabWidth": 2,
  "printWidth": 100,
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "arrowParens": "always"
}
```

### 1.4 Добавить скрипты в `package.json`
```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "lint:fix": "eslint . --ext ts,tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx,css,json}\""
}
```

### 1.5 НЕ запускай `lint:fix` пока! Сначала заверши остальные фазы, иначе будет конфликтовать с рефакторингом.

---

## ФАЗА 2: Вынести дублирующиеся утилиты

### 2.1 Создать файл `src/utils/formatting.ts`

Вынести из `Calculator.tsx` и `Database.tsx` следующие функции:

```typescript
// src/utils/formatting.ts

/**
 * Capitalize первой буквы, с поддержкой префикса (ПФ)
 */
export function capitalize(s: string): string {
  if (!s) return ""
  const trimmed = s.trim()
  if (/^\(?пф\)?/i.test(trimmed)) {
    const cleanName = trimmed.replace(/^(\(?пф\)?[:\s-]*)+/i, "").trim()
    if (!cleanName) return "(ПФ)"
    return `(ПФ) ${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}`
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

/**
 * Очистить ключ полуфабриката от префикса ПФ
 */
export function cleanPfKey(key: string): string {
  return key.toLowerCase().replace(/^(\(?пф\)?[:\s-]*)+/gi, "").trim()
}
```

### 2.2 Создать файл `src/utils/semiProducts.ts`

Вынести логику работы с полуфабрикатами:

```typescript
// src/utils/semiProducts.ts
import { Recipe, SemiProduct } from "@/types/db"
import { cleanPfKey } from "./formatting"

export function findSemiProduct(
  key: string,
  semiProducts: Record<string, SemiProduct>
): { key: string; semi: SemiProduct } | null {
  if (!key) return null
  if (semiProducts[key]) return { key, semi: semiProducts[key] }
  const clean = cleanPfKey(key)
  for (const [sKey, sVal] of Object.entries(semiProducts)) {
    if (sKey === key || cleanPfKey(sKey) === clean) {
      return { key: sKey, semi: sVal }
    }
  }
  return null
}

export function expandRecipe(
  recipe: Recipe,
  multiplier: number,
  semiProducts: Record<string, SemiProduct>,
  pfToMake: Record<string, number>,
  seen = new Set<string>()
): Record<string, number> {
  // ... скопировать из Calculator.tsx строки 65-103
}
```

### 2.3 Обновить импорты
- В `Calculator.tsx` — удалить локальные определения `capitalize`, `cleanPfKey`, `findSemiProduct`, `expandRecipe`, заменить на импорты из `@/utils/formatting` и `@/utils/semiProducts`.
- В `Database.tsx` — аналогично удалить `capitalize`, `cleanPfKey`, заменить на импорты.

### 2.4 Проверить: `npx tsc --noEmit` — ноль ошибок.

---

## ФАЗА 3: Разделить DatabaseContext

Текущий `DatabaseContext.tsx` (548 строк) содержит CRUD для коктейлей, полуфабрикатов, ингредиентов и категорий — всё в одном контексте. Любое обновление перерендерит всех потребителей.

### 3.1 Разделить на 4 контекста:

#### `src/context/CocktailsContext.tsx`
- Состояние: `customCocktails`, `deletedKeys`, `starredKeys`
- Функции: `addCocktail`, `updateCocktail`, `removeCocktail`, `toggleStar`, `isStarred`
- Зависит от: `ActivitiesContext`, базовых данных из `cocktails_db.json`
- Экспортирует: `CocktailsProvider`, `useCocktails()`

#### `src/context/IngredientsContext.tsx`
- Состояние: `customPrices`, `customCategoriesMap`, `customIngredientInfo`, `customBottleVolumes`, `deletedIngredientKeys`
- Функции: `addIngredient`, `updateIngredient`, `removeIngredient`, `getDefaultUnit`
- Мёрдж-логика: `prices`, `categories`, `ingredientInfo`, `bottleVolumes`
- Экспортирует: `IngredientsProvider`, `useIngredients()`

#### `src/context/SemiProductsContext.tsx`
- Состояние: `customSemiProducts`, `deletedSemiKeys`
- Функции: `addSemiProduct`, `updateSemiProduct`, `removeSemiProduct`
- Экспортирует: `SemiProductsProvider`, `useSemiProducts()`

#### `src/context/CategoriesContext.tsx`
- Состояние: `customCategoryNames`, `deletedCategoryKeys`
- Функции: `addCategory`, `removeCategory`
- Экспортирует: `CategoriesProvider`, `useCategories()`

### 3.2 Создать `src/context/DatabaseSyncService.ts`
Вынести логику `saveFullDbToDisk` в отдельный сервис/утилиту. Контексты будут вызывать его при изменениях.

### 3.3 Обновить `App.tsx`
Обернуть приложение новыми провайдерами (порядок важен — зависимости должны быть снаружи):

```tsx
<ActivitiesProvider>
  <CategoriesProvider>
    <IngredientsProvider>
      <SemiProductsProvider>
        <CocktailsProvider>
          <ClientsProvider>
            <EventsProvider>
              <PageWrapper>
                <Routes>...</Routes>
              </PageWrapper>
            </EventsProvider>
          </ClientsProvider>
        </CocktailsProvider>
      </SemiProductsProvider>
    </IngredientsProvider>
  </CategoriesProvider>
</ActivitiesProvider>
```

### 3.4 Обновить все потребители
Во всех компонентах, которые используют `useDatabase()`, заменить на конкретные хуки:
- `useCocktails()` — где нужны коктейли
- `useIngredients()` — где нужны ингредиенты/цены
- `useSemiProducts()` — где нужны полуфабрикаты
- `useCategories()` — где нужны категории

Найти все места использования: `grep -r "useDatabase" src/`

### 3.5 Удалить старый `DatabaseContext.tsx` после миграции.
### 3.6 Проверить: `npx tsc --noEmit` — ноль ошибок.

---

## ФАЗА 4: Разбить Calculator.tsx (1880 строк → ~8 файлов)

### Целевая структура:

```
src/
├── pages/
│   └── Calculator.tsx          (~150 строк — оркестратор)
├── components/calculator/
│   ├── CocktailSelector.tsx    — левая панель: поиск, фильтры, список коктейлей
│   ├── CocktailCard.tsx        — карточка одного коктейля с +/- кнопками
│   ├── CalculatorHeader.tsx    — шапка с названием мероприятия, датой, буфером
│   ├── SmetaTab.tsx            — вкладка "Смета" (таблица ингредиентов + итоги)
│   ├── TtkTab.tsx              — вкладка "ТТК" (техкарты коктейлей)
│   ├── ReportTab.tsx           — вкладка "Отчёт" (текстовый отчёт, кнопки копирования)
│   ├── PrintableSmeta.tsx      — (уже существует) версия для печати
│   └── useCalculator.ts        — кастомный хук с логикой расчётов (useMemo для сметы, ТТК, полуфабрикатов)
```

### 4.1 Создать хук `src/components/calculator/useCalculator.ts`

Вынести из `Calculator.tsx` ВСЮ вычислительную логику:
- Все `useMemo` для расчёта `totalIngredients`, `totalDecorations`, `totalGlassware`, `pfList`, `bottlesNeeded` и т.д.
- Принимает: `selected`, `bufferPercent`, `cocktails`, `semiProducts`, `prices`, `ingredientInfo`, `bottleVolumes`, `categories`
- Возвращает: вычисленные данные для каждой вкладки

```typescript
// src/components/calculator/useCalculator.ts
export function useCalculator(params: CalculatorParams): CalculatorResult {
  // ... все useMemo здесь
}
```

### 4.2 Создать `CocktailSelector.tsx`
- Переместить: поисковая строка, фильтры по категориям, сортировка, список коктейлей с кнопками +/-
- Props: `cocktails`, `selected`, `onQtyChange`, `query`, `onQueryChange`, фильтры и т.д.

### 4.3 Создать `CocktailCard.tsx`
- Одна карточка коктейля с кнопками +/- и отображением qty
- Props: `cocktail`, `qty`, `isStarred`, `onQtyChange`

### 4.4 Создать `CalculatorHeader.tsx`
- Название мероприятия, дата, коэффициент запаса, кнопки PDF/сброс
- Props: `eventName`, `eventDate`, `bufferPercent`, `onExportPdf`, `onReset`, сеттеры

### 4.5 Создать `SmetaTab.tsx`, `TtkTab.tsx`, `ReportTab.tsx`
- Каждая вкладка — отдельный компонент
- Получают данные из хука `useCalculator` через props

### 4.6 Обновить `Calculator.tsx`
Оставить ~150 строк: стейт, подключение контекстов, хук, и рендер подкомпонентов.

### 4.7 Проверить: `npx tsc --noEmit` — ноль ошибок.

---

## ФАЗА 5: Разбить Database.tsx (1199 строк → ~6 файлов)

### Целевая структура:

```
src/
├── pages/
│   └── Database.tsx              (~120 строк — оркестратор + табы)
├── components/database/
│   ├── CocktailsTab.tsx          — таблица/список коктейлей
│   ├── IngredientsTab.tsx        — таблица ингредиентов
│   ├── SemiProductsTab.tsx       — таблица полуфабрикатов
│   ├── CategoriesTab.tsx         — управление категориями
│   ├── DatabaseSearch.tsx        — шапка с поиском и фильтрами
│   ├── CocktailAddModal.tsx      — (уже существует)
│   ├── CocktailEditModal.tsx     — (уже существует)
│   ├── IngredientAddModal.tsx    — (уже существует)
│   ├── IngredientEditModal.tsx   — (уже существует)
│   ├── SemiProductAddModal.tsx   — (уже существует)
│   ├── SemiProductEditModal.tsx  — (уже существует)
│   ├── GlasswareAddModal.tsx     — (уже существует)
│   ├── GlasswareEditModal.tsx    — (уже существует)
│   └── CategoriesManageModal.tsx — (уже существует)
```

### 5.1 Из `Database.tsx` вынести в отдельные компоненты:
- Таблицу/список коктейлей → `CocktailsTab.tsx`
- Таблицу ингредиентов → `IngredientsTab.tsx`
- Таблицу полуфабрикатов → `SemiProductsTab.tsx`
- Управление категориями → `CategoriesTab.tsx`
- Шапку с поиском → `DatabaseSearch.tsx`

### 5.2 Каждый таб-компонент:
- Подключает нужный контекст напрямую (`useCocktails`, `useIngredients` и т.д.)
- Управляет своими модальными окнами
- Имеет свой локальный стейт (поиск, сортировка, выделение)

### 5.3 Обновить `Database.tsx`
Оставить только: переключение табов и рендер текущего таба.

### 5.4 Проверить: `npx tsc --noEmit` — ноль ошибок.

---

## ФАЗА 6: Оптимизация производительности

### 6.1 Добавить `useCallback` во всех контекстах
Все функции, передаваемые через контекст (`addCocktail`, `updateCocktail`, `removeCocktail` и т.д.) обернуть в `useCallback`.

### 6.2 Обновить `useLocalStorage.ts`
Обернуть `setValue` в `useCallback`:
```typescript
const setValue = useCallback((value: T | ((val: T) => T)) => {
  // ...
}, [key]) // key — единственная зависимость
```

> [!WARNING]
> При этом нужно использовать `setStoredValue` с функциональным апдейтом вместо прямой ссылки на `storedValue`, иначе будет stale closure.

### 6.3 Добавить `React.memo` для тяжёлых компонентов
- `CocktailCard` — рендерится в списке, нужно мемоизировать
- `SmetaTab`, `TtkTab`, `ReportTab` — чтобы переключение табов не ре-рендерило скрытые

### 6.4 Создать `ErrorBoundary`

Создать `src/components/ui/ErrorBoundary.tsx`:

```tsx
import { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Что-то пошло не так</h2>
          <p className="text-text-secondary">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-brand text-white rounded"
          >
            Попробовать снова
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Обернуть каждый Route в `App.tsx`:
```tsx
<Route path="/calculator" element={<ErrorBoundary><Calculator /></ErrorBoundary>} />
```

### 6.5 Проверить: `npx tsc --noEmit` — ноль ошибок.

---

## ФАЗА 7: Мелкие исправления

### 7.1 Заменить `Date.now()` на `crypto.randomUUID()`

Во всех контекстах заменить генерацию ID:
```typescript
// БЫЛО:
id: "c_" + Date.now()
// СТАЛО:
id: crypto.randomUUID()
```

Затронутые файлы:
- `ClientsContext.tsx` (строка 23)
- `EventsContext.tsx` (строка 32)
- `ActivitiesContext.tsx` (строка 20)

### 7.2 Убрать хардкод `user: "Влад"`

Создать `src/constants.ts`:
```typescript
export const CURRENT_USER = "Влад"
```

Заменить все `user: "Влад"` на `user: CURRENT_USER` во всех контекстах. Потом, когда появится авторизация, можно будет заменить в одном месте.

### 7.3 Очистить мусор
- Удалить `tupotestgit.txt` из корня проекта
- Удалить `start_server — ярлык.lnk` из корня (ярлыку не место в репо)
- Добавить в `.gitignore`:
```
dist/
*.lnk
```

### 7.4 Проверить: `npx tsc --noEmit` — ноль ошибок.

---

## ФАЗА 8: Тесты (Vitest + React Testing Library)

### 8.1 Установить зависимости
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 8.2 Настроить Vitest

Добавить в `vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from "vite"

export default defineConfig({
  // ... существующий конфиг ...
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    css: true,
  },
})
```

### 8.3 Создать `src/test/setup.ts`
```typescript
import "@testing-library/jest-dom"
```

### 8.4 Добавить скрипт в `package.json`
```json
"scripts": {
  "test": "vitest",
  "test:run": "vitest run"
}
```

### 8.5 Написать базовые тесты

#### `src/utils/__tests__/formatting.test.ts`
```typescript
import { describe, it, expect } from "vitest"
import { capitalize, cleanPfKey } from "../formatting"

describe("capitalize", () => {
  it("capitalizes first letter", () => {
    expect(capitalize("водка")).toBe("Водка")
  })
  it("handles (ПФ) prefix", () => {
    expect(capitalize("пф: сауэр микс")).toBe("(ПФ) Сауэр микс")
  })
  it("returns empty for empty string", () => {
    expect(capitalize("")).toBe("")
  })
})

describe("cleanPfKey", () => {
  it("removes ПФ prefix", () => {
    expect(cleanPfKey("пф: сауэр микс")).toBe("сауэр микс")
  })
  it("lowercases", () => {
    expect(cleanPfKey("Водка")).toBe("водка")
  })
})
```

#### `src/utils/__tests__/semiProducts.test.ts`
```typescript
import { describe, it, expect } from "vitest"
import { findSemiProduct } from "../semiProducts"

describe("findSemiProduct", () => {
  const semiProducts = {
    "сауэр микс": { name: "Сауэр Микс", output_volume: 1, unit: "л", recipe: {} },
  }

  it("finds by exact key", () => {
    expect(findSemiProduct("сауэр микс", semiProducts)).toBeTruthy()
  })
  it("returns null for unknown key", () => {
    expect(findSemiProduct("неизвестный", semiProducts)).toBeNull()
  })
  it("returns null for empty key", () => {
    expect(findSemiProduct("", semiProducts)).toBeNull()
  })
})
```

#### `src/hooks/__tests__/useLocalStorage.test.ts`
Тест для хука useLocalStorage с моком localStorage.

#### `src/components/calculator/__tests__/useCalculator.test.ts`
Тест для хука useCalculator — проверить расчёт сметы для известного набора коктейлей.

### 8.6 Запустить тесты: `npm run test:run`
### 8.7 Все тесты должны проходить.

---

## ФАЗА 9 (ФИНАЛ): Запуск линтера

Теперь, когда весь рефакторинг завершён:

```bash
npm run lint:fix
npm run format
```

Исправить оставшиеся ошибки линтера вручную (если есть). Убедиться:
- `npm run lint` — 0 ошибок, 0 предупреждений
- `npm run test:run` — все тесты проходят
- `npm run build` — билд успешен

---

## Чеклист готовности

После выполнения всех фаз проверь:

- [ ] ESLint + Prettier настроены и работают
- [ ] Нет дублирования кода — утилиты вынесены в `utils/`
- [ ] DatabaseContext разделён на 4 контекста
- [ ] Calculator.tsx < 200 строк
- [ ] Database.tsx < 200 строк
- [ ] Все обработчики обёрнуты в useCallback
- [ ] ErrorBoundary на каждом роуте
- [ ] ID генерируются через crypto.randomUUID()
- [ ] Нет хардкода `user: "Влад"` — используется константа
- [ ] Мусорные файлы удалены
- [ ] Vitest настроен, базовые тесты проходят
- [ ] `npm run build` — успех
- [ ] `npm run lint` — 0 ошибок
- [ ] `npm run test:run` — все тесты зелёные
