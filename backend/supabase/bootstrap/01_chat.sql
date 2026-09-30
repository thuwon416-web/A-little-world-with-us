-- ----------------------------------------------------------------
-- 01_chat.sql - Chat features
-- ----------------------------------------------------------------
-- Source files merged:
--   20260911_chat_media_parity.sql
--   20260915_telegram_features.sql
--
-- Depends on: 00_core.sql
-- Run order: 00 -> 01 -> ... -> 10
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- SECTION - 20260911_chat_media_parity.sql
-- ----------------------------------------------------------------
-- Chat media parity: reply metadata and indexes used by Native and Web chat.
alter table public.messages
  add column if not exists reply_to uuid references public.messages(id) on delete set null;

create index if not exists messages_reply_to_idx
  on public.messages(reply_to);

alter table public.messages
  drop constraint if exists check_message_type,
  drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint check_message_type
  check (message_type in ('text', 'voice', 'photo', 'sticker', 'gif', 'file', 'video', 'audio', 'location', 'sos'));

create index if not exists idx_messages_reply_to
  on public.messages(couple_id, reply_to);

comment on column public.messages.reply_to is
  'Optional parent message for a reply thread; access remains governed by couple-scoped message RLS.';

-- ----------------------------------------------------------------
-- SECTION - 20260915_telegram_features.sql
-- ----------------------------------------------------------------
-- Phase 5.5a: Telegram-style chat features
-- Adds reactions, delivery/read status, and message editing support.
alter table public.messages
  add column if not exists reactions jsonb not null default '{}'::jsonb,
  add column if not exists delivered_at timestamptz,
  add column if not exists seen_at timestamptz,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

create index if not exists messages_unseen_idx
  on public.messages(couple_id, seen_at)
  where seen_at is null;

create index if not exists messages_deleted_idx
  on public.messages(deleted_at)
  where deleted_at is null;

create index if not exists messages_reactions_gin_idx
  on public.messages using gin(reactions)
  where reactions != '{}'::jsonb;

-- Mobile chat persistence/sync contract.
alter table public.messages
  add column if not exists encryption_version integer;

-- Typing uses Realtime Presence and does not need a database message_type.
