begin;
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null check (char_length(title) between 1 and 100),
  event_date date not null,
  event_time time,
  description text check (description is null or char_length(description) <= 500),
  type text not null default 'other' check (type in ('date','trip','goal','life','other')),
  repeat text check (repeat is null or repeat in ('daily','weekly','monthly','yearly')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists events_couple_date_idx on public.events(couple_id, event_date);
create table if not exists public.wishlist (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.events enable row level security;
alter table public.wishlist enable row level security;
create policy events_couple_access on public.events for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
create policy wishlist_couple_access on public.wishlist for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
commit;
