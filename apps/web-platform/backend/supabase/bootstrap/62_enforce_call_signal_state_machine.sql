-- P1 hardening: enforce call signaling state transitions at the database boundary.
-- The two call participants may only update their own SDP field and allowed status transitions.
-- Service-role maintenance (no end-user JWT) remains available for administrative operations.

create or replace function public.protect_call_signal_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  actor_id uuid := auth.uid();
begin
  if actor_id is null then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.couple_id is distinct from old.couple_id
    or new.caller_id is distinct from old.caller_id
    or new.receiver_id is distinct from old.receiver_id
    or new.type is distinct from old.type
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Call identity fields cannot be changed.'
      using errcode = '42501';
  end if;

  -- Offers are caller-owned; answers are receiver-owned.
  if new.offer is distinct from old.offer then
    if actor_id <> old.caller_id
      or old.status not in ('calling', 'in_call')
      or new.answer is distinct from old.answer
    then
      raise exception 'Only the caller may update the offer during an active call.'
        using errcode = '42501';
    end if;
  end if;

  if new.answer is distinct from old.answer then
    if actor_id <> old.receiver_id
      or old.status <> 'in_call'
      or new.offer is distinct from old.offer
    then
      raise exception 'Only the receiver may update the answer after accepting a call.'
        using errcode = '42501';
    end if;
  end if;

  if new.status is distinct from old.status then
    if new.offer is distinct from old.offer or new.answer is distinct from old.answer then
      raise exception 'SDP and call status must be updated separately.'
        using errcode = '42501';
    end if;

    if actor_id = old.caller_id then
      if not (old.status in ('calling', 'in_call') and new.status = 'ended') then
        raise exception 'Invalid caller call-status transition.'
          using errcode = '42501';
      end if;
    elsif actor_id = old.receiver_id then
      if not (
        (old.status = 'calling' and new.status in ('in_call', 'rejected'))
        or (old.status in ('calling', 'in_call') and new.status = 'ended')
      ) then
        raise exception 'Invalid receiver call-status transition.'
          using errcode = '42501';
      end if;
    else
      raise exception 'Only call participants may change call status.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists protect_call_signal_identity on public.call_signals;
create trigger protect_call_signal_identity
before update on public.call_signals
for each row execute function public.protect_call_signal_identity();

revoke all on function public.protect_call_signal_identity() from public, anon, authenticated;
