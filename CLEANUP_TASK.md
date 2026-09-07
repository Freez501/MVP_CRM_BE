# 🧹 ТЗ: Дочистка техдолга

> Основной рефакторинг завершён. Осталось 4 задачи по дочистке. Соблюдай правила из AGENTS.md.

---

## ЗАДАЧА 1: Заменить Date.now() в модальных окнах

В контекстах уже используется `crypto.randomUUID()`, но в модалках осталось 16 мест с `Date.now()`. Заменить на `crypto.randomUUID()`.

### Затронутые файлы:
- `src/components/database/CocktailAddModal.tsx` (6 мест)
- `src/components/database/CocktailEditModal.tsx` (7 мест)
- `src/components/database/SemiProductAddModal.tsx` (2 места)
- `src/components/database/SemiProductEditModal.tsx` (2 места)

### Что делать:
Найти все строки вида:
```typescript
id: `rec_init_${idx}_${Date.now()}`
id: `rec_${Date.now()}_${Math.random()}`
```
И заменить на:
```typescript
id: crypto.randomUUID()
```

### Проверка: `npx tsc --noEmit` — ноль ошибок.

---

## ЗАДАЧА 2: Исправить ESLint warnings

Сейчас `npm run lint` выдаёт **37 warnings**, в основном `@typescript-eslint/no-explicit-any`.

### Что делать:
1. Запустить `npm run lint` и посмотреть все warnings.
2. Для каждого `any` — заменить на правильный тип:
   - Если это event handler → `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent` и т.д.
   - Если это catch-блок → `unknown` и потом `if (err instanceof Error)`
   - Если это пропс из библиотеки — найти правильный тип из типов библиотеки.
3. НЕ использовать `eslint-disable` комментарии — исправить по-настоящему.
4. Запустить `npm run lint` — 0 errors, 0 warnings.

---

## ЗАДАЧА 3: Lazy loading для страниц (code-splitting)

При `npm run build` Vite предупреждает что бандл > 500 КБ. Нужно разбить на чанки с помощью `React.lazy`.

### Что делать:

В `src/App.tsx` заменить статические импорты страниц на lazy:

```tsx
import { lazy, Suspense } from "react"

const Dashboard = lazy(() => import("./pages/Dashboard"))
const Events = lazy(() => import("./pages/Events"))
const Clients = lazy(() => import("./pages/Clients"))
const Calculator = lazy(() => import("./pages/Calculator"))
const Database = lazy(() => import("./pages/Database"))
const Settings = lazy(() => import("./pages/Settings"))
```

Обернуть `<Routes>` в `<Suspense>`:
```tsx
<Suspense fallback={
  <div className="flex items-center justify-center h-64">
    <p className="text-text-tertiary font-montserrat">Загрузка...</p>
  </div>
}>
  <Routes>
    ...
  </Routes>
</Suspense>
```

### Проверка:
- `npm run build` — чанки < 500 КБ, warning пропал
- В браузере — переход между страницами работает без ошибок

---

## ЗАДАЧА 4: Разбить PrintableSmeta.tsx (45 КБ)

`src/components/calculator/PrintableSmeta.tsx` — 45 КБ, это слишком много для одного компонента.

### Что делать:
Разбить на подкомпоненты внутри `src/components/calculator/print/`:

```
src/components/calculator/print/
├── PrintableSmeta.tsx       — основной контейнер (~50 строк)
├── PrintHeader.tsx          — шапка документа (название, дата, логотип)
├── PrintMenuSection.tsx     — секция "Меню коктейлей"
├── PrintIngredientsTable.tsx — таблица ингредиентов по категориям
├── PrintSemiProducts.tsx    — секция полуфабрикатов
├── PrintGlassware.tsx       — секция посуды
├── PrintTotals.tsx          — итоги и суммы
└── printStyles.ts           — общие стили для печати (если есть inline-стили)
```

Каждый подкомпонент:
- Принимает данные через props
- Отвечает за свою секцию PDF/печати
- Должен сохранять ТОЧНО такой же визуал как сейчас

### Проверка:
- Сгенерировать PDF — результат должен быть идентичен текущему
- Распечатать (Ctrl+P) — результат идентичен

---

## Финальная проверка

После всех 4 задач:
- [ ] `npm run lint` — 0 errors, 0 warnings
- [ ] `npm run test:run` — все тесты зелёные
- [ ] `npm run build` — нет warning про размер чанков
- [ ] В браузере всё работает: калькулятор, база, PDF, печать
