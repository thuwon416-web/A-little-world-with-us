begin;
alter table public.memories
  drop column if exists latitude,
  drop column if exists longitude,
  drop column if exists location_label;
commit;
