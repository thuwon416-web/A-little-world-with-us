begin;

drop table if exists public.geofence_events cascade;
drop table if exists public.safety_checkins cascade;
drop table if exists public.emergency_contacts cascade;

-- Keep emergency_alerts.accuracy because this migration must not remove
-- a column that may already be used by deployed SOS clients.

commit;
