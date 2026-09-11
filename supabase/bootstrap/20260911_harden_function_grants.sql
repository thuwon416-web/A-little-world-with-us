-- 20260911_harden_function_grants.sql
--
-- Security hardening for public schema functions.
--
-- Background (from Supabase database linter):
--   * 0028_anon_security_definer_function_executable — SECURITY DEFINER functions
--     in the `public` schema are reachable by the `anon` role through
--     /rest/v1/rpc/<name>. The anon key ships in the browser bundle, so anything
--     executable by `anon` is effectively executable by the whole internet.
--   * 0011_function_search_path_mutable — public.touch_updated_at() had no pinned
--     search_path, leaving it open to search_path injection.
--
-- What this migration changes:
--   1. purge_expired_location_history() — HIGH severity. A SECURITY DEFINER
--      function that DELETEs from public.location_history. Any unauthenticated
--      caller could wipe location history older than 7 days over the REST API.
--      EXECUTE is revoked from PUBLIC/anon/authenticated; only service_role and
--      postgres (i.e. the scheduled job) may run it.
--   2. handle_new_user(), assign_active_couple_id(), touch_updated_at() — trigger
--      functions that were never meant to be callable as RPCs. EXECUTE is revoked
--      from PUBLIC/anon/authenticated. PostgreSQL checks EXECUTE on a trigger
--      function at CREATE TRIGGER time, not at fire time, so existing triggers
--      keep working.
--   3. touch_updated_at() is recreated with `set search_path = ''` and a
--      schema-qualified body.
--
-- Deliberately NOT changed:
--   is_couple_member(uuid), is_linked_user(uuid), is_location_admin(),
--   has_accepted_couple(). These are RLS helpers referenced by all 49 policies in
--   the public schema, and every policy is declared `TO public`. Policy
--   expressions are evaluated with the caller's privileges, so revoking EXECUTE
--   from `anon` would turn anonymous reads into "permission denied" errors
--   instead of empty result sets. All four gate on auth.uid(), which is NULL for
--   `anon`, so they return false and leak no data.

begin;

-- 1. Destructive maintenance function: service_role / postgres only.
revoke all on function public.purge_expired_location_history() from public;
revoke all on function public.purge_expired_location_history() from anon;
revoke all on function public.purge_expired_location_history() from authenticated;
grant execute on function public.purge_expired_location_history() to service_role;

-- 2. Trigger functions: not part of the public API surface.
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

revoke all on function public.assign_active_couple_id() from public;
revoke all on function public.assign_active_couple_id() from anon;
revoke all on function public.assign_active_couple_id() from authenticated;

-- 3. Pin search_path on touch_updated_at, then lock it down too.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end
$$;

revoke all on function public.touch_updated_at() from public;
revoke all on function public.touch_updated_at() from anon;
revoke all on function public.touch_updated_at() from authenticated;

commit;
