-- 48_account_deletion_transactional_rpc.sql
-- Transactional account-deletion state changes for the authenticated web API.
-- Apply after reviewing in staging. Forward-only; no destructive bootstrap.

begin;

create or replace function public.request_account_deletion(
  p_user_id uuid,
  p_scheduled_for timestamptz
)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
begin
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'account profile not found';
  end if;

  if exists (
    select 1
    from public.account_deletion_requests
    where user_id = p_user_id
      and completed_at is not null
  ) then
    raise exception 'account deletion is already completed';
  end if;

  insert into public.account_deletion_requests (
    user_id, requested_at, scheduled_for, cancelled_at, completed_at
  )
  values (
    p_user_id, v_now, p_scheduled_for, null, null
  )
  on conflict (user_id) do update
    set requested_at = excluded.requested_at,
        scheduled_for = excluded.scheduled_for,
        cancelled_at = null,
        completed_at = null;

  update public.profiles
  set deleted_at = v_now
  where id = p_user_id;

  insert into public.admin_audit_logs (
    actor_id, action, resource_type, resource_id, details
  )
  values (
    p_user_id,
    'request_account_deletion',
    'profile',
    p_user_id,
    jsonb_build_object(
      'scheduledFor', p_scheduled_for,
      'requestedAt', v_now
    )
  );

  return p_scheduled_for;
end;
$$;

create or replace function public.cancel_account_deletion(
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_updated integer;
begin
  update public.account_deletion_requests
  set cancelled_at = v_now,
      completed_at = null
  where user_id = p_user_id
    and completed_at is null;

  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    return false;
  end if;

  update public.profiles
  set deleted_at = null
  where id = p_user_id;

  insert into public.admin_audit_logs (
    actor_id, action, resource_type, resource_id, details
  )
  values (
    p_user_id,
    'cancel_account_deletion',
    'profile',
    p_user_id,
    jsonb_build_object('cancelledAt', v_now)
  );

  return true;
end;
$$;

revoke all on function public.request_account_deletion(uuid,timestamptz) from public, anon, authenticated;
revoke all on function public.cancel_account_deletion(uuid) from public, anon, authenticated;
grant execute on function public.request_account_deletion(uuid,timestamptz) to service_role;
grant execute on function public.cancel_account_deletion(uuid) to service_role;

commit;
