create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  title text not null,
  description text,
  type text not null default 'goal',
  due_date timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists bucket_list (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  item text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_plans_couple_id on plans(couple_id);
create index if not exists idx_plans_created_at on plans(created_at);
create index if not exists idx_plan_items_plan_id on plan_items(plan_id);
create index if not exists idx_bucket_list_couple_id on bucket_list(couple_id);

alter table plans enable row level security;
alter table plan_items enable row level security;
alter table bucket_list enable row level security;

create policy "Linked couple can view plans" on plans
  for select using (
    exists (
      select 1 from public.couple_links cl
      where cl.id = plans.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can insert plans" on plans
  for insert with check (
    exists (
      select 1 from public.couple_links cl
      where cl.id = plans.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can update plans" on plans
  for update using (
    exists (
      select 1 from public.couple_links cl
      where cl.id = plans.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can delete plans" on plans
  for delete using (
    exists (
      select 1 from public.couple_links cl
      where cl.id = plans.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can view plan items" on plan_items
  for select using (
    exists (
      select 1 from plans p
      join public.couple_links cl on cl.id = p.couple_id
      where p.id = plan_items.plan_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can insert plan items" on plan_items
  for insert with check (
    exists (
      select 1 from plans p
      join public.couple_links cl on cl.id = p.couple_id
      where p.id = plan_items.plan_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can update plan items" on plan_items
  for update using (
    exists (
      select 1 from plans p
      join public.couple_links cl on cl.id = p.couple_id
      where p.id = plan_items.plan_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can delete plan items" on plan_items
  for delete using (
    exists (
      select 1 from plans p
      join public.couple_links cl on cl.id = p.couple_id
      where p.id = plan_items.plan_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can view bucket list" on bucket_list
  for select using (
    exists (
      select 1 from public.couple_links cl
      where cl.id = bucket_list.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can insert bucket list" on bucket_list
  for insert with check (
    exists (
      select 1 from public.couple_links cl
      where cl.id = bucket_list.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can update bucket list" on bucket_list
  for update using (
    exists (
      select 1 from public.couple_links cl
      where cl.id = bucket_list.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );

create policy "Linked couple can delete bucket list" on bucket_list
  for delete using (
    exists (
      select 1 from public.couple_links cl
      where cl.id = bucket_list.couple_id
        and cl.status = 'accepted'
        and (cl.inviter_id = auth.uid() or cl.accepted_by = auth.uid())
    )
  );
