-- ----------------------------------------------------------------
-- 01_chat.sql - Chat features
-- ----------------------------------------------------------------
-- Source files merged:
--   20260911_chat_media_parity.sql
--   20260915_telegram_features.sql
--
-- Depends on: 00_core.sql
-- Run order: 00 -> 01 -> 02 -> ... -> 10
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
-- Adds reactions, delivery/read status, and message editing support

begin;

-- 1. Reactions (JSON keyed by user_id → emoji)
alter table public.messages
  add column if not exists reactions jsonb not null default '{}'::jsonb;

-- 2. Delivery status
alter table public.messages
  add column if not exists delivered_at timestamptz;

-- 3. Read status
alter table public.messages
  add column if not exists seen_at timestamptz;

-- 4. Edit tracking
alter table public.messages
  add column if not exists edited_at timestamptz;

-- 5. Soft delete
alter table public.messages
  add column if not exists deleted_at timestamptz;

-- Index for unread count queries
create index if not exists messages_unseen_idx
  on public.messages(couple_id, seen_at)
  where seen_at is null;

-- Index for soft delete filtering
create index if not exists messages_deleted_idx
  on public.messages(deleted_at)
  where deleted_at is null;

-- Index for reaction queries
create index if not exists messages_reactions_gin_idx
  on public.messages using gin(reactions)
  where reactions != '{}'::jsonb;

-- Update message_type check to allow 'typing' (future)
-- (not needed now — typing uses Realtime Presence)

commit;
