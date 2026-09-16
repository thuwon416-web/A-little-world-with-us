-- ----------------------------------------------------------------
-- 02_wellness.sql - Wellness features
-- ----------------------------------------------------------------
-- Source files merged:
--   20260911_wellness_categories_native.sql
--   20260915_wellness_entries.sql
--
-- Depends on: 00_core.sql
-- Run order: 00 -> 01 -> 02 -> ... -> 10
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- SECTION - 20260911_wellness_categories_native.sql
-- ----------------------------------------------------------------
begin;

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null check (activity_type in ('workout', 'quest', 'game')),
  activity_id text not null,
  completed_at timestamptz not null default now()
);

create index if not exists wellness_logs_user_completed_idx
  on public.wellness_logs(user_id, completed_at desc);

alter table public.wellness_logs enable row level security;

drop policy if exists wellness_logs_owner_access on public.wellness_logs;
create policy wellness_logs_owner_access on public.wellness_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;

-- ----------------------------------------------------------------
-- SECTION - 20260915_wellness_entries.sql
-- ----------------------------------------------------------------
-- Phase 10.2c-3b: Shared wellness entries for cross-platform sync
-- Used by critical wellness boards (gratitude, notes, promises, check-in, apology)

begin;

create table if not exists public.wellness_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  board_id text not null check (char_length(board_id) between 1 and 60),
  content text not null check (char_length(content) between 1 and 2000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists wellness_entries_couple_board_idx
  on public.wellness_entries(couple_id, board_id, created_at desc);

create index if not exists wellness_entries_author_idx
  on public.wellness_entries(author_id);

create trigger wellness_entries_touch
  before update on public.wellness_entries
  for each row execute function public.touch_updated_at();

alter table public.wellness_entries enable row level security;

drop policy if exists wellness_entries_couple_access on public.wellness_entries;
create policy wellness_entries_couple_access
  on public.wellness_entries
  for all
  using (public.is_couple_member(couple_id))
  with check (
    public.is_couple_member(couple_id)
    and author_id = auth.uid()
  );

grant select, insert, update, delete on public.wellness_entries to authenticated;

commit;
