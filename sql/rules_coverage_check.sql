-- Security regression check for repository-defined RLS and grant invariants.
-- This file is intentionally static-only: it validates the schema and policy
-- inventory that can be proven from repo migrations and the live catalog when CI
-- provides a database. It does not pretend to verify live authenticated behavior
-- without a staging target.
--
-- Intentional exceptions:
--   google_drive_connections: server-managed, deny-by-default.
--   korean_lessons / korean_vocab SELECT policies: public reference data.
--   public reference tables and helper tables remain exempt only when they are
--   explicitly listed below as intentionally public/reference.
with protected_tables as (
  select 'public'::text as schemaname, 'profiles'::text as tablename, 'own profile data'::text as rationale
  union all select 'public', 'couples', 'relationship data'
  union all select 'public', 'couple_links', 'relationship link data'
  union all select 'public', 'messages', 'chat message data'
  union all select 'public', 'memories', 'private/shared memories'
  union all select 'public', 'user_locations', 'live location state'
  union all select 'public', 'location_history', 'historical location data'
  union all select 'public', 'location_address_cache', 'server-managed geocode cache'
  union all select 'public', 'user_settings', 'personal settings'
  union all select 'public', 'notifications', 'user notifications'
  union all select 'public', 'onboarding_progress', 'private onboarding state'
  union all select 'public', 'offline_sync', 'user sync payloads'
  union all select 'public', 'feedback', 'user feedback data'
  union all select 'public', 'push_devices', 'device tokens'
  union all select 'public', 'saved_places', 'private couple places'
  union all select 'public', 'time_capsules', 'private time capsule data'
  union all select 'public', 'time_capsule_attachments', 'capsule attachment metadata'
  union all select 'public', 'vault_items', 'private vault entries'
  union all select 'public', 'emergency_alerts', 'risk/safety alerts'
  union all select 'public', 'call_signals', 'call metadata'
  union all select 'public', 'export_jobs', 'export state'
  union all select 'public', 'care_cycle_settings', 'private couple care configuration'
  union all select 'public', 'care_daily_logs', 'care log data'
  union all select 'public', 'care_logs', 'care log data'
  union all select 'public', 'mood_logs', 'private wellness state'
  union all select 'public', 'cycle_logs', 'private period data'
  union all select 'public', 'health_profiles', 'private health data'
  union all select 'public', 'financial_goals', 'private financial data'
  union all select 'public', 'goals', 'private goal data'
  union all select 'public', 'reminders', 'private reminder data'
  union all select 'public', 'calendar_events', 'private calendar data'
  union all select 'public', 'todos', 'private todo data'
  union all select 'public', 'plans', 'private planning data'
  union all select 'public', 'astrology_profiles', 'private astrology data'
  union all select 'public', 'favorites', 'private favorites'
  union all select 'public', 'bucket_list', 'private bucket list'
),
public_tables as (
  select schemaname, tablename
  from pg_tables
  where schemaname = 'public'
    and tablename <> 'spatial_ref_sys'
    and tablename <> 'google_drive_connections'
),
protected_catalog as (
  select p.schemaname, p.tablename, c.relrowsecurity, c.relforcerowsecurity
  from protected_tables p
  left join pg_class c
    on c.relname = p.tablename
   and c.relnamespace = 'public'::regnamespace
),
missing_rls as (
  select p.schemaname, p.tablename, 'missing_rls' as issue
  from protected_catalog p
  where p.relrowsecurity is distinct from true
),
missing_policy as (
  select p.schemaname, p.tablename, 'missing_policy' as issue
  from protected_tables p
  left join pg_policies pol
    on pol.schemaname = p.schemaname and pol.tablename = p.tablename
  where pol.tablename is null
),
permissive as (
  select schemaname, tablename, policyname, cmd, qual, with_check, 'permissive_policy' as issue
  from pg_policies
  where schemaname = 'public'
    and (
      (
        cmd in ('SELECT','ALL')
        and coalesce(qual,'') ~ '^(true|\(true\)|\s*true\s*|\s*\(\s*true\s*\)\s*)$'
      )
      or (
        cmd in ('INSERT','UPDATE','ALL')
        and coalesce(with_check,'') ~ '^(true|\(true\)|\s*true\s*|\s*\(\s*true\s*\)\s*)$'
      )
    )
    and not (tablename = 'korean_lessons' and policyname = 'korean_lessons_authenticated_read')
    and not (tablename = 'korean_vocab' and policyname = 'korean_vocab_authenticated_read')
    and not (tablename = 'google_drive_connections')
),
protected_grants as (
  select table_schema as schemaname,
         table_name as tablename,
         grantee,
         privilege_type,
         'broad_table_grant' as issue
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'profiles','couples','couple_links','messages','memories','user_locations',
      'location_history','location_address_cache','user_settings','notifications',
      'onboarding_progress','offline_sync','feedback','push_devices','saved_places',
      'time_capsules','time_capsule_attachments','vault_items','emergency_alerts',
      'call_signals','export_jobs','care_cycle_settings','care_daily_logs','care_logs',
      'mood_logs','cycle_logs','health_profiles','financial_goals','goals','reminders',
      'calendar_events','todos','plans','astrology_profiles','favorites','bucket_list'
    )
    and grantee in ('PUBLIC','anon')
),
storage_policy_coverage as (
  select schemaname, tablename, policyname, cmd, qual, with_check
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
),
storage_missing_or_permissive as (
  select 'storage'::text as schemaname,
         'objects'::text as tablename,
         policyname,
         cmd,
         'missing_storage_policy'::text as issue
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and (
      cmd in ('SELECT','INSERT','UPDATE','DELETE','ALL')
      and (
        coalesce(qual,'') ~ '^(true|\(true\)|\s*true\s*|\s*\(\s*true\s*\)\s*)$'
        or coalesce(with_check,'') ~ '^(true|\(true\)|\s*true\s*|\s*\(\s*true\s*\)\s*)$'
      )
    )
  union all
  select 'storage'::text as schemaname,
         'objects'::text as tablename,
         NULL::text as policyname,
         NULL::text as cmd,
         'missing_storage_policy'::text as issue
  where not exists (
    select 1
    from pg_policies p
    where p.schemaname = 'storage' and p.tablename = 'objects'
  )
),
security_definer_exec as (
  select routine_schema as schemaname,
         routine_name as funcname,
         grantee,
         privilege_type,
         'privileged_execute_grant' as issue
  from information_schema.routine_privileges
  where routine_schema = 'public'
    and routine_name in (
      'purge_expired_location_history',
      'handle_new_user',
      'assign_active_couple_id',
      'touch_updated_at'
    )
    and grantee in ('PUBLIC','anon','authenticated')
    and privilege_type = 'EXECUTE'
)
select schemaname, tablename, issue, policyname, cmd, qual, with_check
from (
  select schemaname, tablename, issue, null::text as policyname, null::text as cmd, null::text as qual, null::text as with_check from missing_rls
  union all
  select schemaname, tablename, issue, null::text as policyname, null::text as cmd, null::text as qual, null::text as with_check from missing_policy
  union all
  select schemaname, tablename, issue, policyname, cmd, qual, with_check from permissive
  union all
  select schemaname, tablename, issue, grantee::text as policyname, privilege_type::text as cmd, null::text as qual, null::text as with_check
  from protected_grants
  union all
  select schemaname, tablename, issue, policyname, cmd, qual, with_check
  from storage_missing_or_permissive
  union all
  select schemaname, funcname as tablename, issue, grantee::text as policyname, privilege_type::text as cmd, null::text as qual, null::text as with_check
  from security_definer_exec
) x
order by issue, schemaname, tablename, policyname;
