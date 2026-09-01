-- ============================================
-- Phase 8: PWA Offline Support
-- ============================================

-- Create offline_sync table for background sync
create table if not exists public.offline_sync (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action_type text not null check (action_type in ('create', 'update', 'delete')),
  table_name text not null,
  payload jsonb not null,
  synced boolean default false,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);

create index if not exists idx_offline_sync_user_id on offline_sync(user_id);
create index if not exists idx_offline_sync_synced on offline_sync(synced);

alter table offline_sync enable row level security;

-- RLS policies
create policy "Users can view own offline sync" on offline_sync
  for select using (user_id = auth.uid());

create policy "Users can insert own offline sync" on offline_sync
  for insert with check (user_id = auth.uid());

create policy "Users can update own offline sync" on offline_sync
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own offline sync" on offline_sync
  for delete using (user_id = auth.uid());

-- Ensure the update_updated_at_column function exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at column if not exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'offline_sync' and column_name = 'updated_at') then
    alter table offline_sync add column updated_at timestamptz not null default now();
  end if;
end $$;

-- Add updated_at trigger
create trigger offline_sync_updated_at
  before update on offline_sync
  for each row
  execute function update_updated_at_column();
