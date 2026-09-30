-- Safe, repeatable migration for Telegram archive imports on an existing database.
-- This does not reset or delete existing data.

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

create index if not exists telegram_memories_couple_message_date_idx
  on public.telegram_memories(couple_id, message_date);

create index if not exists telegram_memories_couple_processed_idx
  on public.telegram_memories(couple_id, processed);

alter table public.telegram_memories enable row level security;

drop policy if exists telegram_memories_couple_access on public.telegram_memories;
create policy telegram_memories_couple_access
  on public.telegram_memories
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

commit;
