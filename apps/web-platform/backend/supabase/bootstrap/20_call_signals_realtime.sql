-- Publish call state changes so the other member receives call updates.
-- Row-level security still limits event visibility to the call participants.
begin;

do $$
begin
  if to_regclass('public.call_signals') is not null
    and exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'call_signals'
    ) then
    alter publication supabase_realtime add table public.call_signals;
  end if;
end $$;

commit;
