-- ==============================================================================
-- BRILLIANT BAR CRM — SUPABASE DATABASE SCHEMA & RLS POLICIES
-- ==============================================================================
-- Скрипт создания таблиц, ролей (RBAC), связей и RLS-политик.
-- Запустите этот скрипт в SQL Editor в панели Supabase.
-- ==============================================================================

-- 1. Расширения
create extension if not exists "uuid-ossp";

-- 2. Пользовательские типы и перечисления
do $$ begin
  create type user_role as enum ('admin', 'partner', 'staff');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type event_stage as enum ('new', 'in_progress', 'confirmed', 'done', 'cancelled');
exception
  when duplicate_object then null;
end $$;

-- 3. Таблица профилей пользователей (связанная с auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'staff',
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Триггер для автоматического создания профиля при регистрации через Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'staff'::user_role),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Вспомогательная функция для получения роли текущего пользователя
create or replace function public.get_current_role()
returns user_role as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'staff'::user_role
  );
$$ language sql security definer;

-- 4. Таблица заказчиков (Clients)
create table if not exists public.clients (
  id text primary key,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- 5. Таблица мероприятий (Events)
create table if not exists public.events (
  id text primary key,
  title text not null,
  client_id text references public.clients(id) on delete set null,
  client_name text not null,
  date text not null,
  address text not null default '',
  bartenders_count integer not null default 1,
  stage text not null default 'new',
  value numeric not null default 0,
  comment text not null default '',
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- 6. Таблица ленты активности (Activities)
create table if not exists public.activities (
  id text primary key,
  type text not null,
  description text not null,
  timestamp timestamptz not null default now(),
  "user" text not null,
  user_id uuid references auth.users(id) on delete set null
);

-- 7. Таблица коктейлей (Cocktails)
create table if not exists public.cocktails (
  key text primary key,
  name text not null,
  category text not null,
  recipe jsonb not null default '{}'::jsonb,
  decorations jsonb not null default '{}'::jsonb,
  glassware jsonb not null default '{}'::jsonb,
  is_starred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. Таблица ингредиентов (Ingredients)
create table if not exists public.ingredients (
  key text primary key,
  name text not null,
  category text not null,
  unit text not null default 'мл',
  price_per_unit numeric not null default 0,
  bottle_volume numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Таблица полуфабрикатов (Semi-products)
create table if not exists public.semi_products (
  key text primary key,
  name text not null,
  output_volume numeric not null default 0,
  unit text not null default 'мл',
  recipe jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. Таблица категорий (Categories)
create table if not exists public.categories (
  key text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) ПОЛИТИКИ
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.activities enable row level security;
alter table public.cocktails enable row level security;
alter table public.ingredients enable row level security;
alter table public.semi_products enable row level security;
alter table public.categories enable row level security;

-- Profiles: каждый может читать свой профиль, админ может читать и менять всё
create policy "Allow user read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.get_current_role() = 'admin');

create policy "Allow user update own profile"
  on public.profiles for update
  using (auth.uid() = id or public.get_current_role() = 'admin');

create policy "Allow admin all on profiles"
  on public.profiles for all
  using (public.get_current_role() = 'admin');

-- Clients:
-- Все авторизованные пользователи могут читать клиентов
create policy "Allow auth read clients"
  on public.clients for select
  using (auth.role() = 'authenticated');

-- Админы и партнеры могут создавать и обновлять клиентов
create policy "Allow admin and partner modify clients"
  on public.clients for all
  using (public.get_current_role() in ('admin', 'partner'));

-- Events:
-- Все авторизованные могут читать мероприятия
create policy "Allow auth read events"
  on public.events for select
  using (auth.role() = 'authenticated');

-- Админы и партнеры могут создавать/изменять мероприятия
create policy "Allow admin and partner modify events"
  on public.events for all
  using (public.get_current_role() in ('admin', 'partner'));

-- Activities:
-- Все авторизованные могут читать и создавать события в ленте
create policy "Allow auth read activities"
  on public.activities for select
  using (auth.role() = 'authenticated');

create policy "Allow auth insert activities"
  on public.activities for insert
  with check (auth.role() = 'authenticated');

-- Cocktails, Ingredients, Semi-Products, Categories:
-- Все авторизованные могут читать
create policy "Allow auth read cocktails"
  on public.cocktails for select
  using (auth.role() = 'authenticated');

create policy "Allow auth read ingredients"
  on public.ingredients for select
  using (auth.role() = 'authenticated');

create policy "Allow auth read semi_products"
  on public.semi_products for select
  using (auth.role() = 'authenticated');

create policy "Allow auth read categories"
  on public.categories for select
  using (auth.role() = 'authenticated');

-- Staff и Admin могут изменять технологические справочники (коктейли, ингредиенты, п/ф)
create policy "Allow admin and staff modify cocktails"
  on public.cocktails for all
  using (public.get_current_role() in ('admin', 'staff'));

create policy "Allow admin and staff modify ingredients"
  on public.ingredients for all
  using (public.get_current_role() in ('admin', 'staff'));

create policy "Allow admin and staff modify semi_products"
  on public.semi_products for all
  using (public.get_current_role() in ('admin', 'staff'));

create policy "Allow admin and staff modify categories"
  on public.categories for all
  using (public.get_current_role() in ('admin', 'staff'));

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
-- Включение Realtime для оперативной синхронизации между устройствами
alter publication supabase_realtime add table public.clients;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.cocktails;
alter publication supabase_realtime add table public.ingredients;
alter publication supabase_realtime add table public.semi_products;
