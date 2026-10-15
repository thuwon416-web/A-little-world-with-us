begin;

alter table public.profiles
  add column if not exists deleted_at timestamptz,
  add column if not exists is_erased boolean not null default false;

create table if not exists public.account_deletion_requests (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  requested_at timestamptz not null default now(),
  scheduled_for timestamptz not null,
  cancelled_at timestamptz,
  completed_at timestamptz,
  reason text
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  resource_type text,
  resource_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on public.admin_audit_logs from anon, authenticated;
grant all on public.admin_audit_logs to service_role;

drop policy if exists account_deletion_requests_owner_select on public.account_deletion_requests;
create policy account_deletion_requests_owner_select
  on public.account_deletion_requests for select
  using ((select auth.uid()) = user_id);

drop policy if exists account_deletion_requests_owner_insert on public.account_deletion_requests;
create policy account_deletion_requests_owner_insert
  on public.account_deletion_requests for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists account_deletion_requests_owner_update on public.account_deletion_requests;
create policy account_deletion_requests_owner_update
  on public.account_deletion_requests for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists account_deletion_requests_due_idx
  on public.account_deletion_requests(scheduled_for)
  where cancelled_at is null and completed_at is null;

commit;