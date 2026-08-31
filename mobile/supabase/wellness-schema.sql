create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  mood text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists care_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  completed_at timestamptz not null default now()
);

create table if not exists cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  start_date date not null,
  end_date date,
  cycle_length integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_mood_logs_user_id on mood_logs(user_id);
create index if not exists idx_mood_logs_created_at on mood_logs(created_at);
create index if not exists idx_care_logs_user_id on care_logs(user_id);
create index if not exists idx_care_logs_completed_at on care_logs(completed_at);
create index if not exists idx_cycle_logs_user_id on cycle_logs(user_id);
create index if not exists idx_cycle_logs_start_date on cycle_logs(start_date);

alter table mood_logs enable row level security;
alter table care_logs enable row level security;
alter table cycle_logs enable row level security;

create policy "User and linked partner can view mood logs" on mood_logs
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.couple_links cl
      where cl.status = 'accepted'
        and ((cl.inviter_id = auth.uid() and cl.accepted_by = mood_logs.user_id)
          or (cl.accepted_by = auth.uid() and cl.inviter_id = mood_logs.user_id))
    )
  );

create policy "User can insert mood logs" on mood_logs
  for insert with check (user_id = auth.uid());

create policy "User can update mood logs" on mood_logs
  for update using (user_id = auth.uid());

create policy "User can delete mood logs" on mood_logs
  for delete using (user_id = auth.uid());

create policy "User and linked partner can view care logs" on care_logs
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.couple_links cl
      where cl.status = 'accepted'
        and ((cl.inviter_id = auth.uid() and cl.accepted_by = care_logs.user_id)
          or (cl.accepted_by = auth.uid() and cl.inviter_id = care_logs.user_id))
    )
  );

create policy "User can insert care logs" on care_logs
  for insert with check (user_id = auth.uid());

create policy "User can update care logs" on care_logs
  for update using (user_id = auth.uid());

create policy "User can delete care logs" on care_logs
  for delete using (user_id = auth.uid());

create policy "User and linked partner can view cycle logs" on cycle_logs
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.couple_links cl
      where cl.status = 'accepted'
        and ((cl.inviter_id = auth.uid() and cl.accepted_by = cycle_logs.user_id)
          or (cl.accepted_by = auth.uid() and cl.inviter_id = cycle_logs.user_id))
    )
  );

create policy "User can insert cycle logs" on cycle_logs
  for insert with check (user_id = auth.uid());

create policy "User can update cycle logs" on cycle_logs
  for update using (user_id = auth.uid());

create policy "User can delete cycle logs" on cycle_logs
  for delete using (user_id = auth.uid());
