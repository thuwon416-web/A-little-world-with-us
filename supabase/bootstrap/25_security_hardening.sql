-- 1. Revoke from PUBLIC/anon and grant to authenticated
revoke all on function public.save_care_period_dates(uuid, date[]) from public;
revoke all on function public.save_care_period_dates(uuid, date[]) from anon;
grant execute on function public.save_care_period_dates(uuid, date[]) to authenticated;

-- The legacy text[] overload is still used by string-array clients; keep the
-- same authenticated-only execution boundary and hardened search_path.
revoke all on function public.save_care_period_dates(uuid, text[]) from public;
revoke all on function public.save_care_period_dates(uuid, text[]) from anon;
grant execute on function public.save_care_period_dates(uuid, text[]) to authenticated;
alter function public.save_care_period_dates(uuid, text[]) set search_path = '';

-- 2. Set an empty search_path for these RPC functions
alter function public.save_care_period_dates(uuid, date[]) set search_path = '';
alter function public.on_this_day_memories(uuid, integer, integer) set search_path = '';
alter function public.memory_category_stats(uuid) set search_path = '';
