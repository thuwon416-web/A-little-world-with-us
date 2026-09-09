-- Emergency repair for the current project after the destructive bootstrap ran.
-- Safe to run once in Supabase SQL Editor. It does not delete or modify app data.
-- RLS remains enabled; this only restores PostgREST table/sequence privileges for
-- authenticated users so existing policies can be applied.
-- IMPORTANT: Run this file by itself. Do not append BEGIN, ROLLBACK, or SET ROLE.

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant usage, select on sequences to authenticated;

-- Verification: both rows should be true before browser testing.
select
  has_schema_privilege('authenticated', 'public', 'usage') as authenticated_can_use_public_schema,
  has_table_privilege('authenticated', 'public.profiles', 'select') as authenticated_can_select_profiles,
  has_table_privilege('authenticated', 'public.couple_links', 'select') as authenticated_can_select_couple_links;
