-- Restrict the reverse-geocode cache to server-side access only.
-- This table is used by the edge function with the service role key and should not be
-- readable or writable by end users, even when the default authenticated grant is present.
begin;

alter table public.location_address_cache enable row level security;

revoke all on table public.location_address_cache from public;
revoke all on table public.location_address_cache from anon;
revoke all on table public.location_address_cache from authenticated;
grant select, insert, update, delete on table public.location_address_cache to service_role;

drop policy if exists location_address_cache_anon_deny on public.location_address_cache;
create policy location_address_cache_anon_deny
  on public.location_address_cache
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists location_address_cache_authenticated_deny on public.location_address_cache;
create policy location_address_cache_authenticated_deny
  on public.location_address_cache
  for all
  to authenticated
  using (false)
  with check (false);

commit;
