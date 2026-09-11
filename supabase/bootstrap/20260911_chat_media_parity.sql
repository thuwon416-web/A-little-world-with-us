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
