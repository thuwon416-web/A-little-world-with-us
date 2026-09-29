-- 20260929 reliability/security hardening
-- Additive migration. Apply to an existing database after reviewing in staging.

begin;

-- Prevent duplicate web-reminder dispatch when two cron invocations overlap.
alter table public.reminders
  add column if not exists web_claimed_at timestamptz;

create index if not exists reminders_web_claim_idx
  on public.reminders (web_claimed_at)
  where active = true and web_notified_at is null;

-- The couple-wide messages UPDATE policy is intentionally retained for delivery/read
-- metadata, but a trigger prevents a non-sender from changing message ownership/content.
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

drop trigger if exists protect_message_updates on public.messages;
create trigger protect_message_updates
before update on public.messages
for each row execute function public.protect_message_updates();

-- Prevent partners from changing who a safety check-in belongs to while still
-- allowing the couple to acknowledge/update its status and message.
create or replace function public.protect_safety_checkin_updates()
returns trigger
language plpgsql
security invoker
set search_path = public
as $
begin
  if auth.uid() is not null and auth.uid() <> old.user_id then
    if new.couple_id is distinct from old.couple_id
      or new.user_id is distinct from old.user_id
      or new.checkin_type is distinct from old.checkin_type
      or new.latitude is distinct from old.latitude
      or new.longitude is distinct from old.longitude
      or new.accuracy is distinct from old.accuracy
      or new.expected_until is distinct from old.expected_until then
      raise exception 'Only the check-in owner may change check-in ownership or details';
    end if;
  end if;
  return new;
end;
$;

drop trigger if exists protect_safety_checkin_updates on public.safety_checkins;
create trigger protect_safety_checkin_updates
before update on public.safety_checkins
for each row execute function public.protect_safety_checkin_updates();

-- Remove the duplicate permissive export policy created by the generic couple loop.
drop policy if exists export_jobs_couple_access on public.export_jobs;
drop policy if exists export_jobs_own_access on public.export_jobs;
create policy export_jobs_own_access
  on public.export_jobs
  for all
  using (requested_by = auth.uid() and public.is_couple_member(couple_id))
  with check (requested_by = auth.uid() and public.is_couple_member(couple_id));

-- Emergency contacts are shared for reading, but only their creator may mutate/delete them.
drop policy if exists emergency_contacts_couple_access on public.emergency_contacts;
drop policy if exists emergency_contacts_read on public.emergency_contacts;
create policy emergency_contacts_read
  on public.emergency_contacts
  for select
  using (public.is_couple_member(couple_id));
drop policy if exists emergency_contacts_insert on public.emergency_contacts;
create policy emergency_contacts_insert
  on public.emergency_contacts
  for insert
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
drop policy if exists emergency_contacts_update on public.emergency_contacts;
create policy emergency_contacts_update
  on public.emergency_contacts
  for update
  using (public.is_couple_member(couple_id) and created_by = auth.uid())
  with check (public.is_couple_member(couple_id) and created_by = auth.uid());
drop policy if exists emergency_contacts_delete on public.emergency_contacts;
create policy emergency_contacts_delete
  on public.emergency_contacts
  for delete
  using (public.is_couple_member(couple_id) and created_by = auth.uid());

-- A check-in belongs to its creator. Partners may acknowledge/update status,
-- but may not reassign the check-in or delete it.
drop policy if exists safety_checkins_couple_access on public.safety_checkins;
drop policy if exists safety_checkins_read on public.safety_checkins;
create policy safety_checkins_read
  on public.safety_checkins
  for select
  using (public.is_couple_member(couple_id));
drop policy if exists safety_checkins_insert on public.safety_checkins;
create policy safety_checkins_insert
  on public.safety_checkins
  for insert
  with check (public.is_couple_member(couple_id) and user_id = auth.uid());
drop policy if exists safety_checkins_update on public.safety_checkins;
create policy safety_checkins_update
  on public.safety_checkins
  for update
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));
drop policy if exists safety_checkins_delete on public.safety_checkins;
create policy safety_checkins_delete
  on public.safety_checkins
  for delete
  using (public.is_couple_member(couple_id) and user_id = auth.uid());

-- Settlement records are readable by the couple, but only the initiator can mutate them.
drop policy if exists settlements_couple_access on public.settlements;
drop policy if exists settlements_read on public.settlements;
create policy settlements_read
  on public.settlements
  for select
  using (public.is_couple_member(couple_id));
drop policy if exists settlements_insert on public.settlements;
create policy settlements_insert
  on public.settlements
  for insert
  with check (public.is_couple_member(couple_id) and from_user = auth.uid());
drop policy if exists settlements_update on public.settlements;
create policy settlements_update
  on public.settlements
  for update
  using (public.is_couple_member(couple_id) and from_user = auth.uid())
  with check (public.is_couple_member(couple_id) and from_user = auth.uid());
drop policy if exists settlements_delete on public.settlements;
create policy settlements_delete
  on public.settlements
  for delete
  using (public.is_couple_member(couple_id) and from_user = auth.uid());

commit;
