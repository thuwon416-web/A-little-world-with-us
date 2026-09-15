-- Phase 16.4: SOS resolution notes
begin;

alter table public.emergency_alerts
  add column if not exists resolution_note text
  check (resolution_note is null or char_length(resolution_note) <= 500);

comment on column public.emergency_alerts.resolution_note is
  'Optional note added when a partner resolves the SOS';

commit;
