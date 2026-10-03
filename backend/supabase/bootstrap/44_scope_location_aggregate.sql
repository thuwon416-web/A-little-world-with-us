create or replace view public.location_history_aggregated as
select
  round(lh.latitude::numeric / 0.002) * 0.002 as grid_lat,
  round(lh.longitude::numeric / 0.002) * 0.002 as grid_lon,
  count(*)::bigint as points,
  min(lh.captured_at) as first_seen,
  max(lh.captured_at) as last_seen,
  avg(lh.latitude) as avg_lat,
  avg(lh.longitude) as avg_lon
from public.location_history lh
join public.couple_links cl
  on cl.couple_id = lh.couple_id
 and cl.status = 'accepted'
 and ((select auth.uid()) = cl.inviter_id or (select auth.uid()) = cl.accepted_by)
where lh.captured_at > now() - interval '7 days'
group by 1,2;

alter view public.location_history_aggregated set (security_invoker = true);
