-- Remove the retired location-specific admin helper after location RLS became couple-scoped.
begin;
drop function if exists public.is_location_admin();
commit;