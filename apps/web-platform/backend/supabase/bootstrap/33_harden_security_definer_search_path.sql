-- 33_harden_security_definer_search_path.sql
-- Harden SECURITY DEFINER helpers used by RLS policies.
-- The function bodies already schema-qualify public tables and auth.uid(),
-- so an empty search_path removes unnecessary name-resolution exposure.

alter function public.has_accepted_couple() set search_path = '';
alter function public.is_couple_member(uuid) set search_path = '';
alter function public.is_linked_user(uuid) set search_path = '';
