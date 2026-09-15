begin;

alter table public.emergency_alerts
  drop column if exists resolution_note;

commit;
