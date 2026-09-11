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
create policy monthly_budgets_couple_access on public.monthly_budgets for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy bill_reminders_couple_access on public.bill_reminders for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy finance_expenses_couple_access on public.finance_expenses for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy love_streaks_couple_access on public.love_streaks for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
commit;
