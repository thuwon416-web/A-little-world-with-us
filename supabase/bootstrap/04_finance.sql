-- ----------------------------------------------------------------
-- 04_finance.sql - Finance features
-- ----------------------------------------------------------------
-- Source files merged:
--   20260911_advanced_features_native.sql
--   20260915_finance_splitwise.sql
--
-- Depends on: 00_core.sql
-- Run order: 00 -> 01 -> 02 -> ... -> 10
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- SECTION - 20260911_advanced_features_native.sql
-- ----------------------------------------------------------------
begin;
create table if not exists public.monthly_budgets (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  amount numeric not null check (amount >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (couple_id, month)
);
create table if not exists public.bill_reminders (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, title text not null, amount numeric not null default 0 check (amount >= 0),
  due_date date not null, repeat text not null default 'monthly' check (repeat in ('none','weekly','monthly','yearly')), created_at timestamptz not null default now()
);
create table if not exists public.finance_expenses (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, title text not null, amount numeric not null check (amount >= 0),
  spent_at date not null default current_date, category text not null default 'other', created_at timestamptz not null default now()
);
create table if not exists public.love_streaks (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0), last_check_in timestamptz, updated_at timestamptz not null default now()
);
create index if not exists bill_reminders_couple_due_idx on public.bill_reminders(couple_id, due_date);
create index if not exists finance_expenses_couple_spent_idx on public.finance_expenses(couple_id, spent_at);
alter table public.monthly_budgets enable row level security;
alter table public.bill_reminders enable row level security;
alter table public.finance_expenses enable row level security;
alter table public.love_streaks enable row level security;
drop policy if exists monthly_budgets_couple_access on public.monthly_budgets;
create policy monthly_budgets_couple_access on public.monthly_budgets for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
drop policy if exists bill_reminders_couple_access on public.bill_reminders;
create policy bill_reminders_couple_access on public.bill_reminders for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
drop policy if exists finance_expenses_couple_access on public.finance_expenses;
create policy finance_expenses_couple_access on public.finance_expenses for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
drop policy if exists love_streaks_couple_access on public.love_streaks;
create policy love_streaks_couple_access on public.love_streaks for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
commit;

-- ----------------------------------------------------------------
-- SECTION - 20260915_finance_splitwise.sql
-- ----------------------------------------------------------------
-- Phase 19.2: Splitwise-style shared finance
-- Additive migration — preserves all existing data

begin;

alter table public.finance_expenses
  add column if not exists paid_by uuid references public.profiles(id) on delete set null,
  add column if not exists split_type text not null default 'equal'
    check (split_type in ('equal', 'percentage', 'custom')),
  add column if not exists split_with uuid references public.profiles(id) on delete set null,
  add column if not exists split_percentage numeric
    check (split_percentage is null or (split_percentage >= 0 and split_percentage <= 100)),
  add column if not exists is_settled boolean not null default false,
  add column if not exists notes text check (notes is null or char_length(notes) <= 500),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists finance_expenses_unsettled_idx
  on public.finance_expenses(couple_id, is_settled, spent_at desc)
  where is_settled = false;

create index if not exists finance_expenses_paid_by_idx
  on public.finance_expenses(couple_id, paid_by);

drop trigger if exists finance_expenses_touch on public.finance_expenses;
create trigger finance_expenses_touch
  before update on public.finance_expenses
  for each row execute function public.touch_updated_at();

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid not null references public.profiles(id) on delete cascade,
  amount numeric not null check (amount > 0),
  notes text check (notes is null or char_length(notes) <= 500),
  settled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (from_user <> to_user)
);

create index if not exists settlements_couple_settled_idx
  on public.settlements(couple_id, settled_at desc);

create index if not exists settlements_users_idx
  on public.settlements(couple_id, from_user, to_user);

alter table public.settlements enable row level security;

drop policy if exists settlements_couple_access on public.settlements;
create policy settlements_couple_access
  on public.settlements
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and from_user = auth.uid());

grant select, insert, update, delete on public.settlements to authenticated;

commit;
