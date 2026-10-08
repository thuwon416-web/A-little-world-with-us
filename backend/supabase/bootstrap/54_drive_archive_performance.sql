-- Drive/archive performance hardening
create index if not exists chat_archive_days_owner_id_idx on public.chat_archive_days (owner_id);
create index if not exists drive_media_archive_owner_id_idx on public.drive_media_archive (owner_id);

-- Keep authenticated RLS checks stable per statement instead of per row.
drop policy if exists chat_archive_days_members_insert on public.chat_archive_days;
create policy chat_archive_days_members_insert on public.chat_archive_days for insert to authenticated with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.couple_links cl where cl.couple_id = chat_archive_days.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid())))
);
drop policy if exists chat_archive_days_members_read on public.chat_archive_days;
create policy chat_archive_days_members_read on public.chat_archive_days for select to authenticated using (
  owner_id = (select auth.uid())
  or exists (select 1 from public.couple_links cl where cl.couple_id = chat_archive_days.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid())))
);
drop policy if exists chat_archive_days_members_update on public.chat_archive_days;
create policy chat_archive_days_members_update on public.chat_archive_days for update to authenticated using (
  owner_id = (select auth.uid())
  and exists (select 1 from public.couple_links cl where cl.couple_id = chat_archive_days.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid())))
) with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.couple_links cl where cl.couple_id = chat_archive_days.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid())))
);
drop policy if exists drive_media_archive_members_read on public.drive_media_archive;
create policy drive_media_archive_members_read on public.drive_media_archive for select to authenticated using (
  owner_id = (select auth.uid())
  or (owner_id is null and exists (select 1 from public.couple_links cl where cl.couple_id = drive_media_archive.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid()))))
);
drop policy if exists drive_media_archive_owner_insert on public.drive_media_archive;
create policy drive_media_archive_owner_insert on public.drive_media_archive for insert to authenticated with check (
  owner_id = (select auth.uid())
  and exists (select 1 from public.couple_links cl where cl.couple_id = drive_media_archive.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid())))
);
drop policy if exists drive_media_archive_owner_delete on public.drive_media_archive;
create policy drive_media_archive_owner_delete on public.drive_media_archive for delete to authenticated using (
  owner_id = (select auth.uid())
  or (owner_id is null and exists (select 1 from public.couple_links cl where cl.couple_id = drive_media_archive.couple_id and cl.status = 'accepted' and (cl.inviter_id = (select auth.uid()) or cl.accepted_by = (select auth.uid()))))
);