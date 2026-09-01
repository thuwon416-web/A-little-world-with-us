-- ============================================
-- Phase 4: Couple System Enhancement
-- ============================================

-- Create couples table for couple metadata
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  name text,
  anniversary date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_couples_created_at on couples(created_at);

alter table couples enable row level security;

-- RLS policies for couples
create policy "Linked users can view their couple" on couples
  for select using (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = couples.id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked users can update their couple" on couples
  for update using (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = couples.id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

-- Update couple_links to reference couples table
alter table couple_links
  add column if not exists couple_id uuid references public.couples(id) on delete cascade;

create index if not exists idx_couple_links_couple_id on couple_links(couple_id);

-- Ensure indexes exist for couple_links
create index if not exists idx_couple_links_inviter on couple_links(inviter_id);
create index if not exists idx_couple_links_accepted_by on couple_links(accepted_by);

-- Add couple_id to profiles
alter table profiles
  add column if not exists couple_id uuid references public.couples(id) on delete set null;

create index if not exists idx_profiles_couple_id on profiles(couple_id);

-- Update profiles RLS to allow viewing couple_id
drop policy if exists "profiles_own_data_only" on profiles;

create policy "profiles_own_data_only" on profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Add couple_id to tables that need it (if they exist)
-- bucket_items (if exists in wellness schema)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'bucket_items') then
    alter table bucket_items
      add column if not exists couple_id uuid references public.couples(id) on delete set null;
    create index if not exists idx_bucket_items_couple_id on bucket_items(couple_id);
  end if;
end $$;

-- calendar_events (if exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'calendar_events') then
    alter table calendar_events
      add column if not exists couple_id uuid references public.couples(id) on delete set null;
    create index if not exists idx_calendar_events_couple_id on calendar_events(couple_id);
  end if;
end $$;

-- memory_logs (if exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_name = 'memory_logs') then
    alter table memory_logs
      add column if not exists couple_id uuid references public.couples(id) on delete set null;
    create index if not exists idx_memory_logs_couple_id on memory_logs(couple_id);
  end if;
end $$;

-- Updated trigger for couples
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger couples_updated_at
  before update on couples
  for each row
  execute function update_updated_at_column();

-- Function to auto-link couple when invite is accepted
create or replace function link_couple_on_accept()
returns trigger as $$
begin
  -- If the couple_link has a couple_id, update the profiles
  if new.couple_id is not null and new.status = 'accepted' then
    update public.profiles
    set couple_id = new.couple_id
    where id = new.inviter_id or id = new.accepted_by;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger couple_links_accept_trigger
  after update on couple_links
  for each row
  when (old.status is distinct from new.status and new.status = 'accepted')
  execute function link_couple_on_accept();
