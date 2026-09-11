begin;

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_type text not null check (activity_type in ('workout', 'quest', 'game')),
  activity_id text not null,
  completed_at timestamptz not null default now()
);

create index if not exists wellness_logs_user_completed_idx
  on public.wellness_logs(user_id, completed_at desc);

alter table public.wellness_logs enable row level security;

create policy wellness_logs_owner_access on public.wellness_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

commit;
