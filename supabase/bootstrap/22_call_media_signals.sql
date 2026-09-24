-- Add signaling payloads for native WebRTC calls and exchange ICE candidates.
alter table public.call_signals
  add column if not exists offer jsonb,
  add column if not exists answer jsonb;

create table if not exists public.call_ice_candidates (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.call_signals(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  candidate jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists call_ice_candidates_call_created_idx
  on public.call_ice_candidates(call_id, created_at);

alter table public.call_ice_candidates enable row level security;
drop policy if exists call_ice_candidates_participants_read on public.call_ice_candidates;
drop policy if exists call_ice_candidates_sender_insert on public.call_ice_candidates;
drop policy if exists call_ice_candidates_sender_delete on public.call_ice_candidates;

create policy call_ice_candidates_participants_read
  on public.call_ice_candidates for select
  using (exists (
    select 1 from public.call_signals s
    where s.id = call_id and auth.uid() in (s.caller_id, s.receiver_id)
  ));

create policy call_ice_candidates_sender_insert
  on public.call_ice_candidates for insert
  with check (sender_id = auth.uid() and exists (
    select 1 from public.call_signals s
    where s.id = call_id and auth.uid() in (s.caller_id, s.receiver_id)
  ));

create policy call_ice_candidates_sender_delete
  on public.call_ice_candidates for delete
  using (sender_id = auth.uid());

grant select, insert, delete on public.call_ice_candidates to authenticated;

do $$
begin
  if to_regclass('public.call_ice_candidates') is not null
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'call_ice_candidates'
    ) then
    alter publication supabase_realtime add table public.call_ice_candidates;
  end if;
end;
$$;

select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'call_signals'
  and column_name in ('offer', 'answer');

select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename = 'call_ice_candidates';
