begin;

alter table public.memories
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists location_label text;

create index if not exists memories_location_idx
  on public.memories(couple_id, latitude, longitude)
  where latitude is not null and longitude is not null;

comment on column public.memories.latitude is
  'Optional GPS latitude where the memory was captured';

commit;
