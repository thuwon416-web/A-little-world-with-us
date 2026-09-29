-- ----------------------------------------------------------------
-- 37_schedule_retention_cleanup.sql
-- ----------------------------------------------------------------
-- Production retention jobs:
--   * location_history: keep the existing 7-day retention policy.
--   * ai_context_memory: keep its existing per-row 30-day expiry.
-- Deliberately does NOT delete user-curated memories, relationship memories,
-- chat history, or media files.
-- ----------------------------------------------------------------

create or replace function public.purge_expired_ai_context_memory()
returns void
language sql
security definer
set search_path = ''
as $function$
  delete from public.ai_context_memory
  where expires_at < pg_catalog.now();
$function$;

revoke all on function public.purge_expired_ai_context_memory() from public;
revoke all on function public.purge_expired_ai_context_memory() from anon;
revoke all on function public.purge_expired_ai_context_memory() from authenticated;
grant execute on function public.purge_expired_ai_context_memory() to service_role;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute 'select cron.unschedule(jobid) from cron.job where jobname in (''purge-location-history'', ''purge-expired-ai-context-memory'')';
    perform cron.schedule(
      'purge-location-history',
      '15 3 * * *',
      'select public.purge_expired_location_history()'
    );
    perform cron.schedule(
      'purge-expired-ai-context-memory',
      '30 3 * * *',
      'select public.purge_expired_ai_context_memory()'
    );
  else
    raise notice 'pg_cron is unavailable; schedule the retention functions externally.';
  end if;
end
$$;
