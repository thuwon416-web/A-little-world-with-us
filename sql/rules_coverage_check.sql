-- Security regression check for public RLS policy coverage.
-- Intentional exceptions:
--   google_drive_connections / location_address_cache: server-managed, deny-by-default.
--   korean_lessons / korean_vocab SELECT policies: public reference data.
with public_tables as (
  select schemaname, tablename
  from pg_tables
  where schemaname = 'public'
    and tablename <> 'spatial_ref_sys'
),
missing as (
  select t.schemaname, t.tablename
  from public_tables t
  left join pg_policies p
    on p.schemaname = t.schemaname and p.tablename = t.tablename
  where p.tablename is null
    and t.tablename not in ('google_drive_connections','location_address_cache')
),
permissive as (
  select schemaname, tablename, policyname
  from pg_policies
  where schemaname = 'public'
    and (
      (cmd in ('SELECT','ALL') and coalesce(qual,'') ~ '^true$')
      or (cmd in ('INSERT','UPDATE','ALL') and coalesce(with_check,'') ~ '^true$')
    )
    and not (tablename = 'korean_lessons' and policyname = 'korean_lessons_authenticated_read')
    and not (tablename = 'korean_vocab' and policyname = 'korean_vocab_authenticated_read')
)
select 'missing_policy' as issue, tablename as detail from missing
union all
select 'permissive_policy', tablename || '.' || policyname from permissive
order by issue, detail;
