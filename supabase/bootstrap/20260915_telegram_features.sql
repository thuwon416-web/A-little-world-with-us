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

-- Index for unread count queries
create index if not exists messages_unseen_idx
  on public.messages(couple_id, seen_at)
  where seen_at is null;

-- Index for reaction queries
create index if not exists messages_reactions_gin_idx
  on public.messages using gin(reactions)
  where reactions != '{}'::jsonb;

-- Update message_type check to allow 'typing' (future)
-- (not needed now — typing uses Realtime Presence)

commit;
