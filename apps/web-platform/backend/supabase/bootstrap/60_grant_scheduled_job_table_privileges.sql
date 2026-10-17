-- 60_grant_scheduled_job_table_privileges.sql
-- Minimal table privileges for service-role authenticated scheduled functions.
-- RLS remains enabled; no anon/authenticated grants are added.

begin;
grant select, update on table public.safety_checkins to service_role;
grant select on table public.emergency_contacts to service_role;
grant select, insert on table public.battery_alert_log to service_role;
grant select, insert, update on table public.geofence_events to service_role;
commit;
