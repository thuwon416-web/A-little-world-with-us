-- Location sharing is opt-in and scoped to an accepted couple only.
create table if not exists public.user_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_locations_couple_id on public.user_locations(couple_id);
create index if not exists idx_user_locations_updated_at on public.user_locations(updated_at desc);

alter table public.user_locations enable row level security;

drop policy if exists "Users can upsert own location" on public.user_locations;
drop policy if exists "Linked couple can view partner location" on public.user_locations;

create policy "Users can manage their own location" on public.user_locations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Accepted partners can view a shared location" on public.user_locations
  for select using (
    exists (
      select 1 from public.couple_links cl
      where cl.couple_id = user_locations.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );
