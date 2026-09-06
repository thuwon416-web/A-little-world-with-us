-- One current row per device plus a short, auditable route history.
alter table public.user_locations
  add column if not exists battery_level integer check (battery_level between 0 and 100),
  add column if not exists is_charging boolean,
  add column if not exists network_type text,
  add column if not exists device_name text,
  add column if not exists app_version text;

create table if not exists public.location_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision,
  captured_at timestamptz not null default now()
);

create index if not exists location_history_user_captured_idx on public.location_history(user_id, captured_at desc);
create index if not exists location_history_captured_idx on public.location_history(captured_at desc);
alter table public.location_history enable row level security;

create or replace function public.is_location_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

drop policy if exists "Location owners insert history" on public.location_history;
drop policy if exists "Location admin reads history" on public.location_history;
create policy "Location owners insert history" on public.location_history
  for insert with check (auth.uid() = user_id);
create policy "Location admin reads history" on public.location_history
  for select using (public.is_location_admin());

drop policy if exists "Location admin reads latest locations" on public.user_locations;
create policy "Location admin reads latest locations" on public.user_locations
  for select using (public.is_location_admin());

-- Run daily through Supabase Cron / scheduled Edge Function:
-- delete from public.location_history where captured_at < now() - interval '7 days';
