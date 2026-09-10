begin;

create table if not exists public.ai_advice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  advice_type text not null check (advice_type in ('mediator', 'intimacy')),
  context_data jsonb not null default '{}'::jsonb,
  ai_response text not null check (char_length(ai_response) between 1 and 12000),
  created_at timestamptz not null default now()
);

create index if not exists ai_advice_history_user_created_idx
  on public.ai_advice_history(user_id, created_at desc);

alter table public.ai_advice_history enable row level security;
drop policy if exists ai_advice_history_own_access on public.ai_advice_history;
create policy ai_advice_history_own_access
  on public.ai_advice_history
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, delete on public.ai_advice_history to authenticated;

commit;
