create table if not exists public.user_locations (
  user_id uuid primary key references auth.users (id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision default 0,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_locations_updated_at on public.user_locations(updated_at desc);

alter table public.user_locations enable row level security;

create policy "Users can upsert own location"
on public.user_locations
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Linked couple can view partner location"
on public.user_locations
for select
using (
  auth.uid() = user_id
  or exists (
    select 1 from public.couple_links cl
    where ((cl.inviter_id = auth.uid() and cl.accepted_by = user_locations.user_id)
      or (cl.accepted_by = auth.uid() and cl.inviter_id = user_locations.user_id))
      and cl.status = 'accepted'
  )
);

