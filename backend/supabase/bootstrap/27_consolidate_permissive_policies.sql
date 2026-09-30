-- Consolidate redundant permissive policies without changing row-access semantics.
-- These policies replace overlapping SELECT + ALL policies with one SELECT policy
-- and explicit INSERT/UPDATE/DELETE policies for the same couple/creator rules.
begin;

drop policy if exists care_cycle_settings_security_mutate on public.care_cycle_settings;
drop policy if exists care_cycle_settings_security_select on public.care_cycle_settings;
create policy care_cycle_settings_member_select on public.care_cycle_settings for select to public using (is_couple_member(couple_id));
create policy care_cycle_settings_member_insert on public.care_cycle_settings for insert to public with check (is_couple_member(couple_id));
create policy care_cycle_settings_member_update on public.care_cycle_settings for update to public using (is_couple_member(couple_id)) with check (is_couple_member(couple_id));
create policy care_cycle_settings_member_delete on public.care_cycle_settings for delete to public using (is_couple_member(couple_id));

drop policy if exists time_capsule_attachments_creator_access on public.time_capsule_attachments;
drop policy if exists time_capsule_attachments_recipient_read on public.time_capsule_attachments;
create policy time_capsule_attachments_select on public.time_capsule_attachments for select to public using (
  exists (select 1 from public.time_capsules c where c.id = time_capsule_attachments.capsule_id and
    (c.user_id = auth.uid() or (c.recipient_id = auth.uid() and c.status = 'revealed' and c.unlock_at <= now()))
));
create policy time_capsule_attachments_insert on public.time_capsule_attachments for insert to public with check (
  exists (select 1 from public.time_capsules c where c.id = time_capsule_attachments.capsule_id and c.user_id = auth.uid())
);
create policy time_capsule_attachments_update on public.time_capsule_attachments for update to public
  using (exists (select 1 from public.time_capsules c where c.id = time_capsule_attachments.capsule_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.time_capsules c where c.id = time_capsule_attachments.capsule_id and c.user_id = auth.uid()));
create policy time_capsule_attachments_delete on public.time_capsule_attachments for delete to public using (
  exists (select 1 from public.time_capsules c where c.id = time_capsule_attachments.capsule_id and c.user_id = auth.uid())
);

drop policy if exists time_capsules_creator_manage on public.time_capsules;
drop policy if exists time_capsules_recipient_read_revealed on public.time_capsules;
create policy time_capsules_select on public.time_capsules for select to public using (
  user_id = auth.uid() or (recipient_id = auth.uid() and status = 'revealed' and unlock_at <= now())
);
create policy time_capsules_insert on public.time_capsules for insert to public with check (user_id = auth.uid() and is_couple_member(couple_id));
create policy time_capsules_update on public.time_capsules for update to public using (user_id = auth.uid()) with check (user_id = auth.uid() and is_couple_member(couple_id));
create policy time_capsules_delete on public.time_capsules for delete to public using (user_id = auth.uid());

commit;
