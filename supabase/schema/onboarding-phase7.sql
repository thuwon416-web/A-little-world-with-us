-- ============================================
-- Phase 7: Onboarding Flow
-- ============================================

-- Create onboarding_progress table
create table if not exists public.onboarding_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  current_step integer not null default 1,
  completed_steps jsonb default '[]'::jsonb,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_progress_user_id on onboarding_progress(user_id);

alter table onboarding_progress enable row level security;

-- RLS policies
create policy "Users can view own progress" on onboarding_progress
  for select using (user_id = auth.uid());

create policy "Users can insert own progress" on onboarding_progress
  for insert with check (user_id = auth.uid());

create policy "Users can update own progress" on onboarding_progress
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Ensure the update_updated_at_column function exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at trigger
create trigger onboarding_progress_updated_at
  before update on onboarding_progress
  for each row
  execute function update_updated_at_column();
