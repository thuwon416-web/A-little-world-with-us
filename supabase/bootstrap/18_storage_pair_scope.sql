-- Limit private shared-media reads to the uploader and their accepted partner.
-- This is safe to rerun and does not change stored objects.
begin;

-- Remove both known permissive predecessors because PostgreSQL ORs permissive
-- policies together; leaving either one would bypass the narrower rule below.
drop policy if exists shared_media_read on storage.objects;
drop policy if exists storage_security_hardening_read on storage.objects;
create policy storage_security_hardening_read on storage.objects
  for select to authenticated using (
    bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages')
    and owner is not null
    and public.is_linked_user(owner)
  );

commit;
