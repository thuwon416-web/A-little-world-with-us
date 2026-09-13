begin;

create table if not exists public.relationship_memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  category text not null,
  sub_category text,
  date_time timestamptz not null,
  quote_burmese text,
  context text,
  persons text[] default '{}',
  emotional_tone text,
  importance text default 'medium' check (importance in ('critical', 'high', 'medium', 'low')),
  batch_id text,
  created_at timestamptz not null default now()
);

create index if not exists relationship_memories_couple_date_idx
  on public.relationship_memories(couple_id, date_time desc);

create index if not exists relationship_memories_couple_category_idx
  on public.relationship_memories(couple_id, category);

create index if not exists relationship_memories_couple_importance_idx
  on public.relationship_memories(couple_id, importance);

alter table public.relationship_memories enable row level security;

drop policy if exists relationship_memories_couple_access on public.relationship_memories;
create policy relationship_memories_couple_access
  on public.relationship_memories
  for all
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

comment on table public.relationship_memories is
  'AI-extracted relationship memories from Telegram chat history';
comment on column public.relationship_memories.importance is
  'critical=First events, high=Promises/Conflicts, medium=General, low=Minor';

commit;
