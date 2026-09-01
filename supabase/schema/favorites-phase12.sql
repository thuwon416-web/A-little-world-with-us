-- ============================================
-- Phase 12: Favorites / Gift Data
-- ============================================

-- Create favorites table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id),
  category text not null check (category in ('size', 'wishlist', 'gift_ideas', 'favorites')),
  item_name text not null,
  item_value text,
  item_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_favorites_user_id on favorites(user_id);
create index if not exists idx_favorites_couple_id on favorites(couple_id);

alter table favorites enable row level security;

create policy "Users can view own favorites" on favorites
  for select using (user_id = auth.uid());

create policy "Linked partners can view each other's favorites" on favorites
  for select using (
    couple_id is not null
    and exists (
      select 1 from public.couple_links cl
      where cl.id = favorites.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Users can insert own favorites" on favorites
  for insert with check (user_id = auth.uid());

create policy "Users can update own favorites" on favorites
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own favorites" on favorites
  for delete using (user_id = auth.uid());

-- Add updated_at trigger
create trigger favorites_updated_at
  before update on favorites
  for each row
  execute function update_updated_at_column();
