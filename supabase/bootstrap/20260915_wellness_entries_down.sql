-- Phase 10.2c-3b rollback

begin;
drop table if exists public.wellness_entries cascade;
commit;
