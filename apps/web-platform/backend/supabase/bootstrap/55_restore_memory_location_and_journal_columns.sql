-- Restore schema fields required by Memory Map and journal memories.
-- Safe for existing databases: additive only, preserving all existing rows.
begin;

alter table public.memories
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_label text,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists memories_location_idx
  on public.memories(couple_id, latitude, longitude)
  where latitude is not null and longitude is not null;

create index if not exists memories_journal_recent_idx
  on public.memories(couple_id, date desc)
  where category = 'journal';

commit;
