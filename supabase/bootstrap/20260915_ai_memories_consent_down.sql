begin;

alter table public.ai_privacy_settings
  drop column if exists allow_ai_read_memories;

commit;
