# 🔧 Задача: Перевод Мероприятий и Заказчиков на полноценную работу с БД

## 📌 Суть проблемы
Текущие файлы `EventsContext.tsx` и `ClientsContext.tsx` написаны "наполовину". Они делают запрос `fetchEvents` в Supabase, но функции добавления (`addEvent`, `addClient`), обновления и удаления сохраняют данные только в `localStorage` браузера и в стейт React. В базу данных (Supabase) они ничего не отправляют! 

## 🛠 Задачи для агента (IDE)

### Шаг 1: Полный рефакторинг `EventsContext.tsx`
1. Открой `src/context/EventsContext.tsx`.
2. Удали `EVENTS_CACHE_KEY` и функцию `saveCache`.
3. В функции `addEvent`:
   - Сделай её асинхронной (`async`).
   - Вместо генерации `crypto.randomUUID()` и записи в стейт, делай `await supabase.from("events").insert({ ... })`.
   - Обязательно передай `company_id: currentProfile.companyId` (получи его через `useAuth()`).
   - После успешного инсерта вызывай `fetchEvents()` для обновления стейта с сервера.
4. В функциях `updateEvent` и `removeEvent`:
   - Делай `await supabase.from("events").update(...)` и `.delete()`.
   - После успеха вызывай `fetchEvents()`.

### Шаг 2: Полный рефакторинг `ClientsContext.tsx`
1. Открой `src/context/ClientsContext.tsx`.
2. Повтори ту же логику, что и для мероприятий. Удали кэширование в `localStorage`.
3. Функции `addClient`, `updateClient`, `removeClient` должны делать прямые запросы в таблицу `clients` в Supabase.
4. При `insert` передавай `company_id: currentProfile.companyId`.
5. После успешных запросов вызывай `fetchClients()`.

## 🎨 Важно
Обязательно обрабатывай ошибки от Supabase и выводи их через `console.error` или уведомления. Стейт React (`events` и `clients`) должен обновляться только после успешного подтверждения от базы данных, чтобы фронтенд и бэкенд были 100% синхронизированы.
