-- Staging verification for the reverse-geocode cache.
-- Run this against the staging database after applying the migration.

select
  c.oid::regclass as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'location_address_cache';

select
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name = 'location_address_cache'
order by grantee, privilege_type;

select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'location_address_cache'
order by policyname;

select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'location_address_cache'
order by ordinal_position;

select
  'anon' as role_name,
  (select count(*) from pg_roles where rolname = 'anon') as role_exists,
  (select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'location_address_cache'
      and 'anon' = any (string_to_array(roles::text, ','))
  )) as has_policy;

select
  'authenticated' as role_name,
  (select count(*) from pg_roles where rolname = 'authenticated') as role_exists,
  (select exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'location_address_cache'
      and 'authenticated' = any (string_to_array(roles::text, ','))
  )) as has_policy;

select
  'service_role' as role_name,
  (select count(*) from pg_roles where rolname = 'service_role') as role_exists,
  (select exists (
    select 1
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'location_address_cache'
      and grantee = 'service_role'
  )) as has_table_grant;
