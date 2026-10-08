-- Drive-first archive metadata.
-- The connection stores the app-owned root folder once it is created.
alter table public.google_drive_connections
  add column if not exists root_folder_id text;

-- Imported or app-created memory media can point back to the Drive folder that
-- contains the original file. Supabase remains the searchable metadata/index.
alter table public.memories
  add column if not exists drive_folder_id text;

create index if not exists memories_drive_folder_id_idx
  on public.memories (drive_folder_id)
  where drive_folder_id is not null;

-- One archive record per couple/day. The actual chat archive lives in Drive;
-- this table is the fast Supabase index for month/day retrieval.
create table if not exists public.chat_archive_days (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  archive_date date not null,
  drive_file_id text,
  drive_folder_id text,
  message_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (couple_id, archive_date)
);

create index if not exists chat_archive_days_couple_date_idx
  on public.chat_archive_days (couple_id, archive_date desc);

alter table public.chat_archive_days enable row level security;

drop policy if exists "chat_archive_days_members_read" on public.chat_archive_days;
create policy "chat_archive_days_members_read"
  on public.chat_archive_days
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.couple_links cl
      where cl.couple_id = chat_archive_days.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

drop policy if exists "chat_archive_days_members_insert" on public.chat_archive_days;
create policy "chat_archive_days_members_insert"
  on public.chat_archive_days
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.couple_links cl
      where cl.couple_id = chat_archive_days.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

drop policy if exists "chat_archive_days_members_update" on public.chat_archive_days;
create policy "chat_archive_days_members_update"
  on public.chat_archive_days
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.couple_links cl
      where cl.couple_id = chat_archive_days.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.couple_links cl
      where cl.couple_id = chat_archive_days.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );
