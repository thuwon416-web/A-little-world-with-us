-- ============================================
-- Phase 3A: Cycle Engine Schema Update
-- ============================================

-- Update cycle_logs table with new columns
alter table cycle_logs
  add column if not exists phase text check (phase in ('menstrual', 'follicular', 'ovulation', 'luteal')),
  add column if not exists fertile_window_start date,
  add column if not exists fertile_window_end date,
  add column if not exists intimacy_score integer check (intimacy_score >= 0 and intimacy_score <= 10),
  add column if not exists notes text,
  add column if not exists symptoms jsonb default '{}'::jsonb,
  add column if not exists couple_id uuid references public.couple_links(id);

-- Add index for couple_id
create index if not exists idx_cycle_logs_couple_id on cycle_logs(couple_id);

-- Update RLS policies for cycle_logs
drop policy if exists "User and linked partner can view cycle logs" on cycle_logs;

create policy "User and linked partner can view cycle logs" on cycle_logs
  for select using (
    user_id = auth.uid()
    or (
      couple_id is not null
      and exists (
        select 1 from public.couple_links cl
        where cl.id = cycle_logs.couple_id
          and cl.status = 'accepted'
          and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
      )
    )
  );

drop policy if exists "User can insert cycle logs" on cycle_logs;

create policy "User can insert cycle logs" on cycle_logs
  for insert with check (
    user_id = auth.uid()
    and (
      couple_id is null
      or exists (
        select 1 from public.couple_links cl
        where cl.id = cycle_logs.couple_id
          and cl.status = 'accepted'
          and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
      )
    )
  );

-- ============================================
-- Phase 3B: Astrology Engine Schema
-- ============================================

-- Create astrology_profiles table
create table if not exists public.astrology_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couple_links(id),
  birth_date date not null,
  western_sign text not null,
  chinese_sign text not null,
  myanmar_day text not null, -- တနင်္လာ, အင်္ဂါ, ဗုဒ္ဓဟူး, ကြာသပတေး, သောကြာ, စနေ, တနင်္ဂနွေ
  numerology_number integer check (numerology_number >= 1 and numerology_number <= 9),
  synastry_score integer check (synastry_score >= 0 and synastry_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add indexes
create index if not exists idx_astrology_profiles_user_id on astrology_profiles(user_id);
create index if not exists idx_astrology_profiles_couple_id on astrology_profiles(couple_id);

-- Enable RLS
alter table astrology_profiles enable row level security;

-- RLS policies
create policy "Users can view own profile" on astrology_profiles
  for select using (user_id = auth.uid());

create policy "Linked partners can view each other's profiles" on astrology_profiles
  for select using (
    couple_id is not null
    and exists (
      select 1 from public.couple_links cl
      where cl.id = astrology_profiles.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Users can insert own profile" on astrology_profiles
  for insert with check (
    user_id = auth.uid()
    and (
      couple_id is null
      or exists (
        select 1 from public.couple_links cl
        where cl.id = astrology_profiles.couple_id
          and cl.status = 'accepted'
          and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
      )
    )
  );

create policy "Users can update own profile" on astrology_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Add updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger astrology_profiles_updated_at
  before update on astrology_profiles
  for each row
  execute function update_updated_at_column();
