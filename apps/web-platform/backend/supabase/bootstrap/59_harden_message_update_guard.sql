-- 20261022 P0 security hardening: protect sender-owned message fields.
-- The couple-wide UPDATE policy remains for reactions/read receipts and transcript
-- updates, while this trigger blocks peers from changing message content, ownership,
-- storage pointers, timestamps, or offline-sync version.
-- IS DISTINCT FROM is required because sender_id becomes NULL after account deletion.

create or replace function public.protect_message_updates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid() is distinct from old.sender_id then
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
      or new.deleted_at is distinct from old.deleted_at
      or new.media_mime_type is distinct from old.media_mime_type
      or new.media_storage_provider is distinct from old.media_storage_provider
      or new.media_storage_path is distinct from old.media_storage_path
      or new.media_storage_file_id is distinct from old.media_storage_file_id
      or new.media_size_bytes is distinct from old.media_size_bytes
      or new.created_at is distinct from old.created_at
      or new.sync_version is distinct from old.sync_version then
      raise exception 'Only the message sender may edit message content, ownership, or storage metadata';
    end if;
  end if;
  return new;
end;
$$;
