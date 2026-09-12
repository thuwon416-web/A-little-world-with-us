-- Security hardening for the twenty tables identified in the security audit.
-- Every identifier used below is defined by the bootstrap schema.  PostgreSQL
-- has no CREATE POLICY IF NOT EXISTS, so each replacement is guarded by DROP
-- POLICY IF EXISTS and is safe to run repeatedly.
begin;

-- Verified trigger/maintenance functions from the bootstrap schema.  These
-- functions are not an application RPC surface.
revoke all on function public.purge_expired_location_history() from public;
revoke all on function public.purge_expired_location_history() from anon;
revoke all on function public.purge_expired_location_history() from authenticated;
grant execute on function public.purge_expired_location_history() to service_role;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;
revoke all on function public.assign_active_couple_id() from public;
revoke all on function public.assign_active_couple_id() from anon;
revoke all on function public.assign_active_couple_id() from authenticated;
revoke all on function public.touch_updated_at() from public;
revoke all on function public.touch_updated_at() from anon;
revoke all on function public.touch_updated_at() from authenticated;

alter table public.astrology_profiles enable row level security;
alter table public.bucket_list enable row level security;
alter table public.calendar_events enable row level security;
alter table public.call_signals enable row level security;
alter table public.care_cycle_settings enable row level security;
alter table public.care_daily_logs enable row level security;
alter table public.care_logs enable row level security;
alter table public.care_reminders enable row level security;
alter table public.cycle_logs enable row level security;
alter table public.emergency_alerts enable row level security;
alter table public.favorites enable row level security;
alter table public.financial_goals enable row level security;
alter table public.goals enable row level security;
alter table public.health_profiles enable row level security;
alter table public.memories enable row level security;
alter table public.mood_logs enable row level security;
alter table public.plans enable row level security;
alter table public.reminders enable row level security;
alter table public.todos enable row level security;
alter table public.vault_items enable row level security;

-- Member reads are separated from owner mutations.  Owner columns below are
-- verified in the bootstrap schema; care_cycle_settings is intentionally
-- couple-wide because it has no owner column.
do $$
declare
  table_name text;
  owner_column text;
begin
  for table_name, owner_column in select * from (values
    ('astrology_profiles','user_id'), ('bucket_list','user_id'),
    ('calendar_events','user_id'), ('care_daily_logs','user_id'),
    ('care_logs','user_id'), ('care_reminders','user_id'),
    ('cycle_logs','user_id'), ('emergency_alerts','reporter_id'),
    ('favorites','user_id'), ('financial_goals','user_id'),
    ('goals','user_id'), ('health_profiles','user_id'),
    ('memories','user_id'), ('mood_logs','user_id'), ('plans','user_id'),
    ('reminders','user_id'), ('todos','user_id'), ('vault_items','user_id')
  ) as verified(table_name, owner_column) loop
    execute format('drop policy if exists %I on public.%I', table_name || '_couple_access', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_hardening', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_delete', table_name);
    execute format('create policy %I on public.%I for select using (public.is_couple_member(couple_id))', table_name || '_security_select', table_name);
    execute format('create policy %I on public.%I for insert with check (%I = auth.uid() and public.is_couple_member(couple_id))', table_name || '_security_insert', table_name, owner_column);
    execute format('create policy %I on public.%I for update using (%I = auth.uid() and public.is_couple_member(couple_id)) with check (%I = auth.uid() and public.is_couple_member(couple_id))', table_name || '_security_update', table_name, owner_column, owner_column);
    execute format('create policy %I on public.%I for delete using (%I = auth.uid() and public.is_couple_member(couple_id))', table_name || '_security_delete', table_name, owner_column);
  end loop;

  -- call_signals has caller_id/receiver_id rather than a single owner column.
  drop policy if exists call_signals_couple_access on public.call_signals;
  drop policy if exists call_signals_security_hardening on public.call_signals;
  drop policy if exists call_signals_security_select on public.call_signals;
  drop policy if exists call_signals_security_insert on public.call_signals;
  drop policy if exists call_signals_security_update on public.call_signals;
  drop policy if exists call_signals_security_delete on public.call_signals;
  create policy call_signals_security_select on public.call_signals for select using (public.is_couple_member(couple_id) and auth.uid() in (caller_id, receiver_id));
  create policy call_signals_security_insert on public.call_signals for insert with check (public.is_couple_member(couple_id) and auth.uid() = caller_id);
  create policy call_signals_security_update on public.call_signals for update using (public.is_couple_member(couple_id) and auth.uid() in (caller_id, receiver_id)) with check (public.is_couple_member(couple_id) and auth.uid() in (caller_id, receiver_id));
  create policy call_signals_security_delete on public.call_signals for delete using (public.is_couple_member(couple_id) and auth.uid() = caller_id);

  -- care_cycle_settings is explicitly couple-wide: it has no owner column.
  drop policy if exists care_cycle_settings_couple_access on public.care_cycle_settings;
  drop policy if exists care_cycle_settings_security_hardening on public.care_cycle_settings;
  drop policy if exists care_cycle_settings_security_select on public.care_cycle_settings;
  drop policy if exists care_cycle_settings_security_mutate on public.care_cycle_settings;
  create policy care_cycle_settings_security_select on public.care_cycle_settings for select using (public.is_couple_member(couple_id));
  create policy care_cycle_settings_security_mutate on public.care_cycle_settings for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id));
end
$$;

-- Storage identifiers and predicates are taken from the verified bootstrap
-- policies.  Replacing the permissive shared-media delete policy prevents a
-- member from deleting another member's object.
drop policy if exists shared_media_read on storage.objects;
drop policy if exists shared_media_insert on storage.objects;
drop policy if exists shared_media_update on storage.objects;
drop policy if exists shared_media_delete on storage.objects;
drop policy if exists storage_security_hardening_read on storage.objects;
drop policy if exists storage_security_hardening_insert on storage.objects;
drop policy if exists storage_security_hardening_update on storage.objects;
drop policy if exists storage_security_hardening_delete on storage.objects;
create policy storage_security_hardening_read on storage.objects
  for select using (
    bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages')
    and public.has_accepted_couple()
  );
create policy storage_security_hardening_insert on storage.objects
  for insert with check (
    bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages')
    and owner = auth.uid()
    and public.has_accepted_couple()
  );
create policy storage_security_hardening_update on storage.objects
  for update using (
    bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages')
    and owner = auth.uid()
  ) with check (
    bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages')
    and owner = auth.uid()
  );
create policy storage_security_hardening_delete on storage.objects
  for delete using (
    bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages')
    and owner = auth.uid()
  );

revoke all on function public.is_couple_member(uuid) from public, anon;
revoke all on function public.is_location_admin() from public, anon;
revoke all on function public.is_linked_user(uuid) from public, anon;
revoke all on function public.has_accepted_couple() from public, anon;
grant execute on function public.is_couple_member(uuid) to authenticated;
grant execute on function public.is_location_admin() to authenticated;
grant execute on function public.is_linked_user(uuid) to authenticated;
grant execute on function public.has_accepted_couple() to authenticated;
revoke all on function public.purge_expired_location_history() from public, anon, authenticated;
grant execute on function public.purge_expired_location_history() to service_role;

commit;
