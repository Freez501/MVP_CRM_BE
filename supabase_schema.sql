-- ==============================================================================
-- BRILLIANT BAR CRM — SUPABASE DATABASE SCHEMA & RLS POLICIES (MULTI-TENANT)
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

-- 2.5 Таблица компаний (Рабочие пространства)
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  default_currency text not null default 'RUB',
  status text not null default 'trial', -- 'trial' | 'active' | 'blocked'
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.companies enable row level security;

-- 3. Таблица профилей пользователей (связанная с auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role user_role not null default 'staff',
  name text,
  position text,
  phone text,
  avatar_url text,
  company_id uuid references public.companies(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Вспомогательная функция для получения роли текущего пользователя
create or replace function public.get_current_role()
returns user_role as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'staff'::user_role
  );
$$ language sql security definer;

-- Вспомогательная функция для получения компании текущего пользователя
create or replace function public.get_current_company_id()
returns uuid as $$
  select company_id from public.profiles where id = auth.uid();
$$ language sql security definer;

-- Триггер для автоматического создания профиля при регистрации через Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, name, position, company_id)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'staff'::user_role),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'position',
    nullif(new.raw_user_meta_data->>'company_id', '')::uuid
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


-- Функция для автоустановки company_id
create or replace function public.set_company_id_from_user()
returns trigger as $$
begin
  if new.company_id is null then
    new.company_id := public.get_current_company_id();
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- 4. Таблица заказчиков (Clients)
create table if not exists public.clients (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create trigger set_company_id_clients before insert on public.clients
for each row execute procedure public.set_company_id_from_user();

-- 5. Таблица мероприятий (Events)
create table if not exists public.events (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
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

create trigger set_company_id_events before insert on public.events
for each row execute procedure public.set_company_id_from_user();

-- 6. Таблица ленты активности (Activities)
create table if not exists public.activities (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  type text not null,
  description text not null,
  timestamp timestamptz not null default now(),
  "user" text not null,
  user_id uuid references auth.users(id) on delete set null
);

create trigger set_company_id_activities before insert on public.activities
for each row execute procedure public.set_company_id_from_user();

-- 7. Таблица коктейлей (Cocktails)
create table if not exists public.cocktails (
  key text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null,
  recipe jsonb not null default '{}'::jsonb,
  decorations jsonb not null default '{}'::jsonb,
  glassware jsonb not null default '{}'::jsonb,
  is_starred boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_company_id_cocktails before insert on public.cocktails
for each row execute procedure public.set_company_id_from_user();

-- 8. Таблица ингредиентов (Ingredients)
create table if not exists public.ingredients (
  key text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  category text not null,
  unit text not null default 'мл',
  price_per_unit numeric not null default 0,
  bottle_volume numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_company_id_ingredients before insert on public.ingredients
for each row execute procedure public.set_company_id_from_user();

-- 9. Таблица полуфабрикатов (Semi-products)
create table if not exists public.semi_products (
  key text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  output_volume numeric not null default 0,
  unit text not null default 'мл',
  recipe jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_company_id_semi_products before insert on public.semi_products
for each row execute procedure public.set_company_id_from_user();

-- 10. Таблица категорий (Categories)
create table if not exists public.categories (
  key text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create trigger set_company_id_categories before insert on public.categories
for each row execute procedure public.set_company_id_from_user();


-- 11. Таблица персональных приглашений (Invites)
create table if not exists public.invites (
  id text primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  role user_role not null default 'staff',
  name text,
  position text,
  token text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
);

create trigger set_company_id_invites before insert on public.invites
for each row execute procedure public.set_company_id_from_user();

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
alter table public.invites enable row level security;

-- Companies: user can read and update their own company if they are admin
create policy "Allow read own company"
  on public.companies for select
  using (id = public.get_current_company_id());

create policy "Allow admin update own company"
  on public.companies for update
  using (id = public.get_current_company_id() and public.get_current_role() = 'admin');

-- Profiles: 
create policy "Allow user read own profile and colleagues"
  on public.profiles for select
  using (company_id = public.get_current_company_id() or id = auth.uid());

create policy "Allow user update own profile"
  on public.profiles for update
  using (id = auth.uid() or (company_id = public.get_current_company_id() and public.get_current_role() = 'admin'));

-- Clients:
create policy "Allow read clients in same company"
  on public.clients for select
  using (company_id = public.get_current_company_id());

create policy "Allow admin and partner modify clients"
  on public.clients for all
  using (company_id = public.get_current_company_id() and public.get_current_role() in ('admin', 'partner'));

-- Events:
create policy "Allow read events in same company"
  on public.events for select
  using (company_id = public.get_current_company_id());

create policy "Allow admin and partner modify events"
  on public.events for all
  using (company_id = public.get_current_company_id() and public.get_current_role() in ('admin', 'partner'));

-- Activities:
create policy "Allow read activities in same company"
  on public.activities for select
  using (company_id = public.get_current_company_id());

create policy "Allow all auth insert activities in same company"
  on public.activities for insert
  with check (company_id = public.get_current_company_id());

-- Cocktails, Ingredients, Semi-Products, Categories:
create policy "Allow read cocktails in same company"
  on public.cocktails for select
  using (company_id = public.get_current_company_id());

create policy "Allow read ingredients in same company"
  on public.ingredients for select
  using (company_id = public.get_current_company_id());

create policy "Allow read semi_products in same company"
  on public.semi_products for select
  using (company_id = public.get_current_company_id());

create policy "Allow read categories in same company"
  on public.categories for select
  using (company_id = public.get_current_company_id());

create policy "Allow admin and staff modify cocktails"
  on public.cocktails for all
  using (company_id = public.get_current_company_id() and public.get_current_role() in ('admin', 'staff'));

create policy "Allow admin and staff modify ingredients"
  on public.ingredients for all
  using (company_id = public.get_current_company_id() and public.get_current_role() in ('admin', 'staff'));

create policy "Allow admin and staff modify semi_products"
  on public.semi_products for all
  using (company_id = public.get_current_company_id() and public.get_current_role() in ('admin', 'staff'));

create policy "Allow admin and staff modify categories"
  on public.categories for all
  using (company_id = public.get_current_company_id() and public.get_current_role() in ('admin', 'staff'));

-- Invites
create policy "Allow read invites in same company"
  on public.invites for select
  using (company_id = public.get_current_company_id());

create policy "Allow admin manage invites in same company"
  on public.invites for all
  using (company_id = public.get_current_company_id() and public.get_current_role() = 'admin');

-- Для регистрации: чтение инвайта без авторизации (по токену)
create policy "Allow read invite by token"
  on public.invites for select
  using (true);

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
alter publication supabase_realtime add table public.clients;
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.activities;
alter publication supabase_realtime add table public.cocktails;
alter publication supabase_realtime add table public.ingredients;
alter publication supabase_realtime add table public.semi_products;

-- ==============================================================================
-- SELF-SERVE ONBOARDING TRIGGER (Создание компании и профиля при регистрации)
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_company_id uuid;
  company_title text;
  user_name text;
begin
  company_title := coalesce(new.raw_user_meta_data->>'company_name', 'Моя Компания');
  user_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  -- 1. Создаем компанию с 7-дневным триалом
  insert into public.companies (name, status, trial_ends_at)
  values (company_title, 'trial', now() + interval '7 days')
  returning id into new_company_id;

  -- 2. Создаем профиль пользователя с ролью admin
  insert into public.profiles (id, email, role, name, company_id)
  values (new.id, new.email, 'admin', user_name, new_company_id);

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

