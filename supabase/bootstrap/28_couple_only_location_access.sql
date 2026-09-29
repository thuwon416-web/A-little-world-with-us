-- Couple-only location access: no admin-role bypass is needed.
begin;

drop policy if exists locations_admin_pair_read on public.user_locations;
drop policy if exists location_history_admin_pair_read on public.location_history;

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
  );

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
  );

commit;