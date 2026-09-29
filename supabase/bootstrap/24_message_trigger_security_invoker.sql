-- Keep the message ownership trigger invoker-scoped so it is not exposed as a SECURITY DEFINER RPC.
create or replace function public.protect_message_updates()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is not null and auth.uid() <> old.sender_id then
    if new.couple_id is distinct from old.couple_id
      or new.sender_id is distinct from old.sender_id
      or new.content is distinct from old.content
      or new.message_type is distinct from old.message_type
      or new.media_url is distinct from old.media_url
      or new.media_duration is distinct from old.media_duration
      or new.reply_to is distinct from old.reply_to
      or new.location_payload is distinct from old.location_payload
      or new.encrypted is distinct from old.encrypted
      or new.encryption_version is distinct from old.encryption_version
      or new.edited_at is distinct from old.edited_at
      or new.deleted_at is distinct from old.deleted_at then
      raise exception 'Only the message sender may edit message content or ownership';
    end if;
  end if;
  return new;
end;
$$;
