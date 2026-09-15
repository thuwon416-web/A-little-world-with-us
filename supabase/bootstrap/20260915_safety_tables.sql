-- Phase 16.2: Safety tables for geofencing, SOS resolution, and check-ins
-- Additive migration — preserves all existing data

begin;

alter table public.emergency_alerts
  add column if not exists accuracy double precision;

comment on column public.emergency_alerts.accuracy is
  'GPS accuracy in meters at the time of SOS';

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  relationship text check (relationship is null or char_length(relationship) <= 50),
  phone text check (phone is null or char_length(phone) between 5 and 30),
  email text check (email is null or char_length(email) between 5 and 200),
  priority integer not null default 1 check (priority between 1 and 10),
  notify_on_sos boolean not null default true,
  notify_on_checkin_missed boolean not null default false,
  notify_on_low_battery boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create index if not exists emergency_contacts_couple_active_idx
  on public.emergency_contacts(couple_id, is_active) where is_active = true;

drop trigger if exists emergency_contacts_touch on public.emergency_contacts;
create trigger emergency_contacts_touch
  before update on public.emergency_contacts
  for each row execute function public.touch_updated_at();

alter table public.emergency_contacts enable row level security;
drop policy if exists emergency_contacts_couple_access on public.emergency_contacts;
create policy emergency_contacts_couple_access
  on public.emergency_contacts
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());

grant select, insert, update, delete on public.emergency_contacts to authenticated;

create table if not exists public.safety_checkins (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  checkin_type text not null check (checkin_type in ('safe', 'need_help', 'home')),
  status text not null default 'pending' check (status in ('pending', 'acknowledged', 'completed', 'cancelled', 'expired')),
  message text check (message is null or char_length(message) <= 500),
  latitude double precision,
  longitude double precision,
  accuracy double precision,
  expected_until timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists safety_checkins_couple_status_idx
  on public.safety_checkins(couple_id, status, created_at desc);
create index if not exists safety_checkins_user_created_idx
  on public.safety_checkins(user_id, created_at desc);
create index if not exists safety_checkins_pending_idx
  on public.safety_checkins(couple_id, expected_until)
  where status = 'pending' and expected_until is not null;

drop trigger if exists safety_checkins_touch on public.safety_checkins;
create trigger safety_checkins_touch
  before update on public.safety_checkins
  for each row execute function public.touch_updated_at();

alter table public.safety_checkins enable row level security;
drop policy if exists safety_checkins_couple_access on public.safety_checkins;
create policy safety_checkins_couple_access
  on public.safety_checkins
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and user_id = auth.uid());

grant select, insert, update, delete on public.safety_checkins to authenticated;

create table if not exists public.geofence_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  saved_place_id uuid not null references public.saved_places(id) on delete cascade,
  event_type text not null check (event_type in ('entered', 'exited')),
  latitude double precision not null,
  longitude double precision not null,
  occurred_at timestamptz not null default now(),
  notified boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists geofence_events_couple_occurred_idx
  on public.geofence_events(couple_id, occurred_at desc);
create index if not exists geofence_events_user_place_idx
  on public.geofence_events(user_id, saved_place_id, occurred_at desc);
create index if not exists geofence_events_unnotified_idx
  on public.geofence_events(notified, occurred_at)
  where notified = false;

alter table public.geofence_events enable row level security;
drop policy if exists geofence_events_couple_access on public.geofence_events;
create policy geofence_events_couple_access
  on public.geofence_events
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id) and user_id = auth.uid());

grant select, insert, update, delete on public.geofence_events to authenticated;

commit;
