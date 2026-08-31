create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.couple_links (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  accepted_by uuid references public.profiles(id),
  invite_code text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'revoked')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couple_links(id),
  caption text,
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'partner_only')),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couple_links(id),
  content text not null,
  visibility text not null default 'shared' check (visibility in ('private', 'shared', 'partner_only')),
  created_at timestamptz not null default now()
);

create table if not exists public.chat_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couple_links(id),
  last_seen timestamptz not null default now(),
  online boolean not null default true
);

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couple_links(id),
  title text not null,
  content text,
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'partner_only')),
  created_at timestamptz not null default now()
);

create index if not exists idx_couple_links_inviter on public.couple_links(inviter_id);
create index if not exists idx_couple_links_accepted_by on public.couple_links(accepted_by);
create index if not exists idx_couple_links_status on public.couple_links(status);
create index if not exists idx_chat_messages_couple_id on public.chat_messages(couple_id);
create index if not exists idx_chat_messages_sender_id on public.chat_messages(sender_id);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);
create index if not exists idx_memories_user_id on public.memories(user_id);
create index if not exists idx_vault_items_user_id on public.vault_items(user_id);
create index if not exists idx_chat_presence_user_id on public.chat_presence(user_id);

alter table public.profiles enable row level security;
alter table public.couple_links enable row level security;
alter table public.memories enable row level security;
alter table public.chat_messages enable row level security;
alter table public.chat_presence enable row level security;
alter table public.vault_items enable row level security;

create policy "profiles_own_data_only" on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "couple_links_visible_to_linked_users" on public.couple_links
for select
using (
  auth.uid() = inviter_id
  or auth.uid() = accepted_by
);

create policy "couple_links_insert_by_inviter" on public.couple_links
for insert
with check (
  auth.uid() = inviter_id
);

create policy "couple_links_update_by_inviter_or_acceptor" on public.couple_links
for update
using (
  auth.uid() = inviter_id
  or auth.uid() = accepted_by
)
with check (
  auth.uid() = inviter_id
  or auth.uid() = accepted_by
);

create policy "couple_links_delete_by_inviter_or_acceptor" on public.couple_links
for delete
using (
  auth.uid() = inviter_id
  or auth.uid() = accepted_by
);

create policy "memories_select_visible_to_owner_or_shared_couple" on public.memories
for select
using (
  auth.uid() = user_id
  or (
    visibility in ('shared', 'partner_only')
    and exists (
      select 1 from public.couple_links cl
      where cl.id = memories.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  )
);

create policy "memories_insert_own_records" on public.memories
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_links cl
    where cl.id = memories.couple_id
      and cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "memories_update_own_records" on public.memories
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "memories_delete_own_records" on public.memories
for delete
using (auth.uid() = user_id);

create policy "chat_visible_to_connected_couple" on public.chat_messages
for select
using (
  sender_id = auth.uid()
  or exists (
    select 1 from public.couple_links cl
    where cl.id = chat_messages.couple_id
      and cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "chat_insert_only_for_linked_users" on public.chat_messages
for insert
with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.couple_links cl
    where cl.id = chat_messages.couple_id
      and cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "chat_update_own_message" on public.chat_messages
for update
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

create policy "chat_delete_own_message" on public.chat_messages
for delete
using (auth.uid() = sender_id);

create policy "chat_presence_visible_to_couple" on public.chat_presence
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.couple_links cl
    where cl.id = chat_presence.couple_id
      and cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "chat_presence_insert_own_presence" on public.chat_presence
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_links cl
    where cl.id = chat_presence.couple_id
      and cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "chat_presence_update_own_presence" on public.chat_presence
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "chat_presence_delete_own_presence" on public.chat_presence
for delete
using (auth.uid() = user_id);

create policy "vault_visible_to_owner_or_shared_couple" on public.vault_items
for select
using (
  auth.uid() = user_id
  or (
    visibility in ('shared', 'partner_only')
    and exists (
      select 1 from public.couple_links cl
      where cl.id = vault_items.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  )
);

create policy "vault_insert_own_records" on public.vault_items
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.couple_links cl
    where cl.id = vault_items.couple_id
      and cl.status = 'accepted'
      and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
  )
);

create policy "vault_update_own_records" on public.vault_items
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "vault_delete_own_records" on public.vault_items
for delete
using (auth.uid() = user_id);
