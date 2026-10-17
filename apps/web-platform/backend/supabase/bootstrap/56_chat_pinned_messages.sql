-- Migration 56: Chat Pinned Messages
-- Supports pinning important messages in couple chat with realtime synchronization

create table if not exists public.chat_pinned_messages (
  couple_id uuid not null references public.couples(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  pinned_by uuid references public.profiles(id) on delete set null,
  pinned_at timestamptz not null default now(),
  primary key (couple_id, message_id)
);

create index if not exists chat_pinned_messages_couple_pinned_at_idx
  on public.chat_pinned_messages(couple_id, pinned_at desc);
create index if not exists chat_pinned_messages_message_id_idx
  on public.chat_pinned_messages(message_id);
create index if not exists chat_pinned_messages_pinned_by_idx
  on public.chat_pinned_messages(pinned_by);

alter table public.chat_pinned_messages enable row level security;

-- Policy for couple access
drop policy if exists chat_pinned_messages_couple_access on public.chat_pinned_messages;
create policy chat_pinned_messages_couple_access on public.chat_pinned_messages
  for all using (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = chat_pinned_messages.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid()))
    )
  );

-- Also add optional columns to messages table for denormalized query convenience if needed
alter table public.messages add column if not exists is_pinned boolean not null default false;
alter table public.messages add column if not exists pinned_at timestamptz;
create index if not exists messages_couple_pinned_idx on public.messages(couple_id, is_pinned) where is_pinned = true;

-- Enable Supabase Realtime for chat_pinned_messages
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
      and schemaname = 'public' 
      and tablename = 'chat_pinned_messages'
  ) then
    alter publication supabase_realtime add table public.chat_pinned_messages;
  end if;
exception
  when others then null;
end $$;
