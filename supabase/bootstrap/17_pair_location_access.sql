-- Allow each accepted couple to use the shared location page while respecting
-- the location owner's sharing preference. This script is safe to rerun.
begin;

drop policy if exists profiles_read_own_or_location_admin on public.profiles;
drop policy if exists profiles_read_own_or_partner on public.profiles;
create policy profiles_read_own_or_partner
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_linked_user(id));

drop policy if exists locations_admin_pair_read on public.user_locations;
drop policy if exists locations_pair_member_read on public.user_locations;
create policy locations_pair_member_read
  on public.user_locations for select to authenticated
  using (
    auth.uid() = user_id
    or (
      public.is_couple_member(couple_id)
      and exists (
        select 1 from public.location_sharing_settings s
        where s.user_id = user_locations.user_id and s.enabled
      )
    )
    or (public.is_location_admin() and public.is_linked_user(user_id))
  );

drop policy if exists location_history_admin_pair_read on public.location_history;
drop policy if exists location_history_pair_member_read on public.location_history;
create policy location_history_pair_member_read
  on public.location_history for select to authenticated
  using (
    auth.uid() = user_id
    or (
      public.is_couple_member(couple_id)
      and exists (
        select 1 from public.location_sharing_settings s
        where s.user_id = location_history.user_id and s.enabled
      )
    )
    or (public.is_location_admin() and public.is_linked_user(user_id))
  );

drop policy if exists saved_places_admin_access on public.saved_places;
drop policy if exists saved_places_pair_access on public.saved_places;
create policy saved_places_pair_access
  on public.saved_places for all to authenticated
  using (public.is_couple_member(couple_id))
  with check (public.is_couple_member(couple_id));

commit;
