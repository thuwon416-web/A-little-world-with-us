begin;

create table if not exists public.ai_context_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid not null references public.couples(id) on delete cascade,
  source_message_id uuid references public.messages(id) on delete set null,
  category text not null check (category in ('conflict','mood','intimacy','health','milestone','affection')),
  sender_role text not null check (sender_role in ('him','her')),
  context_text text not null,
  matched_keywords text[] not null default '{}',
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists ai_context_memory_user_created_idx on public.ai_context_memory(user_id, created_at desc);
create index if not exists ai_context_memory_expiry_idx on public.ai_context_memory(expires_at);
alter table public.ai_context_memory enable row level security;
drop policy if exists ai_context_memory_own_access on public.ai_context_memory;
create policy ai_context_memory_own_access on public.ai_context_memory
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.ai_context_memory to authenticated;

commit;
