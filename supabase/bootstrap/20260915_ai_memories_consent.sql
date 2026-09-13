begin;

alter table public.ai_privacy_settings
  add column if not exists allow_ai_read_memories boolean not null default false;

comment on column public.ai_privacy_settings.allow_ai_read_memories is
  'When true, AI may read relationship_memories for user-triggered queries only.';

commit;
