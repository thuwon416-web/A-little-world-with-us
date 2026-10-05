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

-- Internal authorization helpers are invoked by RLS/SECURITY DEFINER functions,
-- not directly by clients.
revoke execute on function public.has_accepted_couple() from public, authenticated;
revoke execute on function public.is_couple_member(uuid) from public, authenticated;
revoke execute on function public.is_linked_user(uuid) from public, authenticated;
