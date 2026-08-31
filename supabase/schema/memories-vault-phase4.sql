create extension if not exists pgcrypto;

create table if not exists public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text,
  caption text,
  category text not null default 'favorite',
  media_url text,
  media_type text not null default 'image',
  created_at timestamptz not null default now(),
  scheduled_for date,
  reveal_at timestamptz,
  is_private boolean not null default true
);

create table if not exists public.time_capsules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  content text not null,
  category text not null default 'private',
  reveal_at timestamptz not null,
  created_at timestamptz not null default now(),
  opened_at timestamptz
);

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  category text not null default 'private',
  item_type text not null default 'letter',
  content text,
  storage_path text,
  created_at timestamptz not null default now(),
  reveal_at timestamptz,
  is_locked boolean not null default true
);

alter table public.memory_entries enable row level security;
alter table public.time_capsules enable row level security;
alter table public.vault_items enable row level security;

create policy "memory_entries_select_own" on public.memory_entries
for select using (auth.uid() = user_id);

create policy "memory_entries_insert_own" on public.memory_entries
for insert with check (auth.uid() = user_id);

create policy "memory_entries_update_own" on public.memory_entries
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "memory_entries_delete_own" on public.memory_entries
for delete using (auth.uid() = user_id);

create policy "time_capsules_select_own" on public.time_capsules
for select using (auth.uid() = user_id);

create policy "time_capsules_insert_own" on public.time_capsules
for insert with check (auth.uid() = user_id);

create policy "time_capsules_update_own" on public.time_capsules
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vault_items_select_own" on public.vault_items
for select using (auth.uid() = user_id);

create policy "vault_items_insert_own" on public.vault_items
for insert with check (auth.uid() = user_id);

create policy "vault_items_update_own" on public.vault_items
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "vault_items_delete_own" on public.vault_items
for delete using (auth.uid() = user_id);
