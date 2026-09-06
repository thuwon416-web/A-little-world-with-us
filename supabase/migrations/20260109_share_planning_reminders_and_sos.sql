-- Shared planning, reminders, and in-app emergency alerts for an accepted pair.
-- `couple_id` in these tables references public.couples(id), not couple_links(id).

alter table public.calendar_events add column if not exists couple_id uuid references public.couples(id) on delete cascade;
alter table public.financial_goals add column if not exists couple_id uuid references public.couples(id) on delete cascade;

-- Support both older web reminder columns and the mobile reminder contract.
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  title text not null,
  message text not null default '',
  scheduled_at timestamptz,
  repeat text not null default 'none',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.reminders add column if not exists message text;
alter table public.reminders add column if not exists scheduled_at timestamptz;
alter table public.reminders add column if not exists repeat text not null default 'none';
alter table public.reminders add column if not exists active boolean not null default true;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reminders' and column_name = 'reminder_date') then
    execute 'update public.reminders set scheduled_at = reminder_date::timestamptz where scheduled_at is null and reminder_date is not null';
  end if;
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'reminders' and column_name = 'description') then
    execute 'update public.reminders set message = coalesce(message, description, '''') where message is null';
  else
    update public.reminders set message = '' where message is null;
  end if;
end $$;

-- Safely associate pre-existing private records with the owner's currently accepted pair.
update public.calendar_events e set couple_id = p.couple_id from public.profiles p where e.couple_id is null and e.user_id = p.id and p.couple_id is not null;
update public.financial_goals g set couple_id = p.couple_id from public.profiles p where g.couple_id is null and g.user_id = p.id and p.couple_id is not null;
update public.reminders r set couple_id = p.couple_id from public.profiles p where r.couple_id is null and r.user_id = p.id and p.couple_id is not null;

create index if not exists calendar_events_couple_id_idx on public.calendar_events(couple_id);
create index if not exists financial_goals_couple_id_idx on public.financial_goals(couple_id);
create index if not exists reminders_couple_scheduled_at_idx on public.reminders(couple_id, scheduled_at);

create or replace function public.is_accepted_couple_member(target_couple_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (
  select 1 from public.couple_links cl
  where cl.couple_id = target_couple_id
    and cl.status = 'accepted'
    and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
) $$;

alter table public.calendar_events enable row level security;
alter table public.financial_goals enable row level security;
alter table public.reminders enable row level security;

drop policy if exists "calendar_events_accepted_couple" on public.calendar_events;
drop policy if exists "financial_goals_accepted_couple" on public.financial_goals;
drop policy if exists "reminders_accepted_couple" on public.reminders;
drop policy if exists "Users can manage own reminders" on public.reminders;
drop policy if exists "Users can view own reminders" on public.reminders;
drop policy if exists "Linked partners can view each other's reminders" on public.reminders;
drop policy if exists "Users can insert own reminders" on public.reminders;
drop policy if exists "Users can update own reminders" on public.reminders;
drop policy if exists "Users can delete own reminders" on public.reminders;

create policy "calendar_events_accepted_couple" on public.calendar_events for all
using (public.is_accepted_couple_member(couple_id))
with check (public.is_accepted_couple_member(couple_id));
create policy "financial_goals_accepted_couple" on public.financial_goals for all
using (public.is_accepted_couple_member(couple_id))
with check (public.is_accepted_couple_member(couple_id));
create policy "reminders_accepted_couple" on public.reminders for all
using (public.is_accepted_couple_member(couple_id))
with check (public.is_accepted_couple_member(couple_id));

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);
create index if not exists emergency_alerts_couple_created_at_idx on public.emergency_alerts(couple_id, created_at desc);
alter table public.emergency_alerts enable row level security;
create policy "emergency_alerts_accepted_couple" on public.emergency_alerts for all
using (public.is_accepted_couple_member(couple_id))
with check (public.is_accepted_couple_member(couple_id) and reporter_id = auth.uid());

alter table public.messages add column if not exists couple_id uuid references public.couples(id) on delete cascade;
create index if not exists messages_couple_created_at_idx on public.messages(couple_id, created_at);
alter table public.messages enable row level security;
drop policy if exists "messages_accepted_couple" on public.messages;
create policy "messages_accepted_couple" on public.messages for all
using (public.is_accepted_couple_member(couple_id))
with check (public.is_accepted_couple_member(couple_id) and sender_id = auth.uid());

alter table public.messages drop constraint if exists messages_message_type_check;
alter table public.messages add constraint messages_message_type_check
  check (message_type in ('text', 'voice', 'photo', 'sticker', 'gif', 'file', 'video', 'audio', 'location', 'sos'));
