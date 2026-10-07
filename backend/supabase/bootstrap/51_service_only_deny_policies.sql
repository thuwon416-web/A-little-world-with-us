-- Explicit deny policies for tables intentionally used only by trusted server-side/service-role flows.
-- RLS remains enabled; service_role bypasses RLS while anon/authenticated receive no rows.
create policy "service_role_only" on public.admin_audit_logs
  for all to anon, authenticated using (false) with check (false);

create policy "service_role_only" on public.google_drive_connections
  for all to anon, authenticated using (false) with check (false);

create policy "service_role_only" on public.location_address_cache
  for all to anon, authenticated using (false) with check (false);

create policy "service_role_only" on offline.applied_ops
  for all to anon, authenticated using (false) with check (false);

-- These SECURITY DEFINER helpers are invoked by RLS policies. PostgreSQL checks
-- EXECUTE privilege while evaluating an RLS expression, so authenticated
-- sessions must be allowed to execute them. Anonymous/public access stays revoked.
revoke execute on function public.has_accepted_couple() from public, anon;
revoke execute on function public.is_couple_member(uuid) from public, anon;
revoke execute on function public.is_linked_user(uuid) from public, anon;
grant execute on function public.has_accepted_couple() to authenticated;
grant execute on function public.is_couple_member(uuid) to authenticated;
grant execute on function public.is_linked_user(uuid) to authenticated;
