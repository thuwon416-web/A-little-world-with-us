-- ============================================
-- Phase 10: Advanced Chat Features
-- ============================================

-- Create messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  message_type text not null default 'text' check (message_type in ('text', 'voice', 'photo')),
  media_url text,
  media_duration integer, -- for voice messages (seconds)
  encrypted boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_messages_couple_id on messages(couple_id);
create index if not exists idx_messages_created_at on messages(created_at);
create index if not exists idx_messages_sender_id on messages(sender_id);

alter table messages enable row level security;

-- RLS policies
create policy "Coupled users can view messages" on messages
  for select using (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = messages.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Coupled users can insert messages" on messages
  for insert with check (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = messages.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Coupled users can update messages" on messages
  for update using (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = messages.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

-- Ensure the update_updated_at_column function exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add updated_at trigger
create trigger messages_updated_at
  before update on messages
  for each row
  execute function update_updated_at_column();

-- Create voice_messages storage bucket
insert into storage.buckets (id, name, public)
values ('voice_messages', 'voice_messages', false)
on conflict (id) do nothing;

-- RLS for voice_messages
create policy "Coupled users can upload voice messages"
on storage.objects for insert
with check (
  bucket_id = 'voice_messages'
  and exists (
    select 1 from public.couple_links cl
    join public.messages m on m.couple_id = cl.couple_id
    where cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "Coupled users can view voice messages"
on storage.objects for select
using (
  bucket_id = 'voice_messages'
  and exists (
    select 1 from public.couple_links cl
    join public.messages m on m.couple_id = cl.couple_id
    where cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

-- Create chat_photos storage bucket
insert into storage.buckets (id, name, public)
values ('chat_photos', 'chat_photos', false)
on conflict (id) do nothing;

-- RLS for chat_photos
create policy "Coupled users can upload chat photos"
on storage.objects for insert
with check (
  bucket_id = 'chat_photos'
  and exists (
    select 1 from public.couple_links cl
    join public.messages m on m.couple_id = cl.couple_id
    where cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "Coupled users can view chat photos"
on storage.objects for select
using (
  bucket_id = 'chat_photos'
  and exists (
    select 1 from public.couple_links cl
    join public.messages m on m.couple_id = cl.couple_id
    where cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);
