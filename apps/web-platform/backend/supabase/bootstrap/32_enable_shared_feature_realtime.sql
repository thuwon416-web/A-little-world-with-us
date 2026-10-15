-- 32_enable_shared_feature_realtime.sql
-- Enable Postgres Changes for the couple-shared data used by Web and Mobile.
-- RLS remains the access boundary; Realtime only publishes rows a subscriber
-- is already allowed to receive.
begin;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'calendar_events','care_cycle_settings','care_daily_logs','care_reminders',
    'finance_expenses','financial_goals','memories','plans','plan_items','todos',
    'bucket_list','wishlist','goals','events','reminders','shared_playlist',
    'time_capsules','time_capsule_attachments','watchlist','watch_history',
    'wellness_entries','wellness_logs','couple_occasions','mood_logs','cycle_logs',
    'safety_checkins','emergency_alerts','settlements','user_locations',
    'location_history','location_sharing_settings'
  ]
  loop
    if exists (
      select 1 from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relkind = 'r'
    ) and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

commit;
