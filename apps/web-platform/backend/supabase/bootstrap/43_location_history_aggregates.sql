create or replace view public.location_history_aggregated as
select
  round(latitude::numeric / 0.002) * 0.002 as grid_lat,
  round(longitude::numeric / 0.002) * 0.002 as grid_lon,
  count(*)::bigint as points,
  min(captured_at) as first_seen,
  max(captured_at) as last_seen,
  avg(latitude) as avg_lat,
  avg(longitude) as avg_lon
from public.location_history
where captured_at > now() - interval '7 days'
group by 1,2;

revoke all on public.location_history_aggregated from anon;
grant select on public.location_history_aggregated to authenticated;