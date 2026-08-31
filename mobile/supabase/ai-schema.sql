create table if not exists public.ai_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_type text not null check (prompt_type in ('gift', 'date', 'message')),
  context jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  suggestion_type text not null check (suggestion_type in ('gift', 'date', 'message')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_prompts_user_id on public.ai_prompts(user_id);
create index if not exists idx_ai_prompts_created_at on public.ai_prompts(created_at);
create index if not exists idx_ai_suggestions_user_id on public.ai_suggestions(user_id);
create index if not exists idx_ai_suggestions_created_at on public.ai_suggestions(created_at);

alter table public.ai_prompts enable row level security;
alter table public.ai_suggestions enable row level security;

create policy "Users can manage own AI prompts"
on public.ai_prompts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own AI suggestions"
on public.ai_suggestions
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
