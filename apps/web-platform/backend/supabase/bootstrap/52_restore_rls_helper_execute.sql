-- RLS policies execute these SECURITY DEFINER helpers in the caller's role context.
-- Authenticated sessions therefore need EXECUTE privilege for RLS evaluation.
-- Keep anonymous/public execution revoked. The helpers are hardened with an empty
-- search_path and only return authorization booleans.
revoke execute on function public.has_accepted_couple() from public, anon;
revoke execute on function public.is_couple_member(uuid) from public, anon;
revoke execute on function public.is_linked_user(uuid) from public, anon;

grant execute on function public.has_accepted_couple() to authenticated;
grant execute on function public.is_couple_member(uuid) to authenticated;
grant execute on function public.is_linked_user(uuid) to authenticated;
