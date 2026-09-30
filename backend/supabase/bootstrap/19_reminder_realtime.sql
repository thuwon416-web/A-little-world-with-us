-- Publish shared reminder changes so both phones can schedule or cancel local
-- notifications promptly. RLS still controls which rows each account sees.
begin;

do $$
begin
  if to_regclass('public.reminders') is not null
    and exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'reminders'
    ) then
    alter publication supabase_realtime add table public.reminders;
  end if;
end $$;

commit;
