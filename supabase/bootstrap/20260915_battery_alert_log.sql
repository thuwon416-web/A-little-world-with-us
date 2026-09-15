-- Phase 16.6: Debounced low-battery alert history
begin;

create table if not exists public.battery_alert_log (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  battery_level integer not null check (battery_level between 0 and 100),
  notified_at timestamptz not null default now()
);

create index if not exists battery_alert_log_user_notified_idx
  on public.battery_alert_log(user_id, notified_at desc);

alter table public.battery_alert_log enable row level security;
drop policy if exists battery_alert_log_couple_access on public.battery_alert_log;
create policy battery_alert_log_couple_access
  on public.battery_alert_log
  for all
  using (public.is_couple_member(couple_id));

grant select, insert on public.battery_alert_log to authenticated;

commit;
