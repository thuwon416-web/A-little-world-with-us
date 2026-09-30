-- Optimize RLS auth.uid() evaluation without changing authorization semantics.
-- Supabase recommends wrapping auth.<function>() in SELECT so it is evaluated once
-- per statement rather than once per row.
--
-- This follow-on is intentionally limited to auth.uid(). It does not alter
-- couple/location authorization logic, SECURITY DEFINER behavior, or policies
-- outside the public schema.
DO $$
DECLARE
  p record;
  q text;
  w text;
  stmt text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ILIKE '%auth.uid()%' OR with_check ILIKE '%auth.uid()%')
  LOOP
    q := CASE
      WHEN p.qual IS NULL THEN NULL
      ELSE replace(p.qual, 'auth.uid()', '(select auth.uid())')
    END;

    w := CASE
      WHEN p.with_check IS NULL THEN NULL
      ELSE replace(p.with_check, 'auth.uid()', '(select auth.uid())')
    END;

    stmt := format(
      'ALTER POLICY %I ON %I.%I %s;',
      p.policyname,
      p.schemaname,
      p.tablename,
      CASE
        WHEN q IS NOT NULL AND w IS NOT NULL THEN
          format('USING (%s) WITH CHECK (%s)', q, w)
        WHEN q IS NOT NULL THEN
          format('USING (%s)', q)
        WHEN w IS NOT NULL THEN
          format('WITH CHECK (%s)', w)
        ELSE ''
      END
    );

    EXECUTE stmt;
  END LOOP;
END $$;
