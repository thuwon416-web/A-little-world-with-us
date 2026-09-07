-- One authenticated, shared daily Care record for every accepted couple.
-- This deliberately replaces the former per-user daily Care uniqueness rule.

alter table public.care_daily_logs
  add column if not exists discharge text[] not null default '{}',
  add column if not exists digestion text[] not null default '{}',
  add column if not exists pregnancy_test text[] not null default '{}',
  add column if not exists contraceptives text[] not null default '{}',
  add column if not exists other_pills text[] not null default '{}',
  add column if not exists basal_temp numeric,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null;

create table if not exists public.care_cycle_settings (
  couple_id uuid primary key references public.couple_links(id) on delete cascade,
  cycle_length integer not null default 28 check (cycle_length between 15 and 60),
  period_length integer not null default 5 check (period_length between 1 and 14),
  last_period_start date,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Attach old entries to an accepted link if their owner is part of one.
update public.care_daily_logs log
set couple_id = link.id,
    created_by = coalesce(log.created_by, log.user_id),
    updated_by = coalesce(log.updated_by, log.user_id)
from public.couple_links link
where log.couple_id is null
  and link.status = 'accepted'
  and (link.inviter_id = log.user_id or link.accepted_by = log.user_id);

-- Keep the newest existing record for each shared couple/day before adding the
-- one-record-per-day constraint. Older duplicates remain only for unlinked users.
delete from public.care_daily_logs older
using public.care_daily_logs newer
where older.couple_id is not null
  and older.couple_id = newer.couple_id
  and older.log_date = newer.log_date
  and (older.updated_at, older.id) < (newer.updated_at, newer.id);

drop index if exists public.care_daily_logs_user_date_unique;
create unique index if not exists care_daily_logs_shared_day_unique
  on public.care_daily_logs(couple_id, log_date)
  where couple_id is not null;

alter table public.care_cycle_settings enable row level security;
drop policy if exists "Accepted couples manage Care settings" on public.care_cycle_settings;
create policy "Accepted couples manage Care settings" on public.care_cycle_settings for all
using (exists (select 1 from public.couple_links cl where cl.id = care_cycle_settings.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())))
with check (exists (select 1 from public.couple_links cl where cl.id = care_cycle_settings.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())));

drop policy if exists "Owners can insert care logs" on public.care_daily_logs;
create policy "Accepted couples insert shared care logs" on public.care_daily_logs for insert
with check (auth.uid() = user_id and exists (select 1 from public.couple_links cl where cl.id = care_daily_logs.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())));

-- Reminder choices follow the same accepted couple scope as daily Care logs.
alter table public.care_reminders
  add column if not exists couple_id uuid references public.couple_links(id) on delete cascade;

update public.care_reminders reminder
set couple_id = link.id
from public.couple_links link
where reminder.couple_id is null
  and link.status = 'accepted'
  and (link.inviter_id = reminder.user_id or link.accepted_by = reminder.user_id);

delete from public.care_reminders older
using public.care_reminders newer
where older.couple_id is not null
  and older.couple_id = newer.couple_id
  and older.reminder_type = newer.reminder_type
  and (older.created_at, older.id) < (newer.created_at, newer.id);

create unique index if not exists care_reminders_shared_type_unique
  on public.care_reminders(couple_id, reminder_type)
  where couple_id is not null;

drop policy if exists "Users can view own reminders" on public.care_reminders;
drop policy if exists "Users can insert own reminders" on public.care_reminders;
drop policy if exists "Users can update own reminders" on public.care_reminders;
drop policy if exists "Users can delete own reminders" on public.care_reminders;
drop policy if exists "Accepted couples manage shared Care reminders" on public.care_reminders;
create policy "Accepted couples manage shared Care reminders" on public.care_reminders for all
using (exists (select 1 from public.couple_links cl where cl.id = care_reminders.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())))
with check (auth.uid() = user_id and exists (select 1 from public.couple_links cl where cl.id = care_reminders.couple_id and cl.status = 'accepted' and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())));
