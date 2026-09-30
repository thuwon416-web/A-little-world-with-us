-- Harden the remaining SECURITY DEFINER trigger/maintenance helpers.
-- All referenced application objects are schema-qualified, so an empty search_path
-- removes unnecessary name-resolution exposure without changing authorization logic.

alter function public.assign_active_couple_id() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.purge_expired_location_history() set search_path = '';
