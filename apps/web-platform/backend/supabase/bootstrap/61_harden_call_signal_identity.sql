-- P1 hardening: call participants must not be mutable after creation.
-- Call metadata is user-writable by the two participants, but identity fields
-- must remain fixed so a participant cannot reassign a call to another user/couple.

create or replace function public.protect_call_signal_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  -- Service-role maintenance can operate without an end-user JWT. For a normal
  -- authenticated request, immutable fields cannot be reassigned by either peer.
  if auth.uid() is not null and (
    new.id is distinct from old.id
    or new.couple_id is distinct from old.couple_id
    or new.caller_id is distinct from old.caller_id
    or new.receiver_id is distinct from old.receiver_id
    or new.type is distinct from old.type
    or new.created_at is distinct from old.created_at
  ) then
    raise exception 'Call identity fields cannot be changed.'
      using errcode = '42501';
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_call_signal_identity on public.call_signals;
create trigger protect_call_signal_identity
before update on public.call_signals
for each row execute function public.protect_call_signal_identity();

drop policy if exists call_signals_security_insert on public.call_signals;
create policy call_signals_security_insert
  on public.call_signals
  for insert
  with check (
    public.is_couple_member(couple_id)
    and (select auth.uid()) = caller_id
    and receiver_id <> caller_id
    and public.is_linked_user(receiver_id)
  );

-- Do not expose this trigger helper as an RPC endpoint.
revoke all on function public.protect_call_signal_identity() from public, anon, authenticated;
