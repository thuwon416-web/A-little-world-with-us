-- ============================================
-- Phase 5: Health Profile
-- ============================================

-- Create health_profiles table
create table if not exists public.health_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete set null,
  blood_type text check (blood_type in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  height_cm integer check (height_cm > 0 and height_cm < 300),
  weight_kg numeric check (weight_kg > 0 and weight_kg < 500),
  allergies jsonb default '[]'::jsonb,
  medications jsonb default '[]'::jsonb,
  conditions jsonb default '[]'::jsonb,
  emergency_contact jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_health_profiles_user_id on health_profiles(user_id);
create index if not exists idx_health_profiles_couple_id on health_profiles(couple_id);

alter table health_profiles enable row level security;

-- RLS policies
create policy "Users can view own profile" on health_profiles
  for select using (user_id = auth.uid());

create policy "Linked partners can view each other's profiles" on health_profiles
  for select using (
    couple_id is not null
    and exists (
      select 1 from public.couple_links cl
      where cl.id = health_profiles.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Users can insert own profile" on health_profiles
  for insert with check (user_id = auth.uid());

create policy "Users can update own profile" on health_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own profile" on health_profiles
  for delete using (user_id = auth.uid());

-- Add updated_at trigger
create trigger health_profiles_updated_at
  before update on health_profiles
  for each row
  execute function update_updated_at_column();
