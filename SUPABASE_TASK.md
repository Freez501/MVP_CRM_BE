# 📋 ТЗ: Интеграция Supabase (Бэкенд, База Данных, Авторизация)

> Цель: перевести проект из локального MVP (localStorage) в полноценное облачное приложение с разделением ролей (RBAC). Соблюдать правило №5 из `AGENTS.md` (написать план перед выполнением).

---

## 🎯 ЧТО ДЕЛАЕМ: ОБЗОР

1. **Подключение Supabase**: установка пакетов и настройка клиента.
2. **Проектирование БД**: создание таблиц для всех сущностей (Clients, Events, Cocktails, Activities).
3. **Авторизация (Auth)**: реализация экрана входа (Login) и управления сессиями.
4. **Управление ролями (RBAC)**: настройка Row Level Security (RLS) в Supabase для разделения доступов (Admin, Partner, Staff).
5. **Миграция состояния**: замена хука `useLocalStorage` на хук `useSupabase` для работы с облачной базой.

---

## 🛠️ ПОШАГОВЫЙ ПЛАН РЕАЛИЗАЦИИ

### ШАГ 1: Настройка клиента

1. Установить зависимости: `npm install @supabase/supabase-js`.
2. Создать файл `.env.local` в корне проекта (не коммитить!):
   ```env
   VITE_SUPABASE_URL=твой_url
   VITE_SUPABASE_ANON_KEY=твой_ключ
   ```
3. Создать `src/lib/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

   export const supabase = createClient(supabaseUrl, supabaseAnonKey)
   ```

### ШАГ 2: Экран Авторизации и Защита Роутов

1. Создать страницу `src/pages/Login.tsx` (форма: email, пароль).
2. Создать провайдер `AuthProvider` (`src/context/AuthContext.tsx`), который слушает `supabase.auth.onAuthStateChange`.
3. Защитить все роуты в `App.tsx` компонентом `<ProtectedRoute>`. Если юзер не авторизован — редирект на `/login`.

### ШАГ 3: SQL-миграции (Структура БД)

Подготовить SQL-скрипт (сохранить как артефакт `supabase_schema.sql`), который пользователь выполнит в SQL Editor в панели Supabase. Скрипт должен создавать:

1. Таблицу `profiles` (связанную с `auth.users`) с полем `role` (enum: 'admin', 'partner', 'staff').
2. Таблицы: `clients`, `events`, `cocktails`, `ingredients`, `semi_products`, `activities`.
3. RLS Политики:
   - **Staff (Заготовщик)**: может ЧИТАТЬ всё, может ИЗМЕНЯТЬ `cocktails`, `ingredients`, `semi_products`. Не видит финансовые поля `events` (или видит только нужные).
   - **Partner**: может создавать `clients` и `events`, но видит только СВОИХ клиентов/мероприятия (если мы включаем multi-tenant на этом этапе, либо пока просто полный доступ).
   - **Admin**: полный доступ ко всему.

### ШАГ 4: Перевод контекстов на Supabase

Заменить `useLocalStorage` во всех контекстах (`ClientsContext`, `EventsContext` и т.д.) на подписки реального времени Supabase (Realtime) или простые CRUD запросы:
- При загрузке приложения делать `SELECT` из базы.
- При добавлении делать `INSERT`.
- При изменении `UPDATE`.

*(Начинаем с одного контекста, например, `ClientsContext`, проверяем работоспособность, затем переносим остальные).*

---

## 🔍 КРИТЕРИИ ГОТОВНОСТИ

- [ ] В проекте настроен клиент Supabase.
- [ ] Неавторизованных пользователей редиректит на `/login`.
- [ ] Подготовлен SQL-скрипт для создания структуры БД.
- [ ] Описан план миграции контекстов (пошагово).
