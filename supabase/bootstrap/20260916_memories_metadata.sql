-- Phase 17.0 — memories.metadata for journal entries (mood_tag, voice_url, ai_reflection)
alter table public.memories
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists memories_journal_recent_idx
  on public.memories(couple_id, date desc)
  where category = 'journal';
