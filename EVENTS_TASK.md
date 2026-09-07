# 📋 ТЗ: Полная прокачка модуля «Мероприятия» (Events)

> Цель: превратить заглушку мероприятий в полноценную CRM-воронку с Drag & Drop, детальным редактированием, интеграцией с базой клиентов и коктейлей, удалением и расчётом сметы. Соблюдать правила из `AGENTS.md`.

---

## 🎯 ЧТО ДЕЛАЕМ: ОБЗОР

1. **Типизация**: расширить интерфейс `Event` в `src/types/index.ts` (добавить `details` с таймингом, оборудованием, украшениями, выбранными коктейлями).
2. **Интеграция с контекстами**:
   - Заказчиков брать из `useClients()`, а не из `mockClients`.
   - Список коктейлей брать из `useCocktails()`, а не статически из JSON.
3. **Drag & Drop в Kanban**:
   - Перетаскивание карточек между колонками статусов (Новый → В работе → Подтверждён → Проведён → Отменён) с автоматическим сохранением и логированием в активность (`ActivitiesContext`).
4. **Редактирование и просмотр карточки**:
   - Открытие модалки с предзаполненными данными при клике на карточку.
   - Возможность обновлять любые поля мероприятия.
5. **Удаление мероприятий**:
   - Кнопка удаления с подтверждением через `ConfirmDialog`.
6. **Поиск и фильтры**:
   - Поиск по названию, заказчику и площадке.
   - Фильтр по датам и диапазону бюджетов.
7. **Связь с калькулятором**:
   - Кнопка «Рассчитать смету в калькуляторе» прямо из карточки/деталей мероприятия (передаёт коктейли в калькулятор).

---

## 🛠️ ПОШАГОВЫЙ ПЛАН РЕАЛИЗАЦИИ

### ШАГ 1: Расширение типов (`src/types/index.ts`)

Обновить интерфейс `Event`:

```typescript
export interface EventDetails {
  departure?: string
  setup?: string
  start?: string
  end?: string
  clothing?: string
  bar?: string
  barComment?: string
  shelf?: string
  shelfComment?: string
  pyramid?: string
  pyramidComment?: string
  decorations?: string[]
  decorationComment?: string
  menu?: "us" | "client"
  cocktails?: { name: string; qty: number; key?: string }[]
}

export interface Event {
  id: string
  title: string
  clientId: string
  clientName: string
  date: string
  address: string
  bartendersCount: number
  stage: EventStage
  value: number
  comment: string
  details?: EventDetails
  createdAt: string
  updatedAt: string
}
```

---

### ШАГ 2: Drag & Drop для Kanban-доски (`src/components/events/`)

Реализовать нативный HTML5 Drag & Drop (без тяжёлых внешних библиотек):

1. **`EventCard.tsx`**:
   - Добавить атрибут `draggable`.
   - Обработчик `onDragStart={(e) => e.dataTransfer.setData("text/plain", event.id)}`.
   - Стилизация перетаскиваемой карточки (`cursor-grab`, `active:cursor-grabbing`).
2. **`EventColumn.tsx`**:
   - Обработчики `onDragOver={(e) => { e.preventDefault(); }}`, `onDrop={(e) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); onChangeStage(id, stage); }}`.
   - Визуальная подсветка колонки при наведении (`bg-accent-primary/10`, пунктирная рамка `border-brand`).

---

### ШАГ 3: Редактирование и удаление мероприятий

1. **Модальное окно редактирования/создания**:
   - Подгружать актуальный список заказчиков из `useClients()`.
   - Подгружать коктейли из `useCocktails()`.
   - Поддержка создания и редактирования существующего мероприятия.
2. **Удаление**:
   - Кнопка удаления с подтверждением через `ConfirmDialog`.
   - Вызов `removeEvent(id)` из `useEvents()`.

---

### ШАГ 4: Поиск, фильтры и статистика в шапке (`src/pages/Events.tsx`)

Добавить над Kanban-доской:
1. Поисковую строку (по названию мероприятия, клиенту, адресу).
2. Фильтр по периоду (Все, Предстоящие, Прошедшие).
3. Сводку по бюджету в воронке.

---

### ШАГ 5: Интеграция с Калькулятором

При нажатии «Открыть в калькуляторе» в карточке мероприятия:
1. Записывать выбранные коктейли мероприятия в `localStorage` ключ `brilliant-calculator-selected`.
2. Переходить на `/calculator`.

---

## 🔍 КРИТЕРИИ ГОТОВНОСТИ

- [ ] Мероприятия свободно перетаскиваются мышкой между всеми 5 колонками, статус обновляется мгновенно.
- [ ] Мероприятия можно создавать, открывать на редактирование и удалять.
- [ ] Клиенты в выпадающем списке берутся из `ClientsContext`.
- [ ] Коктейли берутся из `CocktailsContext`.
- [ ] Поиск и фильтрация в реальном времени скрывают/показывают карточки.
- [ ] `npm run build` проходит без ошибок.
- [ ] `npm run lint` и `npm run test:run` проходят без ошибок.
