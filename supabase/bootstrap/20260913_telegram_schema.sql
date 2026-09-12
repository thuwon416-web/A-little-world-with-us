begin;

create table if not exists public.telegram_memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  message_date timestamptz not null,
  sender_name text not null,
  sender_id text,
  message_text text not null,
  raw_payload jsonb,
  batch_id text,
  processed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (couple_id, message_date, sender_name, message_text)
);

create table if not exists public.extracted_entities (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  telegram_memory_id uuid references public.telegram_memories(id) on delete set null,
  category text not null,
  sub_category text,
  date_time timestamptz not null,
  quote_burmese text,
  context text,
  persons text[],
  emotional_tone text,
  batch_id text,
  created_at timestamptz not null default now()
);

create index if not exists telegram_memories_couple_message_date_idx
  on public.telegram_memories(couple_id, message_date);
create index if not exists telegram_memories_couple_processed_idx
  on public.telegram_memories(couple_id, processed);
create index if not exists extracted_entities_couple_category_date_time_idx
  on public.extracted_entities(couple_id, category, date_time);
create index if not exists extracted_entities_couple_date_time_idx
  on public.extracted_entities(couple_id, date_time);
create index if not exists extracted_entities_couple_sub_category_idx
  on public.extracted_entities(couple_id, sub_category);

alter table public.telegram_memories enable row level security;
alter table public.extracted_entities enable row level security;

drop policy if exists telegram_memories_couple_access on public.telegram_memories;
create policy telegram_memories_couple_access
  on public.telegram_memories
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

drop policy if exists extracted_entities_couple_access on public.extracted_entities;
create policy extracted_entities_couple_access
  on public.extracted_entities
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

commit;
