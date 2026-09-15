begin;

drop index if exists public.messages_unseen_idx;
drop index if exists public.messages_reactions_gin_idx;

alter table public.messages
  drop column if exists reactions,
  drop column if exists delivered_at,
  drop column if exists seen_at,
  drop column if exists edited_at;

commit;
