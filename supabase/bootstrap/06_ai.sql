-- ----------------------------------------------------------------
-- 06_ai.sql - AI features
-- ----------------------------------------------------------------
-- Source files merged:
--   20260910_ai_advice_history.sql
--   20260910_ai_guardian.sql
--   20260910_context_memory.sql
--   20260915_ai_memories_consent.sql
--   20260916_ai_usage_logs.sql
--
-- Depends on: 00_core.sql
-- Run order: 00 -> 01 -> 02 -> ... -> 10
-- ----------------------------------------------------------------

-- ----------------------------------------------------------------
-- SECTION - 20260910_ai_advice_history.sql
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- SECTION - 20260910_ai_guardian.sql
-- ----------------------------------------------------------------
begin;

create table if not exists public.ai_privacy_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  allow_ai_read_mood boolean not null default false,
  allow_ai_read_cycle boolean not null default false,
  allow_ai_read_chat boolean not null default false,
  allow_ai_read_location boolean not null default false,
  allow_ai_read_finance boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists ai_privacy_settings_touch on public.ai_privacy_settings;
create trigger ai_privacy_settings_touch
before update on public.ai_privacy_settings
for each row execute function public.touch_updated_at();

alter table public.ai_privacy_settings enable row level security;

drop policy if exists ai_privacy_settings_own_access on public.ai_privacy_settings;
create policy ai_privacy_settings_own_access
on public.ai_privacy_settings
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update, delete on public.ai_privacy_settings to authenticated;

commit;

-- ----------------------------------------------------------------
-- SECTION - 20260910_context_memory.sql
-- ----------------------------------------------------------------
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

-- ----------------------------------------------------------------
-- SECTION - 20260915_ai_memories_consent.sql
-- ----------------------------------------------------------------
begin;

alter table public.ai_privacy_settings
  add column if not exists allow_ai_read_memories boolean not null default false;

comment on column public.ai_privacy_settings.allow_ai_read_memories is
  'When true, AI may read relationship_memories for user-triggered queries only.';

commit;

-- ----------------------------------------------------------------
-- SECTION - 20260916_ai_usage_logs.sql
-- ----------------------------------------------------------------
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
