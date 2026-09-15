-- Phase 19.2: Splitwise-style shared finance
-- Additive migration - preserves all existing data

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
