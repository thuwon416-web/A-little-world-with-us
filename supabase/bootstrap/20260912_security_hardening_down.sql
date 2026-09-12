-- Revert 20260912_security_hardening.sql.
begin;

-- Function hardening is intentionally monotonic: the verified bootstrap
-- already restricts these trigger/maintenance functions, so rollback does
-- not re-grant public RPC execution.


drop policy if exists storage_security_hardening_read on storage.objects;
drop policy if exists storage_security_hardening_insert on storage.objects;
drop policy if exists storage_security_hardening_update on storage.objects;
drop policy if exists storage_security_hardening_delete on storage.objects;

-- Restore only verified policies replaced by this migration.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'shared_media_read') then
    create policy shared_media_read on storage.objects for select using (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and public.has_accepted_couple());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'shared_media_insert') then
    create policy shared_media_insert on storage.objects for insert with check (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and owner = auth.uid() and public.has_accepted_couple());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'shared_media_update') then
    create policy shared_media_update on storage.objects for update using (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and owner = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'shared_media_delete') then
    create policy shared_media_delete on storage.objects for delete using (bucket_id in ('memories','gallery','chat_files','chat_photos','voice_messages') and (owner = auth.uid() or public.has_accepted_couple()));
  end if;
end
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array[
    'astrology_profiles','bucket_list','calendar_events','care_daily_logs',
    'care_logs','care_reminders','cycle_logs','emergency_alerts','favorites',
    'financial_goals','goals','health_profiles','memories','mood_logs','plans',
    'reminders','todos','vault_items','call_signals'
  ] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_security_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_update', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_security_delete', table_name);
  end loop;
  drop policy if exists care_cycle_settings_security_select on public.care_cycle_settings;
  drop policy if exists care_cycle_settings_security_mutate on public.care_cycle_settings;
end
$$;

-- Restore the verified bootstrap couple policies that the up migration replaces.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'astrology_profiles','bucket_list','calendar_events','call_signals',
    'care_cycle_settings','care_daily_logs','care_logs','care_reminders',
    'cycle_logs','emergency_alerts','favorites','financial_goals','goals',
    'health_profiles','memories','mood_logs','plans','reminders','todos',
    'vault_items'
  ] loop
    if not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
        and policyname = table_name || '_couple_access'
    ) then
      execute format(
        'create policy %I on public.%I for all using (public.is_couple_member(couple_id)) with check (public.is_couple_member(couple_id))',
        table_name || '_couple_access', table_name
      );
    end if;
  end loop;
end
$$;

commit;
