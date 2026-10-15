-- Persist browser push subscriptions and mark one-time reminders after dispatch.
-- Run after the existing bootstrap migrations; this does not recreate or delete data.
alter table public.reminders
  add column if not exists web_notified_at timestamptz;

create index if not exists reminders_due_web_push_idx
  on public.reminders (scheduled_at)
  where active = true and web_notified_at is null;

create table if not exists public.web_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists web_push_subscriptions_user_id_idx
  on public.web_push_subscriptions(user_id);

alter table public.web_push_subscriptions enable row level security;
drop policy if exists web_push_subscriptions_owner_access on public.web_push_subscriptions;
create policy web_push_subscriptions_owner_access
  on public.web_push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.web_push_subscriptions to authenticated;

drop trigger if exists web_push_subscriptions_touch on public.web_push_subscriptions;
create trigger web_push_subscriptions_touch
  before update on public.web_push_subscriptions
  for each row execute function public.touch_updated_at();

-- Verify migration state.
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'reminders'
  and column_name = 'web_notified_at';

select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename = 'web_push_subscriptions';
