-- ============================================
-- Phase 3 Update: Cycle Logs Partner Access
-- ============================================

-- Add partner view policy to cycle_logs if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'cycle_logs'
      AND policyname = 'Partners can view each other''s cycle logs'
  ) THEN
    CREATE POLICY "Partners can view each other's cycle logs"
    ON cycle_logs FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM couple_links cl
        WHERE cl.status = 'accepted'
          AND (
            (cl.inviter_id = auth.uid() AND cl.accepted_by = user_id)
            OR (cl.accepted_by = auth.uid() AND cl.inviter_id = user_id)
          )
      )
    );
  END IF;
END $$;
