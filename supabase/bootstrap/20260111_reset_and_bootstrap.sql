-- A Little World With Us: destructive clean reset for the CURRENT Supabase project.
-- Keeps only the two verified auth.users records below. Run once in Supabase SQL Editor.
-- WARNING: this permanently deletes all public-schema data.
-- Empty every Storage bucket manually in the Supabase Dashboard before running this script.

do $$
begin
  if not exists (select 1 from auth.users where id = '900da207-67b7-4433-a105-90c4e4e6d9a4' and email = 'thuwon416@gmail.com') then
    raise exception 'Admin auth account does not match the supplied ID/email; reset cancelled.';
  end if;
  if not exists (select 1 from auth.users where id = '693b63dc-2262-47c9-ad81-ab9d3d0646c4' and email = 'myintmyatthu.3792@gmail.com') then
    raise exception 'Partner auth account does not match the supplied ID/email; reset cancelled.';
  end if;
end $$;

begin;

-- Storage objects must be removed through the Supabase Storage Dashboard or API.
-- Clear old Storage policies only; canonical buckets are recreated/upserted below.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname, tablename from pg_policies where schemaname = 'storage' and tablename in ('objects', 'buckets')
  loop
    execute format('drop policy if exists %I on storage.%I', policy_record.policyname, policy_record.tablename);
  end loop;
end $$;
drop schema if exists public cascade;
create schema public;
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
-- RLS decides which rows an authenticated account may access. These grants only
-- allow PostgREST to reach the tables so that those RLS policies can be evaluated.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  birth_date date,
  gender text,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  anniversary date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Shared annual dates drive visual occasions and reminders. They remain
-- private to accepted members of this couple.
create table public.couple_occasions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  month smallint not null check (month between 1 and 12),
  day smallint not null check (day between 1 and 31),
  kind text not null default 'custom' check (kind in ('anniversary','birthday','custom')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, kind, title)
);

create table public.couple_links (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id) on delete cascade,
  invite_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  check (accepted_by is null or accepted_by <> inviter_id)
);
create unique index couple_links_accepted_member_pair on public.couple_links (least(inviter_id, accepted_by), greatest(inviter_id, accepted_by)) where status = 'accepted' and accepted_by is not null;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger couples_touch before update on public.couples for each row execute function public.touch_updated_at();
create trigger couple_occasions_touch before update on public.couple_occasions for each row execute function public.touch_updated_at();
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'))
  on conflict (id) do update set email = excluded.email;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_couple_member(target_couple_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.couple_links cl where cl.couple_id = target_couple_id and cl.status = 'accepted' and auth.uid() in (cl.inviter_id, cl.accepted_by));
$$;
create or replace function public.is_location_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and email = 'thuwon416@gmail.com' and role = 'admin');
$$;
create or replace function public.is_linked_user(target_user_id uuid) returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() = target_user_id or exists (select 1 from public.couple_links cl where cl.status = 'accepted' and ((cl.inviter_id = auth.uid() and cl.accepted_by = target_user_id) or (cl.accepted_by = auth.uid() and cl.inviter_id = target_user_id)));
$$;

-- Core shared content
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  message_type text not null default 'text' check (message_type in ('text','voice','photo','sticker','gif','file','video','audio','location')),
  media_url text,
  media_duration integer,
  transcript text,
  location_payload jsonb,
  encrypted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index messages_couple_created_at_idx on public.messages(couple_id, created_at);
create trigger messages_touch before update on public.messages for each row execute function public.touch_updated_at();

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  caption text,
  image_url text,
  storage_path text,
  date date not null default current_date,
  category text not null default 'favorite' check (category in ('favorite','travel','ritual','journal')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index memories_couple_date_idx on public.memories(couple_id, date desc);
create trigger memories_touch before update on public.memories for each row execute function public.touch_updated_at();

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  date timestamptz not null, title text not null, type text, created_at timestamptz not null default now()
);
create index calendar_events_couple_date_idx on public.calendar_events(couple_id, date);
create table public.financial_goals (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, target_amount numeric not null default 0, current_amount numeric not null default 0, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create trigger financial_goals_touch before update on public.financial_goals for each row execute function public.touch_updated_at();
create table public.reminders (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, message text, scheduled_at timestamptz, repeat text not null default 'none', active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index reminders_couple_scheduled_at_idx on public.reminders(couple_id, scheduled_at);
create trigger reminders_touch before update on public.reminders for each row execute function public.touch_updated_at();

create table public.plans (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid references public.profiles(id) on delete set null, title text not null, description text, type text not null default 'goal', due_date date, status text not null default 'active', date date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.plan_items (id uuid primary key default gen_random_uuid(), plan_id uuid not null references public.plans(id) on delete cascade, title text not null, completed boolean not null default false, created_at timestamptz not null default now());
create table public.bucket_list (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid references public.profiles(id) on delete set null, title text, item text, completed boolean not null default false, completed_at timestamptz, created_at timestamptz not null default now());
create table public.todos (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, title text not null, completed boolean not null default false, created_at timestamptz not null default now());
create table public.goals (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, title text not null, description text, progress integer not null default 0, target integer not null default 100, created_at timestamptz not null default now());

-- Health, cycle, and Care. period_day identifies all period dates; cycle boundaries are calculated from contiguous ranges.
create table public.health_profiles (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, couple_id uuid references public.couples(id) on delete cascade, blood_type text, height_cm numeric, weight_kg numeric, allergies text[] not null default '{}', medications text[] not null default '{}', conditions text[] not null default '{}', emergency_contact jsonb not null default '{}'::jsonb, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.cycle_logs (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, start_date date not null, end_date date, period_start date, cycle_length integer, phase text not null default 'menstrual' check (phase in ('menstrual','follicular','ovulation','luteal')), notes text, source text, created_at timestamptz not null default now(), check (end_date is null or end_date >= start_date));
create index cycle_logs_couple_start_idx on public.cycle_logs(couple_id, start_date desc);
create table public.care_daily_logs (
  id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, log_date date not null,
  period_day boolean not null default false, mood text, symptoms text[] not null default '{}', sex text[] not null default '{}', discharge text[] not null default '{}', digestion text[] not null default '{}', pregnancy_test text[] not null default '{}', ovulation_test text,
  contraceptives text[] not null default '{}', other_pills text[] not null default '{}', medication_taken boolean, water_intake integer, weight numeric, basal_temp numeric, notes text, activities text[] not null default '{}', other_tags text[] not null default '{}', created_by uuid references public.profiles(id) on delete set null, updated_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (couple_id, log_date)
);
create index care_daily_logs_couple_date_idx on public.care_daily_logs(couple_id, log_date desc);
create trigger care_daily_logs_touch before update on public.care_daily_logs for each row execute function public.touch_updated_at();
create table public.care_cycle_settings (couple_id uuid primary key references public.couples(id) on delete cascade, cycle_length integer not null default 28 check (cycle_length between 15 and 60), period_length integer not null default 5 check (period_length between 1 and 14), last_period_start date, updated_by uuid references public.profiles(id) on delete set null, updated_at timestamptz not null default now());
create table public.care_reminders (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, reminder_type text not null check (reminder_type in ('pms','period','fertile','symptom')), enabled boolean not null default true, created_at timestamptz not null default now(), unique(couple_id, reminder_type));
create table public.mood_logs (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, mood text not null, note text, date timestamptz not null default now(), created_at timestamptz not null default now());
create table public.care_logs (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, type text not null, completed_at timestamptz not null default now(), created_at timestamptz not null default now());
create table public.favorites (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, item_type text not null, item_id text not null, created_at timestamptz not null default now(), unique(couple_id, item_type, item_id));

-- Couple content retained by the other private routes.
create table public.vault_items (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, title text not null, content text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  content text not null,
  unlock_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','revealed','cancelled')),
  revealed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (recipient_id <> user_id)
);
create index time_capsules_recipient_unlock_idx on public.time_capsules(recipient_id, unlock_at);
create trigger time_capsules_touch before update on public.time_capsules for each row execute function public.touch_updated_at();
create table public.time_capsule_attachments (
  id uuid primary key default gen_random_uuid(),
  capsule_id uuid not null references public.time_capsules(id) on delete cascade,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image','file')),
  created_at timestamptz not null default now()
);
create table public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  requested_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ready' check (status in ('ready','failed')),
  expires_at timestamptz not null default now() + interval '24 hours',
  created_at timestamptz not null default now()
);
create table public.astrology_profiles (id uuid primary key default gen_random_uuid(), couple_id uuid references public.couples(id) on delete cascade, user_id uuid not null unique references public.profiles(id) on delete cascade, birth_date date, data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Personal security/device data.
create table public.user_settings (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade, lock_pin_hash text, settings jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, title text not null, body text, scheduled_at timestamptz, read_at timestamptz, created_at timestamptz not null default now());
create table public.onboarding_progress (user_id uuid primary key references public.profiles(id) on delete cascade, data jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table public.offline_sync (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, payload jsonb not null, created_at timestamptz not null default now());
create table public.feedback (id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null, feedback text not null, created_at timestamptz not null default now());

-- Location: both accounts write; only the designated admin can read pair data.
create table public.user_locations (user_id uuid primary key references public.profiles(id) on delete cascade, couple_id uuid not null references public.couples(id) on delete cascade, latitude double precision not null, longitude double precision not null, accuracy double precision, place_label text, battery_level integer check (battery_level between 0 and 100), is_charging boolean, network_type text, device_name text, app_version text, last_sync_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.location_history (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, couple_id uuid not null references public.couples(id) on delete cascade, latitude double precision not null, longitude double precision not null, accuracy double precision, place_label text, captured_at timestamptz not null default now());
create index location_history_couple_captured_idx on public.location_history(couple_id, captured_at desc);
create table public.location_sharing_settings (user_id uuid primary key references public.profiles(id) on delete cascade, enabled boolean not null default false, last_permission_state text not null default 'unknown' check (last_permission_state in ('unknown','granted','denied')), updated_at timestamptz not null default now());
create table public.location_address_cache (id uuid primary key default gen_random_uuid(), grid_key text not null unique, latitude double precision not null, longitude double precision not null, label text not null, provider text not null default 'nominatim', cached_at timestamptz not null default now());
create table public.push_devices (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, expo_push_token text not null unique, platform text not null check (platform in ('android','ios')), device_id text, preferences jsonb not null default '{"sos":true,"location_stale":true,"sharing":true}'::jsonb, updated_at timestamptz not null default now());
create table public.saved_places (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, created_by uuid not null references public.profiles(id) on delete cascade, name text not null, latitude double precision not null, longitude double precision not null, radius_meters integer not null default 100 check (radius_meters between 25 and 10000), created_at timestamptz not null default now());
create table public.emergency_alerts (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, reporter_id uuid not null references public.profiles(id) on delete cascade, latitude double precision, longitude double precision, message text, created_at timestamptz not null default now(), resolved_at timestamptz, resolved_by uuid references public.profiles(id) on delete set null);
create table public.call_signals (id uuid primary key default gen_random_uuid(), couple_id uuid not null references public.couples(id) on delete cascade, caller_id uuid not null references public.profiles(id) on delete cascade, receiver_id uuid not null references public.profiles(id) on delete cascade, type text not null check (type in ('audio','video')), status text not null check (status in ('calling','ringing','in_call','ended','rejected')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());

-- Default privileges above cover future tables; these cover every table created
-- by this bootstrap even when the SQL editor role has custom defaults.
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Older screens still submit user-owned records without couple_id. Fill it from the
-- caller's accepted link before RLS is evaluated, so the canonical shared scope is kept.
create or replace function public.assign_active_couple_id() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.couple_id is null then
    select cl.couple_id into new.couple_id
    from public.couple_links cl
    where cl.status = 'accepted' and new.user_id in (cl.inviter_id, cl.accepted_by)
    order by cl.accepted_at desc nulls last
    limit 1;
  end if;
  if new.couple_id is null then
    raise exception 'An accepted couple link is required before creating shared data.';
  end if;
  return new;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['calendar_events','financial_goals','reminders','plans','bucket_list','todos','goals','health_profiles','cycle_logs','care_daily_logs','care_reminders','mood_logs','care_logs','favorites','vault_items','time_capsules','astrology_profiles'] loop
    execute format('create trigger %I before insert on public.%I for each row execute function public.assign_active_couple_id()', table_name || '_assign_couple', table_name);
  end loop;
end $$;

-- Generic couple RLS for all shared content tables.
alter table public.profiles enable row level security;
create policy profiles_read_own_or_location_admin on public.profiles for select using (id = auth.uid() or (public.is_location_admin() and public.is_linked_user(id)));
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
alter table public.couples enable row level security;
create policy couples_member_access on public.couples for all using (public.is_couple_member(id)) with check (public.is_couple_member(id));
alter table public.couple_links enable row level security;
create policy couple_links_member_access on public.couple_links for select using (auth.uid() in (inviter_id, accepted_by));

alter table public.messages enable row level security;
create policy messages_couple_read on public.messages for select using (public.is_couple_member(couple_id));
create policy messages_couple_insert on public.messages for insert with check (public.is_couple_member(couple_id) and sender_id = auth.uid());
create policy messages_couple_update on public.messages for update using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy messages_couple_delete on public.messages for delete using (public.is_couple_member(couple_id));

do $$ declare table_name text; begin
  foreach table_name in array array['memories','calendar_events','financial_goals','reminders','plans','bucket_list','todos','goals','health_profiles','cycle_logs','care_daily_logs','care_cycle_settings','care_reminders','mood_logs','care_logs','favorites','vault_items','astrology_profiles','emergency_alerts','call_signals','export_jobs','couple_occasions'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy %I on public.%I for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id))', table_name || '_couple_access', table_name);
  end loop;
end $$;

alter table public.plan_items enable row level security;
create policy plan_items_couple_access on public.plan_items for all using (exists (select 1 from public.plans p where p.id = plan_id and public.is_couple_member(p.couple_id))) with check (exists (select 1 from public.plans p where p.id = plan_id and public.is_couple_member(p.couple_id)));
alter table public.time_capsules enable row level security;
create policy time_capsules_creator_manage on public.time_capsules for all using (user_id = auth.uid()) with check (user_id = auth.uid() and public.is_couple_member(couple_id));
create policy time_capsules_recipient_read_revealed on public.time_capsules for select using (recipient_id = auth.uid() and status = 'revealed' and unlock_at <= now());
alter table public.time_capsule_attachments enable row level security;
create policy time_capsule_attachments_creator_access on public.time_capsule_attachments for all using (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.user_id = auth.uid())) with check (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.user_id = auth.uid()));
create policy time_capsule_attachments_recipient_read on public.time_capsule_attachments for select using (exists (select 1 from public.time_capsules c where c.id = capsule_id and c.recipient_id = auth.uid() and c.status = 'revealed' and c.unlock_at <= now()));
alter table public.user_settings enable row level security;
create policy user_settings_own_access on public.user_settings for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.notifications enable row level security;
create policy notifications_own_access on public.notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.onboarding_progress enable row level security;
create policy onboarding_own_access on public.onboarding_progress for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.offline_sync enable row level security;
create policy offline_sync_own_access on public.offline_sync for all using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.feedback enable row level security;
create policy feedback_insert_authenticated on public.feedback for insert with check (auth.uid() = user_id);

alter table public.user_locations enable row level security;
create policy locations_owner_write on public.user_locations for insert with check (auth.uid() = user_id and public.is_couple_member(couple_id) and exists (select 1 from public.location_sharing_settings s where s.user_id = auth.uid() and s.enabled));
create policy locations_owner_update on public.user_locations for update using (auth.uid() = user_id) with check (auth.uid() = user_id and public.is_couple_member(couple_id) and exists (select 1 from public.location_sharing_settings s where s.user_id = auth.uid() and s.enabled));
create policy locations_admin_pair_read on public.user_locations for select using (public.is_location_admin() and public.is_couple_member(couple_id));
alter table public.location_history enable row level security;
create policy location_history_owner_insert on public.location_history for insert with check (auth.uid() = user_id and public.is_couple_member(couple_id) and exists (select 1 from public.location_sharing_settings s where s.user_id = auth.uid() and s.enabled));
create policy location_history_admin_pair_read on public.location_history for select using (public.is_location_admin() and public.is_couple_member(couple_id));
alter table public.location_sharing_settings enable row level security;
create policy location_sharing_owner_access on public.location_sharing_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.location_address_cache enable row level security;
create policy location_address_admin_read on public.location_address_cache for select using (public.is_location_admin());
alter table public.push_devices enable row level security;
create policy push_devices_owner_access on public.push_devices for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
alter table public.saved_places enable row level security;
create policy saved_places_admin_access on public.saved_places for all using (public.is_location_admin() and public.is_couple_member(couple_id)) with check (public.is_location_admin() and public.is_couple_member(couple_id));

-- Private storage buckets with couple-aware paths (<owner-uuid>/...).
insert into storage.buckets (id, name, public) values ('memories','memories',false),('gallery','gallery',false),('chat_files','chat_files',false),('chat_photos','chat_photos',false),('voice_messages','voice_messages',false),('surprises','surprises',false)
on conflict (id) do update set name = excluded.name, public = excluded.public;
create or replace function public.has_accepted_couple() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.couple_links where status = 'accepted' and auth.uid() in (inviter_id, accepted_by));
$$;
create policy shared_media_read on storage.objects for select using (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and public.has_accepted_couple());
create policy shared_media_insert on storage.objects for insert with check (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and owner = auth.uid() and public.has_accepted_couple());
create policy shared_media_update on storage.objects for update using (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and owner = auth.uid());
create policy shared_media_delete on storage.objects for delete using (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and (owner = auth.uid() or public.has_accepted_couple()));
create policy surprise_media_creator_access on storage.objects for all using (bucket_id = 'surprises' and owner = auth.uid()) with check (bucket_id = 'surprises' and owner = auth.uid() and public.has_accepted_couple());
create policy surprise_media_recipient_read on storage.objects for select using (bucket_id = 'surprises' and exists (select 1 from public.time_capsule_attachments a join public.time_capsules c on c.id = a.capsule_id where a.storage_path = name and c.recipient_id = auth.uid() and c.status = 'revealed' and c.unlock_at <= now()));

-- Preserve the supplied accounts, create their profiles, and directly accept the pair.
insert into public.profiles (id, email, role)
select id, email, case when email = 'thuwon416@gmail.com' then 'admin' else 'user' end
from auth.users where id in ('900da207-67b7-4433-a105-90c4e4e6d9a4','693b63dc-2262-47c9-ad81-ab9d3d0646c4');
insert into public.couples (name) values ('A Little World With Us');
insert into public.couple_links (couple_id, inviter_id, accepted_by, status, accepted_at)
select id, '900da207-67b7-4433-a105-90c4e4e6d9a4', '693b63dc-2262-47c9-ad81-ab9d3d0646c4', 'accepted', now()
from public.couples order by created_at desc limit 1;

-- Flo import. Adjacent or overlapping entries are merged into one menstrual range.
with flo_raw(start_date, end_date) as (
  values
  ('2024-05-06'::date,'2024-05-10'::date),('2024-06-06','2024-06-10'),('2024-07-03','2024-07-06'),('2024-08-03','2024-08-06'),('2024-08-27','2024-08-31'),('2024-09-01','2024-09-02'),('2024-10-21','2024-10-25'),('2024-11-16','2024-11-20'),('2024-12-15','2024-12-19'),('2025-01-11','2025-01-15'),('2025-02-03','2025-02-07'),('2025-03-01','2025-03-05'),('2025-03-26','2025-03-30'),('2025-04-02','2025-04-06'),('2025-05-02','2025-05-05'),('2025-05-17','2025-05-21'),('2025-05-31','2025-05-31'),('2025-06-01','2025-06-04'),('2025-06-12','2025-06-16'),('2025-07-09','2025-07-11'),('2025-08-06','2025-08-09'),('2025-08-17','2025-08-21'),('2025-08-26','2025-08-31'),('2025-09-01','2025-09-02'),('2025-09-06','2025-09-11'),('2025-09-28','2025-09-30'),('2025-10-01','2025-10-02'),('2025-10-25','2025-10-29'),('2025-11-20','2025-11-24'),('2025-12-14','2025-12-19'),('2026-01-10','2026-01-13'),('2026-02-08','2026-02-11'),('2026-03-10','2026-03-10'),('2026-04-02','2026-04-06'),('2026-05-02','2026-05-05'),('2026-05-31','2026-05-31'),('2026-06-01','2026-06-04'),('2026-07-22','2026-07-26'),('2026-08-17','2026-08-21'),('2026-08-26','2026-08-31'),('2026-09-01','2026-09-02'),('2026-09-06','2026-09-11')
), ordered as (
  select *, lag(end_date) over (order by start_date, end_date) as prior_end from flo_raw
), marked as (
  select *, sum(case when prior_end is null or start_date > prior_end + 1 then 1 else 0 end) over (order by start_date, end_date) as grp from ordered
), flo_periods as (
  select min(start_date) as start_date, max(end_date) as end_date from marked group by grp
)
insert into public.cycle_logs (couple_id,user_id,start_date,end_date,phase,notes,source)
select pair.couple_id,'693b63dc-2262-47c9-ad81-ab9d3d0646c4',period.start_date,period.end_date,'menstrual','Imported from Flo','flo_import'
from flo_periods period cross join (select id as couple_id from public.couples order by created_at desc limit 1) pair;
insert into public.care_daily_logs (couple_id,user_id,log_date,period_day,created_by,updated_by)
select period.couple_id,period.user_id,days::date,true,period.user_id,period.user_id
from public.cycle_logs period cross join lateral generate_series(period.start_date,period.end_date,'1 day'::interval) days
where period.source = 'flo_import';
insert into public.care_cycle_settings (couple_id,cycle_length,period_length,last_period_start,updated_by)
select id,28,5,(select max(start_date) from public.cycle_logs where source = 'flo_import'),'693b63dc-2262-47c9-ad81-ab9d3d0646c4'
from public.couples order by created_at desc limit 1;

insert into public.location_sharing_settings (user_id, enabled, last_permission_state)
values ('900da207-67b7-4433-a105-90c4e4e6d9a4', false, 'unknown'), ('693b63dc-2262-47c9-ad81-ab9d3d0646c4', false, 'unknown');

create or replace function public.purge_expired_location_history() returns void language sql security definer set search_path = public as $$ delete from public.location_history where captured_at < now() - interval '7 days'; $$;
commit;

-- Enable database-side retention only when pg_cron is already available.
-- Dynamic SQL avoids a compile-time dependency on the optional cron schema.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute 'select cron.unschedule(jobid) from cron.job where jobname = ''purge-location-history''';
    execute 'select cron.schedule(''purge-location-history'', ''15 3 * * *'', ''select public.purge_expired_location_history()'')';
  else
    raise notice 'pg_cron is unavailable; schedule public.purge_expired_location_history() externally once per day.';
  end if;
end $$;

-- Realtime events used by chat and the admin's live map.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then alter publication supabase_realtime add table public.messages; end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_locations') then alter publication supabase_realtime add table public.user_locations; end if;
end $$;

select 'Reset complete' as status, (select id from public.couples limit 1) as couple_id, (select count(*) from public.cycle_logs where source = 'flo_import') as imported_flo_periods;
