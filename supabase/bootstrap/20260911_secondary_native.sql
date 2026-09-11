begin;
alter table public.vault_items add column if not exists photo_url text;
create table if not exists public.call_logs (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  caller_id uuid references public.profiles(id) on delete set null,
  call_type text not null check (call_type in ('audio','video')),
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);
create index if not exists call_logs_couple_created_idx on public.call_logs(couple_id, created_at desc);
alter table public.call_logs enable row level security;
create policy call_logs_couple_access on public.call_logs for select using (public.is_couple_member(couple_id));
commit;
