-- Fix: Add 'sos' to messages.message_type constraint
-- Reason: SOS flow inserts message_type='sos' which violated the original constraint
-- Affects: Web EmergencySOS + Mobile location SOS

-- Drop old constraint and recreate with 'sos'
alter table public.messages
  drop constraint if exists messages_message_type_check;

alter table public.messages
  add constraint messages_message_type_check
  check (message_type in (
    'text','voice','photo','sticker','gif','file','video','audio','location','sos'
  ));
