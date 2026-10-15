-- Remove the retired location-specific admin helper after location RLS became couple-scoped.
begin;
drop policy if exists location_address_admin_read on public.location_address_cache;
drop function if exists public.is_location_admin();
commit;