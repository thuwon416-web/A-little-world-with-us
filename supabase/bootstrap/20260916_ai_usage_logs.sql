begin;

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  endpoint text not null,
  provider text not null,
  status text not null check (status in ('success', 'failure', 'timeout')),
  estimated_tokens integer not null default 0 check (estimated_tokens >= 0),
  prompt_length integer not null default 0 check (prompt_length >= 0),
  response_length integer not null default 0 check (response_length >= 0),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_user_created_idx
  on public.ai_usage_logs(user_id, created_at desc);

alter table public.ai_usage_logs enable row level security;

drop policy if exists ai_usage_logs_own_access on public.ai_usage_logs;
create policy ai_usage_logs_own_access
  on public.ai_usage_logs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, delete on public.ai_usage_logs to authenticated;

comment on table public.ai_usage_logs is
  'AI usage tracking for cost guardrails. Logs every AI call with endpoint, provider, and status.';

commit;
