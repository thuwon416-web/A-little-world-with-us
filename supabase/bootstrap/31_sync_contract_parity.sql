-- 31_sync_contract_parity.sql
-- Production parity fix for Web <-> Mobile shared data contracts.
--
-- Apply after 30_remove_location_admin_helper.sql on an existing database.
-- Fresh bootstrap already includes these columns in 01_chat.sql; this file
-- exists so an existing deployment can be reconciled explicitly.

begin;

alter table public.messages
  add column if not exists reactions jsonb not null default '{}'::jsonb,
  add column if not exists delivered_at timestamptz,
  add column if not exists seen_at timestamptz,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists encryption_version integer;

create index if not exists messages_unseen_idx
  on public.messages(couple_id, seen_at)
  where seen_at is null;

create index if not exists messages_deleted_idx
  on public.messages(deleted_at)
  where deleted_at is null;

create index if not exists messages_reactions_gin_idx
  on public.messages using gin(reactions)
  where reactions != '{}'::jsonb;

drop function if exists public.save_care_period_dates(uuid, text[]);

alter function public.save_care_period_dates(uuid, date[])
  set search_path = '';

revoke all on function public.save_care_period_dates(uuid, date[]) from public, anon;
grant execute on function public.save_care_period_dates(uuid, date[]) to authenticated;

commit;
